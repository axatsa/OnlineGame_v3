import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarPicker } from "@/components/session/AvatarPicker";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";

const AVATARS = ["placeholder"];
function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

const JoinSession = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState<string>(randomAvatar());
  const [step, setStep] = useState<"code" | "name">("code");
  const [sessionInfo, setSessionInfo] = useState<{ topic: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("code")) setStep("name");
  }, []);

  const checkCode = async () => {
    setError("");
    if (code.length !== 6) { setError(t("session_enterCode")); return; }
    setLoading(true);
    try {
      const res = await api.get(`/sessions/${code}/info`);
      if (res.data.status !== "waiting") {
        setError("Сессия уже началась или завершена");
        return;
      }
      setSessionInfo(res.data);
      setStep("name");
    } catch {
      setError("Сессия не найдена");
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    setError("");
    if (!nickname.trim()) { setError("Введите никнейм"); return; }
    setLoading(true);
    try {
      const res = await api.post(`/sessions/${code}/join`, {
        nickname: nickname.trim(),
        avatar_id: avatarId,
      });
      const { participant_id, session_id } = res.data;
      sessionStorage.setItem(`session_${code}`, JSON.stringify({ participant_id, session_id, nickname: nickname.trim(), avatar_id: avatarId }));
      navigate(`/play/${code}`);
    } catch (e: unknown) {
      const err = e as { response?: { status: number } };
      if (err.response?.status === 409) setError("Этот никнейм уже занят");
      else if (err.response?.status === 400) setError("Сессия уже началась");
      else setError("Ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src="/logo_sticker.webp" alt="ClassPlay" className="w-14 h-14 rounded-2xl" />
          <h1 className="text-2xl font-bold text-foreground">ClassPlay</h1>
          <p className="text-sm text-muted-foreground">{t("session_join")}</p>
        </div>

        {step === "code" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Код сессии</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="483920"
                className="text-center text-2xl tracking-widest font-bold h-14 rounded-xl"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && checkCode()}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button onClick={checkCode} disabled={loading} className="w-full h-12 rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {t("confirm")}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {sessionInfo && (
              <div className="bg-muted/50 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Тема</p>
                <p className="font-semibold text-foreground text-sm">{sessionInfo.topic || "—"}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ваш никнейм</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                placeholder="Введите имя"
                className="h-12 rounded-xl"
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && joinSession()}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Аватар</label>
              <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button onClick={joinSession} disabled={loading} className="w-full h-12 rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("session_join")}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JoinSession;
