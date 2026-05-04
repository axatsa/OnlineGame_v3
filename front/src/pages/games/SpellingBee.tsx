import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";
import { Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import type { SpellingWord } from "@/types/api";

// ── Voice presets ─────────────────────────────────────────────────────────────
type VoicePresetId = "female" | "male" | "robot" | "child" | "default";

interface VoicePreset {
  id: VoicePresetId;
  label: string;
  emoji: string;
  // hint for picking a system voice by name
  preferGender?: "female" | "male";
  // overrides for utterance
  rate: number;
  pitch: number;
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: "default", label: "Обычный", emoji: "🔊", rate: 0.85, pitch: 1.0 },
  { id: "female", label: "Женский", emoji: "👩", preferGender: "female", rate: 0.9, pitch: 1.15 },
  { id: "male", label: "Мужской", emoji: "👨", preferGender: "male", rate: 0.85, pitch: 0.85 },
  { id: "robot", label: "Робот", emoji: "🤖", rate: 0.7, pitch: 0.1 },
  { id: "child", label: "Ребёнок", emoji: "🧒", preferGender: "female", rate: 1.0, pitch: 1.6 },
];

// Heuristic to identify a "female" or "male" voice by its name
const FEMALE_HINTS = ["female", "женск", "samantha", "anna", "milena", "victoria", "veena", "zira", "tatyana", "alenka", "milana", "alice", "nicky", "karen", "moira", "fiona", "google русский", "google english (united states)"];
const MALE_HINTS = ["male", "мужск", "alex", "yuri", "daniel", "fred", "george", "tom", "thomas", "diego", "luca", "george", "google english (united kingdom)"];

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, prefer?: "female" | "male"): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const langCode = lang === "English" ? "en" : lang === "Uzbek" ? "uz" : "ru";
  const matchingLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));
  const pool = matchingLang.length > 0 ? matchingLang : voices;
  if (!prefer) return pool[0];
  const hints = prefer === "female" ? FEMALE_HINTS : MALE_HINTS;
  const matched = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return matched || pool[0];
}

function speak(text: string, lang: string, presetId: VoicePresetId = "default") {
  if (!window.speechSynthesis) return;
  const preset = VOICE_PRESETS.find((p) => p.id === presetId) || VOICE_PRESETS[0];
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === "English" ? "en-US" : lang === "Uzbek" ? "uz-UZ" : "ru-RU";
  utt.rate = preset.rate;
  utt.pitch = preset.pitch;
  const voices = window.speechSynthesis.getVoices();
  const v = pickVoice(voices, lang, preset.preferGender);
  if (v) utt.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

const VOICE_STORAGE_KEY = "spelling_voice_preset";

function loadVoicePreference(): VoicePresetId {
  try {
    const v = localStorage.getItem(VOICE_STORAGE_KEY) as VoicePresetId | null;
    if (v && VOICE_PRESETS.some((p) => p.id === v)) return v;
  } catch {}
  return "default";
}

function saveVoicePreference(id: VoicePresetId) {
  try { localStorage.setItem(VOICE_STORAGE_KEY, id); } catch {}
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function SetupForm({ onStart }: { onStart: (words: SpellingWord[], lang: string) => void }) {
  const [mode, setMode] = useState<"ai" | "custom">("ai");
  const [topic, setTopic] = useState("");
  const [customText, setCustomText] = useState("");
  const [language, setLanguage] = useState("Russian");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (mode === "custom") {
      const lines = customText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return toast.error("Введите хотя бы одно слово");
      const words: SpellingWord[] = lines.map((l) => {
        const sep = l.includes("—") ? "—" : l.includes(":") ? ":" : null;
        if (sep) {
          const idx = l.indexOf(sep);
          return { word: l.slice(0, idx).trim(), definition: l.slice(idx + sep.length).trim(), example: "" };
        }
        return { word: l.trim(), definition: "", example: "" };
      });
      onStart(words, language);
      return;
    }
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

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-input overflow-hidden">
          {([["ai", "✨ AI генерация"], ["custom", "✏️ Свои слова"]] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}>
              {label}
            </button>
          ))}
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

        {mode === "ai" ? (
          <>
            <div className="space-y-2">
              <Label>Тема</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: природа, технологии, спорт"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
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
          </>
        ) : (
          <div className="space-y-2">
            <Label>Слова (по одному на строку)</Label>
            <p className="text-xs text-muted-foreground">Формат: <code className="bg-muted px-1 rounded">слово</code> или <code className="bg-muted px-1 rounded">слово — подсказка</code></p>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={6}
              placeholder={"автомобиль\nкомпьютер — электронное устройство\nтелефон"}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={loading || (mode === "ai" ? !topic.trim() : !customText.trim())}
          className="w-full gap-2"
        >
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
  const [voicePreset, setVoicePreset] = useState<VoicePresetId>(() => loadVoicePreference());
  const [voicesReady, setVoicesReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = words[index];

  // Ensure system voices are loaded (Chrome loads them async)
  useEffect(() => {
    const handle = () => setVoicesReady(true);
    if (window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
      window.speechSynthesis.onvoiceschanged = handle;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // auto-speak when new word appears
    if (voicesReady) speak(current.word, lang, voicePreset);
    inputRef.current?.focus();
  }, [index, voicesReady]);

  const changeVoice = (id: VoicePresetId) => {
    setVoicePreset(id);
    saveVoicePreference(id);
    // Demo the new voice immediately
    speak(current.word, lang, id);
  };

  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/ё/g, "е");

  const allAnswers = (w: typeof current) =>
    [w.word, ...(w.alternatives ?? [])];

  const checkAnswer = (input: string) =>
    allAnswers(current).some((a) => normalize(input) === normalize(a));

  const check = () => {
    if (!input.trim()) return;
    setChecking(true);
    const correct = checkAnswer(input);
    if (correct) setCorrect((c) => c + 1);
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

  const isCorrect = checkAnswer(input);

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
        {/* Voice selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Голос диктора</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {VOICE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => changeVoice(p.id)}
                title={p.label}
                className={`flex flex-col items-center justify-center py-2 rounded-lg border text-[10px] font-medium transition-all ${
                  voicePreset === p.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white hover:bg-primary/5 border-input"
                }`}
              >
                <span className="text-lg leading-none">{p.emoji}</span>
                <span className="mt-0.5">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Listen button */}
        <button
          onClick={() => speak(current.word, lang, voicePreset)}
          className="w-full h-20 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Volume2 className="w-8 h-8" />
          <span className="text-xs font-medium">Нажмите чтобы услышать слово</span>
        </button>

        {/* Definition */}
        <p className="text-sm text-muted-foreground text-center italic">"<RichTextRenderer text={current.definition} />"</p>

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
                <div className="space-y-1">
                  <p className="text-red-500 font-bold">✗ Неверно</p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Правильно: </span>
                    {allAnswers(current).map((a, i) => (
                      <span key={a}>
                        <strong className="text-green-700">{a}</strong>
                        {i < allAnswers(current).length - 1 && <span className="text-muted-foreground"> / </span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground"><RichTextRenderer text={current.example} /></p>
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
      howToPlay="Выберите голос диктора (женский, мужской, робот и др.), нажмите на кнопку с динамиком, чтобы услышать слово. Напишите его правильно в поле и нажмите «Проверить». Прочитайте определение как подсказку."
    >
      {!words ? (
        <SetupForm onStart={(w, l) => { setWords(w); setLang(l); }} />
      ) : (
        <SpellingGame words={words} lang={lang} onBack={() => setWords(null)} />
      )}
    </GameShell>
  );
}
