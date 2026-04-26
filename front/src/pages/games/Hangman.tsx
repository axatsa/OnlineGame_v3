import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

// ── SVG Hangman drawing ──────────────────────────────────────────────────────
const HANGMAN_PARTS = [
  // 0: gallows base
  <line key="base" x1="10" y1="130" x2="90" y2="130" stroke="#374151" strokeWidth="4" strokeLinecap="round" />,
  // 1: pole
  <line key="pole" x1="50" y1="130" x2="50" y2="10" stroke="#374151" strokeWidth="4" strokeLinecap="round" />,
  // 2: top beam
  <line key="beam" x1="50" y1="10" x2="90" y2="10" stroke="#374151" strokeWidth="4" strokeLinecap="round" />,
  // 3: rope
  <line key="rope" x1="90" y1="10" x2="90" y2="30" stroke="#374151" strokeWidth="3" strokeLinecap="round" />,
  // 4: head
  <circle key="head" cx="90" cy="42" r="12" stroke="#EF4444" strokeWidth="3" fill="none" />,
  // 5: body
  <line key="body" x1="90" y1="54" x2="90" y2="90" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />,
  // 6: left arm
  <line key="larm" x1="90" y1="65" x2="72" y2="80" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />,
  // 7: right arm
  <line key="rarm" x1="90" y1="65" x2="108" y2="80" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />,
  // 8: left leg
  <line key="lleg" x1="90" y1="90" x2="74" y2="112" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />,
  // 9: right leg
  <line key="rleg" x1="90" y1="90" x2="106" y2="112" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />,
];
const MAX_WRONG = HANGMAN_PARTS.length - 3; // 7 wrong guesses allowed (after gallows)

const ALPHABET_RU = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
const ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface WordEntry { word: string; hint: string }

type Phase = "setup" | "playing" | "result";

// ── Setup form ────────────────────────────────────────────────────────────────
function SetupForm({ onStart }: { onStart: (words: WordEntry[], lang: string) => void }) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("Russian");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Введите тему");
    setLoading(true);
    try {
      const { data } = await api.post<{ words: WordEntry[] }>("/generate/hangman", {
        topic: topic.trim(),
        count: 8,
        language,
      });
      if (!data.words?.length) throw new Error("empty");
      onStart(data.words, language);
    } catch {
      toast.error("Не удалось сгенерировать слова. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="w-full max-w-md space-y-4 bg-white rounded-2xl shadow-md p-6 border">
        <h2 className="text-xl font-bold text-center font-serif">Виселица</h2>
        <p className="text-sm text-muted-foreground text-center">Угадайте слово по подсказке</p>

        <div className="space-y-2">
          <Label>Тема</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: животные, физика, история"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <div className="space-y-2">
          <Label>Язык</Label>
          <div className="flex gap-2">
            {["Russian", "Uzbek", "English"].map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  language === l ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"
                }`}
              >
                {l === "Russian" ? "Рус" : l === "Uzbek" ? "O'zb" : "Eng"}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✨"}
          {loading ? "Генерирую..." : "Начать игру"}
        </Button>
      </div>
    </div>
  );
}

// ── Game logic ────────────────────────────────────────────────────────────────
function HangmanGame({ words, lang, onBack }: { words: WordEntry[]; lang: string; onBack: () => void }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);

  const { word, hint } = words[wordIndex];
  const upper = word.toUpperCase();
  const alphabet = lang === "English" ? ALPHABET_EN : ALPHABET_RU;

  const wrongGuesses = [...guessed].filter((l) => !upper.includes(l));
  const wrongCount = wrongGuesses.length;
  const partsToShow = Math.min(wrongCount + 3, HANGMAN_PARTS.length);

  const isWon = upper.split("").every((ch) => ch === " " || guessed.has(ch));
  const isLost = wrongCount >= MAX_WRONG;

  useEffect(() => {
    if (isWon) { setPhase("won"); setScore((s) => s + 1); }
    else if (isLost) setPhase("lost");
  }, [isWon, isLost]);

  const guess = useCallback((letter: string) => {
    if (phase !== "playing" || guessed.has(letter)) return;
    setGuessed((prev) => new Set([...prev, letter]));
  }, [phase, guessed]);

  const next = () => {
    if (wordIndex + 1 >= words.length) {
      // finished all words — go back to result handled by parent
      onBack();
      return;
    }
    setWordIndex((i) => i + 1);
    setGuessed(new Set());
    setPhase("playing");
  };

  return (
    <div className="flex flex-col items-center h-full overflow-auto py-4 px-4 gap-4">
      {/* Score & progress */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Слово {wordIndex + 1}/{words.length}</span>
        <span>Очки: {score}</span>
      </div>

      {/* Hint */}
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-800 text-center max-w-xs">
        💡 {hint}
      </p>

      {/* SVG gallows */}
      <svg viewBox="0 0 140 140" width="140" height="140">
        {HANGMAN_PARTS.slice(0, partsToShow)}
      </svg>

      {/* Word display */}
      <div className="flex gap-2 flex-wrap justify-center">
        {upper.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="w-4" />
          ) : (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-9 h-10 flex items-end justify-center border-b-2 border-gray-400 text-lg font-bold text-gray-800"
            >
              {guessed.has(ch) ? ch : ""}
            </motion.div>
          )
        )}
      </div>

      {/* Wrong letters */}
      {wrongGuesses.length > 0 && (
        <p className="text-sm text-red-500">
          Неверно: {wrongGuesses.join(", ")} ({MAX_WRONG - wrongCount} осталось)
        </p>
      )}

      {/* Keyboard */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
        {alphabet.map((l) => {
          const isRight = upper.includes(l) && guessed.has(l);
          const isWrong = !upper.includes(l) && guessed.has(l);
          return (
            <button
              key={l}
              onClick={() => guess(l)}
              disabled={guessed.has(l) || phase !== "playing"}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                isRight ? "bg-green-500 text-white" :
                isWrong ? "bg-red-200 text-red-400 line-through" :
                "bg-gray-100 hover:bg-primary hover:text-white active:scale-95"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {phase !== "playing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 bg-white rounded-2xl border shadow-lg p-6 max-w-xs w-full"
          >
            <span className="text-4xl">{phase === "won" ? "🎉" : "💀"}</span>
            <p className="text-lg font-bold">{phase === "won" ? "Правильно!" : "Неверно"}</p>
            {phase === "lost" && (
              <p className="text-sm text-muted-foreground">Слово было: <strong>{upper}</strong></p>
            )}
            <Button onClick={next} className="gap-2">
              {wordIndex + 1 >= words.length ? "Завершить" : "Следующее слово →"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Top-level component ───────────────────────────────────────────────────────
export default function Hangman() {
  const [words, setWords] = useState<WordEntry[] | null>(null);
  const [lang, setLang] = useState("Russian");

  const start = (w: WordEntry[], l: string) => { setWords(w); setLang(l); };
  const restart = () => setWords(null);

  return (
    <GameShell
      title="Виселица"
      onBack="/games"
      onRestart={words ? restart : undefined}
      howToPlay="Угадайте скрытое слово, называя буквы по одной. После 7 неверных попыток игра заканчивается. Используйте подсказку к слову."
    >
      {!words ? (
        <SetupForm onStart={start} />
      ) : (
        <HangmanGame words={words} lang={lang} onBack={restart} />
      )}
    </GameShell>
  );
}
