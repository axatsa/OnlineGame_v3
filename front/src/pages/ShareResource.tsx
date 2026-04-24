import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, Download, Loader2, AlertCircle, GraduationCap } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const TYPE_LABELS: Record<string, string> = {
    math: "Математика",
    quiz: "Тест / Викторина",
    crossword: "Кроссворд",
    assignment: "Задание",
    jeopardy: "Своя игра",
    word_search: "Поиск слов",
    book: "Книга",
};

function formatContent(content: any): string {
    if (!content) return "";
    if (typeof content === "string") {
        try {
            const parsed = JSON.parse(content);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return content;
        }
    }
    return JSON.stringify(content, null, 2);
}

function renderContent(raw: string) {
    // Try to parse and render as structured content
    try {
        const parsed = JSON.parse(raw);

        // Quiz / Assignment with questions array
        if (Array.isArray(parsed)) {
            return (
                <div className="space-y-6">
                    {parsed.map((item: any, i: number) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                            <p className="font-semibold text-gray-800 mb-3">
                                {i + 1}. {item.question || item.task || item.text || JSON.stringify(item)}
                            </p>
                            {item.options && (
                                <ul className="space-y-1 ml-4">
                                    {item.options.map((opt: string, j: number) => (
                                        <li key={j} className="text-gray-600 text-sm">
                                            {String.fromCharCode(65 + j)}. {opt}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {item.answer !== undefined && (
                                <p className="mt-3 text-xs text-emerald-600 font-medium border-t border-gray-100 pt-2">
                                    Ответ: {item.answer}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // Object with questions key
        if (parsed.questions && Array.isArray(parsed.questions)) {
            return renderContent(JSON.stringify(parsed.questions));
        }

        // Generic object
        return (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                {JSON.stringify(parsed, null, 2)}
            </pre>
        );
    } catch {
        // Plain text
        return (
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {raw}
            </pre>
        );
    }
}

export default function ShareResource() {
    const { logId } = useParams<{ logId: string }>();
    const [data, setData] = useState<{ topic: string; generator_type: string; content: any; created_at: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/generate/public/history/${logId}`)
            .then(r => {
                if (!r.ok) throw new Error("not_found");
                return r.json();
            })
            .then(setData)
            .catch(() => setError("Материал не найден или ссылка устарела"))
            .finally(() => setLoading(false));
    }, [logId]);

    const handlePrint = () => window.print();

    const handleDownload = () => {
        if (!data) return;
        const text = typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2);
        const blob = new Blob([`${data.topic}\n\n${text}`], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.topic || "материал"}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                <p className="text-gray-600 font-medium">{error}</p>
            </div>
        </div>
    );

    const contentStr = typeof data!.content === "string" ? data!.content : JSON.stringify(data!.content);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>

            {/* Header */}
            <div className="no-print bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-gray-800 text-sm truncate">ClassPlay</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Скачать
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <Printer className="w-4 h-4" /> Печать
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto px-4 py-8"
            >
                {/* Meta */}
                <div className="mb-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        {TYPE_LABELS[data!.generator_type] || data!.generator_type}
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">{data!.topic}</h1>
                    <p className="text-sm text-gray-400">
                        {new Date(data!.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>

                {/* Material */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    {renderContent(contentStr)}
                </div>

                <p className="no-print text-center text-xs text-gray-400 mt-8">
                    Создано с помощью ClassPlay · classplay.uz
                </p>
            </motion.div>
        </div>
    );
}
