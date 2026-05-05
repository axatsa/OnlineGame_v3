
import React, { useRef, RefObject, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Printer, Download, Pencil, Loader2, Sparkles, Calculator, LayoutGrid, GraduationCap, ChevronDown, Check, Plus, Save, Brain, Trophy, FileText, BookmarkPlus, Gamepad2 } from "lucide-react";
import { AIGeneratingOverlay } from "@/components/feedback/AIGeneratingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useClass } from "@/context/ClassContext";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { toast } from "sonner";
import { generateCrosswordLayout, CrosswordGrid } from "@/lib/crossword";
import { EmptyState } from "@/components/common/EmptyState";
import { RichTextRenderer } from "@/components/common/RichTextRenderer";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { downloadDOCX, cleanMathForExport, AssignmentData, QuizQuestion, MathProblem } from "@/lib/generatorExport";
import type { GeneratorType } from "@/lib/generatorExport";
import { handleAIError } from "@/lib/errorUtils";
import ResultEditor from "@/pages/tools/ResultEditor";

import { MathForm } from "@/components/generator/forms/MathForm";
import { CrosswordForm } from "@/components/generator/forms/CrosswordForm";
import { QuizForm } from "@/components/generator/forms/QuizForm";
import { AssignmentForm } from "@/components/generator/forms/AssignmentForm";

import { MathPreview } from "@/components/generator/preview/MathPreview";
import { QuizPreview } from "@/components/generator/preview/QuizPreview";
import { AssignmentPreview } from "@/components/generator/preview/AssignmentPreview";
import { CrosswordPreview } from "@/components/generator/preview/CrosswordPreview";
import { ResourceQRCode } from "@/components/common/ResourceQRCode";



const Generator = () => {
  const navigate = useNavigate();
  const { activeClass, activeClassId, classes, setActiveClassId } = useClass();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [orgName, setOrgName] = useState(() => localStorage.getItem("orgName") || "");
  const [genType, setGenType] = useState<GeneratorType>("math");
  const [targetLang, setTargetLang] = useState(lang === "uz" ? "Uzbek" : lang === "en" ? "English" : "Russian");

  // Math fields
  const [mathTopic, setMathTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");

  // Crossword fields
  const [crosswordTopic, setCrosswordTopic] = useState("");
  const [wordCount, setWordCount] = useState("10");
  const [crosswordMode, setCrosswordMode] = useState<"ai" | "custom">("ai");
  const [customWordsText, setCustomWordsText] = useState("");

  // Quiz fields
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState("5");

  // Assignment fields
  const [assignSubject, setAssignSubject] = useState("");
  const [assignTopic, setAssignTopic] = useState("");
  const [assignCount, setAssignCount] = useState("5");

  // Material context
  const [materials, setMaterials] = useState<{ id: number; filename: string }[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ id: number; filename: string }[]>("/materials/")
      .then((r) => setMaterials(r.data))
      .catch(() => {/* silently ignore */});
  }, []);

  // Results State
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<MathProblem[]>([]);

  // Batch states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState("3");

  const [lastLogId, setLastLogId] = useState<number | null>(null);
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
    setSavedResourceId(null);
    setLastLogId(null);

    try {
      const langLabel = targetLang;

      if (isBatchMode) {
        let params: any = {};
        if (genType === "math") params = { topic: mathTopic, count: parseInt(questionCount), difficulty };
        else if (genType === "quiz") params = { topic: quizTopic, count: parseInt(quizCount) };
        else if (genType === "assignment") params = { subject: assignSubject, topic: assignTopic, count: parseInt(assignCount) };
        else {
          toast.error("Crosswords do not support batch generation yet.");
          setIsGenerating(false);
          return;
        }

        const res = await api.post("/generate/batch", {
          tool_type: genType,
          count: parseInt(batchCount) || 3,
          params: params,
          language: langLabel,
          class_id: activeClassId
        }, { responseType: 'blob' });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `batch_${genType}_${new Date().toISOString().split('T')[0]}.zip`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success("Batch ZIP generated and downloading!");
        setIsGenerating(false);
        return;
      }

      const matId = selectedMaterialId ?? undefined;

      if (genType === "math") {
        const payload = {
          topic: mathTopic,
          count: parseInt(questionCount) || 10,
          difficulty: difficulty,
          language: langLabel,
          class_id: activeClassId,
          material_id: matId,
        };
        const res = await api.post("/generate/math", payload);
        setGeneratedProblems(res.data.problems);
        setLastLogId(res.data.log_id);
      } else if (genType === "quiz") {
        const payload = {
          topic: quizTopic,
          count: parseInt(quizCount) || 5,
          language: langLabel,
          class_id: activeClassId,
          material_id: matId,
        };
        const res = await api.post("/generate/quiz", payload);
        setQuizData(res.data.questions);
        setLastLogId(res.data.log_id);
      } else if (genType === "assignment") {
        const finalSubject = assignSubject.trim() || "General";
        const payload = {
          subject: finalSubject,
          topic: assignTopic,
          count: parseInt(assignCount) || 5,
          language: langLabel,
          class_id: activeClassId,
          material_id: matId,
        };
        const res = await api.post("/generate/assignment", payload);
        setAssignmentData(res.data.result);
        setLastLogId(res.data.log_id);
      } else {
        let payload: any;
        if (crosswordMode === "custom") {
          const parsedLines = customWordsText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          payload = {
            custom_words: parsedLines,
            language: langLabel,
            class_id: activeClassId,
          };
        } else {
          payload = {
            topic: crosswordTopic,
            word_count: parseInt(wordCount) || 10,
            language: langLabel,
            class_id: activeClassId,
            material_id: matId,
          };
        }
        const res = await api.post("/generate/crossword", payload);
        setLastLogId(res.data.log_id);
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
      setMobileTab("preview");
      toast.success("Content generated successfully!");
    } catch (error) {
      handleAIError(error, t);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate =
    (genType === "math" && mathTopic.trim().length > 0) ||
    (genType === "crossword" && (
      (crosswordMode === "ai" && crosswordTopic.trim().length > 0) ||
      (crosswordMode === "custom" && customWordsText.trim().length > 0)
    )) ||
    (genType === "quiz" && quizTopic.trim().length > 0) ||
    // Assignment: требуем только topic (subject автоопределяется)
    (genType === "assignment" && assignTopic.trim().length > 0);


  // Edit & Save State
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState<any>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedResourceId, setSavedResourceId] = useState<number | null>(null);

  // Template State
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");

  const fetchTemplates = async () => {
    try {
      const res = await api.get(`/generate/templates?feature=${genType}`);
      setTemplates(res.data);
    } catch (err) { }
  };

  React.useEffect(() => {
    fetchTemplates();
  }, [genType]);

  const loadTemplate = (tmpl: any) => {
    const p = tmpl.params;
    if (genType === "math") {
      if (p.topic) setMathTopic(p.topic);
      if (p.count) setQuestionCount(String(p.count));
      if (p.difficulty) setDifficulty(p.difficulty);
    } else if (genType === "crossword") {
      if (p.topic) setCrosswordTopic(p.topic);
      if (p.word_count) setWordCount(String(p.word_count));
    } else if (genType === "quiz") {
      if (p.topic) setQuizTopic(p.topic);
      if (p.count) setQuizCount(String(p.count));
    } else if (genType === "assignment") {
      if (p.subject) setAssignSubject(p.subject);
      if (p.topic) setAssignTopic(p.topic);
      if (p.count) setAssignCount(String(p.count));
    }
    toast.success(t("genTemplateLoaded"));
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast.error(t("genTemplateTitleRequired"));
      return;
    }
    try {
      const params = genType === "math" ? { topic: mathTopic, count: parseInt(questionCount), difficulty } :
        genType === "crossword" ? { topic: crosswordTopic, word_count: parseInt(wordCount) } :
          genType === "quiz" ? { topic: quizTopic, count: parseInt(quizCount) } :
            { subject: assignSubject, topic: assignTopic, count: parseInt(assignCount) };

      await api.post("/generate/templates", {
        feature: genType,
        name: templateTitle,
        description: "",
        params: params,
        is_system: false
      });
      toast.success(t("genTemplateSaved"));
      setShowTemplateDialog(false);
      setTemplateTitle("");
      fetchTemplates();
    } catch (e) {
      toast.error(t("genTemplateSaveError"));
    }
  };


  const puzzleRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const handleDownloadDOCX = async () => {
    await downloadDOCX({
      genType,
      orgName,
      generatedProblems,
      mathTopic,
      difficulty,
      quizData,
      quizTopic,
      assignmentData,
      crosswordData,
      crosswordTopic
    });
  };

  const openEdit = () => {
    if (genType === "math") {
      setEditContent(generatedProblems);
    } else if (genType === "crossword" && crosswordData) {
      setEditContent(crosswordData);
    } else if (genType === "quiz" && quizData) {
      setEditContent(quizData);
    } else if (genType === "assignment" && assignmentData) {
      setEditContent(assignmentData);
    } else {
      return;
    }
    setShowEdit(true);
  };

  const saveEdit = (newData: any) => {
    try {
      if (genType === "math") {
        setGeneratedProblems(newData);
      } else if (genType === "crossword") {
        setCrosswordData(newData);
      } else if (genType === "quiz") {
        setQuizData(newData);
      } else if (genType === "assignment") {
        setAssignmentData(newData);
      }
      setShowEdit(false);
      toast.success("Changes applied!");
    } catch (e) {
      toast.error("Format error. Please check your inputs.");
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

      const res = await api.post("/resources/", {
        title: saveTitle,
        type: genType,
        content: content
      });
      setSavedResourceId(res.data.id ?? null);
      toast.success("Ресурс сохранён в профиле!");
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

      {/* ── AI LOADING OVERLAY ── */}
      <AIGeneratingOverlay isGenerating={isGenerating} />

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex print:hidden">
        <button
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${mobileTab === "form" ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}
        >
          {t("genMobileSettings")}
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${mobileTab === "preview" ? "text-primary border-t-2 border-primary -mt-px" : "text-muted-foreground"}`}
        >
          {t("genMobileResult")}
        </button>
      </div>

      {/* Left Settings Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`w-full md:w-[400px] bg-card border-r border-border flex flex-col print:hidden pb-16 md:pb-0 ${mobileTab === "preview" ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <button
            onClick={() => navigate("/teacher")}
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("genOrgName")}</Label>
              <Input
                placeholder={t("genOrgNamePlaceholder")}
                value={orgName}
                onChange={e => { setOrgName(e.target.value); localStorage.setItem("orgName", e.target.value); }}
                className="rounded-xl font-sans"
              />
            </div>
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


            {/* Generation Language Switcher */}
            <SegmentedControl
              label={t("language_label")}
              options={[t("lang_ru"), t("lang_uz"), t("lang_en")]}
              value={targetLang === "Russian" ? t("lang_ru") : targetLang === "Uzbek" ? t("lang_uz") : t("lang_en")}
              onChange={(v) => {
                const langMap: any = { [t("lang_ru")]: "Russian", [t("lang_uz")]: "Uzbek", [t("lang_en")]: "English" };
                setTargetLang(langMap[v]);
              }}
              segId="targetLang"
            />

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
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {genType === "math" && (
              <MathForm
                topic={mathTopic}
                setTopic={setMathTopic}
                count={questionCount}
                setCount={setQuestionCount}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
              />
            )}
            {genType === "crossword" && (
              <CrosswordForm
                mode={crosswordMode}
                setMode={setCrosswordMode}
                topic={crosswordTopic}
                setTopic={setCrosswordTopic}
                count={wordCount}
                setCount={setWordCount}
                customWordsText={customWordsText}
                setCustomWordsText={setCustomWordsText}
              />
            )}

            {genType === "quiz" && (
              <QuizForm
                topic={quizTopic}
                setTopic={setQuizTopic}
                count={quizCount}
                setCount={setQuizCount}
              />
            )}

            {genType === "assignment" && (
              <AssignmentForm
                subject={assignSubject}
                setSubject={setAssignSubject}
                topic={assignTopic}
                setTopic={setAssignTopic}
                count={assignCount}
                setCount={setAssignCount}
              />
            )}
          </AnimatePresence>

          {/* Batch Generation Toggle */}
          {genType !== "crossword" && (
            <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("genBatchTitle")}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t("genBatchSubtitle")}</p>
                </div>
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBatchMode ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBatchMode ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {isBatchMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 pt-2"
                >
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("genBatchCountLabel")}</Label>
                  <div className="flex items-center gap-2">
                    {[2, 3, 5, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setBatchCount(String(n))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${batchCount === String(n) ? "bg-primary/10 text-primary border-primary/40" : "bg-card text-muted-foreground border-border"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Templates Section */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{t("genTemplates")}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplateDialog(true)} className="h-8 text-xs gap-1 text-primary hover:text-primary">
                <BookmarkPlus className="w-3.5 h-3.5" /> {t("genSaveAsTemplate")}
              </Button>
            </div>
            {templates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => loadTemplate(tmpl)}
                    className="p-3 text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted transition-all"
                  >
                    <div className="text-sm font-medium text-foreground truncate">{tmpl.name}</div>
                    {tmpl.is_system && <div className="text-[10px] text-primary mt-1 uppercase tracking-wider font-semibold">{t("genSystemTemplate")}</div>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed border-border text-center">
                {t("genNoTemplates")}
              </div>
            )}
          </div>
        </div>

        {/* Material selector or upload prompt */}
        <div className="px-6 pb-4 space-y-1.5">
          {materials.length > 0 ? (
            <>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("genMaterialLabel")}
              </label>
              <select
                value={selectedMaterialId ?? ""}
                onChange={(e) => setSelectedMaterialId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t("genMaterialNone")}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.filename}</option>
                ))}
              </select>
              {selectedMaterialId && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t("genMaterialHint")}
                </p>
              )}
            </>
          ) : (
            <a
              href="/materials"
              className="flex items-center gap-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 hover:bg-primary/10 transition-colors group"
            >
              <span className="text-lg">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary">{t("genUploadMaterials")}</p>
                <p className="text-xs text-muted-foreground">{t("genUploadMaterialsDesc")}</p>
              </div>
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
            </a>
          )}
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
          {generated && activeClass && (
            <div className="text-xs text-primary/70 flex items-center justify-center gap-1.5 mt-3">
              <Sparkles className="w-3 h-3" />
              Адаптировано для: {activeClass.name} (Класс {activeClass.grade})
            </div>
          )}
        </div>
      </motion.div>

      {/* Right Preview */}
      <div className={`flex-1 bg-muted/50 items-start justify-center pt-20 px-6 md:px-10 pb-10 relative print:p-0 print:block print:bg-white inset-0 print:absolute print:z-[9999] ${mobileTab === "form" ? "hidden md:flex" : "flex"}`}>
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
                {(genType === "quiz" || genType === "assignment") && lastLogId && (
                  <Button
                    onClick={() => navigate(`/games/session/new?log_id=${lastLogId}`)}
                    className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 border-none"
                  >
                    <Gamepad2 className="w-4 h-4" /> {t("session_start_btn")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-2 bg-white/80 backdrop-blur">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                {genType === "crossword" && (
                  <Button variant="outline" size="sm" onClick={handleRetryLayout} className="gap-2 bg-white/80 backdrop-blur">
                    <Sparkles className="w-4 h-4" /> Rewrite Layout
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDownloadDOCX} className="gap-2 bg-white/80 backdrop-blur">
                  <Download className="w-4 h-4" /> Download DOCX
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="gap-2 bg-white/80 backdrop-blur">
                  <Save className="w-4 h-4" /> Сохранить
                </Button>
              </div>

              {/* QR code panel — appears after saving */}
              {lastLogId && (
                <div className="absolute top-6 left-6 print:hidden z-10">
                  <ResourceQRCode
                    logId={lastLogId}
                    topic={genType === "math" ? mathTopic : genType === "quiz" ? quizTopic : genType === "assignment" ? assignTopic : crosswordTopic}
                    generatorType={genType}
                    content={
                      genType === "math" ? generatedProblems :
                      genType === "quiz" ? quizData :
                      genType === "assignment" ? assignmentData :
                      crosswordData
                    }
                  />
                </div>
              )}

              {genType === "quiz" && quizData.length > 0 && (
                <QuizPreview
                  quizData={quizData}
                  quizTopic={quizTopic}
                  orgName={orgName}
                  puzzleRef={puzzleRef}
                  answerRef={answerRef}
                />
              )}

              {genType === "assignment" && assignmentData && (
                <AssignmentPreview
                  assignmentData={assignmentData}
                  orgName={orgName}
                  puzzleRef={puzzleRef}
                  answerRef={answerRef}
                />
              )}

              {genType === "math" && generatedProblems.length > 0 && (
                <MathPreview
                  problems={generatedProblems}
                  topic={mathTopic}
                  difficulty={difficulty}
                  orgName={orgName}
                  puzzleRef={puzzleRef}
                  answerRef={answerRef}
                />
              )}

              {genType === "crossword" && crosswordData && (
                <CrosswordPreview
                  crosswordData={crosswordData}
                  crosswordTopic={crosswordTopic}
                  orgName={orgName}
                  puzzleRef={puzzleRef}
                  answerRef={answerRef}
                />
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
      {showEdit && (
        <ResultEditor
          open={showEdit}
          onOpenChange={setShowEdit}
          type={genType}
          data={
            genType === "math" ? generatedProblems :
              genType === "quiz" ? quizData :
                genType === "crossword" ? crosswordData :
                  assignmentData
          }
          onSave={saveEdit}
        />
      )}

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
      </Dialog>
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("genTemplateSaveTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("genTemplateNameLabel")}</Label>
              <Input
                placeholder={t("genTemplateNamePlaceholder")}
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="rounded-xl">{t("genTemplateCancel")}</Button>
            <Button onClick={handleSaveTemplate} className="rounded-xl">{t("genTemplateSave")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Generator;
