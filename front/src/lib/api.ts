import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
    baseURL: "/api",
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

// Response interceptor — при 401 (истёкший/невалидный токен) → редирект на логин
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token expired or invalid — redirecting to login");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Диспатч события для AuthListener в App.tsx
            window.dispatchEvent(new Event("auth:unauthorized"));
            // Редирект на логин
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
