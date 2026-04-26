import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, Coins, Zap, Sparkles, BookOpen, Users, BarChart3,
  ChevronRight, Play, Shield, BrainCircuit, ArrowRight, Check,
  Menu, X, Globe, LogOut, Settings, User, ChevronDown,
  Gamepad2, CheckCircle2, Rocket, Brain, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const FEATURES_CONFIG = [
  { icon: Sparkles, colorClass: "text-primary", bg: "bg-primary/5 border-primary/10", iconBg: "bg-primary/10", key: 0 },
  { icon: Gamepad2, colorClass: "text-accent", bg: "bg-accent/5 border-accent/10", iconBg: "bg-accent/10", key: 1 },
  { icon: BookOpen, colorClass: "text-secondary", bg: "bg-secondary/10 border-secondary/20", iconBg: "bg-secondary/20", key: 2 },
  { icon: BarChart3, colorClass: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100", key: 3 },
  { icon: Trophy, colorClass: "text-primary", bg: "bg-primary/5 border-primary/10", iconBg: "bg-primary/10", key: 4 },
  { icon: Shield, colorClass: "text-sky-500", bg: "bg-sky-50 border-sky-100", iconBg: "bg-sky-100", key: 5 },
];

const STEPS_CONFIG = [
  { step: "01", icon: Zap, colorClass: "text-secondary", iconBg: "bg-secondary/20", key: 0 },
  { step: "02", icon: Brain, colorClass: "text-primary", iconBg: "bg-primary/10", key: 1 },
  { step: "03", icon: Rocket, colorClass: "text-accent", iconBg: "bg-accent/10", key: 2 },
];

const LEADERBOARD_DEMO = [
  { name: "Kaiser S.", level: 12, xp: 3240, rank: 1 },
  { name: "Salamov A.", level: 11, xp: 2980, rank: 2 },
  { name: "Abdullaev B.", level: 10, xp: 2710, rank: 3 },
  { name: "Ibragimov F.", level: 9, xp: 2490, rank: 4 },
  { name: "Miraliev D.", level: 9, xp: 2301, rank: 5 },
];

const GAMES_NAMES = [
  { name: "Jeopardy", emoji: "🎯" },
  { name: "Memory Matrix", emoji: "🧠" },
  { name: "Word Search", emoji: "🔍" },
  { name: "Tug of War", emoji: "🏆" },
  { name: "Balance Scales", emoji: "⚖️" },
  { name: "Crossword", emoji: "✏️" },
];

const STATS_CONFIG = [
  { icon: Users, key: 0 },
  { icon: Gamepad2, key: 1 },
  { icon: BrainCircuit, key: 2 },
  { icon: Layers, key: 3 },
];

const FAQS_CONFIG = [
  { key: 0 },
  { key: 1 },
  { key: 2 },
  { key: 3 },
  { key: 4 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FEATURES = FEATURES_CONFIG.map(config => ({
    ...config,
    title: t(`land_features_${config.key}_title`),
    desc: t(`land_features_${config.key}_desc`),
  }));

  const STEPS = STEPS_CONFIG.map(config => ({
    ...config,
    title: t(`land_steps_${config.key}_title`),
    desc: t(`land_steps_${config.key}_desc`),
  }));

  const GAMES = GAMES_NAMES.map((game, idx) => ({
    ...game,
    desc: t(`land_games_${idx}_desc`),
    tag: t(`land_games_${idx}_tag`),
  }));

  const STATS = STATS_CONFIG.map(config => ({
    ...config,
    value: t(`land_stats_${config.key}_value`),
    label: t(`land_stats_${config.key}_label`),
  }));

  const FAQS = FAQS_CONFIG.map(config => ({
    q: t(`land_faq_${config.key}_q`),
    a: t(`land_faq_${config.key}_a`),
  }));

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(user ? "/teacher" : "/")}
            className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
          >
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo_sticker.webp" alt="ClassPlay" className="w-full h-full object-contain" fetchPriority="high" />
            </div>
            <span className="text-lg font-bold text-foreground font-serif tracking-tight">ClassPlay</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {["#features", "#how-it-works", "#games", "#pricing"].map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium capitalize"
              >
                {href.replace("#", "").replace("-", " ")}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfile(v => !v)}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center border-none cursor-pointer"
                >
                  <User className="w-4 h-4 text-white" />
                </button>
                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-52 bg-card rounded-2xl border border-border shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="font-bold text-sm text-foreground">{user.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={() => navigate(user.role === "super_admin" ? "/admin" : "/teacher")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <Settings className="w-4 h-4 opacity-50" /> {t("land_dashboard")}
                      </button>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="text-sm rounded-xl" onClick={() => navigate("/demo")}>Демо</Button>
                <Button className="rounded-xl text-sm gap-1.5" onClick={() => navigate("/login")}>
                  Войти <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3">
            {["#features", "#how-it-works", "#games", "#pricing"].map((href) => (
              <a key={href} href={href} className="block text-sm font-medium text-muted-foreground hover:text-foreground capitalize" onClick={() => setMobileOpen(false)}>
                {href.replace("#", "").replace("-", " ")}
              </a>
            ))}
            <div className="pt-2 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl text-sm" onClick={() => navigate("/demo")}>Демо</Button>
              <Button className="flex-1 rounded-xl text-sm" onClick={() => navigate("/login")}>Войти</Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ИИ-платформа для учителей нового поколения
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-foreground font-serif leading-tight tracking-tight mb-6 max-w-4xl mx-auto"
          >
            Уроки,{" "}
            <span className="text-primary relative inline-block">
              которые не забудут
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
                <path d="M2 9 Q100 2 200 9 Q300 16 398 9" stroke="hsl(217 91% 60%)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Создавайте материалы, запускайте игры и вовлекайте учеников — всё в одном месте. Хватит тратить часы на подготовку.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="rounded-2xl px-8 gap-2 text-base" onClick={() => navigate("/login")}>
              Начать бесплатно <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl px-8 gap-2 text-base border-border" onClick={() => navigate("/demo")}>
              <Play className="w-4 h-4 fill-current" /> Смотреть демо
            </Button>
          </motion.div>

          <p className="mt-4 text-xs text-muted-foreground">Без карточки · Бесплатно для 1 класса</p>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-16 bg-card rounded-3xl border border-border shadow-xl p-6 md:p-8 text-left max-w-4xl mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.04]">
              <Trophy className="w-64 h-64 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-2xl font-bold font-serif text-foreground">Добро пожаловать, Алекс 👋</h2>
                <p className="text-muted-foreground text-sm mt-0.5">Продолжайте серию — вы в ударе!</p>
              </div>
              <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 flex items-center gap-2 text-sm font-semibold shrink-0">
                <Coins className="w-4 h-4" /> 480 монет
              </div>
            </div>

            <div className="flex items-center gap-6 mb-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center shrink-0 relative">
                <span className="text-2xl font-black text-primary font-serif">8</span>
                <div className="absolute -bottom-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Ур.
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-primary">1 840 XP</span>
                  <span className="text-muted-foreground">240 XP до Уровня 9</span>
                </div>
                <div className="h-4 rounded-full bg-secondary/20 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: "76%" }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
              {[
                { label: "Дневной XP", value: "320 / 500", icon: Sparkles, color: "text-primary" },
                { label: "Монеты", value: "60 / 100", icon: Coins, color: "text-secondary" },
                { label: "Серия", value: "7 дней 🔥", icon: Zap, color: "text-yellow-500" },
                { label: "Рейтинг", value: "#3 в классе", icon: Trophy, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-2xl border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  <p className="font-black font-serif text-lg text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-2">
              <span className="text-3xl font-black font-serif text-primary">{s.value}</span>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <s.icon className="w-3 h-3" /> {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Star className="w-3.5 h-3.5 fill-current" />
            Возможности
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4 max-w-lg">
            Всё для современного учителя
          </h2>
          <p className="text-muted-foreground max-w-xl">
            От ИИ-генераторов до живых игр — ClassPlay полный комплект для вовлечённого класса.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-3xl border p-6 space-y-4 ${f.bg}`}
            >
              <div className={`w-11 h-11 rounded-2xl ${f.iconBg} flex items-center justify-center`}>
                <f.icon className={`w-5 h-5 ${f.colorClass}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Leaderboard ── */}
      <section className="bg-sidebar py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-sidebar-foreground">
              <div className="inline-flex items-center gap-2 bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Trophy className="w-3.5 h-3.5" />
                Живые лидерборды
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-5 leading-tight">
                Соревнование, которое действительно мотивирует
              </h2>
              <p className="text-sidebar-foreground/70 text-lg leading-relaxed mb-8">
                Ученики постоянно проверяют свой рейтинг. Это любопытство превращается в обучение. Обновления в реальном времени означают, что каждое задание — шанс подняться выше.
              </p>
              <Button className="rounded-2xl px-6 gap-2" onClick={() => navigate("/login")}>
                Попробовать <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-bold font-serif text-foreground">Класс 7Б — Эта неделя</span>
              </div>
              <div className="divide-y divide-border">
                {LEADERBOARD_DEMO.map((item) => (
                  <div key={item.rank} className={`flex items-center gap-4 px-6 py-4 ${item.rank === 1 ? "bg-primary/5" : ""}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${item.rank === 1 ? "bg-yellow-400 text-white" :
                      item.rank === 2 ? "bg-gray-300 text-gray-700" :
                        item.rank === 3 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                      {item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Уровень {item.level}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary">{item.xp.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-amber-700 border border-secondary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Как это работает
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">
            Три шага до результата
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Никаких звонков по онбордингу. Никаких IT-заявок. Создайте аккаунт и начните прямо сегодня.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-3xl border border-border p-8 space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-4 right-6 text-6xl font-black font-serif text-muted/30 leading-none select-none">
                {s.step}
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-6 h-6 ${s.colorClass}`} />
              </div>
              <h3 className="text-xl font-bold font-serif text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Games ── */}
      <section id="games" className="bg-muted/30 border-y border-border py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Gamepad2 className="w-3.5 h-3.5" />
              Игры
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">
              6 игр для живого урока
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Запускайте прямо на проекторе. Ученики играют — учитель управляет.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {GAMES.map((game, i) => (
              <motion.button
                key={game.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate("/login")}
                className="bg-card rounded-3xl border border-border p-5 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer text-center group"
              >
                <span className="text-4xl">{game.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-foreground">{game.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{game.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {game.tag}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="rounded-2xl px-8 gap-2" onClick={() => navigate("/login")}>
              Попробовать все игры <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-amber-700 border border-secondary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Coins className="w-3.5 h-3.5" />
            Тарифы
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">
            Для любого масштаба
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Начните бесплатно. Масштабируйтесь только тогда, когда будете готовы.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {/* Free */}
          <div className="bg-card rounded-3xl border border-border p-8 space-y-6">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Бесплатно</div>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-black font-serif text-foreground">$0</span>
                <span className="text-sm text-muted-foreground pb-2">/ мес</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Попробуйте без риска</p>
            </div>
            <ul className="space-y-3">
              {["10 ИИ-генераций", "Базовые игры", "Поддержка", "1 учитель"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => navigate("/checkout?plan=free")}>
              Начать бесплатно
            </Button>
          </div>

          {/* Pro */}
          <div className="bg-sidebar rounded-3xl border border-sidebar-primary/30 p-8 space-y-6 shadow-2xl scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
            <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Популярный
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-sidebar-primary mb-1">Pro Учитель</div>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-black font-serif text-sidebar-foreground">$15</span>
                <span className="text-sm text-sidebar-foreground/50 pb-2">/ мес</span>
              </div>
              <p className="text-sm text-sidebar-foreground/60 mt-2">Всё без ограничений</p>
            </div>
            <ul className="space-y-3">
              {["Безлимитные генерации", "Все 6 игр", "ИИ-книги", "Аналитика класса", "Приоритетная поддержка"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-sidebar-primary" />
                  </div>
                  <span className="text-sidebar-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full rounded-2xl bg-sidebar-primary hover:bg-sidebar-primary/90" onClick={() => navigate("/checkout?plan=pro")}>
              Начать сейчас
            </Button>
          </div>

          {/* School */}
          <div className="bg-card rounded-3xl border border-border p-8 space-y-6">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Для Школ</div>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-black font-serif text-foreground">$49</span>
                <span className="text-sm text-muted-foreground pb-2">/ мес</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Полное решение для учреждений</p>
            </div>
            <ul className="space-y-3">
              {["Все функции Pro", "До 10 учителей", "Админ-панель", "CSV-импорт", "Договор"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full rounded-2xl border-primary/30 text-primary hover:bg-primary/5" onClick={() => navigate("/checkout?plan=school")}>
              Оформить
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-muted/30 border-y border-border py-24">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-serif text-foreground">Частые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-transparent border-none cursor-pointer text-left"
                >
                  <span className="text-sm font-semibold text-foreground leading-snug">{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === i ? "bg-primary" : "bg-muted"}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? "rotate-180 text-white" : "text-muted-foreground"}`} />
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
                      <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.08]">
            <Trophy className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Users className="w-3.5 h-3.5" />
              Более 12 000 учеников уже используют ClassPlay
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif mb-5 leading-tight">
              Готовы сделать ваш класс<br />лучшей игрой в школе?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Настройте первый геймифицированный класс за несколько минут. Бесплатно для учителей — навсегда.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="rounded-2xl px-10 bg-white text-primary hover:bg-white/90 font-semibold gap-2"
                onClick={() => navigate("/login")}
              >
                Создать бесплатный аккаунт <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-2xl px-10 text-primary-foreground hover:bg-white/10 border border-white/20"
                onClick={() => navigate("/demo")}
              >
                <Play className="w-4 h-4 fill-current" /> Смотреть демо
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              {["Бесплатный старт", "Без карточки", "Отмена в любой момент"].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-primary-foreground/60">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground/40" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo_sticker.webp" alt="ClassPlay" className="w-full h-full object-contain" loading="lazy" />
            </div>
            <span className="font-bold font-serif text-foreground">ClassPlay</span>
          </div>
          <p className="text-sm text-muted-foreground">ИИ-платформа для учителей нового поколения.</p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Конфиденциальность</a>
            <a href="#" className="hover:text-foreground transition-colors">Условия</a>
            <a href="#" className="hover:text-foreground transition-colors">Контакты</a>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="text-center text-xs text-muted-foreground py-4">© {new Date().getFullYear()} ClassPlay. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
