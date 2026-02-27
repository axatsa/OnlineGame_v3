import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'ru',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        resources: {
            ru: {
                translation: {
                    welcome: 'Добро пожаловать',
                    adminPanel: 'Панель администрирования',
                    adminStatusPaid: 'Оплачено',
                    adminStatusPending: 'В ожидании',
                    adminStatusFailed: 'Ошибка',
                    adminMetricMRR: 'Доход (MRR)',
                    adminMetricARR: 'Доход (ARR)',
                    adminMetricTotal: 'Всего выручки',
                    adminMetricPending: 'Заявки',
                    adminChartSub: 'Рост выручки по месяцам',
                    adminNewClients: 'Новые клиенты',
                    adminChurnRate: 'Отток',
                    adminAvgLTV: 'Средний LTV',
                    adminPaymentHistory: 'История платежей',
                    adminOrg: 'Организация',
                    adminAmount: 'Сумма',
                    adminDate: 'Дата',
                    adminMethod: 'Метод',
                    adminPeriod: 'Период',
                    adminStatus: 'Статус',
                    adminNoPayments: 'Платежей не найдено',
                    adminPaymentsEmpty: 'В этом периоде операций не было',
                    adminSystemSettings: 'Настройки системы',
                    adminSystemAlert: 'Объявление на главной',
                    adminSystemAlertDesc: 'Будет показано всем учителям в верхней части экрана',
                    adminAiProvider: 'AI Провайдер по умолчанию',
                    adminAiProviderDesc: 'Глобальная настройка для всех генераций',
                    adminAuditLogs: 'Лог действий',
                }
            },
            uz: {
                translation: {
                    welcome: 'Xush kelibsiz',
                    adminPanel: 'Admin paneli',
                    adminStatusPaid: "To'langan",
                    adminStatusPending: 'Kutilmoqda',
                    adminStatusFailed: 'Xato',
                    adminMetricMRR: 'Daromad (MRR)',
                    adminMetricARR: 'Daromad (ARR)',
                    adminMetricTotal: 'Umumiy tushum',
                    adminMetricPending: 'Arizalar',
                    adminChartSub: 'Oylik daromad o\'sishi',
                    adminNewClients: 'Yangi mijozlar',
                    adminChurnRate: 'Chiqib ketish',
                    adminAvgLTV: 'O\\\'rtacha LTV',
                    adminPaymentHistory: "To'lovlar tarixi",
                    adminOrg: 'Tashkilot',
                    adminAmount: 'Summa',
                    adminDate: 'Sana',
                    adminMethod: 'Usul',
                    adminPeriod: 'Davr',
                    adminStatus: 'Holat',
                    adminNoPayments: "To'lovlar topilmadi",
                    adminPaymentsEmpty: 'Ushbu davrda operatsiyalar bo\'lmadi',
                    adminSystemSettings: 'Tizim sozlamalari',
                    adminSystemAlert: 'Asosiy e\'lon',
                    adminSystemAlertDesc: 'Barcha o\'qituvchilarga ekranning yuqori qismida ko\'rsatiladi',
                    adminAiProvider: 'AI provayderi (standart)',
                    adminAiProviderDesc: 'Barcha generatsiyalar uchun global sozlama',
                    adminAuditLogs: 'Harakatlar jurnali',
                }
            }
        }
    });

export default i18n;
