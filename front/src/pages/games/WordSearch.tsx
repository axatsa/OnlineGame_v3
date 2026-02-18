import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, LogOut, Loader2 } from "lucide-react";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";

type Direction = "h" | "v" | "d";

const GRID_COLS = 12;
const GRID_ROWS = 12;

const RU_LETTERS = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

const generateGrid = (words: string[], difficulty: string, isRu: boolean): { grid: string[][]; placed: { word: string; cells: [number, number][] }[] } => {
  // Reset grid
  const grid: string[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(""));
  const placed: { word: string; cells: [number, number][] }[] = [];
  const dirs: Direction[] = difficulty === "Легко" || difficulty === "Easy" ? ["h"] : difficulty === "Средне" || difficulty === "Medium" ? ["h", "v"] : ["h", "v", "d"];

  // Sort words by length descending to place long words first
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    let tries = 0;
    while (tries < 100) {
      tries++;
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const row = Math.floor(Math.random() * GRID_ROWS);
      const col = Math.floor(Math.random() * GRID_COLS);
      const cells: [number, number][] = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = dir === "h" ? row : row + i;
        const c = dir === "h" ? col + i : dir === "v" ? col : col + i;
        if (r >= GRID_ROWS || c >= GRID_COLS) { fits = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { fits = false; break; }
        cells.push([r, c]);
      }
      if (fits) {
        cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
        placed.push({ word, cells });
        break;
      }
    }
  }

  // Fill empty cells with random letters
  const alphabet = isRu ? RU_LETTERS : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return { grid, placed };
};

const WordSearch = () => {
  const { activeClassId } = useClass();
  const [status, setStatus] = useState<"setup" | "loading" | "playing" | "finished">("setup");
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState("Средне");
  const [language, setLanguage] = useState<"ru" | "uz">("ru");
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<{ word: string; cells: [number, number][] }[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number][]>([]);
  const [highlighted, setHighlighted] = useState<Map<string, string>>(new Map());
  const dragging = useRef(false);

  const HIGHLIGHT_COLORS = ["bg-blue-400/60", "bg-green-400/60", "bg-yellow-400/60", "bg-pink-400/60", "bg-purple-400/60", "bg-orange-400/60"];
  const foundColorMap = useRef<Map<string, string>>(new Map());

  const startGame = async () => {
    if (!topicInput.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setStatus("loading");
    try {
      const isRu = language === "ru";
      const topicPrompt = `${topicInput} (${isRu ? "Russian" : "Uzbek"})`;
      const count = difficulty === "Легко" || difficulty === "Easy" ? 6 : difficulty === "Средне" || difficulty === "Medium" ? 10 : 12;

      const res = await api.post("/generate/crossword", {
        topic: topicPrompt,
        count: count,
        class_id: activeClassId
      });

      if (!res.data.words || res.data.words.length === 0) {
        throw new Error("No words generated");
      }

      // Clean words: uppercase, remove spaces/hyphens
      const words = res.data.words.map((w: any) =>
        w.word.toUpperCase().replace(/[^A-ZА-ЯЁ]/g, "")
      ).filter((w: string) => w.length > 2 && w.length <= 10); // Sanity check length

      if (words.length < 3) throw new Error("Not enough valid words generated");

      const { grid: g, placed } = generateGrid(words, difficulty, isRu);

      setGrid(g);
      setPlacedWords(placed);
      setFound(new Set());
      setSelecting([]);
      setHighlighted(new Map());
      foundColorMap.current = new Map();
      setStatus("playing");
      toast.success("Game generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate game. Try again.");
      setStatus("setup");
    }
  };

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const startSelect = (r: number, c: number) => {
    dragging.current = true;
    setSelecting([[r, c]]);
  };

  const moveSelect = (r: number, c: number) => {
    if (!dragging.current) return;
    setSelecting((prev) => {
      const already = prev.find(([pr, pc]) => pr === r && pc === c);
      if (already) return prev;
      return [...prev, [r, c]];
    });
  };

  const endSelect = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const selectedKeys = selecting.map(([r, c]) => cellKey(r, c));
    for (const pw of placedWords) {
      if (found.has(pw.word)) continue;
      const pwKeys = pw.cells.map(([r, c]) => cellKey(r, c));
      const pwKeysRev = [...pwKeys].reverse();
      if (pwKeys.join(",") === selectedKeys.join(",") || pwKeysRev.join(",") === selectedKeys.join(",")) {
        const colorIdx = foundColorMap.current.size % HIGHLIGHT_COLORS.length;
        const color = HIGHLIGHT_COLORS[colorIdx];
        foundColorMap.current.set(pw.word, color);
        setFound((f) => new Set([...f, pw.word]));
        setHighlighted((h) => {
          const next = new Map(h);
          pwKeys.forEach(k => next.set(k, color));
          return next;
        });
        break;
      }
    }
    setSelecting([]);
  };

  const isSelecting = (r: number, c: number) => selecting.some(([sr, sc]) => sr === r && sc === c);
  const getHighlightClass = (r: number, c: number) => highlighted.get(cellKey(r, c));

  const isFinished = found.size === placedWords.length && placedWords.length > 0;
  const howToPlay = "Найдите скрытые слова в сетке букв. Кликните и перетащите по буквам, чтобы выделить слово. Найденные слова зачёркиваются. Найдите все слова чтобы победить!";

  const currentTopic = topicInput.trim() || (language === "ru" ? "География" : "Animals");

  return (
    <GameShell title="Philword" onBack="/games" onRestart={startGame} howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-white"
          >
            <h2 className="text-4xl font-bold text-gray-800 font-serif">Philword</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-sm">
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Язык / Тил</p>
                <div className="flex gap-2">
                  {(["ru", "uz"] as const).map((l) => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all ${language === l ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                      {l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Тема</p>
                <Input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={language === "ru" ? "Животные, География, Фрукты..." : "Animals, Fruits, Space..."}
                  className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Сложность</p>
                <div className="flex gap-2">
                  {(language === "ru" ? ["Легко", "Средне", "Сложно"] : ["Easy", "Medium", "Hard"]).map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2.5 rounded-xl font-sans font-medium text-sm transition-all ${difficulty === d ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={startGame} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-sans">
                Начать игру
              </Button>
            </div>
          </motion.div>
        )}

        {status === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-full bg-white gap-6 p-6 items-start justify-center"
          >
            {/* Grid */}
            <div className="flex-shrink-0">
              {isFinished ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center flex flex-col items-center gap-4 h-full justify-center pt-20">
                  <div className="text-8xl">🎉</div>
                  <h2 className="text-4xl font-bold text-gray-800 font-serif">Все найдены!</h2>
                  <Button onClick={startGame} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg rounded-2xl">
                    Играть снова
                  </Button>
                </motion.div>
              ) : (
                <div
                  className="bg-gray-50 rounded-3xl p-4 border border-gray-200 shadow-sm select-none"
                  onMouseLeave={endSelect}
                  onMouseUp={endSelect}
                >
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
                    {grid.map((row, r) =>
                      row.map((letter, c) => {
                        const sel = isSelecting(r, c);
                        const hiClass = getHighlightClass(r, c);
                        return (
                          <motion.div
                            key={`${r}-${c}`}
                            onMouseDown={() => startSelect(r, c)}
                            onMouseEnter={() => moveSelect(r, c)}
                            onMouseUp={endSelect}
                            whileHover={{ scale: 1.05 }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold font-mono cursor-pointer select-none transition-colors ${hiClass ? `${hiClass} text-white shadow-sm` :
                                sel ? "bg-yellow-300 text-yellow-900 shadow-sm" :
                                  "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200"
                              }`}
                          >
                            {letter}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
              {/* Topic + score */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg font-serif">{currentTopic}</h3>
                  <p className="text-xs text-gray-400 font-sans uppercase tracking-wider mt-0.5">{difficulty}</p>
                </div>
                <div className="text-right">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ml-auto mb-0.5" />
                  <p className="text-sm font-bold text-gray-700 font-sans">{found.size}/{placedWords.length}</p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Word list */}
              <div className="flex flex-col gap-1.5 flex-1">
                {placedWords.map(({ word }) => {
                  const isFound = found.has(word);
                  const color = foundColorMap.current.get(word);
                  return (
                    <div key={word}
                      className={`px-3 py-2 rounded-xl text-sm font-mono font-bold border transition-all ${isFound
                          ? `line-through text-gray-400 bg-gray-50 border-gray-100`
                          : "text-gray-700 bg-white border-gray-200"
                        }`}
                    >
                      {word}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-2 flex gap-2">
                <button onClick={startGame}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-sans font-medium transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сброс
                </button>
                <button onClick={() => setStatus("setup")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-sans font-medium transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  Выход
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default WordSearch;
