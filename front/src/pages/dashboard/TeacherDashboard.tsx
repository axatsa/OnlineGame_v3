import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Dices, Gamepad2, GraduationCap, User, BookOpen,
  ChevronDown, Plus, Check, Settings2, Globe, BookMarked, Sun, Moon,
  ArrowRight,
} from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classes, activeClass, setActiveClassId } = useClass();
  const { t, i18n } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const setLang = (l: string) => i18n.changeLanguage(l);
  const lang = i18n.language;
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navPills = [
    { key: "Generators", label: t("navGenerators"), route: "/generator" },
    { key: "History", label: "История", route: "/history" },
    { key: "Tools", label: t("navTools"), route: "/tools" },
    { key: "Games", label: t("navGames"), route: "/games" },
    { key: "Library", label: t("navLibrary"), route: "/library" },
  ] as const;

  const [activeNav, setActiveNav] = useState<typeof navPills[number]["key"]>("Generators");

  const quickActions = [
    { icon: Sparkles, label: t("cardAiTitle"), route: "/generator", color: "from-emerald-500 to-sky-500" },
    { icon: Gamepad2, label: t("cardGamesTitle"), route: "/games", color: "from-amber-400 to-orange-500" },
    { icon: BookMarked, label: t("cardLibraryTitle"), route: "/library", color: "from-violet-500 to-fuchsia-500" },
    { icon: Dices, label: t("cardToolsTitle"), route: "/tools", color: "from-sky-400 to-indigo-500" },
  ];

  const firstName = user?.full_name?.split(" ")[0] || (lang === "ru" ? "Учитель" : "O'qituvchi");

  return (
    <div className="min-h-screen bg-background">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/teacher")} className="flex items-center gap-3 group">
            <img
              src="/logo_sticker.webp"
              alt="ClassPlay Logo"
              className="w-10 h-10 rounded-xl object-contain group-hover:scale-110 transition-transform duration-200"
            />
            <span className="text-xl font-display font-bold text-foreground hidden sm:inline tracking-tight">ClassPlay</span>
          </button>

          {/* Nav Pills */}
          <div className="flex items-center bg-muted rounded-full p-1 mx-4">
            {navPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => { setActiveNav(pill.key); navigate(pill.route); }}
                className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeNav === pill.key ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {activeNav === pill.key && (
                  <motion.div
                    layoutId="activePillDash"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Class Picker */}
            <div className="relative mr-2">
              <button
                onClick={() => setShowClassPicker(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-sans font-medium"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" />
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
                    className="absolute right-0 top-12 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[200px] z-50 flex flex-col gap-1"
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left text-sm font-sans"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{cls.name}</span>
                          <span className="text-[10px] text-muted-foreground">{cls.studentCount} {t("studentsLabel")}</span>
                        </div>
                        {cls.id === activeClass?.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 font-semibold font-sans hover:bg-muted rounded-xl transition-colors"
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
                    className="absolute right-0 top-10 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[130px] z-50"
                  >
                    {(["ru", "uz"] as string[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setShowLangMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-sans transition-colors flex items-center gap-2 ${lang === l ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-muted text-foreground"}`}
                      >
                        {l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbekcha"}
                        {lang === l && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title={isDark ? "Светлая тема" : "Тёмная тема"}
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* ── ZONE 1: WELCOME & QUICK-CREATE (emerald) ── */}
      <section className="zone-emerald min-h-[50vh] px-6 lg:px-16 pt-16 pb-20 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <h1 className="text-5xl md:text-8xl font-display font-medium tracking-tighter leading-[0.9] mb-6">
            {lang === "ru" ? "Добро пожаловать," : "Xush kelibsiz,"}<br />
            <span style={{ color: "var(--zone-emerald-muted)" }}>{firstName}.</span>
          </h1>
          <p className="text-xl max-w-xl mb-12" style={{ color: "var(--zone-emerald-muted)" }}>
            {t("dashSub")}
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.route)}
                className={`px-6 py-4 rounded-full font-semibold text-white flex items-center gap-3 shadow-lg bg-gradient-to-r ${action.color}`}
              >
                <action.icon size={20} />
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── ZONE 2: ACTIVE CLASS (amber) ── */}
      <section className="zone-amber py-20 px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl flex flex-col xl:flex-row gap-16"
        >
          <div className="xl:w-1/3 flex flex-col gap-4">
            <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tighter">{t("activeClass")}</h2>
            <button
              onClick={() => navigate("/classes")}
              className="flex items-center gap-2 text-sm font-semibold mt-2 hover:opacity-70 transition-opacity w-fit"
              style={{ color: "var(--zone-amber-muted)" }}
            >
              <Settings2 className="w-4 h-4" /> {t("manageClasses")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="xl:w-2/3">
            {activeClass ? (
              <>
                <div className="relative mb-6">
                  <button
                    onClick={() => setShowClassPicker(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 border-current/20 hover:border-current/40 bg-white/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" style={{ color: "var(--zone-amber-muted)" }} />
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-display font-bold tracking-tight">{activeClass.name}</p>
                        <p className="text-sm opacity-60">{t("grade")} {activeClass.grade} · {activeClass.studentCount} {t("students")}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 opacity-50 transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showClassPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-20 overflow-hidden"
                      >
                        {classes.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground font-sans">{cls.name}</p>
                              <p className="text-xs text-muted-foreground font-sans">{t("grade")} {cls.grade} · {cls.studentCount} {t("students")}</p>
                            </div>
                            {cls.id === activeClass.id && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                        <button
                          onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                          className="w-full flex items-center gap-2 px-5 py-4 text-sm text-emerald-600 font-semibold font-sans hover:bg-muted transition-colors border-t border-border"
                        >
                          <Plus className="w-4 h-4" /> {t("addClass")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {activeClass.description && (
                  <div className="flex items-start gap-3 px-6 py-4 rounded-2xl bg-white/30">
                    <Sparkles className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--zone-amber-muted)" }} />
                    <p className="text-sm opacity-70">{activeClass.description}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <BookOpen className="w-16 h-16 opacity-30" />
                <p className="text-xl opacity-50">{t("noClass")}</p>
                <button
                  onClick={() => navigate("/classes")}
                  className="px-6 py-3 rounded-full font-semibold text-sm border-2 border-current hover:bg-white/30 transition-colors"
                >
                  {t("createFirstClass")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── ZONE 3: ALL TOOLS (sky) ── */}
      <section className="zone-sky py-20 px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl"
        >
          <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tighter mb-16">
            {lang === "ru" ? "Инструменты" : "Vositalar"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {[
              { icon: Sparkles, title: t("cardAiTitle"), desc: t("cardAiDesc"), route: "/generator" },
              { icon: BookMarked, title: "История", desc: "Просмотр ранее созданных материалов", route: "/history" },
              { icon: Dices, title: t("cardToolsTitle"), desc: t("cardToolsDesc"), route: "/tools" },
              { icon: Gamepad2, title: t("cardGamesTitle"), desc: t("cardGamesDesc"), route: "/games" },
              { icon: BookOpen, title: t("cardLibraryTitle"), desc: t("cardLibraryDesc"), route: "/library" },
              { icon: GraduationCap, title: t("cardClassTitle") || "Классы", desc: t("cardClassDesc") || "Управляйте вашими классами", route: "/classes" },
            ].map((item, i) => (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.route)}
                className="flex flex-col text-left group cursor-pointer border-l-4 border-current/20 pl-6 hover:border-current transition-colors duration-300"
              >
                <item.icon className="w-10 h-10 mb-5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all origin-left duration-300" />
                <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tighter leading-tight mb-2">{item.title}</h3>
                <p className="text-base opacity-50 font-sans">{item.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default TeacherDashboard;
