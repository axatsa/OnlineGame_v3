import { useSearchParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, Download, Bookmark, Share2, Expand, MonitorPlay, Edit3, Settings2, Sparkles } from "lucide-react";

export function Editor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "New lesson";
  const type = searchParams.get("type") || "game";
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("editor");

  // This content represents the editable raw text output from the AI
  const [rawText, setRawText] = useState(
    `# Lesson Plan: ${query}\n\n## Warm-up Question (5 mins)\nWhat is your favorite type of pizza? How do you make sure everyone gets an equal slice?\n\n## Core Concept\nNumerator = Number of parts we have.\nDenominator = Total number of parts in a whole.\n\n## Pop Quiz\n1. If a pizza has 8 slices and I eat 2, what fraction is left?\n   - [ ] 2/8\n   - [x] 6/8\n   - [ ] 1/2\n\n2. Which fraction is larger?\n   - [x] 1/2\n   - [ ] 1/4\n   - [ ] 1/8`
  );

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1500); 
    const t2 = setTimeout(() => setStep(2), 3000); 
    const t3 = setTimeout(() => setStep(3), 4500); 
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const states = [
    "Analyzing input topic...",
    "Generating questions and script...",
    "Assembling interactive preview...",
    "Ready.",
  ];

  if (step < 3) {
    return (
      <div className="min-h-screen w-full bg-fuchsia-100 text-fuchsia-950 flex flex-col font-sans px-8 lg:px-24 pt-40 pb-32">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter leading-[0.9]">
          Crafting material for: <br />
          <span className="opacity-40 font-light">"{query}"</span>
        </h1>
        <div className="flex flex-col gap-8 mt-12 md:mt-24">
          {states.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: i <= step ? 1 : 0.2,
                x: i <= step ? 0 : -20,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-light flex items-center gap-8"
            >
              {i < step ? (
                <Check className="w-10 h-10 md:w-14 md:h-14 opacity-100 text-fuchsia-700" strokeWidth={3} />
              ) : (
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-current opacity-20 animate-pulse" />
              )}
              {s}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-fuchsia-100 text-fuchsia-950 flex flex-col font-sans selection:bg-fuchsia-950 selection:text-fuchsia-50 h-screen overflow-hidden">
      {/* Top Bar */}
      <nav className="h-28 flex items-center justify-between px-8 border-b-2 border-fuchsia-950/10 shrink-0 bg-fuchsia-100">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(-1)} className="p-4 bg-fuchsia-200/50 rounded-full hover:bg-fuchsia-200 transition-colors">
            <ArrowLeft size={32} />
          </button>
          <div>
            <h1 className="text-3xl font-medium tracking-tighter">{query}</h1>
            <p className="text-lg font-light opacity-60 flex items-center gap-2">
              <Sparkles size={16} /> 
              {type === "game" ? "Interactive Game" : type === "quiz" ? "Pop Quiz" : "Reading Text"}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4 text-xl font-medium tracking-tight">
          <button className="px-8 py-5 rounded-full bg-fuchsia-200/50 hover:bg-fuchsia-200 transition-colors flex items-center gap-3">
            <Bookmark size={24} /> Save
          </button>
          <button className="px-8 py-5 rounded-full bg-fuchsia-200/50 hover:bg-fuchsia-200 transition-colors flex items-center gap-3">
            <Download size={24} /> Export
          </button>
          <button className="px-10 py-5 rounded-full bg-fuchsia-950 text-fuchsia-100 hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-fuchsia-950/20">
            <Share2 size={24} /> Assign
          </button>
        </div>
      </nav>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Canvas (Editor) */}
        <div className="w-1/2 h-full flex flex-col border-r-2 border-fuchsia-950/10 bg-white/20">
          <div className="flex items-center gap-4 p-6 border-b-2 border-fuchsia-950/10 text-2xl font-bold opacity-50 tracking-widest uppercase">
            <Edit3 size={24} /> Raw Editor
          </div>
          <textarea 
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="flex-1 p-8 text-2xl font-mono leading-relaxed bg-transparent outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {/* Right Canvas (Preview) */}
        <div className="w-1/2 h-full flex flex-col bg-fuchsia-200/20">
          <div className="flex justify-between items-center p-6 border-b-2 border-fuchsia-950/10">
             <div className="flex items-center gap-4 text-2xl font-bold opacity-50 tracking-widest uppercase">
              <MonitorPlay size={24} /> Live Preview
            </div>
            <button className="p-3 bg-fuchsia-950/5 rounded-full hover:bg-fuchsia-950/10">
              <Expand size={24} />
            </button>
          </div>
          
          <div className="flex-1 p-8 flex flex-col gap-12 overflow-y-auto">
            {/* Rendered Preview - Mock layout based on content type */}
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-fuchsia-950/10 flex flex-col gap-8">
              <div className="bg-fuchsia-100 text-fuchsia-950 p-6 rounded-[2rem] text-3xl font-medium text-center">
                🍕 Question 1 of 5
              </div>
              <h2 className="text-5xl font-medium tracking-tighter text-center leading-tight">
                If a pizza has 8 slices and I eat 2, what fraction is left?
              </h2>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <button className="p-8 rounded-[2rem] border-4 border-fuchsia-950/10 text-4xl font-medium hover:bg-fuchsia-100 hover:border-fuchsia-950/50 transition-colors">
                  2/8
                </button>
                <button className="p-8 rounded-[2rem] border-4 border-fuchsia-700 bg-fuchsia-100 text-4xl font-medium shadow-lg">
                  6/8
                </button>
                <button className="p-8 rounded-[2rem] border-4 border-fuchsia-950/10 text-4xl font-medium hover:bg-fuchsia-100 hover:border-fuchsia-950/50 transition-colors">
                  1/2
                </button>
                <button className="p-8 rounded-[2rem] border-4 border-fuchsia-950/10 text-4xl font-medium hover:bg-fuchsia-100 hover:border-fuchsia-950/50 transition-colors">
                  4/8
                </button>
              </div>
            </div>
            
            <p className="text-center text-xl font-light opacity-50">Preview automatically updates as you edit the raw text.</p>
          </div>
        </div>

      </div>
    </div>
  );
}