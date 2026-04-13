import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { paymentService, Plan, PaymentMethod } from "@/api/paymentService";
import { toast } from "sonner";

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
}> = {
    pro: {
        name: "Pro Учитель",
        price: "$15",
        period: "/ месяц",
        planKey: "pro",
        accent: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
        features: [
            "Безлимитные ИИ-генерации",
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
            "Все функции Pro",
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

    const handlePay = async (method: PaymentMethod) => {
        setLoading(method);
        try {
            const res = await paymentService.initiate({ plan: plan.planKey, method });
            window.location.href = res.redirect_url;
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Не удалось инициировать платёж");
            setLoading(null);
        }
    };

    if (!user) {
        return (
            <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 24, padding: "48px 40px",
                        maxWidth: 400, width: "100%", textAlign: "center",
                    }}
                >
                    <LogIn size={40} color={BLUE} style={{ margin: "0 auto 20px" }} />
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                        Войдите для оформления
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 28 }}>
                        Чтобы оформить подписку, нужно войти в аккаунт.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.setItem("redirectAfter", `/checkout?plan=${planId}`);
                            navigate("/login");
                        }}
                        style={{
                            width: "100%", padding: "14px 24px",
                            background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                            color: "#fff", fontSize: 15, fontWeight: 700,
                            border: "none", borderRadius: 14, cursor: "pointer",
                        }}
                    >
                        Войти
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
                            onClick={() => handlePay(m.id)}
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
                    Безопасная оплата через Payme и Click · Отменить можно в любой момент
                </p>
            </div>
        </div>
    );
}
