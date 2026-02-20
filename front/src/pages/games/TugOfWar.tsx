import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import tugOfWarImg from "@/assets/tug-of-war-characters.png";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type GameStatus = "setup" | "loading" | "playing" | "finished";

const LABELS = ["A", "B", "C", "D"];

const TugOfWar = () => {
  const { activeClassId } = useClass();
  const [status, setStatus] = useState<GameStatus>("setup");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<{ q: string; options: string[]; a: string }[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [position, setPosition] = useState(0); // -5 to +5, negative = blue (team1) wins
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [feedback, setFeedback] = useState<{ team: "blue" | "red" | "time"; correct: boolean } | null>(null);
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [timeLeft, setTimeLeft] = useState(15);
  const [blockedTeams, setBlockedTeams] = useState<{ blue: boolean, red: boolean }>({ blue: false, red: false });

  const startGame = async () => {
    const searchTopic = topic.trim() || "General Knowledge";

    setStatus("loading");
    try {
      const res = await api.post("/generate/quiz", {
        topic: searchTopic,
        count: 20, // Enough for a long game
        class_id: activeClassId
      });

      if (!res.data.questions || res.data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      setQuestions(res.data.questions);

      setCurrentQ(0);
      setPosition(0);
      setBlueScore(0);
      setRedScore(0);
      setFeedback(null);
      setBlockedTeams({ blue: false, red: false });
      setTimeLeft(15);
      setStatus("playing");
      toast.success("Battle prepared!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to prepare battle. Try again.");
      setStatus("setup");
    }
  };

  useEffect(() => {
    if (status !== "playing" || feedback) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFeedback({ team: "time", correct: false });
          setTimeout(() => {
            setFeedback(null);
            setBlockedTeams({ blue: false, red: false });
            setCurrentQ((q) => (q + 1) % questions.length);
            setTimeLeft(15);
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, feedback, currentQ, questions.length]);

  const selectAnswer = (team: "blue" | "red", option: string) => {
    if (feedback || blockedTeams[team] || status !== "playing") return;
    const correct = option === questions[currentQ]?.a;

    if (correct) {
      setFeedback({ team, correct: true });
      const newPos = position + (team === "blue" ? -1 : 1);
      setPosition(newPos);
      if (team === "blue") setBlueScore((s) => s + 1);
      else setRedScore((s) => s + 1);

      if (Math.abs(newPos) >= 4) {
        setTimeout(() => { setStatus("finished"); setFeedback(null); }, 1500);
        return;
      }

      setTimeout(() => {
        setFeedback(null);
        setBlockedTeams({ blue: false, red: false });
        setCurrentQ((q) => (q + 1) % questions.length);
        setTimeLeft(15);
      }, 1500);
    } else {
      // Wrong answer
      const newBlocked = { ...blockedTeams, [team]: true };
      setBlockedTeams(newBlocked);

      if (newBlocked.blue && newBlocked.red) {
        // Both teams got it wrong
        setFeedback({ team, correct: false }); // Show final wrong feedback
        setTimeout(() => {
          setFeedback(null);
          setBlockedTeams({ blue: false, red: false });
          setCurrentQ((q) => (q + 1) % questions.length);
          setTimeLeft(15);
        }, 1500);
      }
    }
  };

  const winner = position <= -4 ? team1Name : position >= 4 ? team2Name : null;
  const howToPlay = "Две команды соревнуются, отвечая на вопросы. Каждый правильный ответ тянет канат в свою сторону. Первая команда, перетянувшая канат 4 шага, побеждает!";

  const q = questions[currentQ];
  // rope offset: position ranges -4..+4, map to percentage
  const ropePercent = 50 + position * 10; // center 50%, shift 10% per step

  return (
    <GameShell title="Tug of War" onBack="/games" onRestart={startGame} howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-8 p-8 bg-white"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-800 font-serif mb-2">Battle of Knowledge</h2>
              <p className="text-gray-500 font-sans">Две команды соревнуются в знаниях</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-gray-700 font-sans text-sm">Команда 1</Label>
                  <Input value={team1Name} onChange={(e) => setTeam1Name(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 font-sans" />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-700 font-sans text-sm">Команда 2</Label>
                  <Input value={team2Name} onChange={(e) => setTeam2Name(e.target.value)}
                    className="border-red-200 focus:border-red-400 font-sans" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-700 font-sans text-sm">Тема (необязательно)</Label>
                <Input placeholder="напр. Математика, Русский язык..."
                  value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="font-sans" />
              </div>
              <Button onClick={startGame} className="w-full h-12 font-semibold font-sans bg-blue-600 hover:bg-blue-700 text-white">
                Начать битву!
              </Button>
            </div>
          </motion.div>
        )}

        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 bg-white"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-sans text-lg">Preparing the battle...</p>
          </motion.div>
        )}

        {status === "playing" && q && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-full bg-gray-50"
          >
            {/* Blue team panel */}
            <div className="w-72 flex-shrink-0 bg-white rounded-r-2xl shadow-lg border-r border-gray-100 flex flex-col p-4 gap-3">
              {/* Team header */}
              <div className="flex items-center justify-between bg-blue-500 rounded-xl px-4 py-2.5">
                <span className="text-white font-bold font-sans text-base">{team1Name}</span>
                <span className="bg-white text-blue-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">{blueScore}</span>
              </div>
              {/* Blue question */}
              <div className={`flex-1 flex flex-col gap-3 transition-opacity ${blockedTeams.blue ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <p className="text-blue-700 font-bold text-center text-base font-sans leading-snug px-1 pt-2">{q.q}</p>
                <div className="flex flex-col gap-2 mt-1">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt === q.a;
                    const isFeedback = feedback && feedback.team === "blue";
                    return (
                      <motion.button key={opt}
                        onClick={() => selectAnswer("blue", opt)}
                        disabled={!!feedback || blockedTeams.blue}
                        whileHover={!feedback && !blockedTeams.blue ? { scale: 1.02 } : {}}
                        whileTap={!feedback && !blockedTeams.blue ? { scale: 0.98 } : {}}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left font-sans text-sm font-medium transition-all ${isFeedback && isCorrect ? "border-green-400 bg-green-50 text-green-700" :
                          isFeedback && !isCorrect ? "border-red-200 bg-red-50 text-red-400" :
                            "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                          }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isFeedback && isCorrect ? "bg-green-400 text-white" :
                          isFeedback && !isCorrect ? "bg-red-200 text-red-500" :
                            "bg-blue-100 text-blue-600"
                          }`}>{LABELS[i]}</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center arena */}
            <div className="flex-1 flex flex-col items-center justify-between py-4 px-2">
              {/* Scoreboard */}
              <div className="flex items-center gap-8 bg-white rounded-2xl px-8 py-3 shadow-sm border border-gray-100 w-full max-w-md">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 font-sans">{team1Name}</p>
                  <p className="text-3xl font-bold text-gray-800 font-serif">{blueScore}</p>
                </div>
                <div className="text-center">
                  <p className={`font-mono font-bold text-lg ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-blue-500"}`}>
                    ⏱ 00:{timeLeft.toString().padStart(2, "0")}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 font-sans">{team2Name}</p>
                  <p className="text-3xl font-bold text-gray-800 font-serif">{redScore}</p>
                </div>
              </div>

              {/* Rope & characters */}
              <div className="relative w-full max-w-lg h-52 flex items-center justify-center">
                {/* Rope line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-amber-800/30 rounded-full" />
                {/* Dashed center line */}
                <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-gray-300" />
                {/* Characters image - animates horizontally */}
                <motion.div
                  animate={{ x: position * 18 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="relative z-10"
                >
                  <img src={tugOfWarImg} alt="Tug of War" className="h-40 w-auto object-contain drop-shadow-md" />
                </motion.div>
                {/* Red flag on rope */}
                <motion.div
                  animate={{ left: `${ropePercent}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                  style={{ left: `${ropePercent}%` }}
                >
                  <div className="w-1 h-6 bg-amber-800 rounded">
                    <div className="w-4 h-3 bg-red-500 rounded-sm -mt-3 ml-1" />
                  </div>
                </motion.div>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div key="fb" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    className={`text-3xl font-bold px-6 py-3 rounded-2xl bg-white shadow-xl border-2 z-50 absolute ${feedback.team === "time" ? "border-gray-400 text-gray-600" :
                        feedback.correct ? "border-green-500 text-green-600" : "border-red-500 text-red-500"
                      }`}
                  >
                    {feedback.team === "time" ? "⏰ Время вышло!" : feedback.correct ? "✅ Верно!" : "❌ Ошибка!"}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status indicator */}
              <div className="px-5 py-2 rounded-full text-sm font-semibold font-sans shadow-sm bg-gray-100 text-gray-700">
                Кто ответит быстрее?
              </div>
            </div>

            {/* Red team panel */}
            <div className="w-72 flex-shrink-0 bg-white rounded-l-2xl shadow-lg border-l border-gray-100 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between bg-red-500 rounded-xl px-4 py-2.5">
                <span className="text-white font-bold font-sans text-base">{team2Name}</span>
                <span className="bg-white text-red-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">{redScore}</span>
              </div>
              <div className={`flex-1 flex flex-col gap-3 transition-opacity ${blockedTeams.red ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <p className="text-red-600 font-bold text-center text-base font-sans leading-snug px-1 pt-2">{q.q}</p>
                <div className="flex flex-col gap-2 mt-1">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt === q.a;
                    const isFeedback = feedback && feedback.team === "red";
                    return (
                      <motion.button key={opt}
                        onClick={() => selectAnswer("red", opt)}
                        disabled={!!feedback || blockedTeams.red}
                        whileHover={!feedback && !blockedTeams.red ? { scale: 1.02 } : {}}
                        whileTap={!feedback && !blockedTeams.red ? { scale: 0.98 } : {}}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left font-sans text-sm font-medium transition-all ${isFeedback && isCorrect ? "border-green-400 bg-green-50 text-green-700" :
                          isFeedback && !isCorrect ? "border-red-200 bg-red-50 text-red-400" :
                            "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 text-gray-700"
                          }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isFeedback && isCorrect ? "bg-green-400 text-white" :
                          isFeedback && !isCorrect ? "bg-red-200 text-red-500" :
                            "bg-red-100 text-red-600"
                          }`}>{LABELS[i]}</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {status === "finished" && (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-6 bg-white"
          >
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-8xl">🏆</motion.div>
            <h2 className="text-5xl font-bold text-gray-800 font-serif">{winner} победила!</h2>
            <p className="text-gray-500 font-sans">{team1Name}: {blueScore} | {team2Name}: {redScore}</p>
            <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg rounded-2xl">
              Играть снова
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default TugOfWar;
