import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, RotateCcw, Home } from "lucide-react";

const DARK = "#07101F";
const BLUE = "#0EA5E9";
const CORAL = "#FF3D68";

export default function PaymentFail() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const plan = params.get("plan") || "pro";

    return (
        <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
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
                        background: `rgba(255,61,104,0.1)`,
                        border: `2px solid rgba(255,61,104,0.3)`,
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 28px",
                    }}
                >
                    <XCircle size={36} color={CORAL} />
                </motion.div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32, fontWeight: 800,
                    color: "#fff", marginBottom: 12, lineHeight: 1.1,
                }}>
                    Оплата не прошла
                </h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
                    Что-то пошло не так. Попробуйте ещё раз или свяжитесь с поддержкой.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/checkout?plan=${plan}`)}
                        style={{
                            width: "100%", padding: "14px 24px",
                            background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                            color: "#fff", fontSize: 15, fontWeight: 700,
                            border: "none", borderRadius: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        <RotateCcw size={16} /> Попробовать снова
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/")}
                        style={{
                            width: "100%", padding: "14px 24px",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 600,
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        <Home size={16} /> На главную
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
