import React, { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BookPage {
    page_number: number;
    text: string;
    illustration_prompt: string;
    image_base64?: string;
}

interface Book {
    id: number;
    title: string;
    description: string;
    age_group: string;
    genre: string;
    language: string;
    pages: BookPage[];
    cover_emoji: string;
    createdAt: Date;
}

const COVER_COLORS = [
    "from-rose-400 to-pink-600",
    "from-violet-400 to-purple-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
    "from-fuchsia-400 to-pink-700",
];

// --- Page components for react-pageflip ---
const PageCover = React.forwardRef<HTMLDivElement, { book: Book, colorClass: string }>((props, ref) => {
    return (
        <div className="page page-cover bg-white h-full w-full front overflow-hidden rounded-r-xl shadow-[-5px_0_15px_rgba(0,0,0,0.1)] border-r border-[#e0cfb8] relative" ref={ref} data-density="hard">
            <div className={`absolute inset-0 bg-gradient-to-br ${props.colorClass} opacity-100`}></div>
            <div className="absolute inset-x-0 inset-y-8 bg-white/95 mx-6 rounded-lg p-8 flex flex-col items-center justify-center text-center shadow-inner border border-white/40">
                <div className="text-8xl mb-6 drop-shadow-md">{props.book.cover_emoji}</div>
                <h1 className="text-3xl font-bold font-serif text-gray-800 mb-4 leading-tight">{props.book.title}</h1>
                <p className="text-gray-600 font-sans text-sm max-w-[80%] mb-8 leading-relaxed line-clamp-4">{props.book.description}</p>
                
                <div className="mt-auto space-y-2 w-full">
                    <div className="w-16 h-1 bg-amber-200 mx-auto rounded-full mb-4"></div>
                    <div className="flex justify-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{props.book.genre}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{props.book.age_group} л.</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{props.book.language}</span>
                    </div>
                </div>
            </div>
            {/* Binding effect */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
        </div>
    );
});

const PageBackCover = React.forwardRef<HTMLDivElement, { colorClass: string, isExporting?: boolean }>((props, ref) => {
    return (
        <div className="page page-cover bg-white h-full w-full back overflow-hidden rounded-l-xl shadow-[5px_0_15px_rgba(0,0,0,0.1)] border-l border-[#e0cfb8] relative" ref={ref} data-density="hard">
            <div className={`absolute inset-0 bg-gradient-to-br ${props.colorClass} opacity-100`}></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-10 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-serif text-2xl font-bold mb-2">Конец</h3>
                <p className="font-sans text-sm opacity-80">Создано с помощью ИИ КлассПлей</p>
                {/* When exporting to PDF, we don't need instruction text on the back cover */}
                {!props.isExporting && <p className="text-xs opacity-50 absolute bottom-6">Потяните за край, чтобы закрыть</p>}
            </div>
            {/* Binding effect */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
        </div>
    );
});

const PageText = React.forwardRef<HTMLDivElement, { page: BookPage, totalPages: number }>((props, ref) => {
    return (
        <div className="page bg-[#faf6f0] h-full w-full overflow-hidden relative shadow-[inset_-3px_0_10px_rgba(0,0,0,0.03)]" ref={ref}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
            
            <div className="p-10 flex flex-col h-full relative z-10 w-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 w-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-900/40 font-sans">
                        Глава {props.page.page_number}
                    </span>
                    <span className="w-8 h-8 rounded-full border border-amber-900/20 text-amber-900/60 text-sm font-serif flex items-center justify-center">
                        {props.page.page_number * 2 - 1}
                    </span>
                </div>
                
                {/* Content */}
                <div className="flex-1 flex items-center w-full">
                    {/* Make text scalable to avoid overflow, or use standard size */}
                    <p className="text-[#3b352e] font-serif text-base leading-[1.8] text-justify first-letter:text-5xl first-letter:font-bold first-letter:text-amber-600 first-letter:mr-1 first-letter:float-left first-letter:leading-[0.8]">
                        {props.page.text}
                    </p>
                </div>
            </div>
            {/* Binding shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
        </div>
    );
});

const PageImage = React.forwardRef<HTMLDivElement, { page: BookPage, colorClass: string }>((props, ref) => {
    return (
        <div className="page bg-[#faf6f0] h-full w-full overflow-hidden relative shadow-[inset_3px_0_10px_rgba(0,0,0,0.03)]" ref={ref}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
            
            <div className="p-6 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <span className="w-8 h-8 rounded-full border border-amber-900/20 text-amber-900/60 text-sm font-serif flex items-center justify-center">
                        {props.page.page_number * 2}
                    </span>
                </div>
                
                {/* Image container */}
                <div className="flex-1 w-full bg-white rounded-lg p-2 shadow-sm border border-[#e0cfb8] flex flex-col relative">
                    {props.page.image_base64 ? (
                        <div className="flex-1 w-full relative rounded overflow-hidden">
                            <img 
                                src={`data:image/png;base64,${props.page.image_base64}`} 
                                alt={`Иллюстрация ${props.page.page_number}`}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className={`flex-1 w-full rounded flex items-center justify-center bg-gradient-to-br ${props.colorClass} p-0.5`}>
                            <div className="w-full h-full bg-white/90 rounded-[3px] flex items-center justify-center p-6 text-center shadow-inner">
                                <p className="text-xs text-gray-500 font-sans italic max-w-[80%]">
                                    {props.page.illustration_prompt}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Binding shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
        </div>
    );
});


export const BookReaderFlip = ({ book, onClose }: { book: Book; onClose: () => void }) => {
    const bookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageNumber, setPageNumber] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    
    // Config
    const colorIdx = (book.id - 1) % COVER_COLORS.length;
    const colorClass = COVER_COLORS[colorIdx];
    const totalFlips = book.pages.length * 2 + 2; // cover + (text+img) * 10 + backcover
    
    // Navigation
    const nextButtonClick = () => {
        if (bookRef.current) bookRef.current.pageFlip().turnToNextPage();
    };

    const prevButtonClick = () => {
        if (bookRef.current) bookRef.current.pageFlip().turnToPrevPage();
    };

    const onPage = (e: any) => {
        setPageNumber(e.data);
    };

    // Export to PDF
    const exportToPDF = async () => {
        if (!containerRef.current) return;
        setIsExporting(true);
        
        try {
            // Create a temporary hidden container to render all pages cleanly for PDF
            const tempContainer = document.createElement('div');
            // A4 dimensions at 96 DPI: ~ 794 x 1123 px
            // We'll render pages slightly larger for better quality
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '794px'; 
            document.body.appendChild(tempContainer);
            
            // Render React components to HTML for PDF
            // This is a simplified approach. A more robust way would be to create a hidden React root
            import('react-dom/client').then(async (ReactDOM) => {
                const root = ReactDOM.createRoot(tempContainer);
                
                // Create a component that renders pages sequentially
                const PDFRenderer = () => (
                    <div className="flex flex-col gap-10 p-10 bg-white">
                        {/* Title page */}
                        <div className="w-[794px] h-[1123px] relative flex justify-center items-center rounded-xl overflow-hidden" style={{ pageBreakAfter: 'always' }}>
                            <PageCover book={book} colorClass={colorClass} />
                        </div>
                        
                        {/* Content pages */}
                        {book.pages.map((page, i) => (
                            <React.Fragment key={i}>
                                <div className="w-[794px] h-[1123px] relative" style={{ pageBreakAfter: 'always' }}>
                                    <PageText page={page} totalPages={book.pages.length} />
                                </div>
                                <div className="w-[794px] h-[1123px] relative" style={{ pageBreakAfter: 'always' }}>
                                    <PageImage page={page} colorClass={colorClass} />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                );
                
                // Render it synchronously (conceptually)
                root.render(<PDFRenderer />);
                
                // Wait for render and images to load
                await new Promise(r => setTimeout(r, 2000));
                
                // Now generate PDF using jsPDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const pages = tempContainer.children[0].children;
                
                for (let i = 0; i < pages.length; i++) {
                    const canvas = await html2canvas(pages[i] as HTMLElement, {
                        scale: 2, // Higher quality
                        useCORS: true,
                        backgroundColor: null
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                }
                
                // Download
                const safeTitle = book.title.replace(/[^a-z0-9а-яё]/gi, '_').toLowerCase();
                pdf.save(`${safeTitle}.pdf`);
                
                // Cleanup
                root.unmount();
                document.body.removeChild(tempContainer);
            });
            
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            // Show error toast in real app
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
            onClick={onClose}
        >
            <div 
                className="relative w-full h-full max-w-6xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                ref={containerRef}
            >
                {/* Controls Overlay */}
                <div className="absolute top-0 inset-x-0 flex justify-between items-center z-50 px-4 -mt-12 md:-mt-8">
                    <button onClick={exportToPDF} disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-sm border border-white/10 disabled:opacity-50">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                        {isExporting ? "Подготовка PDF..." : "Скачать PDF"}
                    </button>
                    
                    <button onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Flipbook Container */}
                <div className="flex-1 w-full h-full flex items-center justify-center pt-8">
                    {/* Make flipbook somewhat responsive */}
                    <div className="flip-book-container relative max-w-full drop-shadow-2xl">
                        
                        {/* Book thickness effect (behind) */}
                        <div className="absolute inset-0 bg-[#e0cfb8] rounded-xl translate-y-2 max-w-[99%] mx-auto z-[-1]"></div>
                        
                        {/* @ts-ignore - react-pageflip typings can be tricky */}
                        <HTMLFlipBook 
                            width={420} 
                            height={570} 
                            size="fit" 
                            minWidth={315} 
                            maxWidth={500} 
                            minHeight={420} 
                            maxHeight={680} 
                            maxShadowOpacity={0.6} 
                            showCover={true} 
                            mobileScrollSupport={true}
                            onFlip={onPage}
                            className="book-ui rounded-xl overflow-visible"
                            ref={bookRef}
                            usePortrait={window.innerWidth < 768}
                        >
                            <PageCover book={book} colorClass={colorClass} />
                            
                            {/* Inner pages — text and image interleaved */}
                            {book.pages.flatMap((page, i) => [
                                <PageText key={`text-${i}`} page={page} totalPages={book.pages.length} />,
                                <PageImage key={`img-${i}`} page={page} colorClass={colorClass} />
                            ])}

                            <PageBackCover colorClass={colorClass} isExporting={isExporting} />
                        </HTMLFlipBook>
                        
                        {/* Navigation Buttons */}
                        <button 
                            className="absolute top-1/2 -left-4 md:-left-16 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm shadow-lg border border-white/20 z-50 disabled:opacity-0"
                            onClick={prevButtonClick}
                            disabled={pageNumber === 0}
                        >
                            <ChevronLeft className="w-8 h-8 -ml-1" />
                        </button>
                        
                        <button 
                            className="absolute top-1/2 -right-4 md:-right-16 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm shadow-lg border border-white/20 z-50 disabled:opacity-0"
                            onClick={nextButtonClick}
                            disabled={pageNumber >= totalFlips - 1} // Approximated
                        >
                            <ChevronRight className="w-8 h-8 ml-1" />
                        </button>
                    </div>
                </div>

                {/* Progress Footer */}
                <div className="shrink-0 mt-6 text-center z-50 pb-2">
                    <p className="text-white/60 text-sm font-sans tracking-widest font-medium">
                        {pageNumber === 0 
                            ? "ОБЛОЖКА" 
                            : `СТРАНИЦА ${Math.ceil(pageNumber/2)} из ${book.pages.length}`
                        }
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
