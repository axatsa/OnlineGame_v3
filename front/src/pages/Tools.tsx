import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Dices, Eraser, Palette, FileText, Printer, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/context/LangContext";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";

// ──────────────── Roulette ────────────────
const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f59e0b", "#84cc16", "#6366f1",
];

const RouletteWheel = ({ names, spinning, winner }: { names: string[]; spinning: boolean; winner: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const targetRotation = useRef(0);

  useEffect(() => {
    if (spinning) {
      const extra = 2160 + Math.random() * 1080;
      targetRotation.current = rotation + extra;
      startTimeRef.current = null;

      const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        const duration = 4000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentRot = rotation + (targetRotation.current - rotation) * eased;
        setRotation(currentRot);
        if (progress < 1) animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    const slice = (2 * Math.PI) / names.length;
    ctx.clearRect(0, 0, size, size);

    names.forEach((name, i) => {
      const startAngle = (rotation * Math.PI) / 180 + i * slice;
      const endAngle = startAngle + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.max(10, Math.min(16, 120 / names.length))}px Inter, sans-serif`;
      ctx.fillText(name.length > 12 ? name.slice(0, 12) + "…" : name, r - 10, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }, [names, rotation]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-0 h-0"
        style={{ borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderRight: "24px solid #991B1B" }}
      />
      <canvas ref={canvasRef} width={320} height={320} className="rounded-full shadow-2xl" />
      {winner && !spinning && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
          <div className="bg-primary text-primary-foreground font-bold font-serif text-lg px-6 py-3 rounded-2xl shadow-lg text-center">
            🎉 {winner}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ──────────────── Drawing Board ────────────────
const BRUSH_COLORS = ["#1a1a1a", "#991B1B", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];
const BRUSH_SIZES = [2, 5, 10, 18];

// FIX #1: t передаётся как пропс чтобы компонент имел доступ к переводам
const DrawingBoard = ({ t }: { t: (key: string) => string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#1a1a1a");
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => { drawing.current = true; lastPos.current = getPos(e); };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? "#f8fafc" : color;
    ctx.lineWidth = isEraser ? size * 3 : size;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; lastPos.current = null; };
  const clearCanvas = () => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  useEffect(() => { clearCanvas(); }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl p-3">
        <div className="flex items-center gap-1.5">
          {BRUSH_COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); setIsEraser(false); }}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c && !isEraser ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((s) => (
            <button key={s} onClick={() => { setSize(s); setIsEraser(false); }}
              className={`rounded-full bg-foreground transition-all ${size === s && !isEraser ? "ring-2 ring-primary ring-offset-2" : ""}`}
              style={{ width: s * 2 + 8, height: s * 2 + 8 }} />
          ))}
        </div>
        <div className="w-px h-6 bg-border" />
        <button onClick={() => setIsEraser(!isEraser)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-sans font-medium transition-colors ${isEraser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}>
          <Eraser className="w-4 h-4" /> {t("eraser")}
        </button>
        <button onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-sans font-medium bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto">
          <X className="w-4 h-4" /> {t("clear")}
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
        <canvas ref={canvasRef} width={1200} height={680} className="w-full touch-none cursor-crosshair"
          style={{ cursor: isEraser ? "cell" : "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </div>
    </div>
  );
};

// ──────────────── Assignment Generator ────────────────
interface GeneratedAssignment {
  title: string;
  subject: string;
  grade: string;
  questions: { num: number; text: string; options?: string[]; answer: string }[];
  date: string;
}

// FIX #2: t и lang передаются как пропсы
const AssignmentPrintView = ({
  assignment, t, lang
}: {
  assignment: GeneratedAssignment;
  t: (key: string) => string;
  lang: string;
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>${assignment.title}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 0; }
        .page { width: 100%; page-break-after: always; }
        .page:last-child { page-break-after: avoid; }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 4pt; }
        h2 { font-size: 13pt; text-align: center; margin-bottom: 12pt; color: #333; }
        .meta { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 16pt; border-bottom: 1px solid #000; padding-bottom: 8pt; }
        .question { margin-bottom: 14pt; }
        .question-text { font-weight: bold; margin-bottom: 4pt; }
        .options { display: grid; grid-template-columns: 1fr 1fr; gap: 2pt; padding-left: 12pt; font-size: 11pt; }
        .answer-key { background: #f5f5f5; padding: 8pt; margin-bottom: 8pt; border: 1px solid #ccc; }
        .answers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6pt; margin-top: 12pt; }
        .answer-item { border: 1px solid #333; padding: 6pt; text-align: center; font-size: 11pt; }
        .answer-num { font-size: 9pt; color: #555; }
        .fill-line { border-bottom: 1px solid #000; display: inline-block; min-width: 120pt; }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Printer className="w-4 h-4" /> {t("print")}
        </Button>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> PDF
        </Button>
      </div>

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div dangerouslySetInnerHTML={{
          __html: `
            <div class="page">
              <h1>${assignment.title}</h1>
              <h2>Тест топшириқлари</h2>
              <div class="meta">
                <span>Синф: <strong>${assignment.grade}</strong></span>
                <span>Ўқувчи: <span class="fill-line"></span></span>
                <span>Сана: <strong>${assignment.date}</strong></span>
              </div>
              ${assignment.questions.map(q => `
                <div class="question">
                  <div class="question-text">${q.num}. ${q.text}</div>
                  ${q.options ? `<div class="options">${q.options.map(o => `<div>${o}</div>`).join("")}</div>` : ""}
                </div>
              `).join("")}
            </div>
            <div class="page">
              <h1>ЖАВОБЛАР ВАРАҚАСИ</h1>
              <h2>${assignment.title} — Ўқитувчи учун</h2>
              <div class="meta">
                <span>Синф: <strong>${assignment.grade}</strong></span>
                <span>Сана: <strong>${assignment.date}</strong></span>
                <span>Жами: <strong>${assignment.questions.length} та савол</strong></span>
              </div>
              <div class="answer-key">⚠️ Бу варақа фақат ўқитувчи учун!</div>
              <div class="answers-grid">
                ${assignment.questions.map(q => `
                  <div class="answer-item">
                    <div class="answer-num">№${q.num}</div>
                    <strong>${q.answer}</strong>
                  </div>
                `).join("")}
              </div>
              <div style="margin-top:20pt; border-top:1px solid #000; padding-top:10pt; font-size:10pt;">
                <strong>Баҳолаш жадвали:</strong>
                <div class="answers-grid" style="grid-template-columns: repeat(4,1fr); margin-top:6pt;">
                  <div class="answer-item">90-100% → "5"</div>
                  <div class="answer-item">75-89% → "4"</div>
                  <div class="answer-item">55-74% → "3"</div>
                  <div class="answer-item">0-54% → "2"</div>
                </div>
              </div>
            </div>
          `
        }} />
      </div>

      {/* A4 Preview */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Student sheet */}
        <div className="flex-1">
          <div className="text-xs font-sans font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Ўқувчи учун (1-варақ А4)
          </div>
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"
            style={{ aspectRatio: "1/1.414", padding: "32px", fontFamily: "serif", fontSize: "11px", color: "#000" }}>
            <h2 className="text-center font-bold text-base mb-1" style={{ fontFamily: "serif" }}>{assignment.title}</h2>
            <p className="text-center text-gray-600 text-xs mb-4">Тест топшириқлари</p>
            <div className="flex justify-between text-xs mb-4 pb-2 border-b border-gray-400">
              <span>Синф: <strong>{assignment.grade}</strong></span>
              <span>Ўқувчи: <span className="inline-block w-32 border-b border-gray-600"></span></span>
              <span>Сана: {assignment.date}</span>
            </div>
            <div className="space-y-2">
              {assignment.questions.slice(0, 12).map((q) => (
                <div key={q.num}>
                  <p className="font-bold text-xs">{q.num}. {q.text}</p>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-x-4 pl-3 text-xs text-gray-700">
                      {q.options.map((opt, i) => <span key={i}>{opt}</span>)}
                    </div>
                  )}
                </div>
              ))}
              {assignment.questions.length > 12 && (
                <p className="text-xs text-gray-400 text-center pt-2">... ва {assignment.questions.length - 12} та савол яна</p>
              )}
            </div>
          </div>
        </div>

        {/* Answer key sheet */}
        <div className="flex-1">
          <div className="text-xs font-sans font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Ўқитувчи учун (2-варақ А4)
          </div>
          <div className="bg-white border-2 border-blue-200 shadow-lg rounded-lg overflow-hidden"
            style={{ aspectRatio: "1/1.414", padding: "32px", fontFamily: "serif", fontSize: "11px", color: "#000" }}>
            <h2 className="text-center font-bold text-base mb-1" style={{ fontFamily: "serif" }}>ЖАВОБЛАР ВАРАҚАСИ</h2>
            <p className="text-center text-gray-600 text-xs mb-4">{assignment.title} — Ўқитувчи учун</p>
            <div className="flex justify-between text-xs mb-3 pb-2 border-b border-gray-400">
              <span>Синф: <strong>{assignment.grade}</strong></span>
              <span>Жами: <strong>{assignment.questions.length} савол</strong></span>
              <span>{assignment.date}</span>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs mb-4 text-yellow-800">
              ⚠️ Бу варақа фақат ўқитувчи учун!
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {assignment.questions.map((q) => (
                <div key={q.num} className="border border-gray-300 rounded text-center p-1">
                  <div className="text-gray-400" style={{ fontSize: "9px" }}>№{q.num}</div>
                  <div className="font-bold text-xs">{q.answer.split(")")[0]})</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-300 pt-3 mt-auto">
              <p className="text-xs font-bold mb-1.5">Баҳолаш жадвали:</p>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {[["90-100%", '"5"', "bg-green-100"], ["75-89%", '"4"', "bg-blue-100"], ["55-74%", '"3"', "bg-yellow-100"], ["0-54%", '"2"', "bg-red-100"]].map(([pct, grade, bg]) => (
                  <div key={pct} className={`${bg} rounded text-center p-1`}>
                    <div>{pct}</div><div className="font-bold">{grade}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────── Assignment Generator (inner component) ────────────────
const AssignmentGenerator = () => {
  const { t, lang } = useLang();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedAssignment | null>(null);
  const { activeClassId } = useClass();

  const detectSubject = (p: string) => {
    const l = p.toLowerCase();
    if (l.includes("geo") || l.includes("геогр")) return "Geography";
    if (l.includes("mat") || l.includes("матем") || l.includes("calc")) return "Mathematics";
    if (l.includes("bio") || l.includes("биол")) return "Biology";
    if (l.includes("his") || l.includes("tar") || l.includes("истор")) return "History";
    if (l.includes("phy") || l.includes("физик")) return "Physics";
    if (l.includes("chem") || l.includes("хим")) return "Chemistry";
    if (l.includes("eng") || l.includes("англ")) return "English";
    return "General Knowledge";
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    const subject = detectSubject(prompt);
    const countMatch = prompt.match(/(\d+)/);
    const count = countMatch ? parseInt(countMatch[1]) : 10;
    // FIX #4: передаём язык в запрос
    const langInstruction = lang === "uz" ? "in Uzbek language" : "in Russian language";

    try {
      const res = await api.post("/generate/assignment", {
        subject: subject,
        topic: `${prompt} (${langInstruction})`,
        count: Math.min(count, 20),
        class_id: activeClassId
      });

      const data = res.data.result;
      const finalResult: GeneratedAssignment = {
        title: data.title || "Generated Assignment",
        subject: data.subject || subject,
        grade: data.grade || "N/A",
        questions: data.questions || [],
        date: new Date().toLocaleDateString("ru-RU")
      };

      setResult(finalResult);
      toast.success(lang === "uz" ? "Topshiriq yaratildi!" : "Задание создано!");
    } catch (e) {
      console.error(e);
      toast.error(lang === "uz" ? "Xatolik. Qayta urinib ko'ring." : "Ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
        <Textarea
          placeholder={lang === "uz"
            ? "Masalan: '5-sinf uchun 10 ta matematika savoli' yoki 'Geografiya, Osiyo, 8 ta savol'"
            : "Например: 'Создай 10 вопросов по математике для 5 класса' или 'География, Азия, 8 вопросов'"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] font-sans text-sm resize-none rounded-xl"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-sans">Ctrl+Enter — {t("generating")}</p>
          <Button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("generating")}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {t("genButton")}</>
            )}
          </Button>
        </div>
      </div>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-sans text-sm">
            {lang === "uz" ? "AI kontent yaratmoqda..." : "AI создаёт контент..."}
          </p>
        </motion.div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* FIX #2: передаём t и lang как пропсы */}
          <AssignmentPrintView assignment={result} t={t} lang={lang} />
        </motion.div>
      )}

      {!result && !loading && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-sans text-sm">{t("describeAssignment")}</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {(lang === "uz" ? [
              "5-sinf uchun 10 ta matematika savoli",
              "Geografiya bo'yicha 8 ta test",
              "Biologiya, o'simliklar, 6 ta savol",
            ] : [
              "10 вопросов по математике для 5 класса",
              "Тест по географии, 8 вопросов",
              "Биология, растения, 6 вопросов",
            ]).map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-xs font-sans bg-muted hover:bg-blue-50 hover:text-blue-700 text-muted-foreground px-3 py-1.5 rounded-lg border border-border transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────── Main Tools Page ────────────────
type Tool = "roulette" | "board" | "generator";

const Tools = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [activeTool, setActiveTool] = useState<Tool>("roulette");
  const [names, setNames] = useState<string[]>(["Alice", "Bob", "Charlie", "Diana"]);
  const [inputName, setInputName] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const addName = () => {
    if (inputName.trim() && !spinning) { setNames((prev) => [...prev, inputName.trim()]); setInputName(""); }
  };
  const removeName = (i: number) => { if (!spinning) setNames((prev) => prev.filter((_, idx) => idx !== i)); };
  const spin = () => {
    if (names.length < 2 || spinning) return;
    setSpinning(true); setWinner(null);
    setTimeout(() => { setWinner(names[Math.floor(Math.random() * names.length)]); setSpinning(false); }, 4100);
  };

  const tabs: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "roulette", icon: <Dices className="w-4 h-4" />, label: "Рулетка" },
    { id: "board", icon: <Palette className="w-4 h-4" />, label: "Доска" },
    { id: "generator", icon: <FileText className="w-4 h-4" />, label: "Генератор" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </button>
          <h1 className="text-xl font-bold text-foreground font-serif">{t("navTools")}</h1>

          <div className="ml-6 flex bg-muted rounded-full p-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTool(tab.id)}
                className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeTool === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {activeTool === tab.id && (
                  <motion.div layoutId="toolPill" className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon} {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTool === "roulette" && (
            <motion.div key="roulette" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-full lg:w-80 bg-card rounded-2xl border border-border p-6 flex flex-col gap-4">
                <h3 className="font-bold text-foreground font-serif text-lg">{t("studentNames")}</h3>
                <div className="flex gap-2">
                  <Input placeholder={t("addName")} value={inputName} onChange={(e) => setInputName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addName()} className="h-10 rounded-xl font-sans" disabled={spinning} />
                  <Button size="sm" className="h-10 px-3 rounded-xl" onClick={addName} disabled={spinning}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {names.map((name, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-sans font-medium text-foreground">{name}</span>
                      </div>
                      <button onClick={() => removeName(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <Button onClick={spin} disabled={names.length < 2 || spinning} className="w-full h-12 rounded-xl font-sans font-semibold gap-2 mt-2">
                  {spinning ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}><Dices className="w-5 h-5" /></motion.div> {t("spinning")}</>
                  ) : (
                    <><Dices className="w-5 h-5" /> {t("spinWheel")}</>
                  )}
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center py-8">
                {names.length >= 2 ? (
                  <RouletteWheel names={names} spinning={spinning} winner={winner} />
                ) : (
                  <div className="text-center text-muted-foreground font-sans">
                    <Dices className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>{t("addAtLeastTwo")}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTool === "board" && (
            <motion.div key="board" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* FIX #1: передаём t в DrawingBoard */}
              <DrawingBoard t={t} />
            </motion.div>
          )}
          {activeTool === "generator" && (
            <motion.div key="generator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <AssignmentGenerator />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Tools;
