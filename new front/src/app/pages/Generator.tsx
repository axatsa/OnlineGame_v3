import { motion } from "motion/react";
import { ArrowLeft, Sparkles, Image as ImageIcon, Link as LinkIcon, Upload, ArrowRight, Settings2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useState } from "react";

export function Generator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "game";
  const defaultQuery = searchParams.get("q") || "";

  const [type, setType] = useState(defaultType);
  const [query, setQuery] = useState(defaultQuery);
  const [language, setLanguage] = useState("English");
  const [age, setAge] = useState("8-10 (Grade 3-4)");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/editor?q=${encodeURIComponent(query)}&type=${type}`);
    }
  };

  const types = [
    { id: "game", label: "Interactive Game", icon: <Sparkles size={24} /> },
    { id: "quiz", label: "Pop Quiz", icon: <Sparkles size={24} /> },
    { id: "reading", label: "Reading Text", icon: <Sparkles size={24} /> },
    { id: "crossword", label: "Crossword", icon: <Sparkles size={24} /> },
  ];

  return (
    <div className="min-h-screen w-full bg-indigo-100 text-indigo-950 flex flex-col font-sans selection:bg-indigo-950 selection:text-indigo-50 relative">
      {/* Header */}
      <Link
        to="/"
        className="fixed top-8 left-8 flex items-center gap-4 hover:opacity-60 transition-opacity z-10 p-4 bg-indigo-100/80 backdrop-blur-xl rounded-full"
      >
        <ArrowLeft size={32} />
        <span className="text-2xl font-medium tracking-tight">Back to Hub</span>
      </Link>

      <div className="flex-1 flex flex-col lg:flex-row w-full pt-32 px-8 lg:px-16 gap-16 pb-32">
        
        {/* Left Panel: Configuration */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-[450px] shrink-0 flex flex-col gap-12"
        >
          <div>
            <h1 className="text-6xl font-medium tracking-tighter mb-4">
              Material Setup
            </h1>
            <p className="text-2xl opacity-60 font-light">
              Configure how the AI should build your lesson.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Type Selector */}
            <div className="flex flex-col gap-4">
              <label className="text-xl font-bold uppercase tracking-widest opacity-50">Content Type</label>
              <div className="flex flex-col gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-4 p-6 rounded-[2rem] text-2xl font-medium transition-all ${
                      type === t.id 
                        ? "bg-indigo-950 text-indigo-100 shadow-xl scale-105 origin-left" 
                        : "bg-indigo-200/50 hover:bg-indigo-200 border-2 border-indigo-950/5"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Age */}
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-4">
                <label className="text-xl font-bold uppercase tracking-widest opacity-50">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-6 rounded-[2rem] bg-indigo-200/50 border-2 border-indigo-950/5 text-2xl font-medium outline-none focus:border-indigo-950/30 appearance-none cursor-pointer"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <label className="text-xl font-bold uppercase tracking-widest opacity-50">Age Group</label>
                <select 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-6 rounded-[2rem] bg-indigo-200/50 border-2 border-indigo-950/5 text-2xl font-medium outline-none focus:border-indigo-950/30 appearance-none cursor-pointer"
                >
                  <option>4-7 (Pre-K to 2)</option>
                  <option>8-10 (Grade 3-4)</option>
                  <option>11-13 (Middle)</option>
                  <option>14+ (High)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Area: Input and Generate */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex flex-col gap-8"
        >
          <div className="flex-1 flex flex-col relative bg-white/40 backdrop-blur-3xl rounded-[3rem] p-10 lg:p-16 border-4 border-indigo-950/10 shadow-2xl shadow-indigo-900/10">
            <div className="flex justify-between items-center mb-10">
              <label className="text-3xl font-medium tracking-tight flex items-center gap-4">
                <Settings2 size={32} className="opacity-40" />
                What are we teaching today?
              </label>
              
              <div className="flex gap-4">
                <button className="w-16 h-16 rounded-full bg-indigo-200/50 flex items-center justify-center hover:bg-indigo-950 hover:text-indigo-100 transition-colors tooltip relative group" aria-label="Upload File">
                  <Upload size={24} />
                  <span className="absolute -top-12 bg-black text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Upload File</span>
                </button>
                <button className="w-16 h-16 rounded-full bg-indigo-200/50 flex items-center justify-center hover:bg-indigo-950 hover:text-indigo-100 transition-colors tooltip relative group" aria-label="Add Link">
                  <LinkIcon size={24} />
                  <span className="absolute -top-12 bg-black text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Add Web Link</span>
                </button>
                <button className="w-16 h-16 rounded-full bg-indigo-200/50 flex items-center justify-center hover:bg-indigo-950 hover:text-indigo-100 transition-colors tooltip relative group" aria-label="Add Image">
                  <ImageIcon size={24} />
                  <span className="absolute -top-12 bg-black text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Add Image Reference</span>
                </button>
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste a Wikipedia article, type a concept like 'Photosynthesis', or paste your existing notes..."
              className="w-full flex-1 bg-transparent text-4xl lg:text-5xl font-light leading-relaxed outline-none resize-none placeholder:text-indigo-950/30"
            />

            <div className="flex justify-end mt-8 border-t-2 border-indigo-950/10 pt-12">
              <button 
                onClick={handleGenerate}
                disabled={!query.trim()}
                className="group flex items-center gap-6 bg-indigo-950 text-indigo-100 px-12 py-8 rounded-[3rem] text-4xl font-medium hover:scale-105 transition-all duration-300 shadow-2xl shadow-indigo-950/30 disabled:opacity-50 disabled:hover:scale-100"
              >
                <span>Generate Content</span>
                <div className="bg-indigo-100 text-indigo-950 p-4 rounded-full group-hover:translate-x-2 transition-transform">
                  <ArrowRight strokeWidth={3} size={32} />
                </div>
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}