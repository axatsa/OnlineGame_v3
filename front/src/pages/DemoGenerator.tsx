import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Calculator, BookOpen, UserPlus, FileText, LayoutGrid, Brain, Globe
} from "lucide-react";
import { AIGeneratingOverlay } from "@/components/AIGeneratingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";

const DemoGenerator = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<any[]>([]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ru' ? 'uz' : 'ru';
    i18n.changeLanguage(nextLang);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error(t("fillBothFields", "Пожалуйста, введите тему"));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/generate/demo/math", {
        topic: topic.trim(),
        count: 5,
        difficulty: "Средний",
        language: i18n.language === 'ru' ? "Russian" : "Uzbek",
        class_id: null
      });

      if (response.data.problems && response.data.problems.length > 0) {
        setGeneratedProblems(response.data.problems);
        toast.success(t("demoGeneratedSuccess", "Успешно сгенерировано!"));
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(t("demoLimitExceeded", "Дневной лимит демо-запросов исчерпан. Зарегистрируйтесь для продолжения!"));
      } else {
        toast.error(t("demoGenError", "Ошибка генерации. Попробуйте другую тему."));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 font-sans text-slate-900 overflow-x-hidden pt-20">
      <AIGeneratingOverlay isGenerating={isGenerating} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-black/5 z-50 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <img
              src="/logo_sticker.webp"
              alt="ClassPlay"
              className="w-10 h-10 rounded-xl object-contain group-hover:scale-110 transition-transform duration-200"
            />
            <span className="text-xl font-display font-bold tracking-tight text-slate-800">ClassPlay</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-slate-600"
            >
              <Globe className="w-4 h-4" />
              {i18n.language === 'ru' ? 'RU' : 'UZ'}
            </button>
            <Button 
              onClick={() => navigate("/login")}
              className="rounded-full px-6 h-10 font-semibold shadow-md bg-slate-900 hover:bg-slate-800 text-white transition-all"
            >
              {t("land_login", "Войти / Регистрация")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10 space-y-4">
          <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-100/50 text-emerald-700 font-bold text-xs mb-4 uppercase tracking-wider backdrop-blur-sm shadow-sm ring-1 ring-emerald-500/20">
            {t("land_hero_demo", "Демо-режим")}
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tighter text-slate-900">
            Быстрая проверка возможностей AI
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Опробуйте генерацию математических примеров. Для неограниченного доступа ко всем форматам, пожалуйста, пройдите регистрацию.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-white/80 backdrop-blur-xl border border-black/5 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="text-2xl font-display font-semibold mb-2">Настройки</h3>
            
            <div className="space-y-4">
               <label className="text-sm font-bold text-slate-700">Тема примеров</label>
               <Input 
                 placeholder="Например: Сложение дробей" 
                 value={topic}
                 onChange={e => setTopic(e.target.value)}
                 className="h-14 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 border-black/5"
                 maxLength={50}
               />
            </div>

            <div className="pt-4">
               <Button 
                 onClick={handleGenerate} 
                 disabled={isGenerating || !topic}
                 className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-400 to-sky-500 hover:opacity-90 transition-opacity text-slate-900"
               >
                 {isGenerating ? "Генерация..." : (
                   <>
                     Сгенерировать <Sparkles className="w-5 h-5 ml-2" />
                   </>
                 )}
               </Button>
            </div>

            <div className="border-t border-slate-100 pt-6 mt-6">
               <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-4">Доступно после регистрации</h4>
               <ul className="space-y-4">
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <Brain className="w-5 h-5 text-fuchsia-500" /> Генерация тестов и викторин
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <LayoutGrid className="w-5 h-5 text-emerald-500" /> Создание кроссвордов
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <FileText className="w-5 h-5 text-amber-500" /> Развернутые задания
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <Calculator className="w-5 h-5 text-sky-500" /> Адаптация под классы и предметы
                 </li>
               </ul>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white/80 backdrop-blur-xl border border-black/5 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-y-auto max-h-[600px] flex flex-col">
            <h3 className="text-2xl font-display font-semibold mb-6">Результат</h3>
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-emerald-500 space-y-4 py-20"
                >
                  <Sparkles className="w-10 h-10 animate-bounce" />
                  <p className="font-bold animate-pulse text-emerald-700">Искусственный интеллект думает...</p>
                </motion.div>
              ) : generatedProblems.length > 0 ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                   {generatedProblems.map((prob, i) => (
                     <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="font-medium text-lg text-slate-800">{prob.q}</p>
                        <p className="text-sm font-bold text-emerald-600 mt-2">Ответ: {prob.a}</p>
                     </div>
                   ))}
                   
                   <div className="mt-8 pt-8 border-t border-slate-100 pb-4 text-center">
                      <p className="text-slate-500 font-medium mb-4">
                        Понравился результат?
                      </p>
                      <Button onClick={() => navigate("/login")} className="rounded-full font-semibold h-12 w-full px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                        <UserPlus className="w-5 h-5 mr-2" /> Создать аккаунт чтобы сохранить
                      </Button>
                   </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-20 text-center"
                >
                  <Calculator className="w-12 h-12 opacity-30" />
                  <p className="max-w-[200px] font-medium text-sm">
                    Введите тему и нажмите "Сгенерировать"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoGenerator;
