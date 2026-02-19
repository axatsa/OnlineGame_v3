import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Printer, Download, Pencil, Loader2, Sparkles, Calculator, LayoutGrid, GraduationCap, Settings2, ChevronDown, Check, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import thompsonLogo from "@/assets/thompson-logo.png";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { generateCrosswordLayout, CrosswordGrid } from "@/lib/crossword";

type GeneratorType = "math" | "crossword";
const difficulties = ["Easy", "Medium", "Hard"];
const languages = ["RU", "UZ"];

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
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [genType, setGenType] = useState<GeneratorType>("math");

  // Math fields
  const [mathTopic, setMathTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");

  // Crossword fields
  const [crosswordTopic, setCrosswordTopic] = useState("");
  const [wordCount, setWordCount] = useState("10");
  const [language, setLanguage] = useState("RU");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<string[]>([]);

  // Crossword state
  const [crosswordData, setCrosswordData] = useState<CrosswordGrid | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerated(false);
    setCrosswordData(null);

    try {
      if (genType === "math") {
        const payload = {
          topic: mathTopic,
          count: parseInt(questionCount) || 10,
          difficulty: difficulty,
          class_id: activeClassId
        };
        const res = await api.post("/generate/math", payload);
        setGeneratedProblems(res.data.problems);
      } else {
        const payload = {
          topic: crosswordTopic,
          word_count: parseInt(wordCount) || 10,
          language: language,
          class_id: activeClassId
        };
        const res = await api.post("/generate/crossword", payload);
        // Backend returns { words: [{word, clue}, ...] }
        // We need to generate the layout
        const layout = generateCrosswordLayout(res.data.words);
        if (!layout) {
          toast.error("Could not arrange words into a crossword. Try again or fewer words.");
          return; // Don't set generated true
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

  const canGenerate = genType === "math" ? mathTopic.trim().length > 0 : crosswordTopic.trim().length > 0;


  // Edit & Save State
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const openEdit = () => {
    if (genType === "math") {
      setEditContent(generatedProblems.join("\n"));
    } else {
      // Crossword editing is complex, maybe just skip for now or just text
      toast.info("Editing crossword layout is not supported yet.");
      return;
    }
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (genType === "math") {
      setGeneratedProblems(editContent.split("\n").filter(l => l.trim().length > 0));
    }
    setShowEdit(false);
    toast.success("Changes applied!");
  };

  const handleSaveResource = async () => {
    if (!saveTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setIsSaving(true);
    try {
      const content = genType === "math"
        ? JSON.stringify({ problems: generatedProblems })
        : JSON.stringify({ words: crosswordData?.words, grid: crosswordData?.grid, width: crosswordData?.width, height: crosswordData?.height });

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
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground font-serif">AI Generators</h2>
              <p className="text-sm text-muted-foreground font-sans">Personalized for your class</p>
            </div>
          </div>

          {/* Active Class Selector */}
          <div className="mb-6 relative">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Target Class</Label>
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
                          <p className="text-xs text-muted-foreground font-sans truncate">Grade {activeClass.grade} • {activeClass.studentCount} Students</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground font-sans">Select a class...</p>
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
                            <p className="text-xs text-muted-foreground font-sans">Grade {cls.grade}</p>
                          </div>
                          {cls.id === activeClassId && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                      <button
                        onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-primary font-semibold font-sans hover:bg-muted transition-colors border-t border-border bg-muted/30"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create New Class
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
                Add your first class
              </button>
            )}
          </div>

          {/* Context Info */}
          {activeClass?.description && (
            <div className="mb-6 px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5" />
                <p className="text-xs text-primary/80 font-sans leading-relaxed">
                  <span className="font-semibold text-primary">Context:</span> {activeClass.description}
                </p>
              </div>
            </div>
          )}

          {/* Type Switcher */}
          <div className="flex bg-muted rounded-xl p-1">
            <button
              onClick={() => { setGenType("math"); setGenerated(false); }}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium font-sans rounded-lg transition-colors ${genType === "math" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {genType === "math" && (
                <motion.div
                  layoutId="genTypePill"
                  className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Calculator className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Mathematics</span>
            </button>
            <button
              onClick={() => { setGenType("crossword"); setGenerated(false); }}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium font-sans rounded-lg transition-colors ${genType === "crossword" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {genType === "crossword" && (
                <motion.div
                  layoutId="genTypePill"
                  className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <LayoutGrid className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Crossword</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {genType === "math" ? (
              <motion.div
                key="math"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic</Label>
                  <Input
                    placeholder="e.g. Fractions, Multiplication, Geometry..."
                    value={mathTopic}
                    onChange={(e) => setMathTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of Questions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <SegmentedControl
                  label="Difficulty"
                  options={difficulties}
                  value={difficulty}
                  onChange={setDifficulty}
                  segId="difficulty"
                />
              </motion.div>
            ) : (
              <motion.div
                key="crossword"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic</Label>
                  <Input
                    placeholder="e.g. Animals, Space, Food..."
                    value={crosswordTopic}
                    onChange={(e) => setCrosswordTopic(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of Words</Label>
                  <Input
                    type="number"
                    min="3"
                    max="15"
                    placeholder="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
                  <p className="text-xs text-muted-foreground font-sans">Wait ~10-20s for generation.</p>
                </div>

                <SegmentedControl
                  label="Language"
                  options={languages}
                  value={language}
                  onChange={setLanguage}
                  segId="language"
                />
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate {genType === "math" ? "Worksheet" : "Crossword"}
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
                {genType === "math" && (
                  <Button variant="outline" size="sm" onClick={openEdit} className="gap-2 bg-white/80 backdrop-blur">
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-white/80 backdrop-blur">
                  <Printer className="w-4 h-4" /> Print / PDF
                </Button>
                <Button size="sm" onClick={() => setShowSaveDialog(true)} className="gap-2">
                  <Download className="w-4 h-4" /> Save
                </Button>
              </div>

              {genType === "math" && (
                <motion.div
                  key="math-paper"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
                  style={{ aspectRatio: "210/297", maxHeight: "80vh" }}
                >
                  <div className="p-10 h-full flex flex-col print:p-0 print:h-auto">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <img src={thompsonLogo} alt="Logo" className="w-8 h-8 rounded object-cover" />
                        <span className="text-sm font-bold font-serif text-gray-800">Thompson International</span>
                      </div>
                      <span className="text-xs text-gray-500 font-sans">{difficulty} • {mathTopic}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-1 font-serif">Mathematics Worksheet</h3>
                    <div className="space-y-3 flex-1 mt-6">
                      {generatedProblems.map((problem, i) => (
                        <div key={i} className="text-sm text-gray-800 font-mono py-1 border-b border-gray-100">{problem}</div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {genType === "crossword" && crosswordData && (
                <motion.div
                  key="crossword-paper"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-border overflow-y-auto print:shadow-none print:border-0 print:w-full print:max-w-none print:block"
                  style={{ aspectRatio: "210/297", maxHeight: "80vh" }}
                >
                  <div className="p-10 h-full flex flex-col print:p-0 print:h-auto">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <img src={thompsonLogo} alt="Logo" className="w-8 h-8 rounded object-cover" />
                        <span className="text-sm font-bold font-serif text-gray-800">Thompson International</span>
                      </div>
                      <span className="text-xs text-gray-500 font-sans">{language} • {crosswordTopic}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-6 font-serif">Crossword Puzzle</h3>

                    {/* Grid */}
                    <div className="flex justify-center mb-8">
                      <div className="inline-grid gap-px bg-gray-900 border-2 border-gray-900 p-px"
                        style={{
                          gridTemplateColumns: `repeat(${crosswordData.width}, 1.5rem)`,
                          gridTemplateRows: `repeat(${crosswordData.height}, 1.5rem)`
                        }}>
                        {crosswordData.grid.map((row, r) => (
                          row.map((cell, c) => {
                            const wordStart = crosswordData.words.find(w => w.row === r && w.col === c);
                            return (
                              <div key={`${r}-${c}`} className={`w-6 h-6 relative flex items-center justify-center text-xs font-bold ${cell ? "bg-white" : "bg-gray-300"}`}>
                                {cell ? (
                                  <>
                                    {wordStart && (
                                      <span className="absolute top-0.5 left-0.5 text-[6px] leading-none">{wordStart.number}</span>
                                    )}
                                  </>
                                ) : ""}
                              </div>
                            );
                          })
                        ))}
                      </div>
                    </div>

                    {/* Clues */}
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-sans">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 uppercase">Across</h4>
                        <ul className="space-y-1 list-none">
                          {crosswordData.words.filter(w => w.isAcross).sort((a, b) => a.number - b.number).map(w => (
                            <li key={w.word}><span className="font-bold">{w.number}.</span> {w.clue}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 uppercase">Down</h4>
                        <ul className="space-y-1 list-none">
                          {crosswordData.words.filter(w => !w.isAcross).sort((a, b) => a.number - b.number).map(w => (
                            <li key={w.word}><span className="font-bold">{w.number}.</span> {w.clue}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
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
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
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
    </div>
  );
};

export default Generator;
