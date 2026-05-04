import React from "react";
import { motion } from "framer-motion";
import { CrosswordData } from "@/lib/crossword";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";

interface CrosswordPreviewProps {
  crosswordData: CrosswordData;
  crosswordTopic: string;
  orgName: string;
  puzzleRef: React.RefObject<HTMLDivElement>;
  answerRef: React.RefObject<HTMLDivElement>;
}

export const CrosswordPreview = ({
  crosswordData,
  crosswordTopic,
  orgName,
  puzzleRef,
  answerRef,
}: CrosswordPreviewProps) => {
  return (
    <>
      <div className="fixed left-[-9999px] top-0">
        <div ref={answerRef} className="w-[210mm] min-h-[297mm] bg-white p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-8 h-8 rounded object-contain" />
              <span className="text-sm font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <span className="text-xs text-gray-500 font-sans">Answer Key • {crosswordTopic}</span>
          </div>
          <h2 className="text-xl font-bold font-serif mb-6 text-center">Crossword Answer Key</h2>
          <div className="flex-1 flex items-center justify-center px-4 py-6">
            <div
              className="grid gap-0 w-full"
              style={{
                gridTemplateColumns: `repeat(${crosswordData.width}, 1fr)`,
              }}
            >
              {crosswordData.grid.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square flex items-center justify-center text-sm font-bold ${cell
                      ? "bg-white text-gray-900 border border-gray-400"
                      : "bg-transparent"
                      }`}
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        ref={puzzleRef}
        key="crossword-paper"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
        style={{ maxHeight: "80vh" }}
      >
        <div className="p-8 flex flex-col min-h-full print:p-2">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-8 h-8 rounded object-contain" />
              <span className="text-sm font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-sans uppercase tracking-widest">{crosswordTopic}</p>
              <p className="text-[10px] text-gray-400 font-sans">Crossword Puzzle</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 items-stretch mb-8">
            <div
              className="grid gap-0 shrink-0 w-full px-1"
              style={{
                gridTemplateColumns: `repeat(${crosswordData.width}, 1fr)`,
              }}
            >
              {crosswordData.grid.map((row, r) =>
                row.map((cell, c) => {
                  const wordStart = crosswordData.words.find(w => w.row === r && w.col === c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`relative flex items-center justify-center aspect-square ${cell
                        ? "bg-white border border-gray-400"
                        : "bg-transparent"
                        }`}
                    >
                      {wordStart && cell && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-gray-500 leading-none">
                          {wordStart.number}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex-1 space-y-4 font-sans">
              {['Across', 'Down'].map((dir) => {
                const isAcross = dir === 'Across';
                const dirWords = crosswordData.words
                  .filter(w => w.isAcross === isAcross)
                  .sort((a, b) => a.number - b.number);

                if (dirWords.length === 0) return null;

                return (
                  <div key={dir}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 border-b border-primary/20 pb-1">
                      {dir}
                    </h3>
                    <div className="space-y-1.5">
                      {dirWords.map(w => (
                        <div key={w.number} className="text-[11px] leading-relaxed flex gap-2">
                          <span className="font-bold text-primary shrink-0 w-4">{w.number}.</span>
                          <span className="text-gray-700"><RichTextRenderer text={w.clue} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="w-40 border-b border-gray-300 h-6"></div>
                <span className="text-[10px] text-gray-400 uppercase font-sans">Name</span>
              </div>
              <div className="flex gap-2">
                <div className="w-40 border-b border-gray-300 h-6"></div>
                <span className="text-[10px] text-gray-400 uppercase font-sans">Date</span>
              </div>
            </div>
            <p className="text-[8px] text-gray-300 italic font-sans max-w-[200px] text-right">
              Crossword generated with AI assistance. Keep practicing and keep learning!
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
};
