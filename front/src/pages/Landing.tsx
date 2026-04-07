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
import { useTranslation } from "react-i18next";

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

const PriceCard = ({ title, price, features, highlighted = false, delay = 0 }: { title: string, price: string, features: string[], highlighted?: boolean, delay?: number }) => {
  const { t } = useTranslation();
  return (
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
          {price !== "Индивидуально" && price !== "$0" && <span className={highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}>/{t("adminPeriod")}</span>}
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
        {t("land_start")}
      </Button>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <img src="/logo-v4.png" alt="ClassPlay Logo" className="w-12 h-12 rounded-xl object-contain drop-shadow-md" />
            <span className="text-2xl font-black tracking-tight font-serif text-slate-800">ClassPlay</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">{t("land_features")}</a>
            <a href="#preview" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">{t("land_preview")}</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">{t("land_pricing")}</a>
          </nav>

          <Button 
            onClick={() => navigate("/login")}
            variant="default"
            className="rounded-xl px-8 h-10 font-bold shadow-md hover:shadow-xl transition-all"
          >
            {t("land_login")}
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
              {t("land_hero_badge")}
            </span>
            <h1 className="text-6xl md:text-8xl font-black font-serif tracking-tight leading-[1.05] text-slate-900">
              {t("land_hero_title1")} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-600 to-rose-500">{t("land_hero_title2")}</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-500 mt-8 leading-relaxed font-sans">
              {t("land_hero_sub")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10"
          >
            <Button onClick={() => navigate("/login")} size="lg" className="h-16 px-12 text-xl font-bold rounded-2xl shadow-[0_20px_50px_rgba(153,27,27,0.3)] hover:scale-105 transition-transform">
              {t("land_hero_cta")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <button onClick={() => navigate("/demo")} className="h-16 px-12 text-lg font-bold text-slate-600 hover:text-primary transition-colors">
              {t("land_hero_demo")}
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
            <h2 className="text-4xl md:text-5xl font-black font-serif mb-6">{t("land_features_title")}</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">{t("land_features_sub")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Sparkles} 
              title={t("land_f1_title")} 
              desc={t("land_f1_desc")} 
              delay={0.1}
            />
            <FeatureCard 
              icon={Gamepad2} 
              title={t("land_f2_title")} 
              desc={t("land_f2_desc")} 
              delay={0.2}
            />
            <FeatureCard 
              icon={BookOpen} 
              title={t("land_f3_title")} 
              desc={t("land_f3_desc")} 
              delay={0.3}
            />
            <FeatureCard 
              icon={Calculator} 
              title={t("land_f4_title")} 
              desc={t("land_f4_desc")} 
              delay={0.4}
            />
            <FeatureCard 
              icon={Layout} 
              title={t("land_f5_title")} 
              desc={t("land_f5_desc")} 
              delay={0.5}
            />
            <FeatureCard 
              icon={Layers} 
              title={t("land_f6_title")} 
              desc={t("land_f6_desc")} 
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
                  {t("land_res_title1")} <br />
                  <span className="text-primary italic">{t("land_res_title2")}</span>
                </h2>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="flex items-center gap-2 font-bold text-xl mb-2">
                       <CheckCircle2 className="text-primary w-6 h-6" />
                       {t("land_res_acc")}
                    </h4>
                    <p className="text-slate-500">{t("land_res_acc_desc")}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="flex items-center gap-2 font-bold text-xl mb-2">
                       <CheckCircle2 className="text-primary w-6 h-6" />
                       {t("land_res_print")}
                    </h4>
                    <p className="text-slate-500">{t("land_res_print_desc")}</p>
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
                   <h5 className="text-2xl font-black mb-2">{t("land_stat_gen")}</h5>
                   <p className="opacity-80">{t("land_stat_gen_desc")}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-8 rounded-3xl bg-slate-900 shadow-2xl text-white">
                   <Users className="w-10 h-10 mb-4 text-primary" />
                   <h5 className="text-xl font-bold">{t("land_org_title")}</h5>
                   <p className="opacity-60 text-sm">{t("land_org_desc")}</p>
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
            <h2 className="text-5xl font-black font-serif">{t("land_price_title")}</h2>
            <p className="text-xl text-slate-500">{t("land_price_sub")}</p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            <PriceCard 
              title={t("land_p1_title")} 
              price="$0" 
              features={[
                t("land_p1_f1"),
                t("land_p1_f2"),
                t("land_p1_f3"),
                t("land_p1_f4")
              ]}
              delay={0.1}
            />
            <PriceCard 
              title={t("land_p2_title")} 
              price="$9" 
              highlighted={true}
              features={[
                t("land_p2_f1"),
                t("land_p2_f2"),
                t("land_p2_f3"),
                t("land_p2_f4"),
                t("land_p2_f5"),
                t("land_p2_f6")
              ]}
              delay={0.2}
            />
            <PriceCard 
              title={t("land_p3_title")} 
              price={t("land_p3_price")} 
              features={[
                t("land_p3_f1"),
                t("land_p3_f2"),
                t("land_p3_f3"),
                t("land_p3_f4"),
                t("land_p3_f5"),
                t("land_p3_f6")
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
               <h3 className="text-3xl font-black font-serif leading-tight">{t("land_cta_more")}</h3>
               <p className="text-slate-400 text-lg">{t("land_cta_desc")}</p>
             </div>
             <Button variant="outline" className="relative z-10 bg-white/10 hover:bg-white/20 border-white/20 text-white h-16 px-12 rounded-2xl text-xl font-bold flex-shrink-0">
               {t("land_cta_btn")}
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
                <img src="/logo-v4.png" alt="ClassPlay Logo" className="w-10 h-10 rounded-lg object-contain drop-shadow-md" />
                <span className="text-xl font-black font-serif">ClassPlay</span>
              </div>
              <p className="text-slate-500 max-w-sm">{t("land_foot_desc")}</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10">
              <div className="space-y-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-slate-400">{t("land_foot_prod1")}</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#features" className="hover:text-primary transition-colors">{t("land_foot_prod2")}</a></li>
                  <li><a href="#pricing" className="hover:text-primary transition-colors">{t("land_foot_prod3")}</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">{t("land_foot_prod4")}</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="font-bold text-sm uppercase tracking-widest text-slate-400">{t("land_foot_comp1")}</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#" className="hover:text-primary transition-colors">{t("land_foot_comp2")}</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">{t("land_foot_comp3")}</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">{t("land_foot_comp4")}</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-10 border-t border-slate-100">
            <p className="text-slate-400 text-sm font-medium">{t("land_copy")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
