import axios from "axios";

const api = axios.create({
    baseURL: "/api/v1",
    timeout: 90000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — добавляем токен к каждому запросу
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — при 401 редирект на логин, при 402 показ тоста о лимите
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token expired or invalid — redirecting to login");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("auth:unauthorized"));
        }
        if (error.response?.status === 402) {
            const detail = error.response.data?.detail;
            if (detail?.error === "token_quota_exceeded") {
                window.dispatchEvent(new CustomEvent("quota:exceeded", { detail: { detail } }));
                import("sonner").then(({ toast }) => {
                    toast.error("Лимит генераций исчерпан. Обновите тариф.", {
                        duration: 10000,
                        action: {
                            label: "Обновить",
                            onClick: () => { window.location.href = "/checkout"; },
                        },
                    });
                });
            }
        }
        if (error.response?.status === 429) {
            const detail = error.response.data?.detail;
            const retryAfter = detail?.retry_after;
            if (retryAfter) {
                window.dispatchEvent(new CustomEvent("api:overloaded", { detail: { retryAfter } }));
            }
        }
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
            import("sonner").then(({ toast }) => {
                toast.error("Сервер не отвечает. Проверьте соединение и попробуйте снова.", { duration: 6000 });
            });
        } else if (!error.response) {
            import("sonner").then(({ toast }) => {
                toast.error("Нет соединения с сервером. Проверьте интернет.", { duration: 6000 });
            });
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Session API helpers ────────────────────────────────────────────────────

export const createSession = (log_id: number, time_per_q: number) =>
  api.post<{ code: string; session_id: number }>("/sessions/create", { log_id, time_per_q });

export const getSessionInfo = (code: string) =>
  api.get<{ topic: string; generator_type: string; status: string; participant_count: number; time_per_q: number; question_count: number }>(`/sessions/${code}/info`);

export const joinSession = (code: string, nickname: string, avatar_id?: string) =>
  api.post<{ participant_id: number; session_id: number; nickname: string; avatar_id: string | null }>(`/sessions/${code}/join`, { nickname, avatar_id });

export const getSessionResults = (code: string) =>
  api.get<{ rank: number; nickname: string; avatar_id: string | null; score: number }[]>(`/sessions/${code}/results`);
