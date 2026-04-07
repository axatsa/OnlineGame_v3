import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, BookOpen, Users, Gamepad2,
  CheckCircle2, Star, Zap, Globe, LogOut, User, Settings, Medal, Crown, Gift
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: "easeOut" as const }
  })
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [navScrolled, setNavScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ru' ? 'uz' : 'ru';
    i18n.changeLanguage(nextLang);
  };

  const features = [
    { icon: Sparkles, title: t("land_f1_title", "ИИ-Генераторы"), desc: t("land_f1_desc"), zone: "emerald" },
    { icon: Gamepad2, title: t("land_f2_title", "Интерактивные Игры"), desc: t("land_f2_desc"), zone: "amber" },
    { icon: BookOpen, title: t("land_f3_title", "Персональные Книги"), desc: t("land_f3_desc"), zone: "sky" },
    { icon: Users, title: t("land_f6_title", "Управление Классами"), desc: t("land_f6_desc"), zone: "fuchsia" },
  ];

  const stats = [
    { value: "6+", label: "Мини-игр" },
    { value: "AI", label: "Генератор" },
    { value: "∞", label: "Материалов" },
    { value: t("land_stat_gen", "10k+"), label: "Создано" },
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
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-slate-600"
          >
            <Globe className="w-4 h-4" />
            {i18n.language === 'ru' ? 'RU' : 'UZ'}
          </button>
          
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
                    <p className="font-semibold text-sm text-slate-900">{(user as any).name || user.email}</p>
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
                className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-black/5 transition-colors hidden sm:block"
              >
                {t("land_hero_demo", "Демо")}
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors shadow-sm"
              >
                {t("land_login", "Войти")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ──────────── ZONE 1: HERO (emerald) ──────────── */}
      <section className="min-h-[90vh] w-full zone-emerald pt-36 px-6 lg:px-24 flex flex-col justify-center relative overflow-hidden">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-5xl z-10 relative"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-10">
            <span className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-emerald-500/20 rounded-full text-sm font-bold text-emerald-800 tracking-wider">
              {t("land_hero_badge", "✨ МАГИЯ ОБУЧЕНИЯ С ПОМОЩЬЮ ИИ")}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-[11vw] sm:text-7xl md:text-9xl font-display font-medium tracking-tighter leading-[0.85] mb-8"
          >
            {t("land_hero_title1", "Революция")}<br />
            <span style={{ color: "var(--zone-emerald-muted)" }}>{t("land_hero_title2", "в Вашем Классе")}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-xl md:text-2xl max-w-2xl leading-relaxed mb-12 font-medium"
            style={{ color: "var(--zone-emerald-muted)" }}
          >
            {t("land_hero_sub", "Хватит тратить часы на подготовку. Создавайте уроки, игры и персонализированные книги за считанные секунды.")}
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-5 rounded-full text-xl font-semibold flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl"
              style={{ background: "var(--zone-emerald-text)", color: "var(--zone-emerald-bg)" }}
            >
              {t("land_hero_cta", "Попробовать бесплатно")} <ArrowRight size={22} />
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="px-8 py-5 rounded-full text-xl font-medium flex items-center gap-3 border-2 hover:bg-black/5 transition-colors bg-white/30 backdrop-blur-sm"
              style={{ borderColor: "var(--zone-emerald-text)", color: "var(--zone-emerald-text)" }}
            >
              <Zap size={20} /> {t("land_hero_demo", "Смотреть демо")}
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
             {t("land_features_title", "Все, что нужно учителю")}
          </h2>
          <p className="text-xl max-w-xl mb-20 font-medium" style={{ color: "var(--zone-amber-muted)" }}>
            {t("land_features_sub", "Одна платформа, бесконечные возможности.")}
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
                  <f.icon className="w-10 h-10 mb-6 opacity-80 group-hover:scale-110 transition-transform origin-left duration-500" />
                  <h3 className="text-3xl md:text-4xl font-display font-medium tracking-tighter leading-tight mb-4">
                    {f.title}
                  </h3>
                  <p className="text-lg leading-relaxed font-medium opacity-80">{f.desc}</p>
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
            {t("land_res_title1", "Увидьте")} {t("land_res_title2", "Результат")}
          </h2>

          <div className="flex flex-col gap-16">
            {[
              { n: "01", title: t("land_res_acc", "Высокая Точность"), desc: t("land_res_acc_desc", "Каждое задание проверяется нашим алгоритмом.") },
              { n: "02", title: t("land_res_print", "Готово к Печати"), desc: t("land_res_print_desc", "Оптимизировано под формат A4.") },
              { n: "03", title: t("land_org_title", "Для Организаций"), desc: t("land_org_desc", "Подходит как для частных репетиторов, так и для целых школ.") },
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
                  <p className="text-xl font-medium opacity-70">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ──────────── ZONE 5: PRICING PLANS ──────────── */}
      {/* We use a neutral/slate look with hints of color to make plans pop */}
      <section className="bg-slate-50 py-32 px-6 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tighter text-slate-900 mb-6">
              {t("land_price_title", "Тарифы для любого масштаба")}
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              {t("land_price_sub", "От индивидуальных занятий до государственных учреждений. Выберите лучший план для вас.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1: Free */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl shadow-slate-200/50 flex flex-col hover:-translate-y-2 transition-transform duration-300">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                  <Gift className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-3xl font-display font-semibold text-slate-900 mb-2">{t("land_p1_title", "Бесплатно")}</h3>
                <p className="text-slate-500 mb-8 font-medium">Креативность без ограничений, базовые инструменты всегда под рукой.</p>
                
                <h4 className="text-5xl font-display font-semibold text-slate-900 mb-8">$0<span className="text-xl text-slate-400 font-normal"> / мес</span></h4>
                
                <ul className="space-y-4 mb-8">
                  {[
                    t("land_p1_f1", "10 ИИ-генераций в месяц"),
                    t("land_p1_f2", "Базовый доступ к играм"),
                    t("land_p1_f3", "Поддержка сообщества"),
                    t("land_p1_f4", "1 место учителя")
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-slate-600 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-slate-800 hover:text-slate-900 transition-colors"
              >
                {t("land_start", "Начать сейчас")}
              </button>
            </div>

            {/* Plan 2: Pro Teacher */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/40 relative flex flex-col hover:-translate-y-2 transition-transform duration-300 scale-100 md:scale-105 z-10">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-fuchsia-500 via-emerald-500 to-sky-500 rounded-t-[2.5rem]" />
              <div className="flex-1 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Medal className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-3xl font-display font-semibold mb-2">{t("land_p2_title", "Pro Учитель")}</h3>
                <p className="text-slate-400 mb-8 font-medium">Бесконечные генерации и продвинутые инструменты для современного учителя.</p>
                
                <h4 className="text-5xl font-display font-semibold mb-8">$15<span className="text-xl text-slate-500 font-normal"> / мес</span></h4>
                
                <ul className="space-y-4 mb-8">
                  {[
                    t("land_p2_f1", "Безлимитные генерации"),
                    t("land_p2_f2", "Полная библиотека игр"),
                    t("land_p2_f3", "Создание ИИ-книг"),
                    t("land_p2_f4", "Продвинутая аналитика класса"),
                    t("land_p2_f5", "Приоритетная поддержка")
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-200 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 text-slate-900 font-bold hover:opacity-90 transition-opacity"
              >
                {t("land_start", "Начать сейчас")}
              </button>
            </div>

            {/* Plan 3: For Schools */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl shadow-slate-200/50 flex flex-col hover:-translate-y-2 transition-transform duration-300">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center mb-6">
                  <Crown className="w-6 h-6 text-fuchsia-600" />
                </div>
                <h3 className="text-3xl font-display font-semibold text-slate-900 mb-2">{t("land_p3_title", "Для Школ")}</h3>
                <p className="text-slate-500 mb-8 font-medium">Решение для всего образовательного учреждения с администрированием.</p>
                
                <h4 className="text-5xl font-display font-semibold text-slate-900 mb-8">{t("land_p3_price", "$49")}<span className="text-xl text-slate-400 font-normal"> / мес</span></h4>
                
                <ul className="space-y-4 mb-8">
                  {[
                    t("land_p3_f1", "Все функции Pro-плана"),
                    t("land_p3_f2", "До 10 мест для учителей"),
                    t("land_p3_f3", "Панель администратора"),
                    t("land_p3_f4", "Массовый импорт классов"),
                    t("land_p3_f6", "Работа по договору")
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-fuchsia-500" />
                      <span className="text-slate-600 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 rounded-xl border-2 border-fuchsia-200 text-fuchsia-700 font-bold hover:border-fuchsia-600 transition-colors"
              >
                {t("land_cta_btn", "Связаться с нами")}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ──────────── ZONE 6: CTA (fuchsia) ──────────── */}
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
            <span className="text-sm font-semibold uppercase tracking-widest opacity-80">{t("land_start", "Начать сейчас")}</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-display font-medium tracking-tighter leading-[0.9] mb-12">
             Готовы изменить<br />ваши уроки?
          </h2>
          <div className="flex flex-wrap gap-6 mb-16">
            {["ИИ-Генератор", "Интерактив", "Аналитика", "Безлимит"].map(item => (
              <div key={item} className="flex items-center gap-2 text-xl font-medium">
                <CheckCircle2 className="w-6 h-6" style={{ color: "var(--zone-fuchsia-muted)" }} />
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
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Globe className="w-4 h-4" />
            <span>{t("land_foot_desc", "Самая мощная в мире ИИ-платформа, созданная специально для современного образования.")}</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">{t("land_copy", "© 2026 ClassPlay Inc. Все права защищены.")}</p>
        </div>
      </footer>
    </div>
  );
}

