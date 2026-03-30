# 🌙 Задача 03: Тёмная тема

**Приоритет:** 🟡 Средний (Sprint 2)  
**Оценка:** ~2–3 дня  
**Исполнитель:** Frontend

---

## Контекст

CSS-переменные для тёмной темы уже заложены в проекте. Нужно добавить toggle и пройтись по всем компонентам для проверки корректного отображения.

---

## Подзадачи

### 3.1 Toggle тёмной темы

**Файлы:** `front/src/context/ThemeContext.tsx`, `front/src/components/ThemeToggle.tsx`

**Что делать:**
- Создать `ThemeContext` с состоянием `isDark: boolean`
- Сохранять выбор в `localStorage` → ключ `classplay_theme`
- При инициализации читать из `localStorage` (или из системных prefers-color-scheme)
- По клику добавлять/убирать класс `dark` на `<html>` или `<body>`

```tsx
// ThemeContext.tsx
const ThemeContext = createContext({ isDark: false, toggle: () => {} });

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('classplay_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('classplay_theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
};
```

- Добавить кнопку-иконку (☀️/🌙) в хедер

---

### 3.2 CSS-переменные для тёмной темы

**Файл:** `front/src/index.css` или `front/src/styles/variables.css`

**Что делать:**
Убедиться, что все основные цвета используют переменные:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --card-bg: #ffffff;
}

.dark {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --border-color: #2a2a2a;
  --card-bg: #1e1e1e;
}
```

---

### 3.3 Аудит компонентов

**Что делать:**
Пройтись по всем страницам и компонентам:

- [ ] Header / Navbar
- [ ] Sidebar
- [ ] Dashboard
- [ ] Страница классов
- [ ] Каждый генератор (Quiz, Math, Crossword, Assignment)
- [ ] Игры (Jeopardy, Tug of War, Memory Matrix, Balance Scales, Philword, Crossword)
- [ ] Детская библиотека
- [ ] Панель суперадмина
- [ ] Модальные окна

**Критерии:** нет белых блоков на тёмном фоне, нет чёрного текста на тёмном фоне, все input/select/textarea видны.

---

## Definition of Done

- [ ] Toggle в хедере работает
- [ ] Тема сохраняется после перезагрузки страницы
- [ ] Все основные страницы выглядят корректно в тёмной теме
- [ ] Нет визуальных дефектов (белые острова, невидимый текст)
