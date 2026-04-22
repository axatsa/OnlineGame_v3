import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const DARK = "#07101F";
const BLUE = "#0EA5E9";
const CYAN = "#06D6A0";
const CORAL = "#FF3D68";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    
    const [status, setStatus] = useState<"verifying" | "completed" | "timeout">("verifying");
    const paymentId = searchParams.get("payment_id");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!paymentId) {
            setStatus("completed");
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setStatus("timeout");
        }, 60000);

        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/payments/${paymentId}`);
                if (res.data.status === "completed") {
                    setStatus("completed");
                    clearInterval(interval);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                } else if (res.data.status === "failed" || res.data.status === "cancelled") {
                    clearInterval(interval);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    navigate("/payment/fail");
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 3000);

        return () => {
            clearInterval(interval);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [paymentId, navigate]);

    const handleContinue = () => {
        if (user?.role === "super_admin") navigate("/admin");
        else navigate("/teacher");
    };

    return (
        <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 28,
                    padding: "56px 48px",
                    maxWidth: 480,
                    width: "100%",
                    textAlign: "center",
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    style={{
                        width: 80, height: 80,
                        background: `linear-gradient(135deg, ${CYAN}30, ${CYAN}10)`,
                        border: `2px solid ${CYAN}60`,
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 28px",
                    }}
                >
                    {status === "verifying" ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Loader2 size={36} color={CYAN} />
                        </motion.div>
                    ) : status === "timeout" ? (
                        <AlertCircle size={36} color="#F59E0B" />
                    ) : (
                        <CheckCircle2 size={36} color={CYAN} />
                    )}
                </motion.div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32, fontWeight: 800,
                    color: "#fff", marginBottom: 12, lineHeight: 1.1,
                }}>
                    {status === "verifying" ? "Ожидание банка..." : status === "timeout" ? "Долго нет ответа" : "Оплата прошла!"}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
                    {status === "verifying"
                        ? "Мы ждем подтверждения от платежной системы. Обычно это занимает несколько секунд."
                        : status === "timeout"
                        ? "Платёжная система не ответила в течение минуты. Ваш платёж может быть всё ещё в обработке."
                        : "Ваша подписка активирована. Теперь вам доступны все возможности платформы."}
                </p>

                {status === "timeout" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 0 }}>
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={handleContinue}
                            style={{ width: "100%", padding: "14px 24px", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        >
                            Всё равно войти в кабинет <ArrowRight size={16} />
                        </motion.button>
                        <a
                            href="mailto:support@classplay.uz"
                            style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "none", marginTop: 8 }}
                        >
                            Написать в поддержку → support@classplay.uz
                        </a>
                    </div>
                )}

                {status === "completed" && (
                    <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleContinue}
                    style={{
                        width: "100%", padding: "14px 24px",
                        background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                        color: "#fff", fontSize: 15, fontWeight: 700,
                        border: "none", borderRadius: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                >
                    Перейти в личный кабинет <ArrowRight size={16} />
                </motion.button>
                )}
            </motion.div>
        </div>
    );
}
