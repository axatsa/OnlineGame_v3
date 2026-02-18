import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import type { Lang } from "@/context/LangContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      toast.success("Login successful!");
      // Use context login to set state and redirect
      login(res.data.access_token, res.data.user);
    } catch (error) {
      toast.error("Invalid credentials. Try generic 'teacher@school.edu' / 'password'");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 bg-primary relative items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30Z" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="3" fill="white" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo)" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-primary-foreground tracking-tight">ClassPlay</h1>
            <p className="text-primary-foreground/70 text-lg font-sans max-w-xs">{t("loginTagline")}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center bg-card p-8"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold font-serif text-foreground">ClassPlay</span>
          </div>

          {/* Lang switcher */}
          <div className="flex justify-end">
            <div className="flex bg-muted rounded-full p-1 gap-0.5">
              {(["ru", "uz"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold font-sans transition-colors ${lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {l === "ru" ? "🇷🇺 RU" : "🇺🇿 UZ"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t("loginTitle")}</h2>
            <p className="text-muted-foreground font-sans">{t("loginSub")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium font-sans text-foreground">{t("loginEmail")}</label>
              <Input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-13 text-base rounded-xl border-border"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium font-sans text-foreground">{t("loginPassword")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-13 text-base rounded-xl border-border"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-13 text-base font-semibold rounded-xl font-sans" size="lg" disabled={isLoading}>
              {isLoading ? "Logging in..." : t("loginButton")}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate("/admin")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans underline underline-offset-4"
            >
              {t("loginAdmin")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
