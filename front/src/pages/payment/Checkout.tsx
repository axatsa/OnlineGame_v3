import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Rocket, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { paymentService, Plan, PaymentMethod, TelegramPaymentInfo } from "@/api/paymentService";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; logo: string }[] = [
    { id: "payme", label: "Payme", logo: "https://static.payme.uz/img/logo_payme_mini.svg" },
    { id: "click", label: "Click", logo: "https://cdn.click.uz/click/assets/images/click-logo.svg" },
];

export default function Checkout() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const { t } = useTranslation();

    const PLANS: Record<string, {
        name: string; price: string; period: string; features: string[];
        accent: string; planKey: Plan; free?: boolean;
    }> = {
        free: {
            name: t("planFreeName"), price: "$0", period: t("checkoutForever"),
            planKey: "pro" as Plan, free: true,
            accent: "from-emerald-500 to-teal-400",
            features: [t("planFreeF1"), t("planFreeF2"), t("planFreeF3"), t("planFreeF4")],
        },
        pro: {
            name: t("planProName"), price: "$15", period: t("checkoutPerMonth"),
            planKey: "pro",
            accent: "from-primary via-accent to-secondary",
            features: [t("planProF1"), t("planProF2"), t("planProF3"), t("planProF4"), t("planProF5")],
        },
        school: {
            name: t("planSchoolName"), price: "$49", period: t("checkoutPerMonth"),
            planKey: "school",
            accent: "from-orange-500 to-amber-400",
            features: [t("planSchoolF1"), t("planSchoolF2"), t("planSchoolF3"), t("planSchoolF4"), t("planSchoolF5")],
        },
    };

    const planId = params.get("plan") || "pro";
    const plan = PLANS[planId] ?? PLANS.pro;

    const [loading, setLoading] = useState<PaymentMethod | "telegram" | null>(null);
    const [tgPayment, setTgPayment] = useState<TelegramPaymentInfo | null>(null);
    const [codeCopied, setCodeCopied] = useState(false);
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
            toast.success(authMode === "login" ? t("checkoutWelcome") : t("checkoutAccountCreated"));
            navigate("/teacher");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || t("checkoutAuthError"));
        } finally {
            setAuthLoading(false);
        }
    };

    const handleAuthAndPay = async (method: PaymentMethod | "telegram") => {
        setLoading(method);
        try {
            let activeUser = user;
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
                    toast.success(authMode === "login" ? t("checkoutLoggedIn") : t("checkoutAuthCreated"));
                } catch (err: any) {
                    toast.error(err.response?.data?.detail || t("checkoutAuthError"));
                    setLoading(null);
                    setAuthLoading(false);
                    return;
                }
                setAuthLoading(false);
            }
            
            if (method === "telegram") {
                const data = await paymentService.initiateTelegram(plan.planKey);
                setTgPayment(data);
            } else {
                const res = await paymentService.initiate({ plan: plan.planKey, method });
                window.location.href = res.redirect_url;
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || t("checkoutPaymentError"));
            setLoading(null);
        } finally {
            if (method === "telegram") setLoading(null);
        }
    };

    const handleTelegramPay = async () => {
        if (!user) { toast.error("Сначала войди в аккаунт"); return; }
        setLoading("telegram");
        try {
            const data = await paymentService.initiateTelegram(plan.planKey);
            setTgPayment(data);
        } catch {
            toast.error("Ошибка при создании платежа. Попробуй снова.");
        } finally {
            setLoading(null);
        }
    };

    const copyCode = () => {
        if (!tgPayment) return;
        navigator.clipboard.writeText(tgPayment.payment_code);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    if (plan.free && user) {
        navigate("/teacher");
        return null;
    }

    const inputClass = "w-full bg-background border border-border rounded-2xl px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition";

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-20">
                <div className="max-w-md w-full mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition bg-transparent border-none cursor-pointer p-0"
                    >
                        <ArrowLeft size={15} /> {t("checkoutBack")}
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-xl"
                >
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.accent} flex items-center justify-center shadow-lg`}>
                            <Rocket size={28} className="text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                        {authMode === "register" ? t("checkoutRegister") : t("checkoutLogin")}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        {t("checkoutActivatePlan")} <strong className="text-foreground">{plan.name}</strong>
                    </p>

                    <form className="flex flex-col gap-4 text-left" onSubmit={(e) => e.preventDefault()}>
                        {authMode === "register" && (
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1.5 block">{t("checkoutFullName")}</label>
                                <input type="text" placeholder="Иван Иванов" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1.5 block">Email</label>
                            <input type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1.5 block">{t("checkoutPassword")}</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                            {plan.free ? (
                                <Button
                                    disabled={authLoading || !email || !password}
                                    onClick={handleFreeSignup}
                                    className="w-full rounded-2xl py-6 text-sm font-bold"
                                >
                                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : (authMode === "login" ? t("land_login") : t("land_hero_cta"))}
                                </Button>
                            ) : (
                                <>
                                    {/* Telegram is the main active method */}
                                    <Button
                                        disabled={loading !== null || !email || !password}
                                        onClick={() => handleAuthAndPay("telegram")}
                                        className="w-full rounded-2xl py-6 text-sm font-bold bg-[#229ED9] hover:bg-[#1e8ec3] text-white"
                                    >
                                        {loading === "telegram" ? <Loader2 size={16} className="animate-spin" /> : <>Оплатить через Telegram</>}
                                    </Button>

                                    {PAYMENT_METHODS.map(m => (
                                        <Button
                                            key={m.id}
                                            disabled={true}
                                            className="w-full rounded-2xl py-6 text-sm font-bold opacity-60"
                                        >
                                            {m.label} (Coming soon)
                                        </Button>
                                    ))}
                                </>
                            )}
                        </div>
                    </form>

                    <button
                        onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                        className="mt-6 text-sm font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
                    >
                        {authMode === "login" ? t("checkoutNoAccount") : t("checkoutHasAccount")}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8 bg-transparent border-none cursor-pointer p-0"
                >
                    <ArrowLeft size={15} /> {t("checkoutBack")}
                </button>

                <h1 className="text-3xl font-bold font-serif text-foreground mb-1.5">
                    {t("checkoutTitle")}
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                    {t("checkoutSelectMethod")}
                </p>

                {/* Plan card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-3xl p-6 mb-5 relative overflow-hidden shadow-sm"
                >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.accent}`} />

                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                {t("checkoutSelectedPlan")}
                            </p>
                            <h2 className="text-xl font-bold font-serif text-foreground">{plan.name}</h2>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black font-serif text-foreground">{plan.price}</span>
                            <span className="text-sm text-muted-foreground"> {plan.period}</span>
                        </div>
                    </div>

                    <ul className="flex flex-col gap-2.5">
                        {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/75">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={12} className="text-primary" />
                                </div>
                                {f}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Payment methods */}
                <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((m, i) => (
                        <div
                            key={m.id}
                            className="w-full px-5 py-4 bg-card border border-border rounded-2xl flex items-center justify-between opacity-60"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
                                    <img src={m.logo} alt={m.label} className="w-7 h-7 object-contain" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-foreground">{m.label}</p>
                                    <p className="text-xs text-muted-foreground">{t("checkoutPayVia")} {m.label}</p>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
                                Coming soon
                            </span>
                        </div>
                    ))}

                    {/* Telegram */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={loading !== null}
                        onClick={handleTelegramPay}
                        className="w-full px-5 py-4 bg-card border border-border rounded-2xl cursor-pointer flex items-center justify-between hover:border-sky-400/40 hover:bg-sky-50/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-[#229ED9] flex items-center justify-center shrink-0">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.93 13.48 5.007 12.6c-.657-.203-.671-.657.136-.975l11.157-4.303c.547-.196 1.026.12.594.899z"/>
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">Telegram</p>
                                <p className="text-xs text-muted-foreground">Перевод на карту — 0% комиссии</p>
                            </div>
                        </div>
                        {loading === "telegram"
                            ? <Loader2 size={18} className="text-muted-foreground animate-spin" />
                            : <span className="px-4 py-1.5 rounded-xl bg-[#229ED9] text-white text-xs font-bold">Оплатить</span>
                        }
                    </motion.button>
                </div>

                {/* Telegram payment instructions */}
                <AnimatePresence>
                    {tgPayment && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            className="mt-4 bg-sky-50 border border-sky-200 rounded-2xl p-5 overflow-hidden"
                        >
                            <p className="text-sky-700 text-sm font-bold mb-4">📋 Инструкция по оплате</p>
                            <div className="flex flex-col gap-2.5 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>💵 Сумма</span>
                                    <span className="text-foreground font-bold">{tgPayment.amount_uzs.toLocaleString()} сўм</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>🏦 Карта</span>
                                    <span className="text-foreground font-bold">{tgPayment.card_number}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>👤 Получатель</span>
                                    <span className="text-foreground">{tgPayment.card_holder}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>⏰ До</span>
                                    <span className="text-foreground">{tgPayment.expires_at}</span>
                                </div>
                            </div>

                            <div className="mt-4 bg-white border border-border rounded-xl px-4 py-3">
                                <p className="text-xs text-muted-foreground mb-2">⚠️ Обязательно напиши в комментарии к переводу:</p>
                                <div className="flex items-center justify-between gap-2">
                                    <code className="text-primary text-sm font-bold break-all">{tgPayment.payment_code}</code>
                                    <button
                                        onClick={copyCode}
                                        className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-primary transition shrink-0"
                                    >
                                        {codeCopied ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
                                    </button>
                                </div>
                            </div>

                            <a
                                href="https://t.me/ClassPlayEdu_Purchase_Bot?start=pay"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-4 py-3 bg-[#229ED9] rounded-xl text-white text-sm font-bold text-center no-underline hover:opacity-90 transition"
                            >
                                📱 Открыть Telegram бот и отправить чек
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
                    {t("checkoutFooter")}
                </p>
            </div>
        </div>
    );
}
