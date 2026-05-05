import React from "react";
import { motion } from "framer-motion";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";
import { AssignmentData } from "@/lib/generatorExport";

interface AssignmentPreviewProps {
  assignmentData: AssignmentData;
  orgName: string;
  puzzleRef: React.RefObject<HTMLDivElement>;
  answerRef: React.RefObject<HTMLDivElement>;
}

export const AssignmentPreview = ({
  assignmentData,
  orgName,
  puzzleRef,
  answerRef,
}: AssignmentPreviewProps) => {
  return (
    <>
      <div className="fixed left-[-9999px] top-0">
        <div ref={answerRef} className="w-[210mm] min-h-[297mm] bg-white p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/logo_sticker.webp" alt="Logo" className="w-8 h-8 rounded object-contain" />
              <span className="text-sm font-bold font-serif text-gray-800">{orgName || "ClassPlay"}</span>
            </div>
            <span className="text-xs text-gray-500 font-sans">Answer Key • {assignmentData.title}</span>
          </div>
          <h2 className="text-xl font-bold font-serif mb-6 text-center">Teacher Key</h2>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {assignmentData.questions.map((q: any) => (
              <div key={q.num} className="border border-gray-300 rounded text-center p-1">
                <div className="text-gray-400" style={{ fontSize: "9px" }}>№{q.num}</div>
                <div className="font-bold text-xs">{q.answer?.split(")")[0] || q.answer})</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        ref={puzzleRef}
        key="assignment-paper"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        <div className="p-10 h-full flex flex-col print:p-2 print:h-auto">
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-2xl font-bold font-serif text-gray-900 mb-1">{assignmentData.title}</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest">{assignmentData.subject} • {assignmentData.grade}</p>
          </div>

          {assignmentData.intro && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic border-l-4 border-primary/20">
              {assignmentData.intro}
            </div>
          )}

          <div className="space-y-4 flex-1 text-sm print:space-y-3">
            {assignmentData.questions?.map((q: any, i: number) => (
              <div key={i} className="space-y-1 pb-3 border-b border-gray-100 last:border-0 print:pb-2">
                <div className="font-semibold text-gray-800">
                  {q.num}. <RichTextRenderer text={q.text} />
                </div>
                <div className="space-y-1 pl-4 print:space-y-0.5">
                  {q.options?.map((opt: string, idx: number) => (
                    <div key={idx} className="text-gray-600 flex items-center gap-2 text-sm print:text-xs">
                      <span className="w-3 h-3 rounded-full border border-gray-300 inline-block"></span>
                      <RichTextRenderer text={opt} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};
