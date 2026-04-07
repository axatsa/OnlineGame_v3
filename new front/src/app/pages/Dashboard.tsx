import { motion } from "motion/react";
import { ArrowRight, FileText, Sparkles, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/create?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col w-full min-h-screen font-sans">
      {/* Zone 1: Welcome & Quick Create */}
      <section className="min-h-[75vh] w-full bg-emerald-100 text-emerald-950 pt-40 px-8 lg:px-24 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <h1 className="text-[12vw] sm:text-7xl md:text-9xl font-medium tracking-tighter leading-[0.85]">
            Morning, Sarah. <br />
            <span className="text-emerald-800">Ready to teach?</span>
          </h1>
          <form
            onSubmit={handleCreate}
            className="mt-24 relative flex items-center group w-full max-w-4xl"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="I want to teach fractions using pizza..."
              className="w-full text-3xl md:text-5xl lg:text-6xl bg-transparent border-b-4 border-emerald-950/20 pb-6 outline-none placeholder:text-emerald-950/30 text-emerald-950 transition-colors focus:border-emerald-950"
            />
            <button
              type="submit"
              className="absolute right-0 bottom-8 p-6 bg-emerald-950 text-emerald-100 rounded-full opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all focus:opacity-100 focus:translate-x-0 outline-none"
              aria-label="Create lesson"
            >
              <ArrowRight strokeWidth={2.5} size={36} />
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-16 flex flex-wrap gap-6 text-xl md:text-2xl font-medium tracking-tight">
            <button 
              onClick={() => navigate('/generator?type=game')}
              className="px-8 py-6 rounded-full bg-emerald-950 text-emerald-100 hover:scale-105 transition-transform shadow-2xl shadow-emerald-950/20 flex items-center gap-4"
            >
              <Sparkles size={24} />
              New Mini-Game
            </button>
            <button 
              onClick={() => navigate('/generator?type=quiz')}
              className="px-8 py-6 rounded-full bg-emerald-200/50 text-emerald-950 hover:bg-emerald-200 transition-colors flex items-center gap-4 border border-emerald-950/10"
            >
              <FileText size={24} />
              Pop Quiz
            </button>
            <button 
              onClick={() => navigate('/generator?type=reading')}
              className="px-8 py-6 rounded-full bg-emerald-200/50 text-emerald-950 hover:bg-emerald-200 transition-colors flex items-center gap-4 border border-emerald-950/10"
            >
              Reading Exercise
            </button>
          </div>
        </motion.div>
      </section>

      {/* Zone 2: Schedule / Active */}
      <section className="min-h-[60vh] w-full bg-amber-100 text-amber-950 px-8 lg:px-24 py-32 flex flex-col xl:flex-row gap-20">
        <div className="xl:w-1/3 flex flex-col items-start gap-4 sticky top-32 h-fit">
          <h2 className="text-5xl md:text-7xl font-medium tracking-tighter">Up Next</h2>
          <p className="text-amber-800 text-2xl md:text-3xl font-light max-w-sm">
            You have three classes today. The first one starts in 45 minutes.
          </p>
        </div>
        <div className="xl:w-2/3 flex flex-col gap-16 md:gap-24">
          <div className="flex flex-col md:flex-row gap-6 md:gap-16 group cursor-pointer">
            <div className="text-4xl md:text-6xl font-medium tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
              09:00
            </div>
            <div className="flex-1 group-hover:translate-x-4 transition-transform duration-300">
              <h3 className="text-5xl md:text-7xl font-medium tracking-tighter leading-none mb-6">
                Geometry & Shapes
              </h3>
              <div className="flex items-center gap-6 text-xl md:text-3xl opacity-60">
                <span className="flex items-center gap-2"><MapPin size={28} /> Room 201</span>
                <span className="w-2 h-2 rounded-full bg-current opacity-50" />
                <span>Grade 4</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-16 group cursor-pointer">
            <div className="text-4xl md:text-6xl font-medium tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
              11:30
            </div>
            <div className="flex-1 group-hover:translate-x-4 transition-transform duration-300">
              <h3 className="text-5xl md:text-7xl font-medium tracking-tighter leading-none mb-6">
                Creative Writing
              </h3>
              <div className="flex items-center gap-6 text-xl md:text-3xl opacity-60">
                <span className="flex items-center gap-2"><MapPin size={28} /> Room 201</span>
                <span className="w-2 h-2 rounded-full bg-current opacity-50" />
                <span>Grade 4</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-16 group cursor-pointer">
            <div className="text-4xl md:text-6xl font-medium tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
              14:00
            </div>
            <div className="flex-1 group-hover:translate-x-4 transition-transform duration-300">
              <h3 className="text-5xl md:text-7xl font-medium tracking-tighter leading-none mb-6">
                Life Sciences
              </h3>
              <div className="flex items-center gap-6 text-xl md:text-3xl opacity-60">
                <span className="flex items-center gap-2"><MapPin size={28} /> Lab 3</span>
                <span className="w-2 h-2 rounded-full bg-current opacity-50" />
                <span>Grade 5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 3: Recent Material */}
      <section className="min-h-[70vh] w-full bg-sky-100 text-sky-950 px-8 lg:px-24 py-32 flex flex-col gap-24">
        <h2 className="text-5xl md:text-7xl font-medium tracking-tighter">Recent Materials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-24">
          <div className="flex flex-col group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
            <div className="border-l-4 border-sky-950/20 pl-8 group-hover:border-sky-950 transition-colors duration-300">
              <FileText className="w-16 h-16 mb-8 text-sky-700 group-hover:scale-110 transition-transform origin-left duration-500" />
              <h3 className="text-4xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-6">
                Volcanoes<br />Worksheet
              </h3>
              <p className="text-2xl text-sky-950/60 font-light">Created 2 days ago</p>
            </div>
          </div>
          <div className="flex flex-col group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
            <div className="border-l-4 border-sky-950/20 pl-8 group-hover:border-sky-950 transition-colors duration-300">
              <FileText className="w-16 h-16 mb-8 text-sky-700 group-hover:scale-110 transition-transform origin-left duration-500" />
              <h3 className="text-4xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-6">
                Spelling Bee<br />Flashcards
              </h3>
              <p className="text-2xl text-sky-950/60 font-light">Created last week</p>
            </div>
          </div>
          <div className="flex flex-col group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
            <div className="border-l-4 border-sky-950/20 pl-8 group-hover:border-sky-950 transition-colors duration-300">
              <FileText className="w-16 h-16 mb-8 text-sky-700 group-hover:scale-110 transition-transform origin-left duration-500" />
              <h3 className="text-4xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-6">
                Math Basics<br />Quiz
              </h3>
              <p className="text-2xl text-sky-950/60 font-light">Created last month</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}