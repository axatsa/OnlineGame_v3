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
    adminPanel: "Панель управления",
    superAdmin: "Супер Админ",

    // Generator UI
    genMath: "Математика",
    genCrossword: "Кроссворд",
    genQuiz: "Викторина",
    genAssignment: "Задание",
    genTopic: "Тема задания",
    genTopicPlaceholder: "например: Дроби, Умножение, Космос...",
    genCount: "Количество вопросов",
    genDiff: "Сложность",
    genDiffEasy: "Легко",
    genDiffMed: "Средне",
    genDiffHard: "Сложно",
    genButton: "Создать задание",
    genContext: "Контекст",

    // Class Picker & Info
    selectClass: "Выберите класс...",
    createNewClass: "Создать новый класс",
    addFirstClass: "Добавить первый класс",
    gradeLabel: "Класс",
    studentsLabel: "учеников",
    backToDash: "Вернуться в кабинет",
    myClasses: "Мои классы",
    classGroups: "Группы классов",
    activeLabel: "Активен",
    select: "Выбрать",
    addNewClass: "Добавить новую группу",
    classGroupsDesc: "Управляйте группами — AI учитывает возраст и интересы для генерации контента.",
    aiDifficultyBaseline: "Базовая сложность AI:",
    editClassTitle: "Редактировать класс",
    newClassTitle: "Новая группа",
    profile: "Профиль",
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    updatePassword: "Обновить пароль",
    savedResources: "Сохраненные файлы",
    noResources: "Сохраненных файлов пока нет.",
    view: "Открыть",
    print: "Печать",
    areYouSure: "Вы уверены?",
    resourceDeleted: "Файл удален",
    deleteFailed: "Ошибка при удалении",
    passwordUpdated: "Пароль успешно обновлен",
    fillBothFields: "Пожалуйста, заполните оба поля",
    loginSuccess: "Вход выполнен!",
    invalidCredits: "Неверный логин или пароль",
    loggingIn: "Вход...",
    eraser: "Ластик",
    clear: "Очистить",
    spinWheel: "Крутить колесо!",
    spinning: "Крутим...",
    studentNames: "Имена учеников",
    addName: "Добавить имя...",
    addAtLeastTwo: "Добавьте минимум 2 имени",
    assignmentPrint: "Печать задания",
    answerKey: "Ключи к ответам",
    forTeacher: "Для учителя",
    forStudent: "Для ученика",
    generating: "Генерация...",
    describeAssignment: "Опишите задание выше и нажмите Генерация",

    // Admin Panel
    adminMetricMRR: "MRR",
    adminMetricARR: "ARR (прогноз)",
    adminMetricTotal: "Получено всего",
    adminMetricPending: "Ожидают оплаты",
    adminChartSub: "За последние 6 месяцев",
    adminNewClients: "Новые клиенты",
    adminChurnRate: "Churn rate",
    adminAvgLTV: "LTV средний",
    adminPaymentHistory: "История платежей",
    adminOrg: "Организация",
    adminAmount: "Сумма",
    adminDate: "Дата",
    adminMethod: "Метод",
    adminPeriod: "Период",
    adminStatus: "Статус",
    adminNoPayments: "Нет платежей",
    adminPaymentsEmpty: "История платежей пуста",
    adminRequiresRenewal: "Требуют продления",
    adminRenew: "Продлить",
    adminGlobalAlert: "Глобальное объявление",
    adminAlertEnabled: "Включено",
    adminAlertDisabled: "Выключено",
    adminAlertPlaceholder: "Напишите объявление для всех учителей...",
    adminAlertDesc: "Это сообщение увидят все учителя в своих кабинетах.",
    adminPublish: "Опубликовать",
    adminApiKeys: "API Ключи",
    adminAuditLog: "Журнал действий",
    adminNoData: "Нет данных",
    adminLogEmpty: "Журнал действий пуст",
    adminStatusPaid: "Оплачено",
    adminStatusPending: "Ожидание",
    adminStatusFailed: "Ошибка",

    // Games Data
    game_tug_of_war_title: "Перетягивание каната",
    game_tug_of_war_sub: "Битва знаний",
    game_tug_of_war_cat: "Командная битва",
    game_tug_of_war_how: "Две команды соревнуются, отвечая на вопросы. Каждый правильный ответ тянет канат в вашу сторону. Побеждает команда, перетянувшая канат до конца!",

    game_jeopardy_title: "Своя игра",
    game_jeopardy_sub: "Интеллектуальная викторина",
    game_jeopardy_cat: "Викторина",
    game_jeopardy_how: "Учитель делит класс на 2-4 команды. На экране сетка с категориями. Выбирайте ячейку, отвечайте на вопрос и получайте баллы!",

    game_memory_title: "Мемори",
    game_memory_sub: "Игра на память",
    game_memory_cat: "Память",
    game_memory_how: "Найдите все пары одинаковых карточек. Переворачивайте по две карты за раз. Если они совпадают — остаются открытыми!",

    game_scales_title: "Весы",
    game_scales_sub: "Математическая логика",
    game_scales_cat: "Математика",
    game_scales_how: "Уравновесьте весы, решая примеры. Нужно подобрать гирьки с правильными ответами, чтобы достичь целевого веса.",

    game_word_search_title: "Филворд",
    game_word_search_sub: "Поиск слов",
    game_word_search_cat: "Язык",
    game_word_search_how: "Найдите все спрятанные слова в сетке букв. Слова могут быть расположены по горизонтали и вертикали.",
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
    adminPanel: "Boshqaruv paneli",
    superAdmin: "Super Admin",

    // Generator UI
    genMath: "Matematika",
    genCrossword: "Krossvord",
    genQuiz: "Viktorina",
    genAssignment: "Topshiriq",
    genTopic: "Mavzu",
    genTopicPlaceholder: "masalan: Kasrlar, Ko'paytirish, Kosmos...",
    genCount: "Savollar soni",
    genDiff: "Qiyinchilik",
    genDiffEasy: "Oson",
    genDiffMed: "O'rtacha",
    genDiffHard: "Qiyin",
    genButton: "Yaratish",
    genContext: "Kontekst",

    // Class Picker & Info
    selectClass: "Sinf tanlang...",
    createNewClass: "Yangi sinf yaratish",
    addFirstClass: "Birinchi sinfingizni qo'shing",
    gradeLabel: "Sinf",
    studentsLabel: "o'quvchi",
    backToDash: "Kabinetga qaytish",
    myClasses: "Mening sinflarim",
    classGroups: "Sinf guruhlari",
    activeLabel: "Faol",
    select: "Tanlash",
    addNewClass: "Yangi guruh qo'shish",
    classGroupsDesc: "Guruhlarni boshqaring — AI kontent yaratishda yosh va qiziqishlarni hisobga oladi.",
    aiDifficultyBaseline: "AI asosiy qiyinchilik darajasi:",
    editClassTitle: "Sinfni tahrirlash",
    newClassTitle: "Yangi guruh",
    profile: "Profil",
    changePassword: "Parolni o'zgartirish",
    currentPassword: "Hozirgi parol",
    newPassword: "Yangi parol",
    updatePassword: "Parolni yangilash",
    savedResources: "Saqlangan fayllar",
    noResources: "Hozircha saqlangan fayllar yo'q.",
    view: "O'chish",
    print: "Chop etish",
    areYouSure: "Ishonchingiz komilmi?",
    resourceDeleted: "Fayl o'chirildi",
    deleteFailed: "O'chirishda xatolik",
    passwordUpdated: "Parol muvaffaqiyatli yangilandi",
    fillBothFields: "Iltimos, har ikkala maydonni to'ldiring",
    loginSuccess: "Kirish muvaffaqiyatli!",
    invalidCredits: "Login yoki parol noto'g'ri",
    loggingIn: "Kirish...",
    eraser: "O'chirg'ich",
    clear: "Tozalash",
    spinWheel: "Aylantirish!",
    spinning: "Aylanmoqda...",
    studentNames: "O'quvchilar ismlari",
    addName: "Ism qo'shing...",
    addAtLeastTwo: "Aylantirish uchun kamida 2 ta ism qo'shing",
    assignmentPrint: "Topshiriqni chop etish",
    answerKey: "Javoblar kaliti",
    forTeacher: "O'qituvchi uchun",
    forStudent: "O'quvchi uchun",
    generating: "Yaratilmoqda...",
    describeAssignment: "Topshiriqni tasvirlab bering va 'Yaratish'ni bosing",

    adminStatusFailed: "Xato",

    // Games Data
    game_tug_of_war_title: "Arqon tortish",
    game_tug_of_war_sub: "Bilimlar jangi",
    game_tug_of_war_cat: "Jamoaviy jang",
    game_tug_of_war_how: "Ikki jamoa savollarga javob berish orqali bellashadi. Har bir to'g'ri javob arqonni siz tomonga tortadi. Arqonni oxirigacha tortgan jamoa g'alaba qozonadi!",

    game_jeopardy_title: "O'z o'yini",
    game_jeopardy_sub: "Intellektual viktorina",
    game_jeopardy_cat: "Viktorina",
    game_jeopardy_how: "O'qituvchi sinfni 2-4 jamoaga bo'ladi. Ekranda toifalar tarmog'i paydo bo'ladi. Katakchani tanlang, savolga javob bering va ball oling!",

    game_memory_title: "Memory",
    game_memory_sub: "Xotira o'yini",
    game_memory_cat: "Xotira",
    game_memory_how: "Barcha bir xil kartalar juftligini toping. Bir vaqtning o'zida ikkita kartani oching. Agar ular mos kelsa — ochiq qoladi!",

    game_scales_title: "Tarozi",
    game_scales_sub: "Matematik mantiq",
    game_scales_cat: "Matematika",
    game_scales_how: "Misollarni yechish orqali tarozini muvozanatlang. Maqsadli vaznga erishish uchun to'g'ri javobli toshlarni tanlash kerak.",

    game_word_search_title: "Filvord",
    game_word_search_sub: "So'z qidirish",
    game_word_search_cat: "Til",
    game_word_search_how: "Harflar tarmog'idan barcha yashiringan so'zlarni toping. So'zlar gorizontal va vertikal joylashishi mumkin.",
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
