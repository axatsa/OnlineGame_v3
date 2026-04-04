import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const TOPICS: Record<string, { emoji: string; pairs: string[] }> = {
  Fruits: { emoji: "🍎", pairs: ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🍑", "🥭", "🍋", "🍒", "🥝", "🫐", "🍍", "🥥", "🍆", "🌽", "🫒", "🍅", "🥕", "🌶️"] },
  Animals: { emoji: "🐶", pairs: ["🐶", "🐱", "🐼", "🦁", "🐘", "🦊", "🐯", "🐸", "🦋", "🐬", "🦅", "🐙", "🦁", "🦒", "🦓", "🐊", "🦀", "🦑", "🦚", "🦜"] },
  Sports: { emoji: "⚽", pairs: ["⚽", "🏀", "🎾", "🏐", "⚾", "🏉", "🥊", "🎯", "🏊", "🚴", "🤸", "🏋️", "⛷️", "🏄", "🤺", "🎿", "🏇", "🥋", "🎳", "🏹"] },
  Pokemon: { emoji: "⚡", pairs: ["⚡", "🌊", "🔥", "🌿", "❄️", "🌪️", "⭐", "💜", "🌙", "☀️", "🌈", "💫", "🌑", "🎆", "💎", "🎇", "🦠", "🌋", "🌫️", "🌀"] },
};

const GRID_SIZES: Record<string, number> = { Easy: 16, Medium: 24, Hard: 32, XL: 40 };

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatrix = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"setup" | "playing" | "finished">("setup");
  const [topic, setTopic] = useState("Fruits");
  const [gridSize, setGridSize] = useState("Easy");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const startGame = () => {
    const size = GRID_SIZES[gridSize];
    const pairs = TOPICS[topic].pairs;
    const needed = size / 2;
    const selected: string[] = [];
    for (let i = 0; i < needed; i++) selected.push(pairs[i % pairs.length]);
    const doubled = [...selected, ...selected];
    const shuffled = doubled.sort(() => Math.random() - 0.5).map((v, i) => ({
      id: i, value: v, flipped: false, matched: false,
    }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    setStatus("playing");
  };

  const flip = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched || flipped.length >= 2) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards((cs) => cs.map((c) => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newFlipped.map((fid) => cards.find((c) => c.id === fid)!);
      if (a.value === b.value) {
        setCards((cs) => cs.map((c) => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (status === "playing" && cards.length > 0 && cards.every((c) => c.matched)) {
      setTimeout(() => setStatus("finished"), 500);
    }
  }, [cards, status]);

  const cols = gridSize === "Easy" ? 4 : gridSize === "Medium" ? 6 : 8;
  const howToPlay = t('game_memory_how');

  return (
    <GameShell title={t('game_memory_matrix_title')} onBack="/games" onRestart={startGame} howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 p-8"
          >
            <h2 className="text-4xl font-bold text-gray-800 font-serif">{t('game_memory_matrix_title')}</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-sm">
              <div>
                <p className="text-gray-500 font-sans text-sm mb-2">{t('genTopic')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TOPICS).map(([t_key, { emoji }]) => (
                    <button key={t_key} onClick={() => setTopic(t_key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-sans font-medium transition-all border ${topic === t_key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"}`}>
                      <span className="text-xl">{emoji}</span> {t_key === "Fruits" ? t('fruits') : t_key === "Animals" ? t('animals') : t_key === "Sports" ? t('sports') : t('pokemon')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-sans text-sm mb-2">{t('game_memory_difficulty_label')}</p>
                <div className="flex gap-2">
                  {["Easy", "Medium", "Hard", "XL"].map((d) => (
                    <button key={d} onClick={() => setGridSize(d)}
                      className={`flex-1 py-2.5 rounded-xl font-sans font-medium text-sm transition-all border ${gridSize === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"}`}>
                      {d === "Easy" ? t('genDiffEasy') : d === "Medium" ? t('genDiffMed') : d === "Hard" ? t('genDiffHard') : "XL"}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-xs font-sans mt-1 text-center">
                  {gridSize === "Easy" ? "4×4 (8 пар)" : gridSize === "Medium" ? "6×4 (12 пар)" : gridSize === "Hard" ? "8×4 (16 пар)" : "8×5 (20 пар)"}
                </p>
              </div>
              <Button onClick={startGame} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {t('game_start')}
              </Button>
            </div>
          </motion.div>
        )}

        {status === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-gray-500 font-sans text-sm">{t('genTopic')}: <strong className="text-gray-800">{topic === "Fruits" ? t('fruits') : topic === "Animals" ? t('animals') : topic === "Sports" ? t('sports') : t('pokemon')}</strong></span>
              <span className="text-gray-500 font-sans text-sm">{t('moves', 'Ходов')}: <strong className="text-gray-800">{moves}</strong></span>
              <span className="text-gray-500 font-sans text-sm">
                {t('found')}: <strong className="text-gray-800">{cards.filter((c) => c.matched).length / 2}/{cards.length / 2}</strong>
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {cards.map((card) => (
                  <motion.button
                    key={card.id}
                    onClick={() => flip(card.id)}
                    className="relative aspect-square"
                    style={{ width: Math.min(80, Math.floor(720 / cols)) }}
                    whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      {/* Back */}
                      <div className={`absolute inset-0 rounded-xl flex items-center justify-center border-2 ${card.matched ? "border-green-400 bg-green-100" : "border-primary/30 bg-primary/80"}`}
                        style={{ backfaceVisibility: "hidden" }}>
                        <span className="text-white/60 text-lg font-bold">?</span>
                      </div>
                      {/* Front */}
                      <div className={`absolute inset-0 rounded-xl flex items-center justify-center border-2 ${card.matched ? "bg-green-100 border-green-400" : "bg-white border-gray-200"}`}
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <span style={{ fontSize: Math.min(32, Math.floor(600 / cols)) }}>{card.value}</span>
                      </div>
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {status === "finished" && (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: 3 }} className="text-8xl">🎉</motion.div>
            <h2 className="text-4xl font-bold text-gray-800 font-serif">{t('game_excellent')}</h2>
            <p className="text-gray-500 font-sans text-lg">{t('game_completed_in_moves', { count: moves })}</p>
            <Button onClick={startGame} className="font-semibold px-8 py-3 text-lg rounded-2xl">
              {t('game_playAgain')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default MemoryMatrix;
