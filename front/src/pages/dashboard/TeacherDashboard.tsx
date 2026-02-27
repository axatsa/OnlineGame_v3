import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Dices, Gamepad2, GraduationCap, User, BookOpen,
  ChevronDown, Plus, Check, Settings2, Globe, BookMarked,
} from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import type { Lang } from "@/context/LangContext";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classes, activeClass, setActiveClassId } = useClass();
  const { lang, setLang, t } = useLang();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navPills = [
    { key: "Generators", label: t("navGenerators"), route: "/generator" },
    { key: "Tools", label: t("navTools"), route: "/tools" },
    { key: "Games", label: t("navGames"), route: "/games" },
    { key: "Library", label: t("navLibrary"), route: "/library" },
  ] as const;

  const [activeNav, setActiveNav] = useState<typeof navPills[number]["key"]>("Generators");

  const cards = [
    {
      title: t("cardAiTitle"),
      description: t("cardAiDesc"),
      icon: Sparkles,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      route: "/generator",
    },
    {
      title: t("cardToolsTitle"),
      description: t("cardToolsDesc"),
      icon: Dices,
      gradient: "from-blue-500/10 to-indigo-500/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-600",
      route: "/tools",
    },
    {
      title: t("cardGamesTitle"),
      description: t("cardGamesDesc"),
      icon: Gamepad2,
      gradient: "from-emerald-500/10 to-teal-500/5",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-600",
      route: "/games",
    },
    {
      title: t("cardLibraryTitle"),
      description: t("cardLibraryDesc"),
      icon: BookMarked,
      gradient: "from-violet-500/10 to-purple-500/5",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-600",
      route: "/library",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-t.png" alt="ClassPlay Logo" className="w-12 h-12 rounded-lg object-contain" />
            <span className="text-xl font-bold font-serif text-foreground hidden sm:inline">ClassPlay</span>
          </div>

          {/* Nav Pills */}
          <div className="flex items-center bg-muted rounded-full p-1 mx-4">
            {navPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => {
                  setActiveNav(pill.key);
                  navigate(pill.route);
                }}
                className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeNav === pill.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {activeNav === pill.key && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Class Picker + Lang + Profile */}
          <div className="flex items-center gap-2">

            {/* Class Picker */}
            <div className="relative mr-2">
              <button
                onClick={() => setShowClassPicker(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-sans font-medium"
              >
                <GraduationCap className="w-4 h-4 text-primary" />
                {activeClass ? (
                  <span className="max-w-[100px] truncate">{activeClass.name}</span>
                ) : (
                  <span className="text-muted-foreground">{t("selectClass")}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showClassPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[200px] z-50 flex flex-col gap-1"
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left text-sm font-sans"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{cls.name}</span>
                          <span className="text-[10px] text-muted-foreground">{cls.studentCount} {t("studentsLabel")}</span>
                        </div>
                        {cls.id === activeClass?.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary font-semibold font-sans hover:bg-muted rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("addClass")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-sans font-medium text-foreground"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {lang === "ru" ? "RU" : "UZ"}
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[130px] z-50"
                  >
                    {(["ru", "uz"] as Lang[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setShowLangMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors flex items-center gap-2 ${lang === l ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
                          }`}
                      >
                        {l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbekcha"}
                        {lang === l && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <User className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("welcomeBack")} {user?.full_name || (lang === "ru" ? "Учитель" : "O'qituvchi")}
          </h1>
          <p className="text-lg text-muted-foreground font-sans">{t("dashSub")}</p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.route)}
              className={`text-left p-8 rounded-2xl bg-gradient-to-br ${card.gradient} border border-border bg-card shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-5`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 font-serif">{card.title}</h3>
              <p className="text-muted-foreground font-sans">{card.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Active Class Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-8"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">{t("activeClass")}</h3>
            </div>
            <button
              onClick={() => navigate("/classes")}
              className="text-xs font-semibold text-primary hover:underline font-sans flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" /> {t("manageClasses")}
            </button>
          </div>

          {activeClass ? (
            <>
              <div className="relative mb-4">
                <button
                  onClick={() => setShowClassPicker((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground font-sans text-sm">{activeClass.name}</span>
                    <span className="text-xs text-muted-foreground font-sans">
                      {t("grade")} {activeClass.grade} · {activeClass.studentCount} {t("students")}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showClassPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground font-sans">{cls.name}</p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {t("grade")} {cls.grade} · {cls.studentCount} {t("students")}
                            </p>
                          </div>
                          {cls.id === activeClass.id && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                      <button
                        onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary font-semibold font-sans hover:bg-muted transition-colors border-t border-border"
                      >
                        <Plus className="w-4 h-4" /> {t("addClass")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-muted text-xs font-sans font-medium text-foreground">
                  <GraduationCap className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> {t("grade")} {activeClass.grade}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-xs font-sans font-medium text-foreground">
                  {activeClass.studentCount} {t("students")}
                </span>
                {activeClass.description && (
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-xs font-sans font-medium text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t("aiContext")}: {activeClass.description.slice(0, 50)}{activeClass.description.length > 50 ? "…" : ""}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground font-sans text-sm mb-3">{t("noClass")}</p>
              <button
                onClick={() => navigate("/classes")}
                className="text-sm font-semibold text-primary hover:underline font-sans"
              >
                {t("createFirstClass")}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
