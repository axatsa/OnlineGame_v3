import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";
import { QuizQuestion } from "@/lib/generatorExport";

interface QuizPreviewProps {
  quizData: QuizQuestion[];
  quizTopic: string;
  orgName: string;
  puzzleRef: React.RefObject<HTMLDivElement>;
  answerRef: React.RefObject<HTMLDivElement>;
}

export const QuizPreview = ({
  quizData,
  quizTopic,
  orgName,
  puzzleRef,
  answerRef,
}: QuizPreviewProps) => {
  const QUIZ_PER_PAGE = 10;
  const questionPages = Array.from(
    { length: Math.ceil(quizData.length / QUIZ_PER_PAGE) },
    (_, pi) => quizData.slice(pi * QUIZ_PER_PAGE, (pi + 1) * QUIZ_PER_PAGE)
  );

  return (
    <>
      {/* Answer key — скрытый, рендерится только для PDF */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={answerRef} className="w-[210mm] bg-white p-8 flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-6 h-6 rounded object-contain" />
              <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">Answer Key • {quizTopic}</span>
          </div>
          <h2 style={{ fontSize: "14px" }} className="font-bold font-serif mb-4 text-center">Quiz Answer Key</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {quizData.map((q, i) => (
              <div key={i} className="border border-gray-300 rounded text-center p-1.5">
                <div className="text-gray-400" style={{ fontSize: "8px" }}>№{i + 1}</div>
                <div className="font-bold text-green-700" style={{ fontSize: "10px" }}>{q.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz worksheet — многостраничный */}
      <motion.div
        ref={puzzleRef}
        key="quiz-paper"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block print:overflow-visible"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        {/* Question pages — 10 вопросов на страницу */}
        {questionPages.map((pageQs, pi) => (
          <div
            key={pi}
            className="p-6 flex flex-col print:p-5"
            style={{ pageBreakAfter: "always" }}
          >
            {/* Header */}
            {pi === 0 ? (
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <img src="/logo_sticker.webp" alt="Logo" className="w-6 h-6 rounded object-contain" />
                    <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
                  </div>
                  <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">{quizTopic}</span>
                </div>
                <h3 style={{ fontSize: "15px" }} className="font-bold text-gray-900 text-center mb-4 font-serif">Quiz Worksheet</h3>
              </>
            ) : (
              <div className="flex items-center justify-end mb-3 pb-2 border-b border-gray-200">
                <span style={{ fontSize: "9px" }} className="text-gray-400 font-sans">Стр. {pi + 1}</span>
              </div>
            )}

            {/* Questions — компактный layout */}
            <div className="space-y-3">
              {pageQs.map((q, qi) => {
                const globalIdx = pi * QUIZ_PER_PAGE + qi;
                return (
                  <div key={qi} className="pb-2 border-b border-gray-100 last:border-0">
                    <div style={{ fontSize: "11px" }} className="font-semibold text-gray-800 mb-1.5 leading-snug">
                      {globalIdx + 1}. <RichTextRenderer text={q.q} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                      {q.options?.map((opt, idx) => (
                        <div key={idx} style={{ fontSize: "10px" }} className="flex items-start gap-1 text-gray-700">
                          <span className="shrink-0 w-3 h-3 mt-0.5 rounded-full border border-gray-400 inline-block" />
                          <RichTextRenderer text={opt} className="leading-tight" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Answer Key — последняя страница */}
        <div className="p-6 flex flex-col print:p-5 border-t-4 border-dashed border-gray-300" style={{ pageBreakBefore: "always" }}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <img src="/logo_sticker.webp" alt="Logo" className="w-6 h-6 rounded object-contain" />
              <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">Answer Key • {quizTopic}</span>
          </div>
          <h3 style={{ fontSize: "14px" }} className="font-bold text-gray-900 text-center mb-4 font-serif">✅ Answer Key (Teacher Copy)</h3>
          <div className="grid grid-cols-5 gap-2">
            {quizData.map((q, i) => (
              <div key={i} className="border border-gray-300 rounded-lg text-center p-2">
                <div style={{ fontSize: "8px" }} className="text-gray-400 font-sans">№{i + 1}</div>
                <div style={{ fontSize: "11px" }} className="font-bold text-green-700 font-sans">{q.a}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "9px" }} className="text-gray-400 font-sans italic text-center mt-3">
            Этот лист только для учителя — не раздавать ученикам.
          </p>
        </div>
      </motion.div>
    </>
  );
};
