import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useRef, RefObject, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Printer, Download, Pencil, Loader2, Sparkles, Calculator, LayoutGrid, GraduationCap, ChevronDown, Check, Plus, Save, Brain, Trophy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useClass } from "@/context/ClassContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { generateCrosswordLayout, CrosswordGrid } from "@/lib/crossword";

type GeneratorType = "math" | "crossword" | "quiz" | "assignment";

// Заменяет x^2 → x<sup>2</sup>, поддерживает любые степени
function formatMathText(text: string): React.ReactNode {
  const parts = text.split(/(\w+\^\d+)/g);
  return parts.map((part, i) => {
    const match = part.match(/^(\w+)\^(\d+)$/);
    if (match) {
      return <span key={i}>{match[1]}<sup>{match[2]}</sup></span>;
    }
    return <span key={i}>{part}</span>;
  });
}
// difficulties are handled via t() now

const SegmentedControl = ({
  label,
  options,
  value,
  onChange,
  segId,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  segId: string;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
    <div className="flex bg-muted rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`relative flex-1 py-2.5 text-sm font-medium font-sans rounded-lg transition-colors ${value === opt ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
        >
          {value === opt && (
            <motion.div
              layoutId={`seg-${segId}`}
              className="absolute inset-0 bg-primary rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt}</span>
        </button>
      ))}
    </div>
  </div>
);

const Generator = () => {
  const navigate = useNavigate();
  const { activeClass, activeClassId, classes, setActiveClassId } = useClass();
  const { lang, t } = useLang();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [genType, setGenType] = useState<GeneratorType>("math");

  // Math fields
  const [mathTopic, setMathTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");

  // Crossword fields
  const [crosswordTopic, setCrosswordTopic] = useState("");
  const [wordCount, setWordCount] = useState("10");

  // Quiz fields
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState("5");

  // Assignment fields
  const [assignSubject, setAssignSubject] = useState("");
  const [assignTopic, setAssignTopic] = useState("");
  const [assignCount, setAssignCount] = useState("5");

  // Results State
  const [quizData, setQuizData] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState<any>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<{ q: string, a: string }[]>([]);

  // Crossword state
  const [crosswordData, setCrosswordData] = useState<CrosswordGrid | null>(null);
  const [rawCrosswordWords, setRawCrosswordWords] = useState<any[]>([]);

  const handleRetryLayout = () => {
    if (rawCrosswordWords.length === 0) return;
    setIsGenerating(true);
    // Small timeout to allow UI to show loading state
    setTimeout(() => {
      const layout = generateCrosswordLayout(rawCrosswordWords);
      if (layout) {
        setCrosswordData(layout);
        toast.success("Layout regenerated!");
      } else {
        toast.error("Could not find a valid layout. Try again.");
      }
      setIsGenerating(false);
    }, 100);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerated(false);
    setCrosswordData(null);
    setRawCrosswordWords([]);
    setQuizData([]);
    setAssignmentData(null);

    try {
      const langInstruction = lang === "uz" ? "in Uzbek language" : "in Russian language";

      if (genType === "math") {
        const payload = {
          topic: `${mathTopic} (${langInstruction})`,
          count: parseInt(questionCount) || 10,
          difficulty: difficulty,
          class_id: activeClassId
        };
        const res = await api.post("/generate/math", payload);
        setGeneratedProblems(res.data.problems);
      } else if (genType === "quiz") {
        const payload = {
          topic: `${quizTopic} (${langInstruction})`,
          count: parseInt(quizCount) || 5,
          class_id: activeClassId
        };
        const res = await api.post("/generate/quiz", payload);
        setQuizData(res.data.questions);
      } else if (genType === "assignment") {
        // Автоопределение предмета если не задан
        const finalSubject = assignSubject.trim() || "General";
        const payload = {
          subject: finalSubject,
          topic: `${assignTopic} (${langInstruction})`,
          count: parseInt(assignCount) || 5,
          class_id: activeClassId
        };
        const res = await api.post("/generate/assignment", payload);
        setAssignmentData(res.data.result);
      } else {
        const payload = {
          topic: crosswordTopic,
          word_count: parseInt(wordCount) || 10,
          language: lang === "uz" ? "O'zbekcha" : "Русский",
          class_id: activeClassId
        };
        const res = await api.post("/generate/crossword", payload);
        // Backend returns { words: [{word, clue}, ...] }
        setRawCrosswordWords(res.data.words);

        // We need to generate the layout
        const layout = generateCrosswordLayout(res.data.words);
        if (!layout) {
          toast.error("Could not arrange words into a crossword. Try again or fewer words.");
          return;
        }
        setCrosswordData(layout);
      }
      setGenerated(true);
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate content. Check API connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate =
    (genType === "math" && mathTopic.trim().length > 0) ||
    (genType === "crossword" && crosswordTopic.trim().length > 0) ||
    (genType === "quiz" && quizTopic.trim().length > 0) ||
    // Assignment: требуем только topic (subject автоопределяется)
    (genType === "assignment" && assignTopic.trim().length > 0);


  // Edit & Save State
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const puzzleRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    // Helper to add a page
    const addPage = async (element: HTMLElement | null, isFirstPage: boolean) => {
      if (!element) return;

      // Temporarily make visible for capture if needed, though they should be rendered
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = width;
      const imgHeight = (canvas.height * width) / canvas.width;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    };

    try {
      toast.info("Generating PDF... Please wait.");
      // Page 1: Puzzle
      await addPage(puzzleRef.current, true);

      // Page 2: Answers
      if (answerRef.current) {
        await addPage(answerRef.current, false);
      }

      pdf.save('generated-content.pdf');
      toast.success("PDF downloaded successfully!");
    } catch (e) {
      console.error("PDF Generation failed", e);
      toast.error("Failed to generate PDF");
    }
  };

  const openEdit = () => {
    if (genType === "math") {
      setEditContent(JSON.stringify(generatedProblems, null, 2));
    } else if (genType === "crossword" && crosswordData) {
      // For crossword, we edit the word list mostly, but let's expose the whole object structure for advanced users
      // or maybe just the words? Let's do words + grid size if possible, but grid is auto-generated.
      // Re-generating layout from edited words is better. 
      // But here we are editing the *result* state.
      // Let's just allow editing the words list for now if we want to re-generate layout?
      // actually, the user wants to edit the CONTENT.
      // If I edit the grid directly, it's hard.
      // Let's allow editing the words text.
      // But for simplicity of "universal" editing, let's just JSON dump the data.
      setEditContent(JSON.stringify(crosswordData, null, 2));
    } else if (genType === "quiz" && quizData) {
      setEditContent(JSON.stringify(quizData, null, 2));
    } else if (genType === "assignment" && assignmentData) {
      setEditContent(JSON.stringify(assignmentData, null, 2));
    } else {
      return;
    }
    setShowEdit(true);
  };

  const saveEdit = () => {
    try {
      if (genType === "math") {
        setGeneratedProblems(JSON.parse(editContent));
      } else if (genType === "crossword") {
        setCrosswordData(JSON.parse(editContent));
      } else if (genType === "quiz") {
        setQuizData(JSON.parse(editContent));
      } else if (genType === "assignment") {
        setAssignmentData(JSON.parse(editContent));
      }
      setShowEdit(false);
      toast.success("Changes applied!");
    } catch (e) {
      toast.error("Invalid JSON format. Please check your syntax.");
    }
  };

  const handleSaveResource = async () => {
    if (!saveTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setIsSaving(true);
    try {
      let content = "";
      if (genType === "math") content = JSON.stringify({ problems: generatedProblems });
      else if (genType === "crossword") content = JSON.stringify({ words: crosswordData?.words, grid: crosswordData?.grid, width: crosswordData?.width, height: crosswordData?.height });
      else if (genType === "quiz") content = JSON.stringify({ questions: quizData });
      else if (genType === "assignment") content = JSON.stringify(assignmentData);

      await api.post("/resources/", {
        title: saveTitle,
        type: genType,
        content: content
      });
      toast.success("Resource saved to Profile!");
      setShowSaveDialog(false);
      setSaveTitle("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save resource");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Settings Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-[400px] bg-card border-r border-border flex flex-col print:hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t("backToDash")}
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("cardAiTitle")}</h1>
              <p className="text-sm text-muted-foreground font-sans">{t("gamesSub")}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("activeClass")}</Label>
              {classes.length > 0 ? (
                <>
                  <button
                    onClick={() => setShowClassPicker(!showClassPicker)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {activeClass ? (
                          <>
                            <p className="text-sm font-semibold text-foreground font-sans truncate">{activeClass.name}</p>
                            <p className="text-xs text-muted-foreground font-sans truncate">{t("gradeLabel")} {activeClass.grade} • {activeClass.studentCount} {t("studentsLabel")}</p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground font-sans">{t("selectClass")}</p>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showClassPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto"
                      >
                        {classes.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground font-sans">{cls.name}</p>
                              <p className="text-xs text-muted-foreground font-sans">{t("gradeLabel")} {cls.grade}</p>
                            </div>
                            {cls.id === activeClassId && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                        <button
                          onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-primary font-semibold font-sans hover:bg-muted transition-colors border-t border-border bg-muted/30"
                        >
                          <Plus className="w-3.5 h-3.5" /> {t("createNewClass")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button
                  onClick={() => navigate("/classes")}
                  className="w-full rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors font-sans flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("addFirstClass")}
                </button>
              )}
            </div>

            {/* Context Info */}
            {activeClass?.description && (
              <div className="mb-6 px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5" />
                  <p className="text-xs text-primary/80 font-sans leading-relaxed">
                    <span className="font-semibold text-primary">{t("genContext")}:</span> {activeClass.description}
                  </p>
                </div>
              </div>
            )}


            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "math", label: t("genMath"), icon: Calculator },
                { id: "crossword", label: t("genCrossword"), icon: LayoutGrid },
                { id: "quiz", label: t("genQuiz"), icon: Brain },
                { id: "assignment", label: t("genAssignment"), icon: FileText },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setGenType(type.id as GeneratorType); setGenerated(false); }}
                  className={`relative flex items-center justify-center gap-2 py-3 text-sm font-medium font-sans rounded-xl transition-all border ${genType === type.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                    }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div> {/* This is the missing closing div */}

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {genType === "math" && (
              <motion.div
                key="math"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genTopic")}</Label>
                  <Input
                    placeholder={t("genTopicPlaceholder")}
                    value={mathTopic}
                    onChange={(e) => setMathTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genCount")} (10–30)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="30"
                    placeholder="15"
                    value={questionCount}
                    onChange={(e) => {
                      const v = Math.min(30, Math.max(10, parseInt(e.target.value) || 10));
                      setQuestionCount(String(v));
                    }}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <SegmentedControl
                  label={t("genDiff")}
                  options={[t("genDiffEasy"), t("genDiffMed"), t("genDiffHard")]}
                  value={difficulty === "Easy" ? t("genDiffEasy") : difficulty === "Hard" ? t("genDiffHard") : t("genDiffMed")}
                  onChange={(v) => {
                    const diffMap: any = { [t("genDiffEasy")]: "Easy", [t("genDiffMed")]: "Medium", [t("genDiffHard")]: "Hard" };
                    setDifficulty(diffMap[v]);
                  }}
                  segId="difficulty"
                />
              </motion.div>
            )}
            {genType === "crossword" && (
              <motion.div
                key="crossword"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genTopic")}</Label>
                  <Input
                    placeholder={t("genTopicPlaceholder")}
                    value={crosswordTopic}
                    onChange={(e) => setCrosswordTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genCount")}</Label>
                  <Input
                    type="number"
                    min="5"
                    max="20"
                    placeholder="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>
              </motion.div>
            )}

            {genType === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genTopic")}</Label>
                  <Input
                    placeholder={t("genTopicPlaceholder")}
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genCount")}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    placeholder="5"
                    value={quizCount}
                    onChange={(e) => setQuizCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>
              </motion.div>
            )}

            {genType === "assignment" && (
              <motion.div
                key="assignment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Subject — выбор или ввод */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Предмет</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Math", "Biology", "History", "Physics", "Chemistry", "English", "Geography", "Literature", "General"].map((s) => (
                      <button key={s} onClick={() => setAssignSubject(s)}
                        className={`py-2 px-2 text-xs font-sans rounded-lg border transition-all ${assignSubject === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="или введите свой предмет..."
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="h-10 rounded-xl font-sans mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genTopic")}</Label>
                  <Input
                    placeholder={t("genTopicPlaceholder")}
                    value={assignTopic}
                    onChange={(e) => setAssignTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genCount")}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    placeholder="5"
                    value={assignCount}
                    onChange={(e) => setAssignCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generate Button */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate}
            className="w-full h-14 text-base font-semibold rounded-xl font-sans gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t("genButton")}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Right Preview */}
      <div className="hidden md:flex flex-1 bg-muted/50 items-center justify-center p-10 relative print:p-0 print:block print:bg-white inset-0 print:absolute print:z-[9999]">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print\\:block, .print\\:block * { visibility: visible; }
            .print\\:absolute { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 20px; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 print:hidden"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground font-sans">AI is generating your content...</p>
            </motion.div>
          )}

          {generated && !isGenerating && (
            <>
              {/* Toolbar */}
              <div className="absolute top-6 right-10 flex gap-2 print:hidden z-10">
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-2 bg-white/80 backdrop-blur">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                {genType === "crossword" && (
                  <Button variant="outline" size="sm" onClick={handleRetryLayout} className="gap-2 bg-white/80 backdrop-blur">
                    <Sparkles className="w-4 h-4" /> Rewrite Layout
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-2 bg-white/80 backdrop-blur">
                  <Printer className="w-4 h-4" /> Print / PDF
                </Button>
              </div>

              {genType === "quiz" && quizData.length > 0 && (() => {
                const QUIZ_PER_PAGE = 10;
                const questionPages = Array.from(
                  { length: Math.ceil(quizData.length / QUIZ_PER_PAGE) },
                  (_, pi) => quizData.slice(pi * QUIZ_PER_PAGE, (pi + 1) * QUIZ_PER_PAGE)
                );
                return (
                  <>
                    {/* Answer key — скрытый, рендерится только для PDF */}
                    <div className="fixed left-[-9999px] top-0">
                      <div ref={answerRef} className="w-[210mm] bg-white p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <img src="/logo-t.png" alt="Logo" className="w-6 h-6 rounded object-contain" />
                            <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">Thompson International</span>
                          </div>
                          <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">Answer Key • {quizTopic}</span>
                        </div>
                        <h2 style={{ fontSize: "14px" }} className="font-bold font-serif mb-4 text-center">Quiz Answer Key</h2>
                        <div className="grid grid-cols-5 gap-1.5">
                          {quizData.map((q, i) => (
                            <div key={i} className="border border-gray-300 rounded text-center p-1.5">
                              <div className="text-gray-400" style={{ fontSize: "8px" }}>№{i + 1}</div>
                              <div className="font-bold text-green-700" style={{ fontSize: "10px" }}>{q.a}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quiz worksheet — многостраничный */}
                    <motion.div
                      ref={puzzleRef}
                      key="quiz-paper"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block print:overflow-visible"
                      style={{ maxHeight: "80vh" }}
                    >
                      {/* Question pages — 10 вопросов на страницу */}
                      {questionPages.map((pageQs, pi) => (
                        <div
                          key={pi}
                          className="p-6 flex flex-col print:p-5"
                          style={{ pageBreakAfter: "always" }}
                        >
                          {/* Header */}
                          {pi === 0 ? (
                            <>
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                                <div className="flex items-center gap-1.5">
                                  <img src="/logo-t.png" alt="Logo" className="w-6 h-6 rounded object-contain" />
                                  <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">Thompson International</span>
                                </div>
                                <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">{quizTopic}</span>
                              </div>
                              <h3 style={{ fontSize: "15px" }} className="font-bold text-gray-900 text-center mb-4 font-serif">Quiz Worksheet</h3>
                            </>
                          ) : (
                            <div className="flex items-center justify-end mb-3 pb-2 border-b border-gray-200">
                              <span style={{ fontSize: "9px" }} className="text-gray-400 font-sans">Стр. {pi + 1}</span>
                            </div>
                          )}

                          {/* Questions — компактный layout */}
                          <div className="space-y-3">
                            {pageQs.map((q, qi) => {
                              const globalIdx = pi * QUIZ_PER_PAGE + qi;
                              return (
                                <div key={qi} className="pb-2 border-b border-gray-100 last:border-0">
                                  <p style={{ fontSize: "11px" }} className="font-semibold text-gray-800 mb-1.5 leading-snug">
                                    {globalIdx + 1}. {q.q}
                                  </p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                                    {q.options?.map((opt: string, idx: number) => (
                                      <div key={idx} style={{ fontSize: "10px" }} className="flex items-start gap-1 text-gray-700">
                                        <span className="shrink-0 w-3 h-3 mt-0.5 rounded-full border border-gray-400 inline-block" />
                                        <span className="leading-tight">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Answer Key — последняя страница */}
                      <div className="p-6 flex flex-col print:p-5 border-t-4 border-dashed border-gray-300" style={{ pageBreakBefore: "always" }}>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <img src="/logo-t.png" alt="Logo" className="w-6 h-6 rounded object-contain" />
                            <span style={{ fontSize: "11px" }} className="font-bold font-serif text-gray-800">Thompson International</span>
                          </div>
                          <span style={{ fontSize: "9px" }} className="text-gray-500 font-sans">Answer Key • {quizTopic}</span>
                        </div>
                        <h3 style={{ fontSize: "14px" }} className="font-bold text-gray-900 text-center mb-4 font-serif">✅ Answer Key (Teacher Copy)</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {quizData.map((q, i) => (
                            <div key={i} className="border border-gray-300 rounded-lg text-center p-2">
                              <div style={{ fontSize: "8px" }} className="text-gray-400 font-sans">№{i + 1}</div>
                              <div style={{ fontSize: "11px" }} className="font-bold text-green-700 font-sans">{q.a}</div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: "9px" }} className="text-gray-400 font-sans italic text-center mt-3">
                          Этот лист только для учителя — не раздавать ученикам.
                        </p>
                      </div>
                    </motion.div>
                  </>
                );
              })()}

              {genType === "assignment" && assignmentData && (
                <>
                  <div className="fixed left-[-9999px] top-0">
                    <div ref={answerRef} className="w-[210mm] min-h-[297mm] bg-white p-10 flex flex-col">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <img src="/logo-t.png" alt="Logo" className="w-8 h-8 rounded object-contain" />
                          <span className="text-sm font-bold font-serif text-gray-800">Thompson International</span>
                        </div>
                        <span className="text-xs text-gray-500 font-sans">Answer Key • {assignmentData.title}</span>
                      </div>
                      <h2 className="text-xl font-bold font-serif mb-6 text-center">Teacher Key</h2>
                      <div className="grid grid-cols-4 gap-1.5 mb-4">
                        {assignmentData.questions.map((q: any) => (
                          <div key={q.num} className="border border-gray-300 rounded text-center p-1">
                            <div className="text-gray-400" style={{ fontSize: "9px" }}>№{q.num}</div>
                            <div className="font-bold text-xs">{q.answer?.split(")")[0] || q.answer})</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <motion.div
                    ref={puzzleRef}
                    key="assignment-paper"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
                    style={{ maxHeight: "80vh" }}
                  >
                    <div className="p-10 h-full flex flex-col print:p-2 print:h-auto">
                      <div className="text-center mb-6 print:mb-4">
                        <h1 className="text-2xl font-bold font-serif text-gray-900 mb-1">{assignmentData.title}</h1>
                        <p className="text-sm text-gray-500 uppercase tracking-widest">{assignmentData.subject} • {assignmentData.grade}</p>
                      </div>

                      {assignmentData.intro && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic border-l-4 border-primary/20">
                          {assignmentData.intro}
                        </div>
                      )}

                      <div className="space-y-4 flex-1 text-sm print:space-y-3">
                        {assignmentData.questions?.map((q: any, i: number) => (
                          <div key={i} className="space-y-1 pb-3 border-b border-gray-100 last:border-0 print:pb-2">
                            <p className="font-semibold text-gray-800">{q.num}. {q.text}</p>
                            <div className="space-y-1 pl-4 print:space-y-0.5">
                              {q.options?.map((opt: string, idx: number) => (
                                <div key={idx} className="text-gray-600 flex items-center gap-2 text-sm print:text-xs">
                                  <span className="w-3 h-3 rounded-full border border-gray-300 inline-block"></span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </>
          )}

          {!generated && !isGenerating && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center print:hidden"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground font-serif mb-1">Ready to Generate</h3>
                <p className="text-muted-foreground font-sans text-sm">Fill in the settings and click Generate</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      < Dialog open={showEdit} onOpenChange={setShowEdit} >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Content</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-60 p-3 rounded-xl border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Save Dialog */}
      < Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog} >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Save to Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource Title</Label>
              <Input
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Algebra Quiz 1"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveResource} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
};

export default Generator;
