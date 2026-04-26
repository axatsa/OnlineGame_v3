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
import { toast } from "sonner";
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
  const [materialCount, setMaterialCount] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, matRes] = await Promise.all([
          api.get("/generate/stats/me"),
          api.get<{ id: number }[]>("/materials/").catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setMaterialCount(matRes.data.length);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        toast.error("Не удалось загрузить статистику");
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const navPills = [
    { key: "Generators", label: t("navGenerators"), route: "/generator" },
    { key: "History",    label: lang === "ru" ? "История" : "Tarix",  route: "/history" },
    { key: "Analytics",  label: lang === "ru" ? "Аналитика" : "Tahlil", route: "/analytics" },
    { key: "Tools",      label: t("navTools"),      route: "/tools" },
    { key: "Games",      label: t("navGames"),      route: "/games" },
    { key: "Library",    label: t("navLibrary"),    route: "/library" },
    { key: "Materials",  label: lang === "ru" ? "Материалы" : "Materiallar", route: "/materials" },
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
            
            <div className="relative">
              <button onClick={() => setShowLangMenu(v => !v)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-[10px] font-bold">
                {lang.toUpperCase()}
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} className="absolute right-0 top-10 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[130px] z-50 flex flex-col gap-1">
                    {[
                      { l: "ru", n: "🇷🇺 Русский" },
                      { l: "uz", n: "🇺🇿 O'zbekcha" },
                      { l: "en", n: "🇺🇸 English" }
                    ].map(({ l, n }) => (
                      <button key={l} onClick={() => { i18n.changeLanguage(l); setShowLangMenu(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${lang === l ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"}`}>
                        <span>{n}</span>
                        {lang === l && <Check className="w-3 h-3" />}
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
                {t("welcomeBack")} {" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  {user?.full_name?.split(" ")[0] || t("teacher_placeholder")}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md">{t("welcome_back_detailed")}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8">
               <Button onClick={() => navigate("/generator")} size="lg" className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 gap-2">
                 <Zap className="w-5 h-5" /> {t("create_lesson")}
               </Button>
               <Button onClick={() => navigate("/games")} variant="secondary" size="lg" className="rounded-2xl px-8 h-12 font-bold gap-2">
                 <Gamepad2 className="w-5 h-5" /> {t("launch_game")}
               </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
             <MetricCard 
               icon={<Zap className="w-5 h-5 text-violet-600" />} 
               value={stats?.total_generations || 0} 
               label={t("stats_total_tasks")} 
               color="bg-violet-500/10" 
               delay={0.1}
             />
             <MetricCard 
               icon={<Calendar className="w-5 h-5 text-emerald-600" />} 
               value={stats?.generations_this_month || 0} 
               label={t("stats_this_month")} 
               color="bg-emerald-500/10" 
               delay={0.2}
             />
             <MetricCard 
               icon={<Gamepad2 className="w-5 h-5 text-orange-600" />} 
               value={stats?.games_launched || 0} 
               label={t("stats_games_launched")} 
               color="bg-orange-500/10" 
               delay={0.3}
             />
             <MetricCard 
               icon={<TrendingUp className="w-5 h-5 text-blue-600" />} 
               value={classes.length} 
               label={t("stats_your_classes")} 
               color="bg-blue-500/10" 
               delay={0.4}
             />
          </div>
        </div>

        {/* Second Row: Bento Grid Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                <h3 className="text-lg font-bold text-foreground leading-tight">{t(card.title)}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t(card.desc)}</p>
              </div>
            </motion.button>
          ))}

          {/* Materials card with upload count */}
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * cardsList.length + 0.7 }}
            whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/materials")}
            className="text-left p-6 rounded-[28px] bg-card border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group relative"
          >
            {materialCount === 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 border border-amber-200">
                Загрузить
              </span>
            )}
            {materialCount > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                {materialCount} файл{materialCount === 1 ? "" : materialCount < 5 ? "а" : "ов"}
              </span>
            )}
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookMarked className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {lang === "ru" ? "Материалы" : "Materiallar"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {lang === "ru"
                  ? "Загрузите учебники — ИИ создаст задания по вашему контенту"
                  : "Darsliklar yuklang — AI sizning materialingiz bo'yicha topshiriqlar yaratadi"}
              </p>
            </div>
          </motion.button>
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
    title: "cardAiTitle",
    desc: "cardAiDesc",
    icon: Sparkles,
    route: "/generator",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    span: "md:col-span-2"
  },
  {
    title: "cardGamesTitle",
    desc: "cardGamesDesc",
    icon: Gamepad2,
    route: "/games",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    title: "cardLibraryTitle",
    desc: "cardLibraryDesc",
    icon: BookOpen,
    route: "/library",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
  }
];

export default TeacherDashboard;
