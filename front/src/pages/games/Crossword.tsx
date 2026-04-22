import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "./GameShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, LogOut, CheckCircle2 } from "lucide-react";
import { AIGeneratingOverlay } from "@/components/AIGeneratingOverlay";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { generateCrosswordLayout, CrosswordGrid, CrosswordWord } from "@/lib/crossword";

interface CellInput {
  value: string;
  correct: boolean | null; // null = unchecked
}

const Crossword = () => {
  const { t } = useTranslation();
  const { activeClassId } = useClass();
  const [status, setStatus] = useState<"setup" | "loading" | "playing" | "finished">("setup");
  const [topicInput, setTopicInput] = useState("");
  const [language, setLanguage] = useState<"ru" | "uz">("ru");
  const [wordCount, setWordCount] = useState("10");

  // Game state
  const [crossword, setCrossword] = useState<CrosswordGrid | null>(null);
  // inputs[r][c] = { value, correct }
  const [inputs, setInputs] = useState<CellInput[][]>([]);
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [checked, setChecked] = useState(false);

  const startGame = async () => {
    if (!topicInput.trim()) {
      toast.error(t("crosswordEnterTopic", "Введите тему"));
      return;
    }
    setStatus("loading");
    try {
      const res = await api.post("/generate/crossword", {
        topic: topicInput.trim(),
        word_count: parseInt(wordCount) || 10,
        language: language === "ru" ? "Русский" : "O'zbekcha",
        class_id: activeClassId,
      });

      if (!res.data.words || res.data.words.length < 3) {
        throw new Error("Not enough words");
      }

      const layout = generateCrosswordLayout(res.data.words);
      if (!layout) {
        throw new Error("Layout failed");
      }

      // Build empty inputs grid
      const emptyInputs: CellInput[][] = Array.from({ length: layout.height }, () =>
        Array.from({ length: layout.width }, () => ({ value: "", correct: null }))
      );

      setCrossword(layout);
      setInputs(emptyInputs);
      setSelectedWord(null);
      setChecked(false);
      setStatus("playing");
      toast.success(t("crosswordGenerated", "Кроссворд сгенерирован!"));
    } catch (e) {
      console.error(e);
      toast.error(t("crosswordGenError", "Не удалось сгенерировать кроссворд. Попробуйте снова."));
      setStatus("setup");
    }
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (!crossword) return;
    const letter = val.toUpperCase().replace(/[^A-ZА-ЯЁA-Z]/gi, "").slice(-1);
    setInputs(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      next[r][c] = { value: letter, correct: null };
      return next;
    });
    setChecked(false);

    // Auto-advance: move to next cell in selected word
    if (selectedWord && letter) {
      advanceCell(r, c, selectedWord);
    }
  };

  const advanceCell = (r: number, c: number, word: CrosswordWord) => {
    const cells = [];
    for (let i = 0; i < word.word.length; i++) {
      cells.push(word.isAcross ? [word.row, word.col + i] : [word.row + i, word.col]);
    }
    const idx = cells.findIndex(([cr, cc]) => cr === r && cc === c);
    if (idx >= 0 && idx < cells.length - 1) {
      const [nr, nc] = cells[idx + 1];
      const el = document.getElementById(`cw-cell-${nr}-${nc}`);
      el?.focus();
    }
  };

  const handleCheckAnswers = () => {
    if (!crossword) return;
    const next = inputs.map(row => row.map(cell => ({ ...cell })));
    let allCorrect = true;

    for (const word of crossword.words) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.isAcross ? word.row : word.row + i;
        const c = word.isAcross ? word.col + i : word.col;
        const expected = word.word[i];
        const actual = next[r][c].value.toUpperCase();
        if (actual === expected) {
          next[r][c].correct = true;
        } else {
          next[r][c].correct = actual.length > 0 ? false : null;
          if (actual !== expected) allCorrect = false;
        }
      }
    }

    setInputs(next);
    setChecked(true);

    if (allCorrect) {
      setTimeout(() => setStatus("finished"), 600);
    } else {
      toast.info(t("crosswordCheckHint", "Проверьте выделенные красным ячейки!"));
    }
  };

  const handleReset = () => {
    if (!crossword) return;
    setInputs(Array.from({ length: crossword.height }, () =>
      Array.from({ length: crossword.width }, () => ({ value: "", correct: null }))
    ));
    setChecked(false);
  };

  const getCellStyle = (r: number, c: number): string => {
    if (!crossword || !crossword.grid[r][c]) return "";
    const cell = inputs[r]?.[c];
    if (!cell) return "bg-white border border-slate-200 rounded shadow-sm";

    const isSelected = selectedWord && (
      selectedWord.isAcross
        ? r === selectedWord.row && c >= selectedWord.col && c < selectedWord.col + selectedWord.word.length
        : c === selectedWord.col && r >= selectedWord.row && r < selectedWord.row + selectedWord.word.length
    );

    if (cell.correct === true) return "bg-green-50 border-2 border-green-400 rounded shadow-sm";
    if (cell.correct === false) return "bg-red-50 border-2 border-red-400 rounded shadow-sm";
    if (isSelected) return "bg-violet-100 border-2 border-violet-400 rounded shadow-sm";
    return "bg-white border border-slate-200 hover:bg-violet-50 hover:border-violet-300 rounded shadow-sm transition-colors";
  };

  const getWordAtCell = (r: number, c: number): CrosswordWord | null => {
    if (!crossword) return null;
    // Prefer the currently selected word's direction
    if (selectedWord) {
      const inSelected = selectedWord.isAcross
        ? r === selectedWord.row && c >= selectedWord.col && c < selectedWord.col + selectedWord.word.length
        : c === selectedWord.col && r >= selectedWord.row && r < selectedWord.row + selectedWord.word.length;
      if (inSelected) return selectedWord;
    }
    // Otherwise pick any word at this cell
    return crossword.words.find(w => {
      if (w.isAcross) return r === w.row && c >= w.col && c < w.col + w.word.length;
      return c === w.col && r >= w.row && r < w.row + w.word.length;
    }) || null;
  };

  const acrossWords = crossword?.words.filter(w => w.isAcross).sort((a, b) => a.number - b.number) || [];
  const downWords = crossword?.words.filter(w => !w.isAcross).sort((a, b) => a.number - b.number) || [];

  const howToPlay = t("game_crossword_how", "Введите буквы в клетки кроссворда. Нажмите на подсказку слева чтобы выбрать слово. Нажмите «Проверить» чтобы увидеть правильные и неправильные ответы. Заполните все слова чтобы победить!");

  const CELL_SIZE = 32; // px

  return (
    <GameShell title={t("game_crossword_title", "Кроссворд")} onBack="/games" onRestart={startGame} howToPlay={howToPlay}>
      <AnimatePresence mode="wait">
        {/* ── Setup ── */}
        {status === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-white"
          >
            <h2 className="text-4xl font-bold text-gray-800 font-serif">Кроссворд</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-sm">
              {/* Language */}
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Язык / Тил</p>
                <div className="flex gap-2">
                  {(["ru", "uz"] as const).map((l) => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all ${language === l ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                      {l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Topic */}
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Тема</p>
                <Input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={language === "ru" ? "Животные, Фрукты, Страны..." : "Animals, Fruits, Countries..."}
                  className="font-sans"
                  onKeyDown={(e) => e.key === "Enter" && startGame()}
                />
              </div>
              {/* Word count */}
              <div className="space-y-1.5">
                <p className="text-gray-700 font-sans text-sm font-medium">Количество слов</p>
                <div className="flex gap-2">
                  {["6", "10", "15"].map(n => (
                    <button key={n} onClick={() => setWordCount(n)}
                      className={`flex-1 py-2.5 rounded-xl font-sans font-medium text-sm transition-all ${wordCount === n ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={startGame} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold font-sans">
                Начать
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {status === "loading" && <AIGeneratingOverlay isGenerating={true} />}

        {/* ── Finished ── */}
        {status === "finished" && (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-5 bg-white"
          >
            <div className="text-8xl">🎉</div>
            <h2 className="text-4xl font-bold text-gray-800 font-serif">Кроссворд решён!</h2>
            <Button onClick={startGame} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 text-lg rounded-2xl">
              Новый кроссворд
            </Button>
          </motion.div>
        )}

        {/* ── Playing ── */}
        {status === "playing" && crossword && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-full bg-white gap-4 p-4 items-start"
          >
            {/* Clues sidebar */}
            <div className="w-56 flex-shrink-0 flex flex-col gap-3 overflow-y-auto h-full pr-1">
              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-sans font-medium transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Сброс
                </button>
                <button onClick={() => setStatus("setup")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-sans font-medium transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Выход
                </button>
              </div>

              <Button onClick={handleCheckAnswers}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Проверить
              </Button>

              {/* Across clues */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 font-sans">По горизонтали</p>
                <div className="flex flex-col gap-1">
                  {acrossWords.map(w => (
                    <button key={`a-${w.number}`}
                      onClick={() => setSelectedWord(w)}
                      className={`text-left px-2 py-1.5 rounded-lg text-xs font-sans transition-colors ${selectedWord?.number === w.number && selectedWord?.isAcross ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                      <span className="font-bold text-gray-500 mr-1">{w.number}.</span>{w.clue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Down clues */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 font-sans">По вертикали</p>
                <div className="flex flex-col gap-1">
                  {downWords.map(w => (
                    <button key={`d-${w.number}`}
                      onClick={() => setSelectedWord(w)}
                      className={`text-left px-2 py-1.5 rounded-lg text-xs font-sans transition-colors ${selectedWord?.number === w.number && !selectedWord?.isAcross ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                      <span className="font-bold text-gray-500 mr-1">{w.number}.</span>{w.clue}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto flex items-start justify-center pt-2">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${crossword.width}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${crossword.height}, ${CELL_SIZE}px)`,
                  gap: "2px",
                  background: "transparent",
                }}
              >
                {crossword.grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isEmpty = cell === "";
                    const wordStart = crossword.words.find(w => w.row === r && w.col === c);
                    const inputCell = inputs[r]?.[c];

                    if (isEmpty) {
                      return (
                        <div key={`${r}-${c}`}
                          style={{ width: CELL_SIZE, height: CELL_SIZE, background: "transparent" }}
                        />
                      );
                    }

                    return (
                      <div key={`${r}-${c}`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE, position: "relative" }}
                        className={getCellStyle(r, c)}
                        onClick={() => {
                          const w = getWordAtCell(r, c);
                          if (w) setSelectedWord(w);
                        }}
                      >
                        {/* Number label */}
                        {wordStart && (
                          <span style={{
                            position: "absolute", top: 1, left: 2,
                            fontSize: "8px", fontWeight: "bold", color: "#6b7280",
                            lineHeight: 1, userSelect: "none",
                          }}>
                            {wordStart.number}
                          </span>
                        )}
                        {/* Input */}
                        <input
                          id={`cw-cell-${r}-${c}`}
                          type="text"
                          maxLength={2}
                          value={inputCell?.value || ""}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          onFocus={() => {
                            const w = getWordAtCell(r, c);
                            if (w) setSelectedWord(w);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !inputCell?.value && selectedWord) {
                              // Move back
                              const cells = [];
                              for (let i = 0; i < selectedWord.word.length; i++) {
                                cells.push(selectedWord.isAcross
                                  ? [selectedWord.row, selectedWord.col + i]
                                  : [selectedWord.row + i, selectedWord.col]);
                              }
                              const idx = cells.findIndex(([cr, cc]) => cr === r && cc === c);
                              if (idx > 0) {
                                const [pr, pc] = cells[idx - 1];
                                document.getElementById(`cw-cell-${pr}-${pc}`)?.focus();
                              }
                            }
                          }}
                          style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "bold",
                            fontFamily: "monospace",
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                            paddingTop: wordStart ? "8px" : "0",
                            color: inputCell?.correct === false ? "#dc2626" : inputCell?.correct === true ? "#16a34a" : "#1f2937",
                          }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
};

export default Crossword;
