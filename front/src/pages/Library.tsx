import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, Plus, ArrowLeft, Sparkles, ChevronLeft, ChevronRight,
    X, Loader2, BookMarked, Globe, Users, Wand2, Trash2, BookText,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────
interface BookPage {
    page_number: number;
    text: string;
    illustration_prompt: string;
    image_base64?: string;  // base64 PNG from gemini-2.5-flash-image
}

interface Book {
    id: number;
    title: string;
    description: string;
    age_group: string;
    genre: string;
    language: string;
    pages: BookPage[];        // 10 страниц
    cover_emoji: string;
    createdAt: Date;
}

// Reader "slides": cover → [text, illustration] × 10  (21 total)
type Slide =
    | { kind: "cover" }
    | { kind: "text"; page: BookPage; index: number }
    | { kind: "image"; page: BookPage; index: number };

function buildSlides(book: Book): Slide[] {
    const slides: Slide[] = [{ kind: "cover" }];
    book.pages.forEach((pg, i) => {
        slides.push({ kind: "text", page: pg, index: i });
        slides.push({ kind: "image", page: pg, index: i });
    });
    return slides;
}

// ─── Palette & constants ─────────────────────────────────────────────────
const COVER_COLORS = [
    "from-rose-400 to-pink-600",
    "from-violet-400 to-purple-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
    "from-fuchsia-400 to-pink-700",
];
const GENRES = ["fairy tale", "adventure", "science", "fable", "comedy"];
const LANGUAGES = ["Russian", "Uzbek", "English"];
const AGE_GROUPS = ["5-7", "7-10", "10-13"];
const EMOJIS = ["📚", "🧚", "🦁", "🐉", "🚀", "🌊", "🌟", "🦋", "🐬", "🏰"];

const fmtDate = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

// ─── Book Reader ────────────────────────────────────────────────────────────
const BookReader = ({ book, onClose }: { book: Book; onClose: () => void }) => {
    const slides = buildSlides(book);
    const [cur, setCur] = useState(0);
    const total = slides.length;        // 21
    const colorIdx = (book.id - 1) % COVER_COLORS.length;

    const slide = slides[cur];

    const prev = () => setCur(p => Math.max(0, p - 1));
    const next = () => setCur(p => Math.min(total - 1, p + 1));

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-xl bg-[#fffdf5] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Book header ─────────────────────────────────── */}
                <div className={`bg-gradient-to-r ${COVER_COLORS[colorIdx]} px-6 py-4 flex items-center justify-between text-white shrink-0`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{book.cover_emoji}</span>
                        <div className="min-w-0">
                            <p className="font-bold font-serif text-base truncate">{book.title}</p>
                            <p className="text-xs text-white/75 font-sans">{book.genre} · {book.age_group} лет</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 ml-3">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Slide content ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={cur}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.2 }}
                            className="p-8"
                        >
                            {/* Cover */}
                            {slide.kind === "cover" && (
                                <div className="text-center py-6">
                                    <div className="text-8xl mb-5">{book.cover_emoji}</div>
                                    <h2 className="text-3xl font-bold font-serif text-gray-800 mb-3">{book.title}</h2>
                                    <p className="text-gray-500 font-sans text-sm leading-relaxed max-w-xs mx-auto">{book.description}</p>
                                    <div className="flex justify-center gap-2 mt-5 flex-wrap">
                                        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-sans">{book.age_group} лет</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-sans">{book.genre}</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-sans">{book.language}</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-sans">10 страниц</span>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-6 font-sans">Нажмите → чтобы начать читать</p>
                                </div>
                            )}

                            {/* Text slide */}
                            {slide.kind === "text" && (
                                <div>
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold font-sans flex items-center justify-center">
                                            {slide.page.page_number}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-sans">
                                            Страница {slide.page.page_number} из {book.pages.length}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 font-serif text-lg leading-relaxed">
                                        {slide.page.text}
                                    </p>
                                </div>
                            )}

                            {/* Illustration slide */}
                            {slide.kind === "image" && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-sans">
                                            🎨 Иллюстрация {slide.page.page_number} / 10
                                        </span>
                                    </div>
                                    {slide.page.image_base64 ? (
                                        // Real AI-generated image
                                        <div className="w-full rounded-2xl overflow-hidden shadow-lg">
                                            <img
                                                src={`data:image/png;base64,${slide.page.image_base64}`}
                                                alt={`Иллюстрация ${slide.page.page_number}`}
                                                className="w-full object-cover rounded-2xl"
                                                style={{ maxHeight: "360px" }}
                                            />
                                        </div>
                                    ) : (
                                        // Fallback if image generation failed
                                        <div className={`w-full rounded-2xl bg-gradient-to-br ${COVER_COLORS[colorIdx]} p-1`}>
                                            <div className="w-full rounded-xl bg-white/90 min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
                                                <div className="text-5xl mb-4">{book.cover_emoji}</div>
                                                <p className="text-sm text-gray-600 font-sans italic leading-relaxed max-w-xs">
                                                    {slide.page.illustration_prompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Navigation ───────────────────────────────────── */}
                <div className="shrink-0 px-6 py-4 border-t border-amber-100 bg-[#fffdf5] flex items-center justify-between">
                    <button onClick={prev} disabled={cur === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-amber-800 font-sans text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" /> Назад
                    </button>

                    {/* Progress indicator */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400 font-sans">
                            {cur === 0
                                ? "Обложка"
                                : slides[cur].kind === "text"
                                    ? `Текст ${(slides[cur] as any).page.page_number}/10`
                                    : `Картинка ${(slides[cur] as any).page.page_number}/10`
                            }
                        </span>
                        <div className="flex gap-0.5">
                            {slides.map((_, i) => {
                                const isText = slides[i].kind === "text";
                                const isImage = slides[i].kind === "image";
                                return (
                                    <button key={i} onClick={() => setCur(i)}
                                        title={slides[i].kind}
                                        className={`h-1.5 rounded-full transition-all ${i === cur
                                            ? "bg-amber-500 w-4"
                                            : isText
                                                ? "w-1.5 bg-amber-300 hover:bg-amber-400"
                                                : isImage
                                                    ? "w-1.5 bg-violet-300 hover:bg-violet-400"
                                                    : "w-1.5 bg-gray-300"
                                            }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={next} disabled={cur === total - 1}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-amber-800 font-sans text-sm font-medium">
                        Далее <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Generate Form ──────────────────────────────────────────────────────────
const GenerateForm = ({
    onClose, onGenerated, nextId,
}: { onClose: () => void; onGenerated: (b: Book) => void; nextId: number }) => {
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [ageGroup, setAgeGroup] = useState("7-10");
    const [language, setLanguage] = useState("Russian");
    const [genre, setGenre] = useState("fairy tale");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!title.trim() || !topic.trim()) {
            toast.error("Заполните название и тему книги");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/library/generate", {
                title: title.trim(), topic: topic.trim(),
                age_group: ageGroup, language, genre,
            });
            const data = res.data.book;
            const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            const newBook: Book = { id: nextId, ...data, cover_emoji: emoji, createdAt: new Date() };
            onGenerated(newBook);
            toast.success(`Книга «${newBook.title}» создана!`);
        } catch {
            toast.error("Ошибка генерации. Проверьте Gemini API ключ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border p-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                            <Wand2 className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-serif text-foreground">Создать книгу</h3>
                            <p className="text-xs text-muted-foreground font-sans">
                                Text: gemini-2.0-flash · Images: gemini-2.5-flash-image · 10 стр · 10 иллюстраций
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block mb-1.5">
                            Название книги *
                        </label>
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            placeholder='"Приключения Тимура в лесу"'
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block mb-1.5">
                            Тема / образовательная цель *
                        </label>
                        <input value={topic} onChange={e => setTopic(e.target.value)}
                            placeholder='"дружба, честность, числа от 1 до 10"'
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>

                    {/* Language + Age */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block mb-1.5">
                                <Globe className="w-3 h-3 inline mr-1" />Язык
                            </label>
                            <div className="flex gap-1">
                                {LANGUAGES.map(l => (
                                    <button key={l} onClick={() => setLanguage(l)}
                                        className={`flex-1 text-xs py-2 rounded-lg border font-sans transition-colors ${language === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                                        {l === "Russian" ? "RU" : l === "Uzbek" ? "UZ" : "EN"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block mb-1.5">
                                <Users className="w-3 h-3 inline mr-1" />Возраст
                            </label>
                            <div className="flex gap-1">
                                {AGE_GROUPS.map(a => (
                                    <button key={a} onClick={() => setAgeGroup(a)}
                                        className={`flex-1 text-xs py-2 rounded-lg border font-sans transition-colors ${ageGroup === a ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Genre */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block mb-1.5">
                            Жанр
                        </label>
                        <select value={genre} onChange={e => setGenre(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    {/* Info badge */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                        <p className="text-xs text-violet-700 font-sans">
                            Книга будет содержать <strong>10 страниц</strong> текста (60–70 слов каждая) и <strong>10 иллюстраций</strong>, чередующихся.
                        </p>
                    </div>
                </div>

                <button onClick={handleGenerate}
                    disabled={loading || !title.trim() || !topic.trim()}
                    className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold font-sans flex items-center justify-center gap-2 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                    {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Генерация (~30-60 сек)...</>
                        : <><Sparkles className="w-4 h-4" /> Сгенерировать книгу</>
                    }
                </button>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Library Page ──────────────────────────────────────────────────────
const Library = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [openBook, setOpenBook] = useState<Book | null>(null);

    const nextId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;

    const handleGenerated = (book: Book) => {
        setBooks(prev => [...prev, book]);
        setShowForm(false);
        setOpenBook(book);
    };

    const handleDelete = (id: number) => {
        setBooks(prev => prev.filter(b => b.id !== id));
        toast.success("Книга удалена");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/teacher")}
                            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                            <BookMarked className="w-5 h-5 text-violet-600" />
                            <span className="text-lg font-bold font-serif text-foreground">Библиотека</span>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold font-sans hover:from-violet-600 hover:to-purple-700 transition-all shadow-md">
                        <Plus className="w-4 h-4" /> Новая книга
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold font-serif text-foreground mb-1">Детская библиотека</h1>
                    <p className="text-muted-foreground font-sans text-sm">
                        Текст: <span className="text-violet-600 font-semibold">gemini-2.0-flash</span> · Картинки: <span className="text-violet-600 font-semibold">gemini-2.5-flash-image</span> · 10 стр · 10 иллюстраций
                    </p>
                </motion.div>

                {/* Empty state */}
                {books.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-5">
                            <BookOpen className="w-10 h-10 text-violet-500" />
                        </div>
                        <h2 className="text-xl font-bold font-serif text-foreground mb-2">Библиотека пуста</h2>
                        <p className="text-muted-foreground font-sans mb-2 max-w-sm text-sm">
                            Нажмите «Новая книга» — Gemini AI напишет уникальную историю
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-sans mb-6">
                            10 страниц · 60–70 слов каждая · 10 иллюстраций
                        </p>
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold font-sans hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg text-sm">
                            <Plus className="w-4 h-4" /> Создать первую книгу
                        </button>
                    </motion.div>
                )}

                {/* Books list */}
                {books.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[52px_1fr_190px_170px] gap-4 px-6 py-3 border-b border-border bg-muted/50">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">#</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">Название</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">Дата создания</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">Действия</span>
                        </div>

                        <div className="divide-y divide-border">
                            {books.map((book, i) => (
                                <motion.div key={book.id}
                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className="grid grid-cols-[52px_1fr_190px_170px] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors"
                                >
                                    {/* ID */}
                                    <div>
                                        <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 font-bold text-sm font-sans flex items-center justify-center">
                                            {book.id}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-2xl shrink-0">{book.cover_emoji}</span>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground font-sans text-sm truncate">{book.title}</p>
                                            <p className="text-xs text-muted-foreground font-sans">
                                                {book.genre} · {book.age_group} лет · {book.pages?.length ?? 10} стр.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <span className="text-sm text-muted-foreground font-sans">{fmtDate(book.createdAt)}</span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setOpenBook(book)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-colors text-xs font-semibold font-sans">
                                            <BookText className="w-3.5 h-3.5" /> Читать
                                        </button>
                                        <button onClick={() => handleDelete(book.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-semibold font-sans">
                                            <Trash2 className="w-3.5 h-3.5" /> Удалить
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showForm && (
                    <GenerateForm
                        onClose={() => setShowForm(false)}
                        onGenerated={handleGenerated}
                        nextId={nextId}
                    />
                )}
                {openBook && <BookReader book={openBook} onClose={() => setOpenBook(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default Library;
