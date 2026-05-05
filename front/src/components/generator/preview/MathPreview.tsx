import React from "react";
import { motion } from "framer-motion";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";
import { MathProblem } from "@/lib/generatorExport";

interface MathPreviewProps {
  problems: MathProblem[];
  topic: string;
  difficulty: string;
  orgName: string;
  puzzleRef: React.RefObject<HTMLDivElement>;
  answerRef: React.RefObject<HTMLDivElement>;
}

export const MathPreview = ({
  problems,
  topic,
  difficulty,
  orgName,
  puzzleRef,
  answerRef,
}: MathPreviewProps) => {
  return (
    <>
      <div className="fixed left-[-9999px] top-0">
        <div ref={answerRef} className="w-[210mm] min-h-[297mm] bg-white p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-8 h-8 rounded object-contain" />
              <span className="text-sm font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <span className="text-xs text-gray-500 font-sans">Answer Key • {topic}</span>
          </div>
          <h2 className="text-xl font-bold font-serif mb-6 text-center">Teacher's Answer Key</h2>
          <div className="grid grid-cols-4 gap-4">
            {problems.map((p, i) => (
              <div key={i} className="border border-gray-100 p-2 text-sm">
                <span className="text-gray-400 mr-2">#{i + 1}</span>
                <span className="font-mono font-bold text-primary">{p.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        ref={puzzleRef}
        key="math-paper"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        <div className="p-10 h-full flex flex-col print:p-2">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-8 h-8 rounded object-contain" />
              <span className="text-sm font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-sans uppercase tracking-widest">{topic}</p>
              <p className="text-[10px] text-gray-400 font-sans">{difficulty}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
            {problems.map((p, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs text-gray-300 font-mono mt-1 w-5">{i + 1})</span>
                <div className="text-lg font-mono text-gray-800 tracking-wider">
                  <RichTextRenderer text={p.q} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-end">
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
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center min-w-[120px]">
              <p className="text-[10px] text-gray-400 uppercase mb-1 font-sans">Score</p>
              <p className="text-2xl font-bold font-serif text-gray-300">/ {problems.length}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
