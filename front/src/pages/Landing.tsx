import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, BookOpen, Users, Gamepad2,
  CheckCircle2, Star, Zap, Globe, LogOut, User, Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" }
  })
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navScrolled, setNavScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: Sparkles, title: "AI Генератор", desc: "Создавайте контент для уроков за секунды с помощью искусственного интеллекта", zone: "emerald" },
    { icon: Gamepad2, title: "Мини-игры", desc: "6 интерактивных игр для вовлечения студентов: Jeopardy, Memory, Crossword и другие", zone: "amber" },
    { icon: BookOpen, title: "Библиотека", desc: "Храните и управляйте всеми созданными материалами в одном месте", zone: "sky" },
    { icon: Users, title: "Классы", desc: "Управляйте несколькими классами и отслеживайте прогресс каждого студента", zone: "fuchsia" },
  ];

  const stats = [
    { value: "6+", label: "Мини-игр" },
    { value: "AI", label: "Генератор" },
    { value: "∞", label: "Материалов" },
    { value: "100%", label: "Бесплатно" },
  ];

  return (
    <div className="min-h-screen font-sans antialiased w-full">
      {/* ──────────── NAVBAR ──────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 flex justify-between items-center transition-all duration-300 ${
        navScrolled ? "bg-white/80 backdrop-blur-xl shadow-sm py-3" : "bg-transparent py-5"
      }`}>
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <img
            src="/logo_sticker.webp"
            alt="ClassPlay"
            className="w-10 h-10 rounded-xl object-contain group-hover:scale-110 transition-transform duration-200"
          />
          <span className="text-xl font-display font-bold tracking-tight text-slate-900">ClassPlay</span>
        </button>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfile(v => !v)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <User className="w-5 h-5 text-white" />
              </button>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 flex flex-col gap-1"
                >
                  <div className="px-4 py-3 border-b border-black/5">
                    <p className="font-semibold text-sm text-slate-900">{user.name || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <button onClick={() => navigate("/teacher")} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-sm text-slate-700 transition-colors">
                    <Settings className="w-4 h-4 opacity-50" /> Дашборд
                  </button>
                  <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-xl text-sm text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" /> Выйти
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/demo")}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-black/5 transition-colors"
              >
                Демо
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors shadow-sm"
              >
                Войти
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ──────────── ZONE 1: HERO (emerald) ──────────── */}
      <section className="min-h-[90vh] w-full zone-emerald pt-36 px-6 lg:px-24 flex flex-col justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-5xl"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-10">
            <img src="/logo_sticker.webp" alt="ClassPlay" className="w-16 h-16 rounded-2xl object-contain" />
            <span className="text-sm font-semibold uppercase tracking-widest opacity-60">ClassPlay</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-[13vw] sm:text-7xl md:text-9xl font-display font-medium tracking-tighter leading-[0.85] mb-8"
          >
            Обучение,<br />
            <span style={{ color: "var(--zone-emerald-muted)" }}>которое работает.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-xl md:text-2xl max-w-2xl leading-relaxed mb-12"
            style={{ color: "var(--zone-emerald-muted)" }}
          >
            AI-платформа для учителей: генерируйте материалы, запускайте игры и управляйте классами — всё в одном месте.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-5 rounded-full text-xl font-semibold flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl"
              style={{ background: "var(--zone-emerald-text)", color: "var(--zone-emerald-bg)" }}
            >
              Начать бесплатно <ArrowRight size={22} />
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="px-8 py-5 rounded-full text-xl font-medium flex items-center gap-3 border-2 hover:bg-black/5 transition-colors"
              style={{ borderColor: "var(--zone-emerald-text)", color: "var(--zone-emerald-text)" }}
            >
              <Zap size={20} /> Попробовать демо
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ──────────── ZONE 2: STATS (stone) ──────────── */}
      <section className="zone-stone py-20 px-6 lg:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center md:items-start gap-2"
            >
              <span className="text-5xl md:text-7xl font-display font-medium tracking-tighter">{s.value}</span>
              <span className="text-sm font-medium uppercase tracking-widest opacity-50">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──────────── ZONE 3: FEATURES (amber) ──────────── */}
      <section className="zone-amber py-32 px-6 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl"
        >
          <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tighter mb-6">
            Всё что нужно
          </h2>
          <p className="text-xl max-w-xl mb-20" style={{ color: "var(--zone-amber-muted)" }}>
            Один инструмент, чтобы планировать, создавать и проводить уроки.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col group cursor-pointer"
              >
                <div className={`border-l-4 pl-8 transition-colors duration-300 group-hover:border-current border-current/20`}>
                  <f.icon className="w-10 h-10 mb-6 opacity-70 group-hover:scale-110 transition-transform origin-left duration-500" />
                  <h3 className="text-3xl md:text-4xl font-display font-medium tracking-tighter leading-tight mb-4">
                    {f.title}
                  </h3>
                  <p className="text-lg leading-relaxed opacity-70">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ──────────── ZONE 4: HOW IT WORKS (sky) ──────────── */}
      <section className="zone-sky py-32 px-6 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl"
        >
          <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tighter mb-20">
            Как это работает
          </h2>

          <div className="flex flex-col gap-16">
            {[
              { n: "01", title: "Создайте класс", desc: "Добавьте класс, пригласите студентов. Всё хранится в вашем аккаунте." },
              { n: "02", title: "Сгенерируйте материал", desc: "Опишите тему — AI создаст задания, викторины и игры за секунды." },
              { n: "03", title: "Запустите урок", desc: "Используйте интерактивные игры прямо на уроке для максимального вовлечения." },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col md:flex-row gap-8 md:gap-16 group cursor-pointer"
              >
                <span className="text-5xl md:text-7xl font-display font-medium tracking-tighter opacity-25 group-hover:opacity-100 transition-opacity">
                  {step.n}
                </span>
                <div className="flex-1 group-hover:translate-x-2 transition-transform duration-300">
                  <h3 className="text-3xl md:text-5xl font-display font-medium tracking-tighter mb-4">{step.title}</h3>
                  <p className="text-xl opacity-60">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ──────────── ZONE 5: CTA (fuchsia) ──────────── */}
      <section className="zone-fuchsia py-40 px-6 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-8 h-8" style={{ color: "var(--zone-fuchsia-muted)" }} />
            <span className="text-sm font-semibold uppercase tracking-widest opacity-60">Начать сейчас</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-display font-medium tracking-tighter leading-[0.9] mb-12">
            Готовы изменить<br />ваши уроки?
          </h2>
          <div className="flex flex-wrap gap-6 mb-16">
            {["AI генератор", "6 игр", "Управление классами", "Бесплатно"].map(item => (
              <div key={item} className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--zone-fuchsia-muted)" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-6 rounded-full text-2xl font-display font-semibold flex items-center gap-4 hover:scale-105 transition-transform shadow-2xl"
            style={{ background: "var(--zone-fuchsia-text)", color: "var(--zone-fuchsia-bg)" }}
          >
            Попробовать ClassPlay <ArrowRight size={26} />
          </button>
        </motion.div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="zone-stone border-t border-black/5 py-12 px-6 lg:px-24">
        <div className="max-w-5xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_sticker.webp" alt="ClassPlay" className="w-8 h-8 rounded-lg object-contain opacity-70" />
            <span className="font-display font-bold text-slate-500 tracking-tight">ClassPlay</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Globe className="w-4 h-4" />
            <span>Создано для учителей</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 ClassPlay. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
