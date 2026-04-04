import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Weight {
  id: number;
  problem: string;
  value: number;
  selected: boolean;
}

const generateWeights = (target: number): Weight[] => {
  const weights: Weight[] = [];
  const vals = [5, 8, 10, 12, 15, 18, 20, 25, 30];
  vals.forEach((v, i) => {
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * 2)];
    let problem = "";
    if (op === "+" ) { const a = Math.floor(v / 2); problem = `${a} + ${v - a}`; }
    else if (op === "-") { const a = v + Math.floor(Math.random() * 10) + 5; problem = `${a} - ${a - v}`; }
    else problem = `${v}`;
    weights.push({ id: i, problem, value: v, selected: false });
  });
  return weights;
};

const BalanceScales = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"setup" | "playing">("setup");
  const [mathTopic, setMathTopic] = useState("Addition");
  const [target, setTarget] = useState(0);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [solved, setSolved] = useState<boolean | null>(null);

  const startGame = () => {
    const t = [25, 30, 35, 40, 45, 50][Math.floor(Math.random() * 6)];
    setTarget(t);
    setWeights(generateWeights(t));
    setSolved(null);
    setStatus("playing");
  };

  const toggleWeight = (id: number) => {
    if (solved !== null) return;
    setWeights((ws) => ws.map((w) => w.id === id ? { ...w, selected: !w.selected } : w));
  };

  const total = weights.filter((w) => w.selected).reduce((sum, w) => sum + w.value, 0);
  const diff = total - target;
  const tiltAngle = Math.min(Math.max(diff * 2, -30), 30);
  const isBalanced = diff === 0;
  const isSolved = solved;

  const checkBalance = () => {
    if (isBalanced) {
      setSolved(true);
    } else {
      setSolved(false);
      setTimeout(() => setSolved(null), 1500);
    }
  };

  const nextRound = () => {
    const t = [25, 30, 35, 40, 45, 50][Math.floor(Math.random() * 6)];
    setTarget(t);
    setWeights(generateWeights(t));
    setSolved(null);
  };

  const howToPlay = t('game_scales_how');

  return (
    <GameShell title={t('game_scales_title')} onBack="/games" onRestart={startGame} howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 p-8"
          >
            <h2 className="text-4xl font-bold text-gray-800 font-serif">{t('game_scales_title')}</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-sm">
              <div>
                <p className="text-gray-500 font-sans text-sm mb-2">{t('game_math_topic')}</p>
                <div className="flex flex-wrap gap-2">
                  {["Addition", "Subtraction", "Mixed"].map((topic) => (
                    <button key={topic} onClick={() => setMathTopic(topic)}
                      className={`px-4 py-2 rounded-xl font-sans font-medium text-sm transition-all border ${mathTopic === topic ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}>
                      {topic === "Addition" ? t('genMath') : topic === "Subtraction" ? t('genMathSubtraction', 'Subtraction') : t('genMathMixed', 'Mixed')}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={startGame} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {t('game_start')}
              </Button>
            </div>
          </motion.div>
        )}

        {status === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full px-6 py-4 gap-4"
          >
            {/* Status bar */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-sans text-sm">{t('genTopic')}: <strong className="text-gray-800">{mathTopic}</strong></span>
              <span className={`text-sm font-semibold font-sans px-3 py-1 rounded-full ${isBalanced ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                {total} / {target}
              </span>
            </div>

            {/* Scale visual */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: solved ? 0 : tiltAngle }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="relative w-80 h-3 rounded-full origin-center"
                    style={{ background: "linear-gradient(to right, #d4a254, #f0c070, #d4a254)" }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-yellow-300 border-2 border-yellow-600" />
                    <div className="absolute -left-2 top-full w-0.5 h-16 bg-yellow-500/60 mx-auto" style={{ left: "12px" }} />
                    <div className="absolute top-full w-0.5 h-16 bg-yellow-500/60" style={{ right: "12px" }} />
                    {/* Left plate */}
                    <div className="absolute flex flex-col items-center" style={{ left: "-12px", top: "68px" }}>
                      <div className="w-24 h-8 rounded-full bg-yellow-400 border border-yellow-600 shadow flex items-center justify-center">
                        <span className="text-yellow-900 font-bold text-lg font-serif">{target}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-sans mt-1">{t('game_target')}</span>
                    </div>
                    {/* Right plate */}
                    <div className="absolute flex flex-col items-center" style={{ right: "-12px", top: "68px" }}>
                      <div className={`w-24 h-8 rounded-full border shadow flex items-center justify-center ${isBalanced ? "bg-green-300 border-green-500" : "bg-yellow-400 border-yellow-600"}`}>
                        <span className={`font-bold text-lg font-serif ${isBalanced ? "text-green-900" : "text-yellow-900"}`}>{total}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-sans mt-1">{t('game_your_side')}</span>
                    </div>
                  </motion.div>
                  <div className="w-3 h-20 rounded-b-full mt-0" style={{ background: "linear-gradient(to bottom, #d4a254, #b8860b)" }} />
                  <div className="w-24 h-4 rounded-full" style={{ background: "linear-gradient(to right, #d4a254, #f0c070, #d4a254)" }} />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {solved === true && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="bg-green-50 border border-green-300 rounded-2xl p-4 text-center"
                >
                  <p className="text-green-700 font-bold font-serif text-2xl">{t('game_perfect_balance')}</p>
                  <Button onClick={nextRound} className="mt-3 font-semibold">
                    {t('game_next_round')}
                  </Button>
                </motion.div>
              )}
              {solved === false && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center"
                >
                  <p className="text-red-600 font-sans text-sm">{t('game_not_balanced')} {diff > 0 ? `${diff} ${t('game_too_heavy')}` : `${Math.abs(diff)} ${t('game_too_light')}`}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weight buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {weights.map((w) => (
                <motion.button
                  key={w.id}
                  onClick={() => toggleWeight(w.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 rounded-2xl font-mono font-bold text-sm border-2 transition-all ${
                    w.selected
                      ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                  }`}
                >
                  {w.problem} = ?
                </motion.button>
              ))}
            </div>

            {solved === null && (
              <Button onClick={checkBalance} disabled={total === 0} className="font-semibold h-12 rounded-xl">
                {t('game_check_balance')}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default BalanceScales;
