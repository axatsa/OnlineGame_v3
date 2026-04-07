import { motion } from "motion/react";
import { Plus, Users, Search, MoreHorizontal, UserPlus, BookOpen, Star, TrendingUp } from "lucide-react";
import { useState } from "react";

const classesData = [
  { id: "math5a", name: "Math 5A", students: 24 },
  { id: "hist10b", name: "History 10B", students: 31 },
  { id: "science4", name: "Science Grade 4", students: 18 },
];

const studentsData = [
  { id: 1, name: "Emily Clark", progress: 85, score: 92, lastActive: "Today" },
  { id: 2, name: "Marcus Johnson", progress: 60, score: 78, lastActive: "Yesterday" },
  { id: 3, name: "Sophia Martinez", progress: 95, score: 98, lastActive: "Today" },
  { id: 4, name: "Liam Davis", progress: 40, score: 65, lastActive: "3 days ago" },
  { id: 5, name: "Olivia Taylor", progress: 75, score: 88, lastActive: "Today" },
  { id: 6, name: "Noah Wilson", progress: 55, score: 72, lastActive: "2 days ago" },
  { id: 7, name: "Ava Moore", progress: 90, score: 95, lastActive: "Yesterday" },
];

export function Students() {
  const [activeClass, setActiveClass] = useState("math5a");
  const [search, setSearch] = useState("");

  const currentClass = classesData.find(c => c.id === activeClass);

  return (
    <div className="flex w-full min-h-screen font-sans bg-rose-50 text-rose-950 pt-28">
      
      {/* Sidebar: Class List */}
      <div className="w-[350px] shrink-0 border-r-2 border-rose-950/10 flex flex-col px-8 py-12 gap-12 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto">
        <div className="flex items-center justify-between">
           <h2 className="text-4xl font-medium tracking-tighter">Classes</h2>
           <button className="p-3 bg-rose-200/50 rounded-full hover:bg-rose-200 transition-colors text-rose-950">
             <Plus size={24} />
           </button>
        </div>

        <div className="flex flex-col gap-4">
          {classesData.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveClass(c.id)}
              className={`flex items-center justify-between p-6 rounded-[2rem] text-xl font-medium transition-all ${
                activeClass === c.id 
                  ? "bg-rose-950 text-rose-100 shadow-xl scale-105 origin-left" 
                  : "bg-rose-200/30 hover:bg-rose-200 border-2 border-rose-950/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <Users size={24} className={activeClass === c.id ? "opacity-100" : "opacity-50"} />
                {c.name}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${activeClass === c.id ? "bg-rose-800 text-rose-100" : "bg-rose-950/10"}`}>
                {c.students}
              </span>
            </button>
          ))}
        </div>
        
        {/* Quick Stats Sidebar */}
        <div className="mt-auto p-8 rounded-[2.5rem] bg-rose-200/50 border-2 border-rose-950/5 flex flex-col gap-6">
          <p className="text-xl font-bold uppercase tracking-widest opacity-50">Overview</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-300/50 flex items-center justify-center text-rose-950">
              <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-sm opacity-60 font-medium">Avg Progress</p>
               <p className="text-2xl font-bold">78%</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-300/50 flex items-center justify-center text-rose-950">
              <Star size={24} />
            </div>
            <div>
               <p className="text-sm opacity-60 font-medium">Avg Score</p>
               <p className="text-2xl font-bold">A-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area: Student Roster */}
      <div className="flex-1 flex flex-col px-12 lg:px-24 py-12 gap-12 overflow-y-auto pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.85] mb-4">
              {currentClass?.name}
            </h1>
            <p className="text-2xl font-light opacity-60">
              Manage students, track progress, and assign material.
            </p>
          </div>
          
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-40" size={24} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-16 pr-8 py-5 rounded-full bg-rose-200/30 border-2 border-rose-950/10 text-xl font-medium outline-none focus:border-rose-950/30 placeholder:text-rose-950/30"
            />
          </div>
        </div>

        {/* Student Table/Grid Concept (Cardless Row layout) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-8 py-4 border-b-4 border-rose-950/10 text-lg font-bold uppercase tracking-widest opacity-50">
            <div className="w-1/3">Student</div>
            <div className="w-1/4 text-center">Progress</div>
            <div className="w-1/6 text-center">Avg Score</div>
            <div className="w-1/6 text-right">Actions</div>
          </div>

          {studentsData.map(student => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-8 py-6 rounded-[2.5rem] bg-rose-200/10 hover:bg-rose-200/50 transition-colors border-2 border-transparent hover:border-rose-950/5 group"
            >
              {/* Name & Avatar */}
              <div className="w-1/3 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-rose-300 text-rose-950 flex items-center justify-center text-2xl font-bold shadow-inner">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-medium tracking-tight">{student.name}</h3>
                  <p className="text-lg opacity-60">Active: {student.lastActive}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-1/4 flex flex-col gap-3 px-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Completion</span>
                  <span>{student.progress}%</span>
                </div>
                <div className="h-4 w-full bg-rose-950/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${student.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-rose-950 rounded-full"
                  />
                </div>
              </div>

              {/* Score */}
              <div className="w-1/6 text-center">
                <span className="text-4xl font-medium tracking-tighter">
                  {student.score}
                </span>
                <span className="text-xl opacity-50">/100</span>
              </div>

              {/* Actions */}
              <div className="w-1/6 flex justify-end gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <button className="w-14 h-14 rounded-full bg-rose-300/50 hover:bg-rose-950 hover:text-rose-100 flex items-center justify-center transition-colors tooltip relative" aria-label="Assign Material">
                  <BookOpen size={24} />
                </button>
                <button className="w-14 h-14 rounded-full bg-rose-300/50 hover:bg-rose-950 hover:text-rose-100 flex items-center justify-center transition-colors">
                  <MoreHorizontal size={24} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-12 right-12 px-8 py-6 rounded-full bg-rose-950 text-rose-100 text-2xl font-medium hover:scale-105 transition-transform flex items-center gap-4 shadow-2xl shadow-rose-950/30 z-50">
        <UserPlus size={28} />
        Add Student
      </button>

    </div>
  );
}