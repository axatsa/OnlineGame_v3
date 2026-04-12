import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, BookOpen, Users, Gamepad2,
  CheckCircle2, Star, Zap, Globe, LogOut, User, Settings,
  ChevronDown, Play, Brain, Layers, Rocket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [navScrolled, setNavScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ru" ? "uz" : "ru");
  };

  const features = [
    {
      icon: Sparkles,
      title: t("land_f1_title", "ИИ-Генераторы"),
      desc: t("land_f1_desc", "Создавайте тесты, карточки и задания за секунды"),
      bg: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    {
      icon: Gamepad2,
      title: t("land_f2_title", "Интерактивные Игры"),
      desc: t("land_f2_desc", "6 игр для живого урока — Jeopardy, Memory, Word Search и другие"),
      bg: "bg-purple-500",
      light: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
    },
    {
      icon: BookOpen,
      title: t("land_f3_title", "Персональные Книги"),
      desc: t("land_f3_desc", "ИИ пишет книгу с именем ученика как главным героем"),
      bg: "bg-yellow-500",
      light: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-100",
    },
    {
      icon: Users,
      title: t("land_f6_title", "Управление Классами"),
      desc: t("land_f6_desc", "Ведите несколько групп, отслеживайте прогресс и активность"),
      bg: "bg-emerald-500",
      light: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
  ];

  const stats = [
    { value: "6+", label: t("land_stat_games", "Мини-игр"), icon: Gamepad2, color: "text-purple-500" },
    { value: "10k+", label: t("land_stat_gen", "Создано материалов"), icon: Sparkles, color: "text-blue-500" },
    { value: "AI", label: t("land_stat_ai", "Умный генератор"), icon: Brain, color: "text-yellow-500" },
    { value: "∞", label: t("land_stat_content", "Контента"), icon: Layers, color: "text-emerald-500" },
  ];

  const faqs = [
    { q: t("faq_1_q"), a: t("faq_1_a") },
    { q: t("faq_2_q"), a: t("faq_2_a") },
    { q: t("faq_3_q"), a: t("faq_3_a") },
    { q: t("faq_4_q"), a: t("faq_4_a") },
    { q: t("faq_5_q"), a: t("faq_5_a") },
    { q: t("faq_6_q"), a: t("faq_6_a") },
  ];

  const testimonials = [
    { name: t("testim_1_name"), role: t("testim_1_role"), school: t("testim_1_school"), text: t("testim_1_text"), color: "from-blue-400 to-purple-400" },
    { name: t("testim_2_name"), role: t("testim_2_role"), school: t("testim_2_school"), text: t("testim_2_text"), color: "from-purple-400 to-pink-400" },
    { name: t("testim_3_name"), role: t("testim_3_role"), school: t("testim_3_school"), text: t("testim_3_text"), color: "from-yellow-400 to-orange-400" },
    { name: t("testim_4_name"), role: t("testim_4_role"), school: t("testim_4_school"), text: t("testim_4_text"), color: "from-emerald-400 to-teal-400" },
  ];

  const gameCards = [
    { name: "Jeopardy", emoji: "🎯", color: "bg-blue-500" },
    { name: "Memory", emoji: "🧠", color: "bg-purple-500" },
    { name: "Word Search", emoji: "🔍", color: "bg-emerald-500" },
    { name: "Tug of War", emoji: "🏆", color: "bg-yellow-500" },
  ];

  return (
    <div className="min-h-screen font-sans antialiased w-full bg-white">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 flex justify-between items-center transition-all duration-300 ${
        navScrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-black/5 py-3" : "bg-transparent py-5"
      }`}>
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <img
            src="/logo_sticker.webp"
            alt="ClassPlay"
            className="w-9 h-9 rounded-xl object-contain group-hover:scale-110 transition-transform"
          />
          <span className={`text-xl font-bold tracking-tight transition-colors ${navScrolled ? "text-slate-900" : "text-white"}`}>
            ClassPlay
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              navScrolled ? "text-slate-500 hover:bg-slate-100" : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Globe className="w-4 h-4" />
            {i18n.language === "ru" ? "RU" : "UZ"}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfile(v => !v)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center hover:scale-110 transition-transform shadow"
              >
                <User className="w-4 h-4 text-white" />
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-2xl border border-black/5 p-2"
                  >
                    <div className="px-3 py-2.5 border-b border-black/5 mb-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">{user.full_name || user.email}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => navigate(user.role === "super_admin" ? "/admin" : "/teacher")} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-sm text-slate-700 transition-colors">
                      <Settings className="w-4 h-4 opacity-40" /> {t("land_dashboard")}
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 rounded-xl text-sm text-red-500 transition-colors">
                      <LogOut className="w-4 h-4" /> {t("logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/demo")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors hidden sm:block ${
                  navScrolled ? "text-slate-600 hover:bg-slate-100" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {t("land_hero_demo", "Демо")}
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow"
              >
                {t("land_login", "Войти")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-[#1a1147] pt-20 pb-16 px-6">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />
          <div className="absolute top-[30%] right-[15%] w-[30%] h-[30%] bg-yellow-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Floating game cards — decorative */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {gameCards.map((card, i) => (
            <motion.div
              key={card.name}
              className={`absolute ${card.color} rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-2 w-24`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 0.9,
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { delay: 0.5 + i * 0.15, duration: 0.5 },
                y: { delay: i * 0.3, duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
              }}
              style={{
                top: `${20 + (i % 2) * 35}%`,
                right: `${6 + (i % 2) * 4}%`,
                left: i > 1 ? undefined : undefined,
                ...(i === 0 ? { top: "20%", right: "8%" } : {}),
                ...(i === 1 ? { top: "52%", right: "4%" } : {}),
                ...(i === 2 ? { top: "30%", left: "4%" } : {}),
                ...(i === 3 ? { top: "60%", left: "7%" } : {}),
              }}
            >
              <span className="text-2xl">{card.emoji}</span>
              <span className="text-white text-[10px] font-bold text-center leading-tight">{card.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            {t("land_hero_badge", "ИИ-платформа для учителей")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-6"
          >
            {t("land_hero_title1", "Уроки,")}<br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
              {t("land_hero_title2", "которые не забудут")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            {t("land_hero_sub", "Создавайте материалы, запускайте игры и вовлекайте учеников — всё в одном месте. Хватит тратить часы на подготовку.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 hover:scale-105 flex items-center justify-center gap-2"
            >
              {t("land_hero_cta", "Начать бесплатно")} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> {t("land_hero_demo", "Смотреть демо")}
            </button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-slate-100 py-12 px-6 lg:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <s.icon className={`w-7 h-7 ${s.color} mb-1`} />
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{s.value}</span>
              <span className="text-sm text-slate-500 font-medium">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-slate-50 py-24 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold uppercase tracking-wider mb-4">
              {t("land_features_badge", "Возможности")}
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">
              {t("land_features_title", "Всё для современного учителя")}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              {t("land_features_sub", "Одна платформа — от подготовки урока до интерактивной игры.")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`bg-white rounded-3xl p-6 border ${f.border} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{f.title}</h3>
                <p className={`text-sm leading-relaxed font-medium ${f.text} opacity-80`}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white py-24 px-6 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase tracking-wider mb-4">
              {t("land_hiw_badge", "Как это работает")}
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              {t("land_res_title1", "Три шага")} <span className="text-purple-600">{t("land_res_title2", "до результата")}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "01", icon: Zap, title: t("land_hiw_1_title", "Выберите инструмент"), desc: t("land_res_acc_desc", "Генератор, игра или библиотека — всё доступно сразу после входа."), color: "bg-blue-500", ring: "ring-blue-100" },
              { n: "02", icon: Brain, title: t("land_hiw_2_title", "ИИ создаёт за вас"), desc: t("land_res_print_desc", "Введите тему — ИИ напишет задания, вопросы или целую книгу за секунды."), color: "bg-purple-500", ring: "ring-purple-100" },
              { n: "03", icon: Rocket, title: t("land_hiw_3_title", "Запустите на уроке"), desc: t("land_org_desc", "Распечатайте или откройте прямо на проекторе. Игры запускаются в один клик."), color: "bg-emerald-500", ring: "ring-emerald-100" },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className={`relative flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all ring-4 ${step.ring}`}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="text-5xl font-black text-slate-200 select-none leading-none">{step.n}</span>
                </div>
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg mt-4`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES SHOWCASE ── */}
      <section className="bg-[#1a1147] py-24 px-6 lg:px-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-sm font-bold uppercase tracking-wider mb-4 border border-white/10">
              {t("land_games_badge", "Игры")}
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
              {t("land_games_title", "6 игр для живого урока")}
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto font-medium">
              {t("land_games_sub", "Запускайте прямо на проекторе. Ученики играют — учитель управляет.")}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: "Jeopardy", emoji: "🎯", desc: t("land_game_jeopardy", "Командные вопросы"), color: "from-blue-600 to-blue-700" },
              { name: "Memory Matrix", emoji: "🧠", desc: t("land_game_memory", "Тренировка памяти"), color: "from-purple-600 to-purple-700" },
              { name: "Word Search", emoji: "🔍", desc: t("land_game_wordsearch", "Поиск слов"), color: "from-emerald-600 to-emerald-700" },
              { name: "Tug of War", emoji: "🏆", desc: t("land_game_tug", "Командная битва"), color: "from-orange-500 to-red-600" },
              { name: "Balance Scales", emoji: "⚖️", desc: t("land_game_scales", "Математика"), color: "from-cyan-600 to-sky-700" },
              { name: "Crossword", emoji: "✏️", desc: t("land_game_crossword", "Кроссворды"), color: "from-pink-500 to-rose-600" },
            ].map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className={`bg-gradient-to-br ${game.color} rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all cursor-pointer group`}
                onClick={() => navigate("/login")}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{game.emoji}</span>
                <h3 className="text-white font-bold text-base leading-tight">{game.name}</h3>
                <p className="text-white/60 text-xs font-medium">{game.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-full font-bold text-lg bg-white text-slate-900 hover:bg-slate-100 transition-all hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              {t("land_games_cta", "Попробовать все игры")} <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-white py-24 px-6 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold uppercase tracking-wider mb-4">
              {t("land_price_badge", "Тарифы")}
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">
              {t("land_price_title", "Для любого масштаба")}
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
              {t("land_price_sub", "От частного репетитора до целой школы.")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col hover:shadow-lg transition-all"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-1">{t("land_p1_title", "Бесплатно")}</h3>
              <p className="text-slate-400 text-sm mb-5 font-medium">{t("land_p1_sub", "Попробуйте без риска")}</p>
              <div className="text-4xl font-black text-slate-900 mb-6">$0<span className="text-lg text-slate-400 font-medium"> / мес</span></div>
              <ul className="space-y-3 mb-7 flex-1">
                {[t("land_p1_f1", "10 ИИ-генераций"), t("land_p1_f2", "Базовые игры"), t("land_p1_f3", "Поддержка"), t("land_p1_f4", "1 учитель")].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/login")} className="w-full py-3.5 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold hover:border-slate-800 transition-colors">
                {t("land_start", "Начать")}
              </button>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative bg-[#1a1147] rounded-3xl p-7 flex flex-col shadow-2xl shadow-purple-900/40 border border-purple-500/20 md:scale-105"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-t-3xl" />
              <div className="absolute -top-3 right-6">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">Popular</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-1">{t("land_p2_title", "Pro Учитель")}</h3>
              <p className="text-white/40 text-sm mb-5 font-medium">{t("land_p2_sub", "Всё без ограничений")}</p>
              <div className="text-4xl font-black text-white mb-6">$15<span className="text-lg text-white/40 font-medium"> / мес</span></div>
              <ul className="space-y-3 mb-7 flex-1">
                {[t("land_p2_f1", "Безлимитные генерации"), t("land_p2_f2", "Все 6 игр"), t("land_p2_f3", "ИИ-книги"), t("land_p2_f4", "Аналитика класса"), t("land_p2_f5", "Приоритетная поддержка")].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/login")} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30">
                {t("land_start", "Начать сейчас")}
              </button>
            </motion.div>

            {/* Schools */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col hover:shadow-lg transition-all"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-1">{t("land_p3_title", "Для Школ")}</h3>
              <p className="text-slate-400 text-sm mb-5 font-medium">{t("land_p3_sub", "Полное решение для учреждений")}</p>
              <div className="text-4xl font-black text-slate-900 mb-6">{t("land_p3_price", "$49")}<span className="text-lg text-slate-400 font-medium"> / мес</span></div>
              <ul className="space-y-3 mb-7 flex-1">
                {[t("land_p3_f1", "Все функции Pro"), t("land_p3_f2", "До 10 учителей"), t("land_p3_f3", "Админ-панель"), t("land_p3_f4", "CSV-импорт"), t("land_p3_f6", "Договор")].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/login")} className="w-full py-3.5 rounded-2xl border-2 border-purple-200 text-purple-700 font-bold hover:border-purple-500 hover:bg-purple-50 transition-colors">
                {t("land_cta_btn", "Связаться с нами")}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-slate-50 py-24 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-wider mb-4">
              {t("land_testimonials_badge", "Отзывы")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {t("land_testimonials_title", "Что говорят учителя")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((tm, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-slate-700 leading-relaxed font-medium mb-6 text-base">"{tm.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tm.color} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                    {tm.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{tm.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{tm.role} · {tm.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-24 px-6 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {t("land_faq_title", "Частые вопросы")}
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 group"
                >
                  <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${openFaq === i ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-slate-500 leading-relaxed font-medium text-sm border-t border-slate-100 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative bg-[#1a1147] py-28 px-6 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[80%] bg-purple-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] bg-blue-600/15 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] mb-6">
              {t("land_ready_to_change", "Готовы изменить свой урок?")}
            </h2>
            <p className="text-xl text-white/50 mb-10 max-w-xl mx-auto font-medium">
              {t("land_cta_sub", "Тысячи учителей уже используют ClassPlay каждый день.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-10 py-5 rounded-full text-xl font-black bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl shadow-blue-500/30 hover:scale-105 flex items-center justify-center gap-3"
              >
                {t("land_cta_try", "Попробовать бесплатно")} <ArrowRight className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigate("/demo")}
                className="w-full sm:w-auto px-10 py-5 rounded-full text-xl font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" /> {t("land_hero_demo", "Демо")}
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm font-medium">
              {[
                t("land_cta_free", "Бесплатный старт"),
                t("land_cta_nocard", "Без карточки"),
                t("land_cta_cancel", "Отмена в любой момент"),
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#120d36] border-t border-white/5 py-10 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_sticker.webp" alt="ClassPlay" className="w-8 h-8 rounded-lg object-contain opacity-60" />
            <span className="font-bold text-white/40 tracking-tight">ClassPlay</span>
          </div>
          <p className="text-sm text-white/30 font-medium text-center">
            {t("land_foot_desc", "ИИ-платформа для учителей нового поколения.")}
          </p>
          <p className="text-sm text-white/20 font-medium">
            {t("land_copy", "© 2026 ClassPlay. Все права защищены.")}
          </p>
        </div>
      </footer>
    </div>
  );
}
