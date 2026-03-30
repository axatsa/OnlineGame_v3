import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  Sparkles, 
  Gamepad2, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  Layout,
  Layers,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/40 shadow-xl hover:shadow-2xl transition-all"
  >
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
      <Icon className="w-7 h-7 text-primary" />
    </div>
    <h3 className="text-2xl font-bold mb-4 font-serif">{title}</h3>
    <p className="text-muted-foreground leading-relaxed font-sans">{desc}</p>
  </motion.div>
);

const PriceCard = ({ title, price, features, highlighted = false, delay = 0 }: { title: string, price: string, features: string[], highlighted?: boolean, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`p-8 rounded-[2rem] flex flex-col h-full transition-all duration-300 ${
      highlighted 
        ? "bg-primary text-primary-foreground shadow-2xl scale-105 border-4 border-primary/20" 
        : "bg-white/60 backdrop-blur-lg border border-white/20 shadow-xl"
    }`}
  >
    <div className="mb-8">
      <h3 className="text-2xl font-black mb-2 uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black">{price}</span>
        {price !== "Индивидуально" && price !== "$0" && <span className={highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}>/мес</span>}
      </div>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlighted ? "text-white" : "text-primary"}`} />
          <span className="text-sm font-medium leading-tight">{f}</span>
        </li>
      ))}
    </ul>
    <Button 
      variant={highlighted ? "secondary" : "default"} 
      className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-transform active:scale-95 ${
        highlighted ? "bg-white text-primary hover:bg-white/90" : ""
      }`}
    >
      Начать сейчас
    </Button>
  </motion.div>
);

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-red-50/30 to-slate-100 font-sans text-slate-900 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-white/20 z-50 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight font-serif text-slate-800">ClassPlay</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">Функции</a>
            <a href="#preview" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">Предпросмотр</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">Цены</a>
          </nav>

          <Button 
            onClick={() => navigate("/login")}
            variant="default"
            className="rounded-xl px-8 h-10 font-bold shadow-md hover:shadow-xl transition-all"
          >
            Войти
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-44 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-2 px-6 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 border border-primary/20 backdrop-blur-sm">
              ✨ МАГИЯ ОБУЧЕНИЯ С ПОМОЩЬЮ ИИ
            </span>
            <h1 className="text-6xl md:text-8xl font-black font-serif tracking-tight leading-[1.05] text-slate-900">
              Революция <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-600 to-rose-500">в Вашем Классе</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-500 mt-8 leading-relaxed font-sans">
              Хватит тратить часы на подготовку. Создавайте уроки, игры и персонализированные книги за считанные секунды.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10"
          >
            <Button size="lg" className="h-16 px-12 text-xl font-bold rounded-2xl shadow-[0_20px_50px_rgba(153,27,27,0.3)] hover:scale-105 transition-transform">
              Попробовать бесплатно <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <button className="h-16 px-12 text-lg font-bold text-slate-600 hover:text-primary transition-colors">
              Смотреть демо
            </button>
          </motion.div>
        </div>

        {/* Floating preview element */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-24 max-w-6xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
          <div className="relative rounded-[2.5rem] border-8 border-white/60 overflow-hidden shadow-2xl backdrop-blur-sm">
            <img 
              src="/landing/dashboard.png" 
              alt="ClassPlay Dashboard" 
              className="w-full object-cover rounded-[1.8rem]"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black font-serif mb-6">Все, что нужно учителю</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Одна платформа, бесконечные возможности. Доверьте рутину искусственному интеллекту.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Sparkles} 
              title="ИИ-Генераторы" 
              desc="Создавайте задания по математике, квизы и кроссворды на любом языке (RU/UZ/EN)." 
              delay={0.1}
            />
            <FeatureCard 
              icon={Gamepad2} 
              title="Интерактивные Игры" 
              desc="Перетягивание каната, Jeopardy и Филворды прямо на вашей смарт-доске." 
              delay={0.2}
            />
            <FeatureCard 
              icon={BookOpen} 
              title="Персональные Книги" 
              desc="Генерация детских историй с ИИ-иллюстрациями за считанные минуты." 
              delay={0.3}
            />
            <FeatureCard 
              icon={Calculator} 
              title="Математика 1-11" 
              desc="Динамические задачи с автоматической подстройкой под уровень класса." 
              delay={0.4}
            />
            <FeatureCard 
              icon={Layout} 
              title="Экспорт в DOCX" 
              desc="Скачивайте готовые материалы для печати в профессиональном формате." 
              delay={0.5}
            />
            <FeatureCard 
              icon={Layers} 
              title="Управление Классами" 
              desc="Удобный дашборд для отслеживания прогресса и статистики учеников." 
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-4xl md:text-6xl font-black font-serif mb-8 leading-tight text-slate-900">
                  Увидьте <br />
                  <span className="text-primary italic">Результат</span>
                </h2>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="flex items-center gap-2 font-bold text-xl mb-2">
                       <CheckCircle2 className="text-primary w-6 h-6" />
                       Высокая Точность
                    </h4>
                    <p className="text-slate-500">Каждое задание проверяется нашим алгоритмом на корректность и эстетику.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="flex items-center gap-2 font-bold text-xl mb-2">
                       <CheckCircle2 className="text-primary w-6 h-6" />
                       Готово к Печати
                    </h4>
                    <p className="text-slate-500">Оптимизировано под формат A4. Просто скачайте, распечатайте и раздайте классу.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 translate-y-8">
                <img src="/landing/game.png" alt="Игра" className="rounded-3xl shadow-xl border-4 border-white hover:scale-105 transition-transform" />
                <div className="p-8 rounded-3xl bg-primary shadow-2xl text-white">
                   <h5 className="text-2xl font-black mb-2">10k+</h5>
                   <p className="opacity-80">Генераций сделано учителями в прошлом месяце.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-8 rounded-3xl bg-slate-900 shadow-2xl text-white">
                   <Users className="w-10 h-10 mb-4 text-primary" />
                   <h5 className="text-xl font-bold">Для Организаций</h5>
                   <p className="opacity-60 text-sm">Подходит как для частных репетиторов, так и для целых школ.</p>
                </div>
                <img src="/landing/books.png" alt="Книги" className="rounded-3xl shadow-xl border-4 border-white hover:scale-105 transition-transform" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-black font-serif">Тарифы для любого масштаба</h2>
            <p className="text-xl text-slate-500">От индивидуальных занятий до государственных учреждений.</p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            <PriceCard 
              title="Бесплатно" 
              price="$0" 
              features={[
                "10 ИИ-генераций в месяц",
                "Базовый доступ к играм",
                "Поддержка сообщества",
                "1 место учителя"
              ]}
              delay={0.1}
            />
            <PriceCard 
              title="Pro Учитель" 
              price="$9" 
              highlighted={true}
              features={[
                "Безлимитные генерации",
                "Полная библиотека игр",
                "Создание ИИ-книг",
                "Продвинутая аналитика класса",
                "Приоритетная поддержка",
                "1 выделенное место"
              ]}
              delay={0.2}
            />
            <PriceCard 
              title="Для Школ" 
              price="$49" 
              features={[
                "Все функции Pro-плана",
                "До 10 мест для учителей",
                "Панель администратора школы",
                "Массовый импорт классов",
                "Брендирование отчетов",
                "Работа по договору и счетам"
              ]}
              delay={0.3}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 p-10 rounded-[3rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20" />
             <div className="space-y-4 relative z-10">
               <h3 className="text-3xl font-black font-serif leading-tight">Нужно больше мест?</h3>
               <p className="text-slate-400 text-lg">Мы предлагаем индивидуальные условия для университетов, образовательных центров и департаментов.</p>
             </div>
             <Button variant="outline" className="relative z-10 bg-white/10 hover:bg-white/20 border-white/20 text-white h-16 px-12 rounded-2xl text-xl font-bold flex-shrink-0">
               Связаться с нами
             </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="pt-20 pb-10 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black font-serif">ClassPlay</span>
              </div>
              <p className="text-slate-500 max-w-sm">Самая мощная в мире ИИ-платформа, созданная специально для современного образования.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10">
              <div className="space-y-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-slate-400">Продукт</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#" className="hover:text-primary transition-colors">Функции</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Цены</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-slate-400">Компания</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#" className="hover:text-primary transition-colors">О нас</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Конфиденциальность</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Условия</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-10 border-t border-slate-100">
            <p className="text-slate-400 text-sm font-medium">© 2026 ClassPlay Inc. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
