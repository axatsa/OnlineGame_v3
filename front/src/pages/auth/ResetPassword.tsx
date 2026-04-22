import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Пароли не совпадают");
            return;
        }
        if (!token) {
            toast.error("Неверная ссылка для сброса");
            return;
        }
        setIsLoading(true);
        try {
            await api.post("/auth/reset-password", { token, new_password: password });
            setDone(true);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Ссылка недействительна или устарела");
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
                <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            {done ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <Lock className="w-7 h-7 text-primary" />}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {done ? "Пароль изменён" : "Новый пароль"}
                        </h1>
                        <p className="text-sm text-muted-foreground font-sans">
                            {done ? "Теперь вы можете войти с новым паролем." : "Введите новый пароль для вашего аккаунта."}
                        </p>
                    </div>

                    {!done && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium font-sans">Новый пароль</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 rounded-xl h-12 font-sans"
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium font-sans">Повторите пароль</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className="pl-10 rounded-xl h-12 font-sans"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading || !password || !confirm}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить пароль"}
                            </Button>
                        </form>
                    )}

                    {done && (
                        <Button className="w-full h-12 rounded-xl" onClick={() => navigate("/login")}>
                            Войти
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
