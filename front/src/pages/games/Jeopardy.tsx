import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { toast } from "sonner";

const POINTS = [100, 200, 300, 400, 500];

const Jeopardy = () => {
  const { activeClassId } = useClass();
  // FIX #4: используем язык интерфейса для генерации
  const { lang } = useLang();
  const [status, setStatus] = useState<"setup" | "loading" | "playing">("setup");
  const [topic, setTopic] = useState("");
  const [selectedLang, setSelectedLang] = useState<"ru" | "uz">(lang);
  const [teams, setTeams] = useState<{ name: string; score: number }[]>([
    { name: "Team A", score: 0 },
    { name: "Team B", score: 0 },
  ]);
  const [newTeam, setNewTeam] = useState("");
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<{ cat: string; pts: number } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Dynamic Data
  const [categories, setCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Record<string, { q: string; a: string }>>({});

  const addTeam = () => {
    if (newTeam.trim() && teams.length < 4) {
      setTeams((t) => [...t, { name: newTeam.trim(), score: 0 }]);
      setNewTeam("");
    }
  };

  const removeTeam = (i: number) => {
    if (teams.length > 2) setTeams((t) => t.filter((_, idx) => idx !== i));
  };

  const startGame = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setStatus("loading");
    try {
      // FIX #4: добавляем инструкцию по языку в тему
      const langStr = selectedLang === "uz" ? "in Uzbek language" : "in Russian language";
      const res = await api.post("/generate/jeopardy", {
        topic: `${topic} (${langStr})`,
        class_id: activeClassId
      });

      const data = res.data;
      if (!data.categories || data.categories.length === 0) {
        throw new Error("No data generated");
      }

      const newCategories: string[] = [];
      const newQuestions: Record<string, { q: string; a: string }> = {};

      data.categories.forEach((cat: any) => {
        newCategories.push(cat.name);
        cat.questions.forEach((q: any) => {
          // Map backend points to closest available or just use backend logic if consistent
          // Backend returns 100, 200, 300... which matches POINTS
          const key = `${cat.name}-${q.points}`;
          newQuestions[key] = { q: q.q, a: q.a };
        });
      });

      setCategories(newCategories);
      setQuestions(newQuestions);
      setStatus("playing");
      toast.success("Game generated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate game. Try again.");
      setStatus("setup");
    }
  };

  const openCell = (cat: string, pts: number) => {
    const key = `${cat}-${pts}`;
    if (answered.has(key)) return;
    setActiveCell({ cat, pts });
    setShowAnswer(false);
  };

  const awardPoints = (teamIdx: number) => {
    if (!activeCell) return;
    setTeams((t) => t.map((team, i) => i === teamIdx ? { ...team, score: team.score + activeCell.pts } : team));
    setAnswered((a) => new Set([...a, `${activeCell.cat}-${activeCell.pts}`]));
    setActiveCell(null);
  };

  const howToPlay = "Tap a cell to reveal the question. Read it aloud. Reveal the answer and award points to the correct team. The team with the most points wins!";

  return (
    <GameShell title="Jeopardy" onBack="/games"
      onRestart={() => { setStatus("setup"); setAnswered(new Set()); setTeams(t => t.map(t => ({ ...t, score: 0 }))); }}
      howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-white"
          >
            <h2 className="text-4xl font-bold text-gray-800 font-serif">Jeopardy</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-sm">
              {/* Topic input */}
              <div className="space-y-1.5">
                <Label className="text-gray-700 font-sans font-medium">Game Topic</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. History, Math, Biology..."
                  className="font-sans" />
                <p className="text-xs text-gray-400 font-sans">AI will generate {POINTS.length * 5} questions about this topic</p>
              </div>

              {/* Language selector */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-sans font-medium">Язык вопросов</Label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedLang("ru")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium font-sans border-2 transition-all ${selectedLang === "ru" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}>
                    🇷🇺 Русский
                  </button>
                  <button onClick={() => setSelectedLang("uz")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium font-sans border-2 transition-all ${selectedLang === "uz" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:border-green-300"}`}>
                    🇺🇿 O'zbekcha
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="space-y-2">
                <Label className="text-gray-700 font-sans font-medium">Teams (2–4)</Label>
                {teams.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <span className="flex-1 text-gray-700 font-sans text-sm">{t.name}</span>
                    {teams.length > 2 && (
                      <button onClick={() => removeTeam(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {teams.length < 4 && (
                <div className="flex gap-2">
                  <Input value={newTeam} onChange={(e) => setNewTeam(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTeam()}
                    placeholder="Team Name..." className="font-sans" />
                  <Button onClick={addTeam} variant="outline"><Plus className="w-4 h-4" /></Button>
                </div>
              )}
              <Button onClick={startGame} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-sans">
                <Sparkles className="w-4 h-4 mr-2" /> Start Game
              </Button>
            </div>
          </motion.div>
        )}

        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 bg-white"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-sans text-lg">Generating game board about "{topic}"...</p>
          </motion.div>
        )}

        {status === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-gray-50"
          >
            {topic && (
              <div className="text-center py-2 text-sm font-sans text-gray-500 bg-white border-b border-gray-100">
                Topic: <span className="font-semibold text-blue-600">{topic}</span>
              </div>
            )}
            {/* Board */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
                {categories.map((cat) => (
                  <div key={cat} className="bg-blue-600 rounded-xl p-3 flex items-center justify-center text-center shadow-sm">
                    <span className="text-white font-bold font-serif text-sm">{cat}</span>
                  </div>
                ))}
                {POINTS.map((pts) =>
                  categories.map((cat) => {
                    const key = `${cat}-${pts}`;
                    const done = answered.has(key);
                    const qData = questions[key];
                    return (
                      <motion.button
                        key={key}
                        onClick={() => openCell(cat, pts)}
                        disabled={done || !qData}
                        whileHover={!done && qData ? { scale: 1.04, y: -2 } : {}}
                        whileTap={!done && qData ? { scale: 0.96 } : {}}
                        className={`rounded-xl p-3 flex items-center justify-center font-bold font-serif text-2xl transition-all shadow-sm ${done
                          ? "bg-gray-100 text-gray-300 border border-gray-200"
                          : !qData
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed" // Handle missing data gracefully
                            : "bg-blue-500 hover:bg-blue-400 text-yellow-300 cursor-pointer shadow-md"
                          }`}
                      >
                        {done ? "✓" : pts}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Scoreboard footer */}
            <div className="flex items-center gap-4 px-4 py-3 bg-white border-t border-gray-200 shadow-sm">
              {teams.map((team, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="text-gray-500 text-xs font-sans">{team.name}</div>
                  <div className="text-2xl font-bold text-gray-800 font-serif">{team.score}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Modal */}
      <AnimatePresence>
        {activeCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={(e) => e.target === e.currentTarget && setActiveCell(null)}
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="bg-white rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl border border-gray-200"
            >
              <div className="text-blue-500 font-bold font-sans text-sm mb-3 uppercase tracking-wider">
                {activeCell.cat} — {activeCell.pts} points
              </div>
              <p className="text-gray-800 text-3xl font-bold font-serif mb-6 leading-tight">
                {questions[`${activeCell.cat}-${activeCell.pts}`]?.q}
              </p>
              {!showAnswer ? (
                <Button onClick={() => setShowAnswer(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8">
                  Show Answer
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-300 rounded-2xl p-4">
                    <p className="text-green-700 font-bold text-2xl font-serif">{questions[`${activeCell.cat}-${activeCell.pts}`]?.a}</p>
                  </div>
                  <p className="text-gray-500 text-sm font-sans">Award points to:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {teams.map((team, i) => (
                      <Button key={i} onClick={() => awardPoints(i)}
                        className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold">
                        +{activeCell.pts} → {team.name}
                      </Button>
                    ))}
                    <Button variant="outline"
                      onClick={() => { setAnswered(a => new Set([...a, `${activeCell.cat}-${activeCell.pts}`])); setActiveCell(null); }}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50">
                      No Winner
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default Jeopardy;
