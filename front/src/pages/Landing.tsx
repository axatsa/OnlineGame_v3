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

const DARK = "#07101F";
const BLUE = "#0EA5E9";
const ORANGE = "#FF5722";
const CYAN = "#06D6A0";
const YELLOW = "#FBBF24";
const CORAL = "#FF3D68";
const LIGHT = "#EFF8FF";
const INK = "#0C1828";

const testimGradients = [
  "linear-gradient(135deg, #60A5FA, #818CF8)",
  "linear-gradient(135deg, #A78BFA, #EC4899)",
  "linear-gradient(135deg, #FBBF24, #F97316)",
  "linear-gradient(135deg, #34D399, #06B6D4)",
];

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

  useEffect(() => {
    const id = "classplay-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ru" ? "uz" : "ru");
  };

  const features = [
    {
      icon: Sparkles,
      title: t("land_f1_title", "ИИ-Генераторы"),
      desc: t("land_f1_desc", "Создавайте тесты, карточки и задания за секунды"),
      color: CYAN,
      bg: "rgba(34,211,238,0.1)",
      num: "01",
    },
    {
      icon: Gamepad2,
      title: t("land_f2_title", "Интерактивные Игры"),
      desc: t("land_f2_desc", "6 игр для живого урока — Jeopardy, Memory, Word Search и другие"),
      color: BLUE,
      bg: "rgba(14,165,233,0.1)",
      num: "02",
    },
    {
      icon: BookOpen,
      title: t("land_f3_title", "Персональные Книги"),
      desc: t("land_f3_desc", "ИИ пишет книгу с именем ученика как главным героем"),
      color: YELLOW,
      bg: "rgba(250,204,21,0.1)",
      num: "03",
    },
    {
      icon: Users,
      title: t("land_f6_title", "Управление Классами"),
      desc: t("land_f6_desc", "Ведите несколько групп, отслеживайте прогресс и активность"),
      color: CORAL,
      bg: "rgba(255,61,104,0.1)",
      num: "04",
    },
  ];

  const stats = [
    { value: "6+", label: t("land_stat_games", "Мини-игр"), icon: Gamepad2, color: CYAN },
    { value: "10k+", label: t("land_stat_gen", "Создано материалов"), icon: Sparkles, color: YELLOW },
    { value: "AI", label: t("land_stat_ai", "Умный генератор"), icon: Brain, color: CORAL },
    { value: "∞", label: t("land_stat_content", "Контента"), icon: Layers, color: ORANGE },
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
    { name: t("testim_1_name"), role: t("testim_1_role"), school: t("testim_1_school"), text: t("testim_1_text") },
    { name: t("testim_2_name"), role: t("testim_2_role"), school: t("testim_2_school"), text: t("testim_2_text") },
    { name: t("testim_3_name"), role: t("testim_3_role"), school: t("testim_3_school"), text: t("testim_3_text") },
    { name: t("testim_4_name"), role: t("testim_4_role"), school: t("testim_4_school"), text: t("testim_4_text") },
  ];

  const gameCards = [
    { name: "Jeopardy", emoji: "🎯" },
    { name: "Memory", emoji: "🧠" },
    { name: "Word Search", emoji: "🔍" },
    { name: "Tug of War", emoji: "🏆" },
  ];

  const games = [
    { name: "Jeopardy", emoji: "🎯", desc: t("land_game_jeopardy", "Командные вопросы"), tag: "TEAM", grad: "linear-gradient(135deg, #2563EB, #7C3AED)" },
    { name: "Memory Matrix", emoji: "🧠", desc: t("land_game_memory", "Тренировка памяти"), tag: "SOLO", grad: "linear-gradient(135deg, #7C3AED, #EC4899)" },
    { name: "Word Search", emoji: "🔍", desc: t("land_game_wordsearch", "Поиск слов"), tag: "SOLO", grad: "linear-gradient(135deg, #059669, #22D3EE)" },
    { name: "Tug of War", emoji: "🏆", desc: t("land_game_tug", "Командная битва"), tag: "TEAM", grad: "linear-gradient(135deg, #F97316, #FACC15)" },
    { name: "Balance Scales", emoji: "⚖️", desc: t("land_game_scales", "Математика"), tag: "SOLO", grad: "linear-gradient(135deg, #06B6D4, #3B82F6)" },
    { name: "Crossword", emoji: "✏️", desc: t("land_game_crossword", "Кроссворды"), tag: "SOLO", grad: "linear-gradient(135deg, #EC4899, #F97316)" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: INK }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          padding: navScrolled ? "12px clamp(16px, 5vw, 48px)" : "20px clamp(16px, 5vw, 48px)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "all 0.3s",
          background: navScrolled ? "rgba(255,255,255,0.96)" : "transparent",
          backdropFilter: navScrolled ? "blur(12px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <img src="/logo_sticker.webp" alt="ClassPlay" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
          <span style={{
            fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
            fontFamily: "'Syne', sans-serif",
            color: navScrolled ? INK : "#fff",
          }}>ClassPlay</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggleLanguage}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 100,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: navScrolled ? "#777" : "rgba(255,255,255,0.65)",
              background: "none", border: "none",
            }}
          >
            <Globe size={14} />
            {i18n.language === "ru" ? "RU" : "UZ"}
          </button>

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfile(v => !v)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: "pointer",
                  boxShadow: `0 4px 12px rgba(14,165,233,0.4)`,
                }}
              >
                <User size={14} color="#fff" />
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    style={{
                      position: "absolute", right: 0, top: 48,
                      width: 216, background: "#fff", borderRadius: 16,
                      boxShadow: "0 24px 60px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.06)",
                      padding: 8,
                    }}
                  >
                    <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: INK }}>{user.full_name || user.email}</p>
                      <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{user.email}</p>
                    </div>
                    <button
                      onClick={() => navigate(user.role === "super_admin" ? "/admin" : "/teacher")}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, fontSize: 14, color: "#444", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Settings size={14} style={{ opacity: 0.4 }} /> {t("land_dashboard")}
                    </button>
                    <button
                      onClick={logout}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, fontSize: 14, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <LogOut size={14} /> {t("logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/demo")}
                style={{
                  padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  color: navScrolled ? "#666" : "rgba(255,255,255,0.75)",
                  background: "transparent", border: "none", cursor: "pointer",
                }}
                className="hidden sm:block"
              >
                {t("land_hero_demo", "Демо")}
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "9px 22px", borderRadius: 100, fontSize: 13, fontWeight: 700,
                  background: navScrolled ? `linear-gradient(135deg, ${BLUE}, ${CORAL})` : "#fff",
                  color: navScrolled ? "#fff" : INK,
                  border: "none", cursor: "pointer",
                  boxShadow: navScrolled ? `0 4px 16px rgba(14,165,233,0.35)` : "0 2px 12px rgba(0,0,0,0.2)",
                  transition: "all 0.2s",
                }}
              >
                {t("land_login", "Войти")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: DARK, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

        {/* Glow blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "55%", height: "60%", background: `radial-gradient(circle, ${BLUE}40 0%, transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "45%", height: "55%", background: `radial-gradient(circle, ${CORAL}30 0%, transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "35%", right: "20%", width: "30%", height: "35%", background: `radial-gradient(circle, ${CYAN}20 0%, transparent 70%)`, borderRadius: "50%" }} />
        </div>

        {/* Dot grid overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Floating game cards */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} className="hidden lg:block">
          {gameCards.map((card, i) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.9, y: [0, -12, 0] }}
              transition={{
                opacity: { delay: 0.7 + i * 0.15, duration: 0.5 },
                y: { delay: i * 0.4, duration: 3.5 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
              }}
              style={{
                position: "absolute",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "16px 18px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                width: 94,
                ...(i === 0 ? { top: "22%", right: "9%" } : {}),
                ...(i === 1 ? { top: "56%", right: "5%" } : {}),
                ...(i === 2 ? { top: "25%", left: "5%" } : {}),
                ...(i === 3 ? { top: "60%", left: "8%" } : {}),
              }}
            >
              <span style={{ fontSize: 28 }}>{card.emoji}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{card.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Hero content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "110px clamp(16px, 5vw, 48px) 56px",
          position: "relative", zIndex: 10,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 18px", borderRadius: 100,
              background: `rgba(14,165,233,0.2)`,
              border: `1px solid rgba(14,165,233,0.45)`,
              color: "#C4B5FD", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 32,
            }}
          >
            <Sparkles size={12} />
            {t("land_hero_badge", "ИИ-платформа для учителей")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(48px, 9vw, 96px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textAlign: "center",
              marginBottom: 28,
              maxWidth: 900,
            }}
          >
            {t("land_hero_title1", "Уроки,")}{" "}
            <span style={{
              background: `linear-gradient(135deg, ${CYAN}, ${BLUE}, ${CORAL})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t("land_hero_title2", "которые не забудут")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(255,255,255,0.5)",
              maxWidth: 520, textAlign: "center", lineHeight: 1.7,
              marginBottom: 44, fontWeight: 400,
            }}
          >
            {t("land_hero_sub", "Создавайте материалы, запускайте игры и вовлекайте учеников — всё в одном месте. Хватит тратить часы на подготовку.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
          >
            <motion.button
              onClick={() => navigate("/login")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "15px 34px", borderRadius: 100,
                background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                color: "#fff", fontSize: 15, fontWeight: 700,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: `0 8px 32px rgba(14,165,233,0.5)`,
              }}
            >
              {t("land_hero_cta", "Начать бесплатно")} <ArrowRight size={16} />
            </motion.button>
            <motion.button
              onClick={() => navigate("/demo")}
              whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.15)" }}
              style={{
                padding: "15px 34px", borderRadius: 100,
                background: "rgba(255,255,255,0.08)", color: "#fff",
                fontSize: 15, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                backdropFilter: "blur(8px)",
              }}
            >
              <Play size={14} style={{ fill: "currentColor" }} /> {t("land_hero_demo", "Смотреть демо")}
            </motion.button>
          </motion.div>
        </div>

        {/* Stats strip */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "28px clamp(16px, 5vw, 48px)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          position: "relative", zIndex: 10,
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 800,
                letterSpacing: "-0.03em", color: s.color,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={20} color="rgba(255,255,255,0.2)" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: "#fff", padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 56 }}
          >
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: 100,
              background: `rgba(14,165,233,0.1)`, color: BLUE,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              border: `1px solid rgba(14,165,233,0.2)`,
            }}>
              {t("land_features_badge", "Возможности")}
            </span>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800,
              color: INK, lineHeight: 1.1, letterSpacing: "-0.03em",
              maxWidth: 560,
            }}>
              {t("land_features_title", "Всё для современного учителя")}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -5, boxShadow: `0 20px 48px rgba(0,0,0,0.1)` }}
                style={{
                  background: LIGHT,
                  borderRadius: 20,
                  padding: 28,
                  borderTop: `3px solid ${f.color}`,
                  position: "relative",
                  transition: "box-shadow 0.2s",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", top: 16, right: 20,
                  fontSize: 56, fontWeight: 900, color: f.color, opacity: 0.07,
                  fontFamily: "'Syne', sans-serif", lineHeight: 1, userSelect: "none",
                }}>{f.num}</div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: f.bg, border: `1px solid ${f.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: DARK, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: 100,
              background: `rgba(250,204,21,0.12)`, color: YELLOW,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              border: `1px solid rgba(250,204,21,0.25)`,
            }}>
              {t("land_hiw_badge", "Как это работает")}
            </span>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800,
              color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em",
            }}>
              {t("land_res_title1", "Три шага")}{" "}
              <span style={{ color: CYAN }}>{t("land_res_title2", "до результата")}</span>
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { n: "01", icon: Zap, title: t("land_hiw_1_title", "Выберите инструмент"), desc: t("land_res_acc_desc", "Генератор, игра или библиотека — всё доступно сразу после входа."), color: CYAN },
              { n: "02", icon: Brain, title: t("land_hiw_2_title", "ИИ создаёт за вас"), desc: t("land_res_print_desc", "Введите тему — ИИ напишет задания, вопросы или целую книгу за секунды."), color: BLUE },
              { n: "03", icon: Rocket, title: t("land_hiw_3_title", "Запустите на уроке"), desc: t("land_org_desc", "Распечатайте или откройте прямо на проекторе. Игры запускаются в один клик."), color: ORANGE },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 24,
                  padding: "40px 32px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", top: 12, right: 20,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 72, fontWeight: 800, color: step.color, opacity: 0.08,
                  lineHeight: 1, userSelect: "none",
                }}>{step.n}</div>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <step.icon size={26} color={step.color} />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES SHOWCASE ── */}
      <section style={{ background: "#fff", padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: 100,
              background: `rgba(249,115,22,0.1)`, color: ORANGE,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              border: `1px solid rgba(249,115,22,0.25)`,
            }}>
              {t("land_games_badge", "Игры")}
            </span>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800,
              color: INK, lineHeight: 1.1, letterSpacing: "-0.03em",
              marginBottom: 12,
            }}>
              {t("land_games_title", "6 игр для живого урока")}
            </h2>
            <p style={{ fontSize: 16, color: "#888", maxWidth: 480, margin: "0 auto" }}>
              {t("land_games_sub", "Запускайте прямо на проекторе. Ученики играют — учитель управляет.")}
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 16, marginBottom: 40 }}>
            {games.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                onClick={() => navigate("/login")}
                whileHover={{ y: -6, boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }}
                style={{
                  background: game.grad,
                  borderRadius: 20,
                  padding: "28px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 12, textAlign: "center",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", inset: 0, opacity: 0.06,
                  background: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='white'/%3E%3C/svg%3E\")",
                }} />
                <span style={{ fontSize: 38, position: "relative", zIndex: 1 }}>{game.emoji}</span>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{game.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{game.desc}</div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 100,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  position: "relative", zIndex: 1,
                }}>
                  {game.tag}
                </span>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              onClick={() => navigate("/login")}
              whileHover={{ scale: 1.04 }}
              style={{
                padding: "14px 36px", borderRadius: 100,
                background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                color: "#fff", fontSize: 15, fontWeight: 700,
                border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: `0 8px 32px rgba(14,165,233,0.35)`,
              }}
            >
              {t("land_games_cta", "Попробовать все игры")} <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ background: LIGHT, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: 100,
              background: `rgba(250,204,21,0.15)`, color: "#A16207",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              border: `1px solid rgba(250,204,21,0.3)`,
            }}>
              {t("land_price_badge", "Тарифы")}
            </span>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800,
              color: INK, lineHeight: 1.1, letterSpacing: "-0.03em",
            }}>
              {t("land_price_title", "Для любого масштаба")}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "center" }}>
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: INK, marginBottom: 4 }}>{t("land_p1_title", "Бесплатно")}</h3>
              <p style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>{t("land_p1_sub", "Попробуйте без риска")}</p>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: INK, marginBottom: 24 }}>
                $0<span style={{ fontSize: 16, fontWeight: 500, color: "#bbb" }}> / мес</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[t("land_p1_f1", "10 ИИ-генераций"), t("land_p1_f2", "Базовые игры"), t("land_p1_f3", "Поддержка"), t("land_p1_f4", "1 учитель")].map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555" }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/checkout?plan=free")} style={{ width: "100%", padding: 14, borderRadius: 14, border: "2px solid rgba(0,0,0,0.12)", background: "transparent", color: INK, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {t("land_start", "Начать бесплатно")}
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                background: `linear-gradient(160deg, #1E0A3C, #2D1060)`,
                borderRadius: 24, padding: 32,
                position: "relative", overflow: "hidden",
                transform: "scale(1.04)",
                boxShadow: `0 32px 80px rgba(14,165,233,0.4)`,
                border: `1px solid rgba(14,165,233,0.3)`,
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${CYAN}, ${BLUE}, ${CORAL})` }} />
              <div style={{ position: "absolute", top: 18, right: 20 }}>
                <span style={{ background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`, color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 100, letterSpacing: "0.08em", textTransform: "uppercase" }}>Popular</span>
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{t("land_p2_title", "Pro Учитель")}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t("land_p2_sub", "Всё без ограничений")}</p>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: "#fff", marginBottom: 24 }}>
                $15<span style={{ fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}> / мес</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[t("land_p2_f1", "Безлимитные генерации"), t("land_p2_f2", "Все 6 игр"), t("land_p2_f3", "ИИ-книги"), t("land_p2_f4", "Аналитика класса"), t("land_p2_f5", "Приоритетная поддержка")].map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                    <CheckCircle2 size={16} color={CYAN} style={{ flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/checkout?plan=pro")} style={{ width: "100%", padding: 14, borderRadius: 14, background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", border: "none", boxShadow: `0 8px 24px rgba(14,165,233,0.45)` }}>
                {t("land_start", "Начать сейчас")}
              </button>
            </motion.div>

            {/* Schools */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: INK, marginBottom: 4 }}>{t("land_p3_title", "Для Школ")}</h3>
              <p style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>{t("land_p3_sub", "Полное решение для учреждений")}</p>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: INK, marginBottom: 24 }}>
                {t("land_p3_price", "$49")}<span style={{ fontSize: 16, fontWeight: 500, color: "#bbb" }}> / мес</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[t("land_p3_f1", "Все функции Pro"), t("land_p3_f2", "До 10 учителей"), t("land_p3_f3", "Админ-панель"), t("land_p3_f4", "CSV-импорт"), t("land_p3_f6", "Договор")].map((f, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555" }}>
                    <CheckCircle2 size={16} color={ORANGE} style={{ flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/checkout?plan=school")} style={{ width: "100%", padding: 14, borderRadius: 14, border: `2px solid rgba(14,165,233,0.25)`, background: "transparent", color: BLUE, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {t("land_cta_btn", "Оформить")}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: "#fff", padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: 100,
              background: "rgba(16,185,129,0.1)", color: "#059669",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              border: "1px solid rgba(16,185,129,0.2)",
            }}>
              {t("land_testimonials_badge", "Отзывы")}
            </span>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800,
              color: INK, lineHeight: 1.1, letterSpacing: "-0.03em",
            }}>
              {t("land_testimonials_title", "Что говорят учителя")}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {testimonials.map((tm, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: LIGHT, borderRadius: 20, padding: 28,
                  border: "1px solid rgba(14,165,233,0.08)",
                }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} style={{ fill: YELLOW, color: YELLOW }} />
                  ))}
                </div>
                <p style={{ color: "#444", lineHeight: 1.75, marginBottom: 20, fontSize: 14, fontStyle: "italic" }}>"{tm.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: testimGradients[i % 4],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "#fff", fontSize: 15, flexShrink: 0,
                  }}>
                    {tm.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: INK, fontSize: 14 }}>{tm.name}</p>
                    <p style={{ fontSize: 12, color: "#999" }}>{tm.role} · {tm.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: LIGHT, padding: "clamp(56px, 8vw, 96px) clamp(16px, 5vw, 48px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800,
              color: INK, lineHeight: 1.1, letterSpacing: "-0.03em",
            }}>
              {t("land_faq_title", "Частые вопросы")}
            </h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", padding: "18px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.4 }}>{faq.q}</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: openFaq === i ? `linear-gradient(135deg, ${BLUE}, ${CORAL})` : "rgba(0,0,0,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}>
                    <ChevronDown size={14} color={openFaq === i ? "#fff" : "#666"} style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 24px 20px", paddingTop: 16, fontSize: 14, color: "#666", lineHeight: 1.7, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
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
      <section style={{ background: DARK, padding: "clamp(72px, 10vw, 112px) clamp(16px, 5vw, 48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "50%", height: "80%", background: `radial-gradient(circle, ${BLUE}35 0%, transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-15%", left: "-5%", width: "40%", height: "60%", background: `radial-gradient(circle, ${CYAN}20 0%, transparent 70%)`, borderRadius: "50%" }} />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 800,
              color: "#fff", lineHeight: 0.95, letterSpacing: "-0.03em",
              marginBottom: 24,
            }}>
              {t("land_ready_to_change", "Готовы изменить свой урок?")}
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto 44px" }}>
              {t("land_cta_sub", "Тысячи учителей уже используют ClassPlay каждый день.")}
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "16px 40px", borderRadius: 100,
                  background: `linear-gradient(135deg, ${BLUE}, ${CORAL})`,
                  color: "#fff", fontSize: 16, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: `0 12px 40px rgba(14,165,233,0.5)`,
                }}
              >
                {t("land_cta_try", "Попробовать бесплатно")} <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => navigate("/demo")}
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.15)" }}
                style={{
                  padding: "16px 40px", borderRadius: 100,
                  background: "rgba(255,255,255,0.08)", color: "#fff",
                  fontSize: 16, fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <Play size={15} style={{ fill: "currentColor" }} /> {t("land_hero_demo", "Демо")}
              </motion.button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
              {[t("land_cta_free", "Бесплатный старт"), t("land_cta_nocard", "Без карточки"), t("land_cta_cancel", "Отмена в любой момент")].map((item, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                  <CheckCircle2 size={14} color="#10B981" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#080514", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px clamp(16px, 5vw, 48px)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo_sticker.webp" alt="ClassPlay" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain", opacity: 0.45 }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "rgba(255,255,255,0.3)", fontSize: 15 }}>ClassPlay</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
            {t("land_foot_desc", "ИИ-платформа для учителей нового поколения.")}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.15)" }}>
            {t("land_copy", "© 2026 ClassPlay. Все права защищены.")}
          </p>
        </div>
      </footer>
    </div>
  );
}
