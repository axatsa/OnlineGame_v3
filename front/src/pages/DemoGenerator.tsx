import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Calculator, BookOpen, UserPlus, FileText, LayoutGrid, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";

const DemoGenerator = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Пожалуйста, введите тему");
      return;
    }

    setIsGenerating(true);
    try {
      // In Demo we only showcase Math for simplicity, or we could add tabs if requested.
      const response = await api.post("/generate/demo/math", {
        topic: topic.trim(),
        count: 5,
        difficulty: "Средний",
        language: "Russian",
        class_id: null
      });

      if (response.data.problems && response.data.problems.length > 0) {
        setGeneratedProblems(response.data.problems);
        toast.success("Примеры успешно сгенерированы!");
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error("Дневной лимит демо-запросов исчерпан. Зарегистрируйтесь для продолжения!");
      } else {
        toast.error("Ошибка генерации. Попробуйте другую тему.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-red-50/30 to-slate-100 font-sans text-slate-900 overflow-x-hidden pt-20">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-white/20 z-50 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight font-serif text-slate-800">ClassPlay</span>
          </div>
          
          <Button 
            onClick={() => navigate("/login")}
            className="rounded-xl px-8 h-10 font-bold shadow-md hover:shadow-xl transition-all"
          >
            Войти / Регистрация
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10 space-y-4">
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs mb-4 uppercase tracking-wider backdrop-blur-sm">
            Демо-режим
          </span>
          <h1 className="text-4xl md:text-5xl font-black font-serif">
            Быстрая проверка возможностей AI
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Опробуйте генерацию математических примеров. Для неограниченного доступа ко всем форматам, пожалуйста, пройдите регистрацию.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-xl font-bold font-serif mb-2">Настройки</h3>
            
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Тема примеров</label>
               <Input 
                 placeholder="Например: Сложение дробей" 
                 value={topic}
                 onChange={e => setTopic(e.target.value)}
                 className="h-12 rounded-xl"
                 maxLength={50}
               />
            </div>

            <div className="pt-4">
               <Button 
                 onClick={handleGenerate} 
                 disabled={isGenerating || !topic}
                 className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
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
               <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <Brain className="w-4 h-4 text-violet-500" /> Генерация тестов и викторин
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <LayoutGrid className="w-4 h-4 text-success" /> Создание кроссвордов
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <FileText className="w-4 h-4 text-yellow-500" /> Развернутые задания
                 </li>
                 <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <Calculator className="w-4 h-4 text-primary" /> Адаптация под классы и предметы
                 </li>
               </ul>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl overflow-y-auto max-h-[600px] flex flex-col">
            <h3 className="text-xl font-bold font-serif mb-6">Результат</h3>
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-primary space-y-4 py-20"
                >
                  <Sparkles className="w-10 h-10 animate-bounce" />
                  <p className="font-bold animate-pulse">Искусственный интеллект думает...</p>
                </motion.div>
              ) : generatedProblems.length > 0 ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                   {generatedProblems.map((prob, i) => (
                     <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="font-mono text-lg font-bold text-slate-800">{prob.q}</p>
                        <p className="text-sm font-bold text-success mt-1">Ответ: {prob.a}</p>
                     </div>
                   ))}
                   
                   <div className="mt-8 pt-8 border-t border-slate-100 pb-4 text-center">
                      <p className="text-slate-500 font-medium mb-4">
                        Понравился результат?
                      </p>
                      <Button onClick={() => navigate("/login")} className="rounded-xl font-bold h-10 w-full" variant="outline">
                        <UserPlus className="w-4 h-4 mr-2" /> Создать аккаунт чтобы сохранить
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
                  <Calculator className="w-12 h-12 opacity-50" />
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
