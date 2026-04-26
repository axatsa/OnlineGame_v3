import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface SpellingWord { word: string; definition: string; example: string }

function speak(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === "English" ? "en-US" : lang === "Uzbek" ? "uz-UZ" : "ru-RU";
  utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupForm({ onStart }: { onStart: (words: SpellingWord[], lang: string) => void }) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("Russian");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Введите тему");
    setLoading(true);
    try {
      const { data } = await api.post<{ words: SpellingWord[] }>("/generate/spelling", {
        topic: topic.trim(),
        count: 10,
        difficulty,
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
        <h2 className="text-xl font-bold text-center font-serif">Орфография</h2>
        <p className="text-sm text-muted-foreground text-center">Прослушай слово — напиши правильно</p>

        <div className="space-y-2">
          <Label>Тема</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: природа, технологии, спорт"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <div className="space-y-2">
          <Label>Язык</Label>
          <div className="flex gap-2">
            {["Russian", "Uzbek", "English"].map((l) => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  language === l ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"
                }`}>
                {l === "Russian" ? "Рус" : l === "Uzbek" ? "O'zb" : "Eng"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Сложность</Label>
          <div className="flex gap-2">
            {[["easy", "Лёгкий"], ["medium", "Средний"], ["hard", "Сложный"]].map(([d, label]) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  difficulty === d ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✨"}
          {loading ? "Генерирую..." : "Начать"}
        </Button>
      </div>
    </div>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
function SpellingGame({ words, lang, onBack }: { words: SpellingWord[]; lang: string; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = words[index];

  useEffect(() => {
    // auto-speak when new word appears
    speak(current.word, lang);
    inputRef.current?.focus();
  }, [index]);

  const check = () => {
    if (!input.trim()) return;
    setChecking(true);
    const isCorrect = input.trim().toLowerCase() === current.word.toLowerCase();
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    setRevealed(true);
    setTimeout(() => setChecking(false), 0);
  };

  const next = () => {
    if (index + 1 >= words.length) { onBack(); return; }
    setIndex((i) => i + 1);
    setInput("");
    setRevealed(false);
  };

  const isCorrect = input.trim().toLowerCase() === current.word.toLowerCase();

  return (
    <div className="flex flex-col items-center h-full overflow-auto py-6 px-4 gap-5">
      {/* Score */}
      <div className="flex gap-6 text-sm">
        <span className="text-green-600 font-semibold">✓ {correct}</span>
        <span className="text-muted-foreground">{index + 1}/{words.length}</span>
        <span className="text-red-500 font-semibold">✗ {wrong}</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-md p-6 space-y-4">
        {/* Listen button */}
        <button
          onClick={() => speak(current.word, lang)}
          className="w-full h-20 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Volume2 className="w-8 h-8" />
          <span className="text-xs font-medium">Нажмите чтобы услышать слово</span>
        </button>

        {/* Definition */}
        <p className="text-sm text-muted-foreground text-center italic">"{current.definition}"</p>

        {/* Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !revealed) check(); }}
            placeholder="Напишите слово..."
            disabled={revealed}
            className={`text-center text-lg font-medium ${
              revealed ? (isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50") : ""
            }`}
          />
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 text-center">
              {isCorrect ? (
                <p className="text-green-600 font-bold text-lg">🎉 Правильно!</p>
              ) : (
                <div>
                  <p className="text-red-500 font-bold">✗ Неверно</p>
                  <p className="text-sm">Правильно: <strong className="text-green-700">{current.word}</strong></p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{current.example}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!revealed ? (
          <Button onClick={check} disabled={!input.trim()} className="w-full">Проверить</Button>
        ) : (
          <Button onClick={next} className="w-full">
            {index + 1 >= words.length ? "Завершить" : "Следующее →"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function SpellingBee() {
  const [words, setWords] = useState<SpellingWord[] | null>(null);
  const [lang, setLang] = useState("Russian");

  return (
    <GameShell
      title="Орфография"
      onBack="/games"
      onRestart={words ? () => setWords(null) : undefined}
      howToPlay="Нажмите на кнопку с динамиком, чтобы услышать слово. Напишите его правильно в поле и нажмите «Проверить». Прочитайте определение как подсказку."
    >
      {!words ? (
        <SetupForm onStart={(w, l) => { setWords(w); setLang(l); }} />
      ) : (
        <SpellingGame words={words} lang={lang} onBack={() => setWords(null)} />
      )}
    </GameShell>
  );
}
