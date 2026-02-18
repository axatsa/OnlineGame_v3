import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ru" | "uz";

// ─── Translation dictionary ───────────────────────────────────────────────────
export const translations = {
  ru: {
    // Global
    appName: "ClassPlay",
    save: "Сохранить",
    cancel: "Отмена",
    back: "Назад",
    search: "Поиск",
    export: "Экспорт",
    loading: "Загрузка...",
    confirm: "Подтвердить",

    // Login
    loginTitle: "Добро пожаловать",
    loginSub: "Войдите в свой аккаунт",
    loginEmail: "Электронная почта",
    loginPassword: "Пароль",
    loginButton: "Войти",
    loginAdmin: "Войти как Супер-Админ",
    loginTagline: "Где обучение встречается с игрой — для учителей и учеников.",

    // Teacher Dashboard
    welcomeBack: "Добро пожаловать,",
    dashSub: "Готовы создать что-то интересное для класса?",
    navGenerators: "Генераторы",
    navTools: "Инструменты",
    navGames: "Игры",

    cardAiTitle: "AI Генераторы",
    cardAiDesc: "Создавайте задания и кроссворды мгновенно",
    cardToolsTitle: "Инструменты",
    cardToolsDesc: "Рулетка, доска и интерактивные инструменты",
    cardGamesTitle: "Библиотека игр",
    cardGamesDesc: "Интерактивные игры для Smartboard",

    activeClass: "Активный класс",
    manageClasses: "Управление классами",
    noClass: "Класс не выбран",
    createFirstClass: "+ Создать первый класс",
    grade: "Класс",
    students: "учеников",
    aiContext: "AI Контекст",

    // Games Library
    gamesTitle: "Игры",
    gamesHeading: "Интерактивные игры",
    gamesSub: "Вовлекайте учеников с помощью игр на Smartboard",
    howToPlay: "Как играть",
    launch: "ЗАПУСТИТЬ",

    // Class Manager
    classesTitle: "Классы",
    addClass: "Добавить класс",
    editClass: "Редактировать",
    deleteClass: "Удалить",
    className: "Название класса",
    classGrade: "Класс (год обучения)",
    classStudents: "Кол-во учеников",
    classDesc: "AI контекст (интересы, уровень)",

    // Generator
    generatorTitle: "Генератор заданий",
    generatorSub: "Опишите задание на любом языке",
    generate: "Сгенерировать",

    // Tools
    toolsTitle: "Инструменты",
    roulette: "Рулетка",
    drawingBoard: "Доска",
    assignmentGen: "Генератор",

    // Admin
    adminDashboard: "Дашборд",
    adminTeachers: "Учителя",
    adminOrgs: "Организации",
    adminAi: "AI Мониторинг",
    adminFinances: "Финансы",
    adminSystem: "Система",
    adminLogout: "Выйти",
  },

  uz: {
    // Global
    appName: "ClassPlay",
    save: "Saqlash",
    cancel: "Bekor qilish",
    back: "Orqaga",
    search: "Qidirish",
    export: "Eksport",
    loading: "Yuklanmoqda...",
    confirm: "Tasdiqlash",

    // Login
    loginTitle: "Xush kelibsiz",
    loginSub: "Hisobingizga kiring",
    loginEmail: "Elektron pochta",
    loginPassword: "Parol",
    loginButton: "Kirish",
    loginAdmin: "Super Admin sifatida kirish",
    loginTagline: "O'qish o'yin bilan uchrashadigan joy — o'qituvchilar va o'quvchilar uchun.",

    // Teacher Dashboard
    welcomeBack: "Xush kelibsiz,",
    dashSub: "Bugun sinf uchun ajoyib narsa yaratishga tayyormisiz?",
    navGenerators: "Generatorlar",
    navTools: "Vositalar",
    navGames: "O'yinlar",

    cardAiTitle: "AI Generatorlar",
    cardAiDesc: "Topshiriqlar va krossvordlarni darhol yarating",
    cardToolsTitle: "Vositalar",
    cardToolsDesc: "Ruletka, doskа va interaktiv vositalar",
    cardGamesTitle: "O'yinlar kutubxonasi",
    cardGamesDesc: "Smartboard uchun interaktiv o'yinlar",

    activeClass: "Faol sinf",
    manageClasses: "Sinflarni boshqarish",
    noClass: "Sinf tanlanmagan",
    createFirstClass: "+ Birinchi sinfni yarating",
    grade: "Sinf",
    students: "o'quvchi",
    aiContext: "AI Kontekst",

    // Games Library
    gamesTitle: "O'yinlar",
    gamesHeading: "Interaktiv o'yinlar",
    gamesSub: "O'quvchilarni Smartboard o'yinlari bilan jalb qiling",
    howToPlay: "Qanday o'ynash",
    launch: "ISHGA TUSHIRISH",

    // Class Manager
    classesTitle: "Sinflar",
    addClass: "Sinf qo'shish",
    editClass: "Tahrirlash",
    deleteClass: "O'chirish",
    className: "Sinf nomi",
    classGrade: "Sinf (o'qish yili)",
    classStudents: "O'quvchilar soni",
    classDesc: "AI kontekst (qiziqishlar, daraja)",

    // Generator
    generatorTitle: "Topshiriq generatori",
    generatorSub: "Istalgan tilda topshiriqni tasvirlab bering",
    generate: "Generatsiya qilish",

    // Tools
    toolsTitle: "Vositalar",
    roulette: "Ruletka",
    drawingBoard: "Doska",
    assignmentGen: "Generator",

    // Admin
    adminDashboard: "Boshqaruv paneli",
    adminTeachers: "O'qituvchilar",
    adminOrgs: "Tashkilotlar",
    adminAi: "AI Monitoring",
    adminFinances: "Moliya",
    adminSystem: "Tizim",
    adminLogout: "Chiqish",
  },
} as const;

export type TranslationKey = keyof typeof translations["ru"];

// ─── Context ──────────────────────────────────────────────────────────────────
interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("classplay_lang") as Lang) ?? "ru";
  });

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("classplay_lang", l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
