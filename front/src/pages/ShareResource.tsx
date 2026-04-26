import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, Download, Loader2, AlertCircle, GraduationCap, FileText, Image } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

function renderContent(raw: string, generatorType?: string) {
    // Try to parse and render as structured content
    try {
        const parsed = JSON.parse(raw);

        // Book pages
        if (generatorType === "book" && parsed.pages && Array.isArray(parsed.pages)) {
            return (
                <div className="space-y-8">
                    {parsed.pages.map((page: any, i: number) => (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                            {page.image_base64 && (
                                <img src={page.image_base64} alt={`Page ${page.page_number}`} className="w-full h-auto" loading="lazy" />
                            )}
                            <div className="p-4 bg-gray-50 space-y-2">
                                <p className="text-xs font-semibold text-gray-400">Страница {page.page_number}</p>
                                <p className="text-gray-700 leading-relaxed text-sm">{page.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

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
            return renderContent(JSON.stringify(parsed.questions), generatorType);
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
    const contentRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<{ topic: string; generator_type: string; content: any; created_at: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

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

    const generateHtmlContent = (data: any, topic: string, type: string) => {
        const contentStr = typeof data === "string" ? data : JSON.stringify(data);
        let bodyContent = "";

        try {
            const parsed = JSON.parse(contentStr);
            if (Array.isArray(parsed)) {
                bodyContent = parsed.map((item: any, i: number) => `
                    <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <p style="font-weight: bold; font-size: 16px; margin: 0 0 10px 0;">
                            ${i + 1}. ${item.question || item.task || item.text || ""}
                        </p>
                        ${item.options ? `
                            <ul style="margin: 10px 0; padding-left: 30px;">
                                ${item.options.map((opt: string, j: number) => `
                                    <li style="margin: 5px 0; color: #333;">${String.fromCharCode(65 + j)}. ${opt}</li>
                                `).join("")}
                            </ul>
                        ` : ""}
                        ${item.answer !== undefined ? `
                            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0f0f0; color: #27ae60; font-size: 14px; font-weight: 500;">
                                Ответ: ${item.answer}
                            </p>
                        ` : ""}
                    </div>
                `).join("");
            }
        } catch {
            bodyContent = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${contentStr}</pre>`;
        }

        return `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${topic}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
                    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                    .type-badge { display: inline-block; background: #e0e7ff; color: #4f46e5; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; margin-bottom: 12px; }
                    .title { font-size: 32px; font-weight: bold; color: #1f2937; margin: 15px 0; }
                    .date { color: #9ca3af; font-size: 14px; }
                    .content { margin-top: 30px; line-height: 1.8; }
                    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
                    @media print {
                        body { background: white; }
                        .container { padding: 20px; max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="type-badge">${TYPE_LABELS[type] || type}</div>
                        <h1 class="title">${topic}</h1>
                        <p class="date">${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div class="content">
                        ${bodyContent}
                    </div>
                    <div class="footer">
                        <p>Создано с помощью ClassPlay · classplay.uz</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleDownloadHtml = () => {
        if (!data) return;
        setDownloading(true);
        try {
            const htmlContent = generateHtmlContent(data.content, data.topic, data.generator_type);
            const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.topic || "материал"}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!data) return;
        setDownloading(true);
        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Special handling for books with multiple pages
            if (data.generator_type === "book" && typeof data.content === "object" && data.content.pages) {
                const pages = data.content.pages as Array<{ page_number: number; text: string; image_base64?: string }>;

                pages.forEach((page, index) => {
                    if (index > 0) pdf.addPage();

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    let yPos = 10;

                    // Add page number
                    pdf.setFontSize(10);
                    pdf.text(`Стр. ${page.page_number}`, pdfWidth - 20, pdfHeight - 10);

                    // Add image if available
                    if (page.image_base64) {
                        try {
                            pdf.addImage(page.image_base64, "JPEG", 10, yPos, pdfWidth - 20, 80);
                            yPos += 85;
                        } catch (e) {
                            console.error("Failed to add image", e);
                        }
                    }

                    // Add text
                    pdf.setFontSize(11);
                    pdf.setFont(undefined, "normal");
                    const textLines = pdf.splitTextToSize(page.text, pdfWidth - 20);
                    pdf.text(textLines, 10, yPos);
                });
            } else {
                // Regular content - screenshot the DOM
                if (!contentRef.current) return;
                const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL("image/png");
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                let heightLeft = canvasHeight;
                let position = 0;

                const pageHeight = pdfWidth * (canvasHeight / canvasWidth);
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pageHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pageHeight);
                    heightLeft -= pageHeight;
                }
            }

            pdf.save(`${data.topic || "материал"}.pdf`);
        } finally {
            setDownloading(false);
        }
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
                        <div className="flex gap-1.5 border border-gray-200 rounded-xl p-1">
                            <button
                                onClick={handleDownloadHtml}
                                disabled={downloading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="Скачать как HTML"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                HTML
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="Скачать как PDF"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                                PDF
                            </button>
                        </div>
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
                ref={contentRef}
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
                    {renderContent(contentStr, data!.generator_type)}
                </div>

                <p className="no-print text-center text-xs text-gray-400 mt-8">
                    Создано с помощью ClassPlay · classplay.uz
                </p>
            </motion.div>
        </div>
    );
}
