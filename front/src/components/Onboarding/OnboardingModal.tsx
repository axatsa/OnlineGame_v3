import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Users, 
  Wand2, 
  Gamepad2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface OnboardingModalProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Добро пожаловать в ClassPlay!",
    description: "Ваш новый помощник в создании увлекательных уроков. Мы объединили искусственный интеллект и игровые механики, чтобы вы могли экономить время и вдохновлять учеников.",
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    color: "bg-primary/10",
  },
  {
    title: "Управляйте своими классами",
    description: "Создавайте группы учеников, чтобы сохранять их прогресс и адаптировать задания под уровень знаний каждого класса.",
    icon: <Users className="w-12 h-12 text-blue-500" />,
    color: "bg-blue-500/10",
    action: "/classes"
  },
  {
    title: "Умная генерация контента",
    description: "Используйте AI для создания тестов, кроссвордов и упражнений всего за 30 секунд. Просто введите тему урока!",
    icon: <Wand2 className="w-12 h-12 text-violet-500" />,
    color: "bg-violet-500/10",
    action: "/generator"
  },
  {
    title: "Интерактивные игры",
    description: "Запускайте Jeopardy, Word Search и другие игры прямо на смарт-борде. Дети будут просить добавки!",
    icon: <Gamepad2 className="w-12 h-12 text-orange-500" />,
    color: "bg-orange-500/10",
    action: "/games"
  }
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsFinishing(true);
    try {
      await api.post("/auth/onboarding-complete");
      onComplete();
    } catch (error) {
      // Even if API fails, we let them proceed
      onComplete();
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden relative"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>

        <button 
          onClick={finishOnboarding}
          className="absolute top-6 right-6 p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 pt-16 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className={`w-24 h-24 rounded-3xl ${steps[currentStep].color} flex items-center justify-center mb-8`}>
                {steps[currentStep].icon}
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-muted-foreground leading-relaxed font-sans px-4">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-12 w-full">
            <Button
              variant="ghost"
              onClick={() => currentStep > 0 && setCurrentStep(p => p - 1)}
              disabled={currentStep === 0}
              className="rounded-2xl h-12 flex-1 font-sans border border-transparent hover:border-border"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Назад
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isFinishing}
              className="rounded-2xl h-12 flex-[2] text-lg font-bold shadow-lg shadow-primary/20 gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  {isFinishing ? "Завершение..." : "Поехали!"} <CheckCircle2 className="w-5 h-5" />
                </>
              ) : (
                <>
                  Далее <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-6 flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} 
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
