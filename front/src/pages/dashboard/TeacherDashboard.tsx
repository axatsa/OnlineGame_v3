import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Dices, Gamepad2, GraduationCap, User, BookOpen,
  ChevronDown, Plus, Check, Globe, BookMarked, Sun, Moon, Settings,
  Zap, Calendar, BarChart3, TrendingUp
} from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import OnboardingModal from "@/components/Onboarding/OnboardingModal";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

interface Stats {
  total_generations: number;
  generations_this_month: number;
  games_launched: number;
  activity_by_day: { date: string; count: number }[];
  top_features: { name: string; count: number }[];
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { classes, activeClass, setActiveClassId } = useClass();
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const setLang = (l: string) => i18n.changeLanguage(l);
  const lang = i18n.language;
  
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(user?.onboarding_completed === false);
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/generate/stats/me");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const navPills = [
    { key: "Generators", label: t("navGenerators"), route: "/generator" },
    { key: "History",    label: lang === "ru" ? "История" : "Tarix",  route: "/history" },
    { key: "Tools",      label: t("navTools"),      route: "/tools" },
    { key: "Games",      label: t("navGames"),      route: "/games" },
    { key: "Library",    label: t("navLibrary"),    route: "/library" },
  ] as const;

  const [activeNav] = useState<typeof navPills[number]["key"]>("Generators");

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans uppercase-none">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate("/teacher")} className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo_sticker.webp" alt="Logo" className="w-9 h-9 rounded-xl object-contain group-hover:scale-110 transition-transform duration-200" />
            <span className="text-lg font-display font-bold text-foreground hidden sm:inline tracking-tight">ClassPlay</span>
          </button>

          <div className="flex items-center bg-muted rounded-full p-1 gap-0.5 overflow-x-auto">
            {navPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => navigate(pill.route)}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${activeNav === pill.key ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {activeNav === pill.key && (
                  <motion.div layoutId="activePillDash" className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" />
                )}
                <span className="relative z-10">{pill.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
             {/* Class Picker */}
             <div className="relative">
              <button onClick={() => setShowClassPicker(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                {activeClass ? <span className="max-w-[80px] truncate">{activeClass.name}</span> : <span className="text-muted-foreground text-xs">{t("selectClass")}</span>}
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showClassPicker && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} className="absolute right-0 top-11 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[190px] z-50 flex flex-col gap-1">
                    {classes.map((cls) => (
                      <button key={cls.id} onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm">{cls.name}</span>
                          <span className="text-[10px] text-muted-foreground">{cls.studentCount} {t("studentsLabel")}</span>
                        </div>
                        {cls.id === activeClass?.id && <Check className="w-3.5 h-3.5 text-violet-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Top Row: Welcome + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
               <Sparkles className="w-48 h-48 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
                {lang === "ru" ? "Привет," : "Xush kelibsiz,"} {" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  {user?.full_name?.split(" ")[0] || "Учитель"}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md">Рады видеть вас снова. Давайте создадим что-то интересное для ваших учеников сегодня!</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8">
               <Button onClick={() => navigate("/generator")} size="lg" className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 gap-2">
                 <Zap className="w-5 h-5" /> Создать урок
               </Button>
               <Button onClick={() => navigate("/games")} variant="secondary" size="lg" className="rounded-2xl px-8 h-12 font-bold gap-2">
                 <Gamepad2 className="w-5 h-5" /> Запустить игру
               </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
             <MetricCard 
               icon={<Zap className="w-5 h-5 text-violet-600" />} 
               value={stats?.total_generations || 0} 
               label="Всего заданий" 
               color="bg-violet-500/10" 
               delay={0.1}
             />
             <MetricCard 
               icon={<Calendar className="w-5 h-5 text-emerald-600" />} 
               value={stats?.generations_this_month || 0} 
               label="В этом месяце" 
               color="bg-emerald-500/10" 
               delay={0.2}
             />
             <MetricCard 
               icon={<Gamepad2 className="w-5 h-5 text-orange-600" />} 
               value={stats?.games_launched || 0} 
               label="Игр запущено" 
               color="bg-orange-500/10" 
               delay={0.3}
             />
             <MetricCard 
               icon={<TrendingUp className="w-5 h-5 text-blue-600" />} 
               value={classes.length} 
               label="Ваши классы" 
               color="bg-blue-500/10" 
               delay={0.4}
             />
          </div>
        </div>

        {/* Second Row: Chart + Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" /> Активность за 2 недели
                </h3>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.activity_by_day || []}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {(stats?.activity_by_day || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === (stats?.activity_by_day?.length || 0) - 1 ? '#8b5cf6' : '#8b5cf640'} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-[32px] p-8 border border-border shadow-sm flex flex-col">
              <h3 className="text-xl font-bold mb-6">Популярное у вас</h3>
              <div className="space-y-4">
                 {(stats?.top_features || []).map((feat, i) => (
                   <div key={feat.name} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-bold text-primary">
                           {i + 1}
                        </div>
                        <span className="font-bold capitalize">{feat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground mr-2">{feat.count} раз</span>
                   </div>
                 ))}
                 {(stats?.top_features?.length || 0) === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">Здесь появится ваша статистика</div>
                 )}
              </div>
           </motion.div>
        </div>

        {/* Third Row: Bento Grid Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cardsList.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.7 }}
              whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.route)}
              className={`text-left p-6 rounded-[28px] bg-card border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group ${card.span || ""}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{card.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={() => {
          setShowOnboarding(false);
          updateUser({ onboarding_completed: true });
        }} />}
      </AnimatePresence>
    </div>
  );
};

const MetricCard = ({ icon, value, label, color, delay }: any) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col justify-between">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">{label}</div>
    </div>
  </motion.div>
);

const cardsList = [
  {
    title: "AI Генераторы",
    desc: "Создавайте тесты и упражнения в один клик",
    icon: Sparkles,
    route: "/generator",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    span: "md:col-span-2"
  },
  {
    title: "Игры",
    desc: "Интерактив на смарт-борде",
    icon: Gamepad2,
    route: "/games",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    title: "Библиотека",
    desc: "Готовые материалы коллег",
    icon: BookOpen,
    route: "/library",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
  }
];

export default TeacherDashboard;
