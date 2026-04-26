import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Flame, Trophy, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

type PuzzleType = "missing_operator" | "number_chain" | "magic_square";

interface OperatorPuzzle { puzzle: string; answer: string }
interface ChainPuzzle { puzzle: string; answer: string; rule: string }
interface MagicPuzzle { puzzle: (number | "?")[][][]; answers: string[]; magic_sum: number }
type AnyPuzzle = OperatorPuzzle | ChainPuzzle | MagicPuzzle;

const PUZZLE_LABELS: Record<PuzzleType, string> = {
  missing_operator: "Пропущенный оператор",
  number_chain: "Числовая цепочка",
  magic_square: "Магический квадрат",
};

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupForm({ onStart }: { onStart: (puzzles: AnyPuzzle[], type: PuzzleType) => void }) {
  const [topic, setTopic] = useState("");
  const [puzzleType, setPuzzleType] = useState<PuzzleType>("missing_operator");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ puzzles: AnyPuzzle[]; puzzle_type: PuzzleType }>("/generate/math-puzzle", {
        topic: topic.trim() || "арифметика",
        count: 6,
        puzzle_type: puzzleType,
        language: "Russian",
      });
      if (!data.puzzles?.length) throw new Error("empty");
      onStart(data.puzzles, data.puzzle_type);
    } catch {
      toast.error("Не удалось сгенерировать задачи. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="w-full max-w-md space-y-4 bg-white rounded-2xl shadow-md p-6 border">
        <h2 className="text-xl font-bold text-center font-serif">Математические головоломки</h2>

        <div className="space-y-2">
          <Label>Тема (необязательно)</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: дроби, уравнения, степени"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <div className="space-y-2">
          <Label>Тип головоломки</Label>
          {(Object.entries(PUZZLE_LABELS) as [PuzzleType, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setPuzzleType(t)}
              className={`w-full py-3 px-4 rounded-xl text-sm font-medium border text-left transition-colors ${
                puzzleType === t ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✨"}
          {loading ? "Генерирую..." : "Начать"}
        </Button>
      </div>
    </div>
  );
}

// ── Single puzzle card ────────────────────────────────────────────────────────
function OperatorCard({ puzzle, answer }: OperatorPuzzle & { onNext: () => void }) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = input.trim().toUpperCase() === String(answer).toUpperCase();
  return (
    <div className="space-y-4">
      <p className="text-3xl font-mono font-bold text-center text-gray-800">{puzzle}</p>
      <p className="text-sm text-muted-foreground text-center">Введите пропущенный оператор (+, -, ×, ÷)</p>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите оператор"
        disabled={checked}
        className="text-center text-xl font-bold"
        onKeyDown={(e) => { if (e.key === "Enter" && !checked) setChecked(true); }}
      />
      {checked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-1">
          {isCorrect
            ? <p className="text-green-600 font-bold text-lg">🎉 Верно!</p>
            : <p className="text-red-500">Ответ: <strong>{answer}</strong></p>}
        </motion.div>
      )}
      {!checked
        ? <Button onClick={() => setChecked(true)} disabled={!input.trim()} className="w-full">Проверить</Button>
        : null}
    </div>
  );
}

function ChainCard({ puzzle, answer, rule }: ChainPuzzle) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = input.trim() === String(answer).trim();
  return (
    <div className="space-y-4">
      <p className="text-2xl font-mono font-bold text-center text-gray-800 tracking-widest">{puzzle}</p>
      <p className="text-sm text-muted-foreground text-center">Найдите следующее число</p>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите число"
        disabled={checked}
        className="text-center text-xl font-bold"
        onKeyDown={(e) => { if (e.key === "Enter" && !checked) setChecked(true); }}
      />
      {checked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-1">
          {isCorrect
            ? <p className="text-green-600 font-bold text-lg">🎉 Верно!</p>
            : <p className="text-red-500">Ответ: <strong>{answer}</strong></p>}
          <p className="text-xs text-muted-foreground">Правило: {rule}</p>
        </motion.div>
      )}
      {!checked
        ? <Button onClick={() => setChecked(true)} disabled={!input.trim()} className="w-full">Проверить</Button>
        : null}
    </div>
  );
}

const PUZZLE_TIME = 30;
const MAX_STREAK_MULTI = 3;

interface RoundResult { correct: boolean; timeLeft: number; bonus: number; streakAt: number }

// ── Results screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  score, total, results, type, onPlayAgain, onBack,
}: {
  score: number; total: number; results: RoundResult[]; type: PuzzleType;
  onPlayAgain: () => void; onBack: () => void;
}) {
  const correct = results.filter(r => r.correct).length;
  const accuracy = Math.round((correct / total) * 100);
  const maxStreak = results.reduce((max, r) => Math.max(max, r.streakAt), 0);
  const avgTime = Math.round(
    results.reduce((sum, r) => sum + (PUZZLE_TIME - r.timeLeft), 0) / total
  );

  useEffect(() => {
    api.post("/gamification/activities/complete", {
      activity_type: "math_puzzle",
      activity_id: `math_${type}_${Date.now()}`,
    }).catch(() => {});
  }, []);

  const grade = accuracy === 100 ? "🏆 Идеально!" : accuracy >= 80 ? "🌟 Отлично!" : accuracy >= 60 ? "👍 Хорошо" : "💪 Тренируйтесь";

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 gap-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="text-center space-y-1">
          <p className="text-4xl">{grade.split(" ")[0]}</p>
          <p className="text-2xl font-bold text-foreground">{grade.split(" ").slice(1).join(" ")}</p>
          <p className="text-muted-foreground text-sm">{PUZZLE_LABELS[type]}</p>
        </div>

        {/* Score big */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Итоговый счёт</p>
          <p className="text-5xl font-black text-primary tabular-nums">{score}</p>
          <p className="text-xs text-muted-foreground mt-1">очков</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{correct}/{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Верных</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Точность</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{maxStreak}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Лучшая серия</p>
          </div>
        </div>

        {/* Per-round breakdown */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Разбор по задачам</p>
          </div>
          <div className="divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  {r.correct
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-muted-foreground">Задача {i + 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  {r.streakAt >= 2 && (
                    <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                      <Flame className="w-3 h-3" />×{Math.min(r.streakAt, MAX_STREAK_MULTI)}
                    </span>
                  )}
                  {r.correct && <span className="text-xs text-muted-foreground">{PUZZLE_TIME - r.timeLeft}с</span>}
                  <span className={`font-bold tabular-nums ${r.correct ? "text-primary" : "text-muted-foreground"}`}>
                    +{r.bonus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2 rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
          <Button className="flex-1 gap-2 rounded-xl" onClick={onPlayAgain}>
            <RotateCcw className="w-4 h-4" /> Ещё раз
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Game runner ───────────────────────────────────────────────────────────────
function PuzzleGame({ puzzles, type, onBack, onRestart }: {
  puzzles: AnyPuzzle[]; type: PuzzleType; onBack: () => void; onRestart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PUZZLE_TIME);
  const [timedOut, setTimedOut] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = puzzles[index];
  const isLast = index + 1 >= puzzles.length;

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(PUZZLE_TIME);
    setTimedOut(false);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); setTimedOut(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => { startTimer(); return stopTimer; }, [index]);

  const handleNext = (wasCorrect: boolean, tLeft: number) => {
    stopTimer();
    const newStreak = wasCorrect ? streak + 1 : 0;
    const streakMulti = Math.min(newStreak, MAX_STREAK_MULTI);
    const timeBonus = wasCorrect ? Math.floor(tLeft / 10) : 0;
    const basePoints = wasCorrect ? 1 : 0;
    const roundScore = wasCorrect ? (basePoints + timeBonus) * (streakMulti || 1) : 0;

    const round: RoundResult = {
      correct: wasCorrect,
      timeLeft: tLeft,
      bonus: roundScore,
      streakAt: newStreak,
    };

    setStreak(newStreak);
    if (wasCorrect) setScore((s) => s + roundScore);
    setResults((prev) => [...prev, round]);

    if (isLast) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <ResultsScreen
        score={score}
        total={puzzles.length}
        results={results}
        type={type}
        onPlayAgain={onRestart}
        onBack={onBack}
      />
    );
  }

  const timerPct = (timeLeft / PUZZLE_TIME) * 100;
  const timerColor = timerPct > 50 ? "bg-green-500" : timerPct > 25 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="flex flex-col items-center h-full overflow-auto py-6 px-4 gap-5">
      {/* Header row */}
      <div className="flex items-center gap-6 text-sm w-full max-w-sm">
        <span className="text-muted-foreground">Задача {index + 1}/{puzzles.length}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
        <span className={`font-bold w-8 text-right tabular-nums ${timeLeft <= 10 ? "text-red-500" : "text-foreground"}`}>
          {timeLeft}с
        </span>
        {streak >= 2 && (
          <span className="flex items-center gap-0.5 text-orange-500 font-bold text-xs">
            <Flame className="w-3.5 h-3.5" />{streak}
          </span>
        )}
        <span className="font-semibold text-primary">⭐ {score}</span>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-md p-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
          {PUZZLE_LABELS[type]}
        </p>

        {timedOut ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3 py-4">
            <p className="text-4xl">⏱️</p>
            <p className="text-lg font-bold text-red-500">Время вышло!</p>
            <Button onClick={() => handleNext(false, 0)} className="w-full">
              {isLast ? "Завершить" : "Следующая →"}
            </Button>
          </motion.div>
        ) : (
          <>
            {type === "missing_operator" && (
              <OperatorManagedCard
                puzzle={current as OperatorPuzzle}
                onResult={(ok) => { const t = timeLeft; setTimeout(() => handleNext(ok, t), 900); }}
              />
            )}
            {type === "number_chain" && (
              <ChainManagedCard
                puzzle={current as ChainPuzzle}
                onResult={(ok) => { const t = timeLeft; setTimeout(() => handleNext(ok, t), 900); }}
              />
            )}
            {type === "magic_square" && (
              <MagicSquareCard
                puzzle={current as unknown as { puzzle: (number | string)[][]; answers: string[]; magic_sum: number }}
                onResult={(ok) => { const t = timeLeft; setTimeout(() => handleNext(ok, t), 1200); }}
              />
            )}
          </>
        )}
      </div>
      {streak >= 2
        ? <p className="text-xs text-orange-500 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3" /> Серия ×{Math.min(streak, MAX_STREAK_MULTI)} — множитель очков!
          </p>
        : <p className="text-xs text-muted-foreground">Быстрый ответ + серия = больше очков</p>
      }
    </div>
  );
}

function OperatorManagedCard({ puzzle, onResult }: { puzzle: OperatorPuzzle; onResult: (ok: boolean) => void }) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = input.trim().toUpperCase() === String(puzzle.answer).toUpperCase();

  const check = () => {
    setChecked(true);
    onResult(isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-3xl font-mono font-bold text-center">{puzzle.puzzle}</p>
      <Input value={input} onChange={(e) => setInput(e.target.value)} disabled={checked}
        placeholder="+  −  ×  ÷" className="text-center text-xl font-bold"
        onKeyDown={(e) => e.key === "Enter" && !checked && check()} />
      {checked
        ? <p className={`text-center font-bold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
            {isCorrect ? "🎉 Верно!" : `Ответ: ${puzzle.answer}`}
          </p>
        : <Button onClick={check} disabled={!input.trim()} className="w-full">Проверить</Button>}
    </div>
  );
}

function ChainManagedCard({ puzzle, onResult }: { puzzle: ChainPuzzle; onResult: (ok: boolean) => void }) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = input.trim() === String(puzzle.answer).trim();
  const check = () => { setChecked(true); onResult(isCorrect); };
  return (
    <div className="space-y-4">
      <p className="text-2xl font-mono font-bold text-center tracking-widest">{puzzle.puzzle}</p>
      <Input value={input} onChange={(e) => setInput(e.target.value)} disabled={checked}
        placeholder="Следующее число" className="text-center text-xl font-bold"
        onKeyDown={(e) => e.key === "Enter" && !checked && check()} />
      {checked
        ? <div className="text-center space-y-1">
            <p className={`font-bold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
              {isCorrect ? "🎉 Верно!" : `Ответ: ${puzzle.answer}`}
            </p>
            <p className="text-xs text-muted-foreground">Правило: {puzzle.rule}</p>
          </div>
        : <Button onClick={check} disabled={!input.trim()} className="w-full">Проверить</Button>}
    </div>
  );
}

function MagicSquareCard({ puzzle, onResult }: { puzzle: { puzzle: (number | string)[][]; answers: string[]; magic_sum: number }; onResult: (ok: boolean) => void }) {
  const [inputs, setInputs] = useState<string[]>(Array(puzzle.answers.length).fill(""));
  const [checked, setChecked] = useState(false);
  let ansIdx = 0;

  const allCorrect = puzzle.answers.every((a, i) => inputs[i]?.trim() === String(a).trim());
  const check = () => { setChecked(true); onResult(allCorrect); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-center text-muted-foreground">Сумма по каждой строке, столбцу и диагонали = <strong>{puzzle.magic_sum}</strong></p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${puzzle.puzzle[0]?.length ?? 3}, 1fr)` }}>
        {puzzle.puzzle.flat().map((cell, i) => {
          if (cell === "?") {
            const idx = ansIdx++;
            return (
              <Input key={i} value={inputs[idx]} onChange={(e) => {
                const next = [...inputs]; next[idx] = e.target.value; setInputs(next);
              }} disabled={checked} className="text-center font-bold h-10 px-1" placeholder="?" />
            );
          }
          return <div key={i} className="h-10 flex items-center justify-center bg-muted rounded-lg font-bold text-gray-700">{cell}</div>;
        })}
      </div>
      {checked
        ? <p className={`text-center font-bold ${allCorrect ? "text-green-600" : "text-red-500"}`}>
            {allCorrect ? "🎉 Верно!" : `Ответы: ${puzzle.answers.join(", ")}`}
          </p>
        : <Button onClick={check} disabled={inputs.some(v => !v.trim())} className="w-full">Проверить</Button>}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function MathPuzzle() {
  const [puzzles, setPuzzles] = useState<AnyPuzzle[] | null>(null);
  const [type, setType] = useState<PuzzleType>("missing_operator");

  return (
    <GameShell
      title="Математические головоломки"
      onBack="/games"
      onRestart={puzzles ? () => setPuzzles(null) : undefined}
      howToPlay="Решите каждую задачу. В «Пропущенном операторе» — вставьте знак действия. В «Цепочке» — найдите следующее число по правилу. В «Магическом квадрате» — заполните ячейки так, чтобы суммы совпали."
    >
      {!puzzles ? (
        <SetupForm onStart={(p, t) => { setPuzzles(p); setType(t); }} />
      ) : (
        <PuzzleGame
          puzzles={puzzles}
          type={type}
          onBack={() => setPuzzles(null)}
          onRestart={() => setPuzzles(null)}
        />
      )}
    </GameShell>
  );
}
