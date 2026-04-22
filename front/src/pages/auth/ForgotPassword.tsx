import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Ошибка. Попробуйте позже.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Вернуться к входу
                </button>

                <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            {sent ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <Mail className="w-7 h-7 text-primary" />}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {sent ? "Письмо отправлено" : "Восстановление пароля"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-sans">
                            {sent
                                ? `Мы отправили ссылку для сброса пароля на ${email}. Проверьте почту.`
                                : "Введите email — мы пришлём ссылку для сброса пароля."}
                        </p>
                    </div>

                    {!sent && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium font-sans">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        required
                                        type="email"
                                        placeholder="teacher@school.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 rounded-xl h-12 font-sans"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading || !email}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отправить ссылку"}
                            </Button>
                        </form>
                    )}

                    {sent && (
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => navigate("/login")}>
                            Вернуться к входу
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
