import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, LogIn, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { paymentService, Plan, PaymentMethod } from "@/api/paymentService";
import { toast } from "sonner";
import api from "@/lib/api";

const DARK = "#07101F";
const BLUE = "#0EA5E9";
const CORAL = "#FF3D68";
const CYAN = "#06D6A0";
const INK = "#0C1828";

const PLANS: Record<string, {
    name: string;
    price: string;
    period: string;
    features: string[];
    accent: string;
    planKey: Plan;
    free?: boolean;
}> = {
    free: {
        name: "Бесплатный",
        price: "$0",
        period: "/ навсегда",
        planKey: "pro" as Plan,
        free: true,
        accent: `linear-gradient(135deg, #10B981, #06D6A0)`,
        features: [
            "10 ИИ-генераций",
            "Базовые игры",
            "Поддержка",
            "1 учитель",
        ],
    },
    pro: {
        name: "Pro Учитель",
        price: "$15",
        period: "/ месяц",
        planKey: "pro",
        accent: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
        features: [
            "до 430 ИИ-генераций в месяц",
            "Все 6 интерактивных игр",
            "ИИ-книги с именем ученика",
            "Аналитика класса",
            "Приоритетная поддержка",
        ],
    },
    school: {
        name: "Для Школ",
        price: "$49",
        period: "/ месяц",
        planKey: "school",
        accent: `linear-gradient(135deg, #F97316, #FBBF24)`,
        features: [
            "2 100 генераций/месяц на всю школу",
            "До 10 учителей",
            "Админ-панель",
            "CSV-импорт пользователей",
            "Договор",
        ],
    },
};

const PAYMENT_METHODS: { id: PaymentMethod; label: string; logo: string; color: string }[] = [
    {
        id: "payme",
        label: "Payme",
        logo: "https://static.payme.uz/img/logo_payme_mini.svg",
        color: "#00AAFF",
    },
    {
        id: "click",
        label: "Click",
        logo: "https://cdn.click.uz/click/assets/images/click-logo.svg",
        color: "#FF6600",
    },
];

export default function Checkout() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();

    const planId = params.get("plan") || "pro";
    const plan = PLANS[planId] ?? PLANS.pro;

    const [loading, setLoading] = useState<PaymentMethod | null>(null);
    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    const { login: contextLogin } = useAuth();

    const handleFreeSignup = async () => {
        setAuthLoading(true);
        try {
            const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
            const payload = authMode === "login"
                ? { email, password }
                : { email, password, full_name: fullName };
            const res = await api.post(endpoint, payload);
            contextLogin(res.data.access_token, res.data.user);
            toast.success(authMode === "login" ? "Добро пожаловать!" : "Аккаунт создан! Добро пожаловать!");
            navigate("/teacher");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Ошибка авторизации");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleAuthAndPay = async (method: PaymentMethod) => {
        setLoading(method);
        try {
            let activeUser = user;

            // If not logged in, try to register/login first
            if (!activeUser) {
                setAuthLoading(true);
                try {
                    const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
                    const payload = authMode === "login" 
                        ? { email, password } 
                        : { email, password, full_name: fullName };
                    
                    const res = await api.post(endpoint, payload);
                    contextLogin(res.data.access_token, res.data.user);
                    activeUser = res.data.user;
                    toast.success(authMode === "login" ? "Вход выполнен" : "Аккаунт создан");
                } catch (err: any) {
                    toast.error(err.response?.data?.detail || "Ошибка авторизации");
                    setLoading(null);
                    setAuthLoading(false);
                    return;
                }
                setAuthLoading(false);
            }

            // Now initiate payment
            const res = await paymentService.initiate({ plan: plan.planKey, method });
            window.location.href = res.redirect_url;
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Не удалось инициировать платёж");
            setLoading(null);
        }
    };

    if (plan.free && user) {
        navigate("/teacher");
        return null;
    }

    if (!user) {
        return (
            <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 32, padding: "40px",
                        maxWidth: 480, width: "100%", textAlign: "center",
                        backdropFilter: "blur(20px)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: plan.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(14,165,233,0.3)" }}>
                            <Rocket size={32} color="#fff" />
                        </div>
                    </div>

                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
                        {authMode === "register" ? "Создайте аккаунт" : "Войдите в аккаунт"}
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32 }}>
                        Чтобы активировать план <strong style={{ color: "#fff" }}>{plan.name}</strong>
                    </p>

                    <form style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} onSubmit={(e) => e.preventDefault()}>
                        {authMode === "register" && (
                            <div>
                                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginLeft: 12, marginBottom: 6, display: "block" }}>ФИО</label>
                                <input 
                                    type="text" 
                                    placeholder="Иван Иванов" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 20px", color: "#fff", outline: "none" }} 
                                />
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginLeft: 12, marginBottom: 6, display: "block" }}>Email</label>
                            <input 
                                type="email" 
                                placeholder="example@mail.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 20px", color: "#fff", outline: "none" }} 
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginLeft: 12, marginBottom: 6, display: "block" }}>Пароль</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 20px", color: "#fff", outline: "none" }} 
                            />
                        </div>

                        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                            {plan.free ? (
                                <button
                                    disabled={authLoading || !email || !password}
                                    onClick={handleFreeSignup}
                                    style={{
                                        width: "100%", padding: "16px",
                                        background: authLoading ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, #10B981, #06D6A0)`,
                                        color: "#fff", fontSize: 15, fontWeight: 700,
                                        border: "none", borderRadius: 16, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                        opacity: (!email || !password) ? 0.5 : 1,
                                        boxShadow: (email && password) ? `0 8px 24px rgba(16,185,129,0.3)` : "none",
                                    }}
                                >
                                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : (authMode === "login" ? "Войти" : "Начать бесплатно")}
                                </button>
                            ) : PAYMENT_METHODS.map(m => (
                                <button
                                    key={m.id}
                                    disabled={loading !== null || !email || !password}
                                    onClick={() => handleAuthAndPay(m.id)}
                                    style={{
                                        width: "100%", padding: "16px",
                                        background: loading === m.id ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                                        color: "#fff", fontSize: 15, fontWeight: 700,
                                        border: "none", borderRadius: 16, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                        opacity: (!email || !password) ? 0.5 : 1,
                                        boxShadow: (email && password) ? `0 8px 24px rgba(14,165,233,0.3)` : "none",
                                    }}
                                >
                                    {loading === m.id ? <Loader2 size={18} className="animate-spin" /> : <>Оплатить через {m.label}</>}
                                </button>
                            ))}
                        </div>
                    </form>

                    <button 
                        onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                        style={{ marginTop: 24, background: "none", border: "none", color: BLUE, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                    >
                        {authMode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: DARK, padding: "32px 16px" }}>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500,
                        marginBottom: 32, padding: 0,
                    }}
                >
                    <ArrowLeft size={16} /> Назад
                </button>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 28, fontWeight: 800, color: "#fff",
                    marginBottom: 6,
                }}>
                    Оформление подписки
                </h1>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>
                    Выберите способ оплаты
                </p>

                {/* Plan card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 20, padding: 24, marginBottom: 20,
                        position: "relative", overflow: "hidden",
                    }}
                >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: plan.accent }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                                Выбранный план
                            </p>
                            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                                {plan.name}
                            </h2>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff" }}>
                                {plan.price}
                            </span>
                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}> {plan.period}</span>
                        </div>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                        {plan.features.map((f, i) => (
                            <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
                                <CheckCircle2 size={15} color={CYAN} style={{ flexShrink: 0 }} />
                                {f}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Payment methods */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {PAYMENT_METHODS.map((m, i) => (
                        <motion.button
                            key={m.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.08)" }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading !== null}
                            onClick={() => handleAuthAndPay(m.id)}
                            style={{
                                width: "100%", padding: "18px 24px",
                                background: "rgba(255,255,255,0.05)",
                                border: `1px solid rgba(255,255,255,0.1)`,
                                borderRadius: 16, cursor: loading !== null ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                transition: "background 0.2s",
                                opacity: loading !== null && loading !== m.id ? 0.4 : 1,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <img src={m.logo} alt={m.label} style={{ width: 28, height: 28, objectFit: "contain" }} />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{m.label}</p>
                                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                                        Оплата через {m.label}
                                    </p>
                                </div>
                            </div>

                            {loading === m.id ? (
                                <Loader2 size={20} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                                <div style={{
                                    padding: "8px 18px", borderRadius: 10,
                                    background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                                    color: "#fff", fontSize: 13, fontWeight: 700,
                                }}>
                                    Оплатить
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Footer note */}
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
                    Безопасная оплата через Payme и Click · Подписка на 30 дней
                </p>
            </div>
        </div>
    );
}
