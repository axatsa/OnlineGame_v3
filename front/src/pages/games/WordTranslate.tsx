import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface WordPair { source: string; target: string; example: string }

const LANG_LABELS: Record<string, string> = {
  Russian: "Русский", Uzbek: "O'zbek", English: "English",
};

type GameMode = "flashcard" | "quiz";

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupForm({ onStart }: { onStart: (pairs: WordPair[], src: string, tgt: string, mode: GameMode) => void }) {
  const [topic, setTopic] = useState("");
  const [sourceLang, setSourceLang] = useState("Russian");
  const [targetLang, setTargetLang] = useState("English");
  const [mode, setMode] = useState<GameMode>("flashcard");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Введите тему");
    if (sourceLang === targetLang) return toast.error("Языки должны быть разными");
    setLoading(true);
    try {
      const { data } = await api.post<{ pairs: WordPair[] }>("/generate/word-pairs", {
        topic: topic.trim(),
        count: 12,
        source_lang: sourceLang,
        target_lang: targetLang,
      });
      if (!data.pairs?.length) throw new Error("empty");
      onStart(data.pairs, sourceLang, targetLang, mode);
    } catch {
      toast.error("Не удалось сгенерировать слова. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const langs = ["Russian", "Uzbek", "English"];
  const modes: { value: GameMode; label: string; desc: string }[] = [
    { value: "flashcard", label: "Карточки", desc: "Переворачивайте и отмечайте что знаете" },
    { value: "quiz", label: "Викторина", desc: "4 варианта — выберите правильный перевод" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="w-full max-w-md space-y-4 bg-white rounded-2xl shadow-md p-6 border">
        <h2 className="text-xl font-bold text-center font-serif">Перевод слов</h2>

        <div className="space-y-2">
          <Label>Тема</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: еда, профессии, глаголы движения"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Исходный язык</Label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {langs.map((l) => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Перевод на</Label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {langs.map((l) => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Режим игры</Label>
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`w-full py-3 px-4 rounded-xl text-sm border text-left transition-colors ${
                mode === m.value ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className={`block text-xs mt-0.5 ${mode === m.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.desc}</span>
            </button>
          ))}
        </div>

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✨"}
          {loading ? "Генерирую..." : "Начать"}
        </Button>
      </div>
    </div>
  );
}

// ── Flashcard mode ────────────────────────────────────────────────────────────
function FlashcardGame({ pairs, src, tgt, onBack }: { pairs: WordPair[]; src: string; tgt: string; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());

  const current = pairs[index];
  const total = pairs.length;
  const done = known.size + unknown.size === total;

  const next = (isKnown: boolean) => {
    if (isKnown) setKnown((s) => new Set([...s, index]));
    else setUnknown((s) => new Set([...s, index]));
    if (index + 1 >= total) return;
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border shadow-md p-8 text-center space-y-4">
          <span className="text-5xl">🏆</span>
          <h3 className="text-xl font-bold">Готово!</h3>
          <div className="flex justify-center gap-8 text-sm">
            <div><p className="text-2xl font-bold text-green-600">{known.size}</p><p className="text-muted-foreground">Знаю</p></div>
            <div><p className="text-2xl font-bold text-red-500">{unknown.size}</p><p className="text-muted-foreground">Учить</p></div>
          </div>
          <Button onClick={onBack} className="w-full gap-2"><RotateCcw className="w-4 h-4" /> Начать заново</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full overflow-auto py-6 px-4 gap-5">
      {/* Progress */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground w-full max-w-sm">
        <span>{index + 1}/{total}</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <span className="text-green-600">{known.size} ✓</span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm h-48 cursor-pointer perspective-1000"
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full"
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-2xl border-2 border-primary/20 shadow-md flex flex-col items-center justify-center gap-2 p-6">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">{LANG_LABELS[src]}</p>
            <p className="text-3xl font-bold text-gray-800">{current.source}</p>
            <p className="text-xs text-muted-foreground mt-2">Нажмите чтобы перевернуть</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-primary rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 p-6"
               style={{ transform: "rotateY(180deg)" }}>
            <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">{LANG_LABELS[tgt]}</p>
            <p className="text-3xl font-bold text-primary-foreground">{current.target}</p>
            <p className="text-xs text-primary-foreground/70 text-center mt-2 italic">{current.example}</p>
          </div>
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        <Button variant="outline" onClick={() => next(false)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
          ✗ Учить
        </Button>
        <Button onClick={() => next(true)} className="flex-1 bg-green-600 hover:bg-green-700">
          ✓ Знаю
        </Button>
      </div>
    </div>
  );
}

// ── Quiz (multiple choice) mode ───────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildOptions(pairs: WordPair[], correctIdx: number): string[] {
  const correct = pairs[correctIdx].target;
  const pool = pairs.filter((_, i) => i !== correctIdx).map((p) => p.target);
  const wrong = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

function QuizGame({ pairs, src, tgt, onBack }: { pairs: WordPair[]; src: string; tgt: string; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>(() => buildOptions(pairs, 0));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);

  const current = pairs[index];
  const isLast = index + 1 >= pairs.length;

  const pick = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const ok = opt === current.target;
    if (ok) setScore((s) => s + 1); else setWrong((w) => w + 1);
    setTimeout(() => {
      if (isLast) { onBack(); return; }
      const next = index + 1;
      setIndex(next);
      setOptions(buildOptions(pairs, next));
      setSelected(null);
    }, 900);
  };

  if (selected === null && index >= pairs.length) {
    return null;
  }

  const progress = ((index + 1) / pairs.length) * 100;

  return (
    <div className="flex flex-col items-center h-full overflow-auto py-6 px-4 gap-5">
      {/* Header */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground w-full max-w-sm">
        <span>{index + 1}/{pairs.length}</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-green-600 font-semibold">⭐ {score}</span>
      </div>

      {/* Question card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-primary/20 shadow-md p-6 text-center space-y-1">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">{LANG_LABELS[src]}</p>
        <p className="text-3xl font-bold text-gray-800">{current.source}</p>
        <p className="text-xs text-muted-foreground">{current.example}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {options.map((opt) => {
          const isCorrect = opt === current.target;
          const isPicked = opt === selected;
          let cls = "rounded-xl border-2 p-3 text-sm font-medium transition-all text-left ";
          if (!selected) cls += "border-input hover:border-primary hover:bg-primary/5 cursor-pointer";
          else if (isCorrect) cls += "border-green-500 bg-green-50 text-green-700";
          else if (isPicked) cls += "border-red-400 bg-red-50 text-red-600";
          else cls += "border-input opacity-50";

          return (
            <motion.button
              key={opt}
              onClick={() => pick(opt)}
              className={cls}
              whileTap={!selected ? { scale: 0.97 } : {}}
            >
              {isPicked && (isCorrect ? "✓ " : "✗ ")}{opt}
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">Выберите правильный перевод слова</p>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function WordTranslate() {
  const [pairs, setPairs] = useState<WordPair[] | null>(null);
  const [src, setSrc] = useState("Russian");
  const [tgt, setTgt] = useState("English");
  const [mode, setMode] = useState<GameMode>("flashcard");

  return (
    <GameShell
      title="Перевод слов"
      onBack="/games"
      onRestart={pairs ? () => setPairs(null) : undefined}
      howToPlay="Два режима: «Карточки» — переворачивайте и отмечайте что знаете; «Викторина» — выбирайте правильный перевод из 4 вариантов. Правильный ответ подсвечивается зелёным, неверный — красным. Набирайте очки за правильные ответы."
    >
      {!pairs ? (
        <SetupForm onStart={(p, s, t, m) => { setPairs(p); setSrc(s); setTgt(t); setMode(m); }} />
      ) : mode === "quiz" ? (
        <QuizGame pairs={pairs} src={src} tgt={tgt} onBack={() => setPairs(null)} />
      ) : (
        <FlashcardGame pairs={pairs} src={src} tgt={tgt} onBack={() => setPairs(null)} />
      )}
    </GameShell>
  );
}
