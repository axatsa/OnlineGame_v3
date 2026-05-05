import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Users, ChevronRight, Eye, SkipForward, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import { Leaderboard } from "@/components/session/Leaderboard";
import { useTranslation } from "react-i18next";

interface Participant {
  id: number;
  nickname: string;
  avatar_id?: string;
}

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatar_id?: string | null;
  score: number;
  delta?: number;
}

type Phase = "lobby" | "question" | "result" | "game_over";

function buildWsUrl(code: string, token: string): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}/api/v1/sessions/${code}/host?token=${encodeURIComponent(token)}`;
}

const ANSWER_COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-green-500"];

const HostView = () => {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") ?? "";

  const [phase, setPhase] = useState<Phase>("lobby");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [question, setQuestion] = useState<{ index: number; total: number; text: string; options: string[]; timeLimit: number } | null>(null);
  const [answerProgress, setAnswerProgress] = useState({ answered: 0, total: 0, distribution: [0, 0, 0, 0] });
  const [resultData, setResultData] = useState<{ correctAnswer: string; leaderboard: LeaderboardEntry[] } | null>(null);
  const [finalLb, setFinalLb] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const joinUrl = `${window.location.origin}/join?code=${code}`;

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;

    if (type === "lobby_update") {
      setParticipants((data.participants as Participant[]) ?? []);
    }
    if (type === "question_start") {
      setPhase("question");
      setResultData(null);
      setAnswerProgress({ answered: 0, total: 0, distribution: [0, 0, 0, 0] });
      setTimerKey((k) => k + 1);
      setQuestion({
        index: data.index as number,
        total: data.total_questions as number,
        text: data.question as string,
        options: data.options as string[],
        timeLimit: data.time_limit as number,
      });
    }
    if (type === "answer_progress") {
      setAnswerProgress({
        answered: data.answered as number,
        total: data.total as number,
        distribution: (data.distribution as number[]) ?? [0, 0, 0, 0],
      });
    }
    if (type === "question_result") {
      setPhase("result");
      setResultData({
        correctAnswer: data.correct_answer as string,
        leaderboard: (data.leaderboard as LeaderboardEntry[]) ?? [],
      });
    }
    if (type === "game_over") {
      setPhase("game_over");
      setFinalLb((data.leaderboard as LeaderboardEntry[]) ?? []);
    }
  }, []);

  const wsUrl = code && token ? buildWsUrl(code, token) : "";
  const { send, status } = useSessionSocket({ url: wsUrl, onMessage: handleMessage, enabled: !!(code && token) });

  const copyCode = () => {
    navigator.clipboard.writeText(code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxDist = Math.max(...answerProgress.distribution, 1);

  if (!code || !token) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("checkoutAuthError")}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-3 mb-4">
        <div>
          <h1 className="font-bold text-lg text-foreground">Сессия #{code}</h1>
          <p className="text-xs text-muted-foreground capitalize">
            {status === "open" ? t("session_status_connected") : t("session_status_connecting")}
          </p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${status === "open" ? "bg-green-500" : "bg-yellow-400"} animate-pulse`} />
      </div>

      <AnimatePresence mode="wait">
        {/* ─── LOBBY ─── */}
        {phase === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
              <QRCodeSVG value={joinUrl} size={140} bgColor="transparent" fgColor="currentColor"
                className="text-foreground rounded-xl" />
              <div className="flex flex-col gap-3 flex-1 w-full">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("session_enterCode")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-5xl font-black tracking-widest text-primary font-mono">{code}</span>
                    <button onClick={copyCode} className="p-2 rounded-xl hover:bg-muted transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground break-all">{joinUrl}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t("students")} ({participants.length})</span>
              </div>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 animate-pulse">{t("session_waitingParticipants")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <span key={p.id}
                      className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm font-medium">
                      <img src={p.avatar_id ? `/avatars/${p.avatar_id}.svg` : "/avatars/placeholder.svg"}
                        alt="" className="w-5 h-5 rounded-full"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/avatars/placeholder.svg"; }} />
                      {p.nickname}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => send({ type: "start_game" })}
              disabled={participants.length === 0}
              className="w-full h-12 rounded-xl gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              {t("game_start")} ({participants.length} {t("students")})
            </Button>
          </motion.div>
        )}

        {/* ─── QUESTION ─── */}
        {phase === "question" && question && (
          <motion.div key={`q-${question.index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }} className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("session_questionCount", { current: question.index + 1, total: question.total })}
                  </p>
                  <p className="text-xl font-bold text-foreground leading-snug">{question.text}</p>
                </div>
                <CountdownTimer key={timerKey} seconds={question.timeLimit} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt, i) => (
                  <div key={i} className={`${ANSWER_COLORS[i]} rounded-xl px-4 py-3 text-white font-semibold text-sm`}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("session_answered")}</span>
                <span className="text-sm font-bold text-foreground">
                  {answerProgress.answered} / {answerProgress.total || participants.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${answerProgress.total ? (answerProgress.answered / answerProgress.total) * 100 : 0}%` }}
                />
              </div>
              {/* Distribution bars */}
              <div className="flex gap-2 pt-1">
                {answerProgress.distribution.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-lg overflow-hidden bg-muted" style={{ height: 48 }}>
                      <div
                        className={`w-full ${ANSWER_COLORS[i]} transition-all duration-500 rounded-lg`}
                        style={{ height: `${(count / maxDist) * 100}%`, marginTop: `${100 - (count / maxDist) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => send({ type: "show_results" })} className="w-full h-12 rounded-xl gap-2">
              <Eye className="w-4 h-4" /> {t("game_show_answer")}
            </Button>
          </motion.div>
        )}

        {/* ─── RESULT ─── */}
        {phase === "result" && resultData && question && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs text-muted-foreground mb-1">{t("session_questionCount", { current: question.index + 1, total: question.total })}</p>
              <p className="font-bold text-foreground mb-4">{question.text}</p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt, i) => (
                  <div key={i}
                    className={`rounded-xl px-4 py-3 font-semibold text-sm transition-all
                      ${opt === resultData.correctAnswer
                        ? "bg-green-500 text-white ring-2 ring-green-300"
                        : `${ANSWER_COLORS[i]} text-white opacity-50`}`}>
                    {opt === resultData.correctAnswer && <span className="mr-1">✓</span>}
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            {resultData.leaderboard.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-medium text-foreground mb-3">{t("session_leaderboard")}</p>
                <Leaderboard entries={resultData.leaderboard} />
              </div>
            )}

            <Button onClick={() => send({ type: "next_question" })} className="w-full h-12 rounded-xl gap-2">
              <SkipForward className="w-4 h-4" /> {t("game_next_round")}
            </Button>
          </motion.div>
        )}

        {/* ─── GAME OVER ─── */}
        {phase === "game_over" && (
          <motion.div key="over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🏆</p>
              <h2 className="text-2xl font-bold text-foreground">{t("session_gameOver")}</h2>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-medium text-foreground mb-3">{t("session_leaderboard")}</p>
              <Leaderboard entries={finalLb} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
                const text = finalLb.map(e => `${e.rank}. ${e.nickname} — ${e.score}`).join("\n");
                navigator.clipboard.writeText(text);
              }}>
                {t("session_copy_results")}
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => navigate("/history")}>
                {t("backToDash")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostView;
