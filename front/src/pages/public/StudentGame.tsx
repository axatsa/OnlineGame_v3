import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { AnswerButton } from "@/components/session/AnswerButton";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import { QuestionCard } from "@/components/session/QuestionCard";
import { Leaderboard } from "@/components/session/Leaderboard";
import { useTranslation } from "react-i18next";

interface SessionState {
  participant_id: number;
  session_id: number;
  nickname: string;
  avatar_id: string;
}

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

function buildWsUrl(code: string, pid: number): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}/api/v1/sessions/${code}/student?pid=${pid}`;
}

const StudentGame = () => {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<SessionState | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [question, setQuestion] = useState<{ index: number; total: number; text: string; options: string[]; timeLimit: number } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; pts: number; correctAnswer: string; leaderboard: LeaderboardEntry[] } | null>(null);
  const [finalLb, setFinalLb] = useState<LeaderboardEntry[]>([]);
  const [answerSentAt, setAnswerSentAt] = useState<number | null>(null);

  useEffect(() => {
    if (!code) return;
    const raw = sessionStorage.getItem(`session_${code}`);
    if (!raw) { navigate(`/join?code=${code}`); return; }
    setState(JSON.parse(raw));
  }, [code, navigate]);

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;

    if (type === "lobby_update") {
      setParticipants((data.participants as Participant[]) ?? []);
    }

    if (type === "question_start") {
      setPhase("question");
      setSelectedAnswer(null);
      setResult(null);
      setAnswerSentAt(Date.now());
      setQuestion({
        index: data.index as number,
        total: data.total_questions as number,
        text: data.question as string,
        options: data.options as string[],
        timeLimit: data.time_limit as number,
      });
    }

    if (type === "answer_received") {
      setResult({
        isCorrect: data.is_correct as boolean,
        pts: data.points_earned as number,
        correctAnswer: data.correct_answer as string,
        leaderboard: [],
      });
    }

    if (type === "question_result") {
      setPhase("result");
      setResult((prev) => prev ? {
        ...prev,
        correctAnswer: data.correct_answer as string,
        leaderboard: (data.leaderboard as LeaderboardEntry[]) ?? [],
      } : {
        isCorrect: false,
        pts: 0,
        correctAnswer: data.correct_answer as string,
        leaderboard: (data.leaderboard as LeaderboardEntry[]) ?? [],
      });
    }

    if (type === "game_over") {
      setPhase("game_over");
      setFinalLb((data.leaderboard as LeaderboardEntry[]) ?? []);
    }
  }, []);

  const wsUrl = state && code ? buildWsUrl(code, state.participant_id) : "";
  const { send } = useSessionSocket({ url: wsUrl, onMessage: handleMessage, enabled: !!state });

  const submitAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return;
    const now = Date.now();
    const elapsed = answerSentAt ? now - answerSentAt : 0;
    setSelectedAnswer(answer);
    send({ type: "submit_answer", answer, response_time_ms: elapsed });
  }, [selectedAnswer, answerSentAt, send]);

  if (!state) return null;

  const myRank = finalLb.find(e => e.nickname === state.nickname);
  const myScore = myRank?.score ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <img
            src={state.avatar_id ? `/avatars/${state.avatar_id}.svg` : "/avatars/placeholder.svg"}
            alt="avatar" className="w-8 h-8 rounded-full bg-muted"
            onError={(e) => { (e.target as HTMLImageElement).src = "/avatars/placeholder.svg"; }}
          />
          <span className="font-semibold text-sm text-foreground">{state.nickname}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">#{code}</span>
      </div>

      <div className="flex-1 w-full flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {/* LOBBY */}
          {phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{t("welcome_user", { name: state.nickname })}</p>
                <p className="text-muted-foreground text-sm mt-1">{t("session_waitingHost")}</p>
              </div>
              <div className="w-full bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-3">Участники ({participants.length})</p>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <span key={p.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm font-medium">
                      <img src={p.avatar_id ? `/avatars/${p.avatar_id}.svg` : "/avatars/placeholder.svg"}
                        alt="" className="w-5 h-5 rounded-full"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/avatars/placeholder.svg"; }} />
                      {p.nickname}
                    </span>
                  ))}
                </div>
              </div>
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm text-muted-foreground">● {t("session_waitingHost")}</motion.div>
            </motion.div>
          )}

          {/* QUESTION */}
          {phase === "question" && question && (
            <motion.div key={`q-${question.index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} className="flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <QuestionCard index={question.index} total={question.total} question={question.text} />
                </div>
                <CountdownTimer
                  seconds={question.timeLimit}
                  onExpire={() => {}}
                />
              </div>

              {selectedAnswer ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">✓</div>
                  <p className="font-semibold text-foreground">Ответ записан!</p>
                  <p className="text-sm text-muted-foreground">Ждём остальных...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {question.options.map((opt, i) => (
                    <AnswerButton
                      key={i}
                      index={i}
                      text={opt}
                      disabled={!!selectedAnswer}
                      onClick={() => {
                        submitAnswer(opt);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* RESULT */}
          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl
                ${result.isCorrect ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {result.isCorrect ? "✅" : "❌"}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {result.isCorrect ? `+${result.pts} ${t("session_points")}!` : t("session_wrong")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("shareAnswer")} <span className="font-semibold text-foreground">{result.correctAnswer}</span>
                </p>
              </div>
              {result.leaderboard.length > 0 && (
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">Топ участников</p>
                  <Leaderboard entries={result.leaderboard} highlightNickname={state.nickname} />
                </div>
              )}
              <p className="text-sm text-muted-foreground animate-pulse">Ждём следующий вопрос...</p>
            </motion.div>
          )}

          {/* GAME OVER */}
          {phase === "game_over" && (
            <motion.div key="over" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="text-5xl mb-2">
                  {myRank?.rank === 1 ? "🥇" : myRank?.rank === 2 ? "🥈" : myRank?.rank === 3 ? "🥉" : "🎮"}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {myRank ? t("session_rank", { rank: myRank.rank }) : t("session_gameOver")}
                </p>
                <p className="text-muted-foreground mt-1">{t("session_finalScore", { score: myScore })}</p>
              </div>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2">Финальный лидерборд</p>
                <Leaderboard entries={finalLb} highlightNickname={state.nickname} />
              </div>
              <button onClick={() => navigate("/join")}
                className="mt-2 text-sm text-primary hover:underline">
                Присоединиться к другой игре
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentGame;
