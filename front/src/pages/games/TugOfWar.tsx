import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import tugOfWarImg from "@/assets/tug-of-war-characters.png";
import { useClass } from "@/context/ClassContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type GameStatus = "setup" | "loading" | "playing" | "finished";

const LABELS = ["A", "B", "C", "D"];

// FIX #3: форматирование секундомера
const formatStopwatch = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// FIX #3: перемешать массив (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TugOfWar = () => {
  const { activeClassId } = useClass();
  const { lang } = useLang();
  const [status, setStatus] = useState<GameStatus>("setup");
  const [topic, setTopic] = useState("");
  // FIX #4: выбор языка вопросов
  const [selectedLang, setSelectedLang] = useState<"ru" | "uz">(lang);
  // FIX #3: два разных вопроса для двух команд из одного пула
  const [blueQuestions, setBlueQuestions] = useState<{ q: string; options: string[]; a: string }[]>([]);
  const [redQuestions, setRedQuestions] = useState<{ q: string; options: string[]; a: string }[]>([]);
  const [blueCurrentQ, setBlueCurrentQ] = useState(0);
  const [redCurrentQ, setRedCurrentQ] = useState(0);
  const [position, setPosition] = useState(0); // -5 to +5
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [feedback, setFeedback] = useState<{ team: "blue" | "red" | "time"; correct: boolean } | null>(null);
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [elapsed, setElapsed] = useState(0);
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация аудио
  useEffect(() => {
    const audio = new Audio("/shou-Benni.mp3");
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Управление музыкой в зависимости от статуса
  useEffect(() => {
    if (!audioRef.current) return;

    if (status === "playing") {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
    } else {
      audioRef.current.pause();
    }
  }, [status]);

  // Запуск секундомера при начале игры
  useEffect(() => {
    if (status === "playing") {
      stopwatchRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => { if (stopwatchRef.current) clearInterval(stopwatchRef.current); };
  }, [status]);

  const startGame = async () => {
    const langStr = selectedLang === "uz" ? "in Uzbek language" : "in Russian language";
    const searchTopic = topic.trim() ? `${topic} (${langStr})` : `General Knowledge (${langStr})`;
    setStatus("loading");
    try {
      const res = await api.post("/generate/quiz", {
        topic: searchTopic,
        count: 40, // Генерируем много, чтобы разделить на два пула
        class_id: activeClassId
      });

      if (!res.data.questions || res.data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      const allQuestions: { q: string; options: string[]; a: string }[] = res.data.questions;
      // FIX #3: делим вопросы на два независимых пула — каждая команда видит свои вопросы
      const half = Math.floor(allQuestions.length / 2);
      const shuffled = shuffleArray(allQuestions);
      const pool1 = shuffled.slice(0, half);
      const pool2 = shuffled.slice(half);

      setBlueQuestions(pool1.length > 0 ? pool1 : allQuestions);
      setRedQuestions(pool2.length > 0 ? pool2 : shuffleArray(allQuestions));
      setBlueCurrentQ(0);
      setRedCurrentQ(0);
      setPosition(0);
      setBlueScore(0);
      setRedScore(0);
      setFeedback(null);
      setElapsed(0);
      setStatus("playing");
      toast.success("Battle prepared!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to prepare battle. Try again.");
      setStatus("setup");
    }
  };

  const selectAnswer = (team: "blue" | "red", option: string) => {
    if (feedback || status !== "playing") return;
    const currentQ = team === "blue"
      ? blueQuestions[blueCurrentQ % blueQuestions.length]
      : redQuestions[redCurrentQ % redQuestions.length];
    const correct = option === currentQ?.a;

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
        if (team === "blue") setBlueCurrentQ(q => q + 1);
        else setRedCurrentQ(q => q + 1);
      }, 1500);
    } else {
      setFeedback({ team, correct: false });
      setTimeout(() => {
        setFeedback(null);
        // При неправильном ответе тоже переходим к следующему вопросу
        if (team === "blue") setBlueCurrentQ(q => q + 1);
        else setRedCurrentQ(q => q + 1);
      }, 1500);
    }
  };

  const winner = position <= -4 ? team1Name : position >= 4 ? team2Name : null;
  const howToPlay = "Две команды соревнуются, отвечая на вопросы независимо друг от друга. У каждой команды свои вопросы — подсматривать невозможно! Каждый правильный ответ тянет канат в свою сторону. Первая команда, перетянувшая канат 4 шага, побеждает!";

  const blueQ = blueQuestions[blueCurrentQ % (blueQuestions.length || 1)];
  const redQ = redQuestions[redCurrentQ % (redQuestions.length || 1)];
  const ropePercent = 50 + position * 10;

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
              {/* FIX #4: выбор языка вопросов */}
              <div className="space-y-1.5">
                <Label className="text-gray-700 font-sans text-sm">Язык вопросов</Label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedLang("ru")}
                    className={`flex-1 py-2 rounded-xl text-sm font-sans border-2 transition-all ${selectedLang === "ru" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    🇷🇺 Русский
                  </button>
                  <button onClick={() => setSelectedLang("uz")}
                    className={`flex-1 py-2 rounded-xl text-sm font-sans border-2 transition-all ${selectedLang === "uz" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:border-green-300"}`}>
                    🇺🇿 O'zbekcha
                  </button>
                </div>
              </div>
              {/* FIX #3: информация о разных вопросах */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-sans">
                  🔀 У каждой команды будут <strong>разные вопросы</strong> — подсматривать не получится!
                </p>
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

        {status === "playing" && blueQ && redQ && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-full bg-gray-50"
          >
            {/* Blue team panel */}
            <div className="w-72 flex-shrink-0 bg-white rounded-r-2xl shadow-lg border-r border-gray-100 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between bg-blue-500 rounded-xl px-4 py-2.5">
                <span className="text-white font-bold font-sans text-base">{team1Name}</span>
                <span className="bg-white text-blue-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">{blueScore}</span>
              </div>
              {/* FIX #3: у синей команды свой вопрос */}
              <div className={`flex-1 flex flex-col gap-3 transition-opacity ${feedback?.team === "blue" ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                  <p className="text-xs text-blue-500 font-sans font-medium">Вопрос #{blueCurrentQ + 1}</p>
                </div>
                <p className="text-blue-700 font-bold text-center text-base font-sans leading-snug px-1 pt-2">{blueQ.q}</p>
                <div className="flex flex-col gap-2 mt-1">
                  {blueQ.options.map((opt, i) => {
                    const isCorrect = opt === blueQ.a;
                    const isFeedback = feedback && feedback.team === "blue";
                    return (
                      <motion.button key={opt}
                        onClick={() => selectAnswer("blue", opt)}
                        disabled={!!feedback}
                        whileHover={!feedback ? { scale: 1.02 } : {}}
                        whileTap={!feedback ? { scale: 0.98 } : {}}
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
              {/* Scoreboard с секундомером */}
              <div className="flex items-center gap-8 bg-white rounded-2xl px-8 py-3 shadow-sm border border-gray-100 w-full max-w-md">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 font-sans">{team1Name}</p>
                  <p className="text-3xl font-bold text-gray-800 font-serif">{blueScore}</p>
                </div>
                {/* FIX #3: секундомер — считает вверх */}
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-sans mb-0.5">секундомер</p>
                  <p className="font-mono font-bold text-xl text-gray-700">
                    ⏱ {formatStopwatch(elapsed)}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 font-sans">{team2Name}</p>
                  <p className="text-3xl font-bold text-gray-800 font-serif">{redScore}</p>
                </div>
              </div>

              {/* Rope & characters */}
              <div className="relative w-full max-w-lg h-52 flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-amber-800/30 rounded-full" />
                <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-gray-300" />
                <motion.div
                  animate={{ x: position * 18 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="relative z-10"
                >
                  <img src={tugOfWarImg} alt="Tug of War" className="h-40 w-auto object-contain drop-shadow-md" />
                </motion.div>
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
                    className={`text-3xl font-bold px-6 py-3 rounded-2xl bg-white shadow-xl border-2 z-50 absolute ${feedback.correct ? "border-green-500 text-green-600" : "border-red-500 text-red-500"}`}
                  >
                    {feedback.correct ? "✅ Верно!" : "❌ Ошибка!"}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-5 py-2 rounded-full text-sm font-semibold font-sans shadow-sm bg-gray-100 text-gray-700">
                🔀 У каждой команды свои вопросы!
              </div>
            </div>

            {/* Red team panel */}
            <div className="w-72 flex-shrink-0 bg-white rounded-l-2xl shadow-lg border-l border-gray-100 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between bg-red-500 rounded-xl px-4 py-2.5">
                <span className="text-white font-bold font-sans text-base">{team2Name}</span>
                <span className="bg-white text-red-600 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">{redScore}</span>
              </div>
              {/* FIX #3: у красной команды свой вопрос */}
              <div className={`flex-1 flex flex-col gap-3 transition-opacity ${feedback?.team === "red" ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                  <p className="text-xs text-red-500 font-sans font-medium">Вопрос #{redCurrentQ + 1}</p>
                </div>
                <p className="text-red-600 font-bold text-center text-base font-sans leading-snug px-1 pt-2">{redQ.q}</p>
                <div className="flex flex-col gap-2 mt-1">
                  {redQ.options.map((opt, i) => {
                    const isCorrect = opt === redQ.a;
                    const isFeedback = feedback && feedback.team === "red";
                    return (
                      <motion.button key={opt}
                        onClick={() => selectAnswer("red", opt)}
                        disabled={!!feedback}
                        whileHover={!feedback ? { scale: 1.02 } : {}}
                        whileTap={!feedback ? { scale: 0.98 } : {}}
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
            <p className="text-gray-400 font-sans text-sm">Время игры: {formatStopwatch(elapsed)}</p>
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
