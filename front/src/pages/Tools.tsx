import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Dices, Eraser, Palette, FileText, Printer, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const DrawingBoard = () => {
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
          <Eraser className="w-4 h-4" /> Eraser
        </button>
        <button onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-sans font-medium bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto">
          <X className="w-4 h-4" /> Clear
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

function parsePrompt(prompt: string): GeneratedAssignment {
  const lower = prompt.toLowerCase();
  const numMatch = prompt.match(/(\d+)/);
  const count = numMatch ? parseInt(numMatch[1]) : 10;

  // Detect subject
  let subject = "General";
  if (lower.includes("геогр") || lower.includes("geograph")) subject = "География";
  else if (lower.includes("матем") || lower.includes("math")) subject = "Математика";
  else if (lower.includes("биол") || lower.includes("biol")) subject = "Биология";
  else if (lower.includes("истор") || lower.includes("histor")) subject = "История";
  else if (lower.includes("физик") || lower.includes("physic")) subject = "Физика";
  else if (lower.includes("химия") || lower.includes("chemi")) subject = "Химия";
  else if (lower.includes("англий") || lower.includes("english")) subject = "Английский язык";
  else if (lower.includes("узб") || lower.includes("o'zbek")) subject = "Ўзбек тили";
  else if (lower.includes("литер") || lower.includes("liter")) subject = "Литература";
  else if (lower.includes("информ") || lower.includes("informat")) subject = "Информатика";

  // Detect grade
  const gradeMatch = prompt.match(/(\d+)\s*(класс|grade|синф)/i);
  const grade = gradeMatch ? `${gradeMatch[1]}-синф` : "5-синф";

  // Detect language
  const isUzbek = lower.includes("узб") || lower.includes("o'zbek") || lower.includes("узбек");
  const isRussian = lower.includes("рус") || lower.includes("russian") || lower.includes("русск");

  // Generate questions based on subject and language
  const questions = generateQuestions(subject, count, isUzbek, isRussian);

  return {
    title: `${subject} — Синов иши`,
    subject,
    grade,
    questions,
    date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

function generateQuestions(subject: string, count: number, isUzbek: boolean, isRussian: boolean) {
  const geoQuestionsUz = [
    { text: "Ер юзидаги eng katta okean qaysi?", options: ["A) Atlantika", "B) Tinch", "C) Hind", "D) Shimoliy Muz"], answer: "B) Tinch" },
    { text: "Dunyo qit'alarining soni nechta?", options: ["A) 5", "B) 6", "C) 7", "D) 8"], answer: "C) 7" },
    { text: "O'zbekistonning poytaxti qaysi shahar?", options: ["A) Samarqand", "B) Buxoro", "C) Toshkent", "D) Namangan"], answer: "C) Toshkent" },
    { text: "Dunyodagi eng uzun daryo qaysi?", options: ["A) Amazon", "B) Nil", "C) Yantszi", "D) Volga"], answer: "B) Nil" },
    { text: "Eng baland tog' cho'qqisi qaysi?", options: ["A) K2", "B) Kangchenjunga", "C) Everest", "D) Lxotse"], answer: "C) Everest" },
    { text: "Osiyoning maydoni qancha?", options: ["A) 34 mln km²", "B) 44 mln km²", "C) 54 mln km²", "D) 24 mln km²"], answer: "B) 44 mln km²" },
    { text: "Qaysi davlat aholisi bo'yicha eng katta?", options: ["A) Hindiston", "B) Xitoy", "C) AQSH", "D) Rossiya"], answer: "A) Hindiston" },
    { text: "Sahara cho'li qaysi qit'ada joylashgan?", options: ["A) Osiyo", "B) Amerika", "C) Afrika", "D) Avstraliya"], answer: "C) Afrika" },
    { text: "Dunyo okeanlarining umumiy soni?", options: ["A) 3", "B) 4", "C) 5", "D) 6"], answer: "C) 5" },
    { text: "Volga daryosi qaysi davlatdan oqadi?", options: ["A) Ukraina", "B) Belarusiya", "C) Rossiya", "D) Qozog'iston"], answer: "C) Rossiya" },
    { text: "Antarktida — bu nima?", options: ["A) Okean", "B) Qit'a", "C) Orol", "D) Yarim orol"], answer: "B) Qit'a" },
    { text: "Yer atrofida nechta tabiiy yo'ldosh bor?", options: ["A) 0", "B) 1", "C) 2", "D) 3"], answer: "B) 1" },
    { text: "Qaysi qit'ada ko'p mamlakat bor?", options: ["A) Afrika", "B) Osiyo", "C) Amerika", "D) Yevropa"], answer: "A) Afrika" },
    { text: "Amazonka daryosi qaysi qit'ada?", options: ["A) Shimoliy Amerika", "B) Afrika", "C) Janubiy Amerika", "D) Osiyo"], answer: "C) Janubiy Amerika" },
    { text: "Kaspiy dengizi qayerda joylashgan?", options: ["A) Yevropa", "B) Osiyo-Yevropa chegarasida", "C) Osiyo", "D) Afrika"], answer: "B) Osiyo-Yevropa chegarasida" },
  ];

  const geoQuestionsRu = [
    { text: "Какой самый большой океан на Земле?", options: ["A) Атлантический", "B) Тихий", "C) Индийский", "D) Северный Ледовитый"], answer: "B) Тихий" },
    { text: "Сколько континентов на Земле?", options: ["A) 5", "B) 6", "C) 7", "D) 8"], answer: "C) 7" },
    { text: "Столица Узбекистана?", options: ["A) Самарканд", "B) Бухара", "C) Ташкент", "D) Наманган"], answer: "C) Ташкент" },
    { text: "Самая длинная река в мире?", options: ["A) Амазонка", "B) Нил", "C) Янцзы", "D) Волга"], answer: "B) Нил" },
    { text: "Самая высокая горная вершина?", options: ["A) К2", "B) Канченджанга", "C) Эверест", "D) Лхоцзе"], answer: "C) Эверест" },
    { text: "Площадь Азии составляет примерно?", options: ["A) 34 млн км²", "B) 44 млн км²", "C) 54 млн км²", "D) 24 млн км²"], answer: "B) 44 млн км²" },
    { text: "Самая населённая страна мира?", options: ["A) Индия", "B) Китай", "C) США", "D) Россия"], answer: "A) Индия" },
    { text: "На каком континенте пустыня Сахара?", options: ["A) Азия", "B) Америка", "C) Африка", "D) Австралия"], answer: "C) Африка" },
    { text: "Сколько океанов на Земле?", options: ["A) 3", "B) 4", "C) 5", "D) 6"], answer: "C) 5" },
    { text: "Через какую страну протекает Волга?", options: ["A) Украина", "B) Беларусь", "C) Россия", "D) Казахстан"], answer: "C) Россия" },
  ];

  const mathQuestionsUz = [
    { text: "15 × 7 = ?", options: ["A) 95", "B) 100", "C) 105", "D) 110"], answer: "C) 105" },
    { text: "144 ÷ 12 = ?", options: ["A) 10", "B) 11", "C) 12", "D) 13"], answer: "C) 12" },
    { text: "2³ = ?", options: ["A) 6", "B) 8", "C) 9", "D) 12"], answer: "B) 8" },
    { text: "√81 = ?", options: ["A) 7", "B) 8", "C) 9", "D) 10"], answer: "C) 9" },
    { text: "Uchburchak perimetri: tomonlari 5, 7, 9 sm. P = ?", options: ["A) 19 sm", "B) 20 sm", "C) 21 sm", "D) 22 sm"], answer: "C) 21 sm" },
    { text: "1 soat = necha daqiqa?", options: ["A) 50", "B) 60", "C) 100", "D) 120"], answer: "B) 60" },
    { text: "0.5 × 0.5 = ?", options: ["A) 0.1", "B) 0.25", "C) 0.5", "D) 1"], answer: "B) 0.25" },
    { text: "Agar x + 12 = 25, x = ?", options: ["A) 11", "B) 12", "C) 13", "D) 14"], answer: "C) 13" },
    { text: "To'g'ri to'rtburchak yuzi: a=6, b=4. S = ?", options: ["A) 20", "B) 24", "C) 28", "D) 30"], answer: "B) 24" },
    { text: "100 ning 30% i necha?", options: ["A) 20", "B) 25", "C) 30", "D) 35"], answer: "C) 30" },
  ];

  const defaultQuestions = isUzbek
    ? (subject === "Математика" ? mathQuestionsUz : geoQuestionsUz)
    : (subject === "Математика" ? mathQuestionsUz : geoQuestionsRu);

  const result = [];
  for (let i = 0; i < Math.min(count, 20); i++) {
    const q = defaultQuestions[i % defaultQuestions.length];
    result.push({ num: i + 1, ...q });
  }
  return result;
}

const AssignmentPrintView = ({ assignment }: { assignment: GeneratedAssignment }) => {
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
        .student-info { border-bottom: 1px solid #000; margin-bottom: 6pt; display: flex; justify-content: space-between; padding-bottom: 4pt; }
        .fill-line { border-bottom: 1px solid #000; display: inline-block; min-width: 120pt; }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const studentPage = (
    <div className="page" style={{ pageBreakAfter: "always" }}>
      <h1 style={{ fontSize: "16pt", textAlign: "center", marginBottom: "4pt" }}>{assignment.title}</h1>
      <h2 style={{ fontSize: "13pt", textAlign: "center", marginBottom: "12pt", color: "#333" }}>Тест топшириқлари</h2>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "16pt", borderBottom: "1px solid #000", paddingBottom: "8pt" }}>
        <span>Синф: <strong>{assignment.grade}</strong></span>
        <span>Ўқувчи: <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "150pt" }}></span></span>
        <span>Сана: <strong>{assignment.date}</strong></span>
      </div>
      {assignment.questions.map((q) => (
        <div key={q.num} style={{ marginBottom: "14pt" }}>
          <div style={{ fontWeight: "bold", marginBottom: "4pt" }}>{q.num}. {q.text}</div>
          {q.options && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2pt", paddingLeft: "12pt", fontSize: "11pt" }}>
              {q.options.map((opt, i) => <div key={i}>{opt}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const answerPage = (
    <div className="page">
      <h1 style={{ fontSize: "16pt", textAlign: "center", marginBottom: "4pt" }}>ЖАВОБЛАР ВАРАҚАСИ</h1>
      <h2 style={{ fontSize: "13pt", textAlign: "center", marginBottom: "12pt", color: "#333" }}>{assignment.title} — Ўқитувчи учун</h2>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "16pt", borderBottom: "1px solid #000", paddingBottom: "8pt" }}>
        <span>Синф: <strong>{assignment.grade}</strong></span>
        <span>Сана: <strong>{assignment.date}</strong></span>
        <span>Жами: <strong>{assignment.questions.length} та савол</strong></span>
      </div>
      <div style={{ background: "#f5f5f5", padding: "8pt", marginBottom: "16pt", border: "1px solid #ccc", fontSize: "11pt" }}>
        ⚠️ Бу варақа фақат ўқитувчи учун. Ўқувчиларга бермаслик керак!
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6pt", marginTop: "12pt" }}>
        {assignment.questions.map((q) => (
          <div key={q.num} style={{ border: "1px solid #333", padding: "6pt", textAlign: "center" }}>
            <div style={{ fontSize: "9pt", color: "#555" }}>№{q.num}</div>
            <div style={{ fontWeight: "bold", fontSize: "11pt" }}>{q.answer}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "20pt", borderTop: "1px solid #000", paddingTop: "10pt", fontSize: "10pt" }}>
        <strong>Баҳолаш жадвали:</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4pt", marginTop: "6pt" }}>
          <div style={{ border: "1px solid #ccc", padding: "4pt", textAlign: "center" }}>90-100% → "5"</div>
          <div style={{ border: "1px solid #ccc", padding: "4pt", textAlign: "center" }}>75-89% → "4"</div>
          <div style={{ border: "1px solid #ccc", padding: "4pt", textAlign: "center" }}>55-74% → "3"</div>
          <div style={{ border: "1px solid #ccc", padding: "4pt", textAlign: "center" }}>0-54% → "2"</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Printer className="w-4 h-4" /> Chop etish / Печатать
        </Button>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> PDF сақлаш
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

// ... imports
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";

// ... (Roulette and Board code remains same)

// ──────────────── Assignment Generator ────────────────
interface GeneratedAssignment {
  title: string;
  subject: string;
  grade: string;
  questions: { num: number; text: string; options?: string[]; answer: string }[];
  date: string;
}

const AssignmentGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedAssignment | null>(null);
  const { activeClassId } = useClass();

  const detectSubject = (p: string) => {
    const l = p.toLowerCase();
    if (l.includes("geo")) return "Geography";
    if (l.includes("mat") || l.includes("calc")) return "Mathematics";
    if (l.includes("bio")) return "Biology";
    if (l.includes("his") || l.includes("tar")) return "History";
    if (l.includes("phy")) return "Physics";
    if (l.includes("chem")) return "Chemistry";
    if (l.includes("eng")) return "English";
    return "General Knowledge"; // Fallback
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    const subject = detectSubject(prompt);
    // Extract count if possible, else 10
    const countMatch = prompt.match(/(\d+)/);
    const count = countMatch ? parseInt(countMatch[1]) : 10;

    try {
      const res = await api.post("/generate/assignment", {
        subject: subject,
        topic: prompt, // Pass full prompt as topic so AI gets context
        count: Math.min(count, 20),
        class_id: activeClassId
      });

      const data = res.data.result;

      // Ensure date exists
      const finalResult: GeneratedAssignment = {
        title: data.title || "Generated Assignment",
        subject: data.subject || subject,
        grade: data.grade || "N/A",
        questions: data.questions || [],
        date: new Date().toLocaleDateString("ru-RU")
      };

      setResult(finalResult);
      toast.success("Assignment generated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Prompt box */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
        {/* ... UI Code same ... */}
        {/* Just updating the generate button onclick */}
        {/* ... */}

        <Textarea
          placeholder="Example: 'Create a geography quiz about capitals for 5th grade' or '10 math problems about fractions'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] font-sans text-sm resize-none rounded-xl"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate(); }}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-sans">Ctrl+Enter — generate</p>
          <Button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate</>
            )}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-muted-foreground font-sans text-sm">AI is establishing context and creating questions...</p>
        </motion.div>
      )}

      {/* Result */}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AssignmentPrintView assignment={result} />
        </motion.div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-sans text-sm">Describe your assignment above and click Generate</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {[
              "10 Geography questions about Europe",
              "Math test for 6th grade, 15 questions",
              "Biology quiz about plants",
            ].map((ex) => (
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
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl font-bold text-foreground font-serif">Classroom Tools</h1>

          <div className="ml-6 flex bg-muted rounded-full p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTool(t.id)}
                className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeTool === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {activeTool === t.id && (
                  <motion.div layoutId="toolPill" className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t.icon} {t.label}
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
                <h3 className="font-bold text-foreground font-serif text-lg">Student Names</h3>
                <div className="flex gap-2">
                  <Input placeholder="Add a name..." value={inputName} onChange={(e) => setInputName(e.target.value)}
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
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}><Dices className="w-5 h-5" /></motion.div> Spinning...</>
                  ) : (
                    <><Dices className="w-5 h-5" /> Spin the Wheel!</>
                  )}
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center py-8">
                {names.length >= 2 ? (
                  <RouletteWheel names={names} spinning={spinning} winner={winner} />
                ) : (
                  <div className="text-center text-muted-foreground font-sans">
                    <Dices className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Add at least 2 names to spin</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTool === "board" && (
            <motion.div key="board" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DrawingBoard />
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
