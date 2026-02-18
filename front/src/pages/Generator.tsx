import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Printer, Download, Pencil, Loader2, Sparkles, Calculator, LayoutGrid, GraduationCap, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import thompsonLogo from "@/assets/thompson-logo.png";
import { useClass } from "@/context/ClassContext";
import api from "@/lib/api"; // Import API
import { toast } from "sonner";

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
  const { activeClass, activeClassId } = useClass();
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
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerated(false);

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
        setGeneratedWords(res.data.words);
      }
      setGenerated(true);
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate content. Check API connection or Token.");
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = genType === "math" ? mathTopic.trim().length > 0 : crosswordTopic.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Settings Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-[400px] bg-card border-r border-border flex flex-col"
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

          {/* Active class context banner */}
          {activeClass ? (
            <div className="mb-4 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary font-sans">{activeClass.name} · Grade {activeClass.grade}</p>
                {activeClass.description && (
                  <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">{activeClass.description}</p>
                )}
              </div>
              <button onClick={() => navigate("/classes")} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/classes")}
              className="mb-4 w-full rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors font-sans text-left"
            >
              + Set up a class for personalised AI generation
            </button>
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
                  <p className="text-xs text-muted-foreground font-sans">AI will use your class personalization + topic to generate tasks</p>
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
                  <p className="text-xs text-muted-foreground font-sans">AI will generate words related to this topic</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of Words</Label>
                  <Input
                    type="number"
                    min="3"
                    max="20"
                    placeholder="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    className="h-11 rounded-xl font-sans"
                  />
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
      <div className="hidden md:flex flex-1 bg-muted/50 items-center justify-center p-10 relative">
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground font-sans">AI is generating your {genType === "math" ? "worksheet" : "crossword"}...</p>
            </motion.div>
          )}

          {generated && !isGenerating && genType === "math" && (
            <motion.div
              key="math-paper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-border overflow-y-auto"
              style={{ aspectRatio: "210/297", maxHeight: "80vh" }}
            >
              <div className="p-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <img src={thompsonLogo} alt="Logo" className="w-8 h-8 rounded object-cover" />
                    <span className="text-sm font-bold font-serif text-gray-800">Thompson International</span>
                  </div>
                  <span className="text-xs text-gray-500 font-sans">{difficulty} • {mathTopic}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1 font-serif">Mathematics Worksheet</h3>
                <p className="text-xs text-gray-500 text-center mb-1 font-sans">Topic: {mathTopic}</p>
                <p className="text-xs text-gray-400 text-center mb-6 font-sans">Name: _________________ Date: _____________</p>
                <div className="space-y-3 flex-1">
                  {generatedProblems.map((problem, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                      className="text-sm text-gray-800 font-mono py-1 border-b border-gray-100"
                    >
                      {problem}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {generated && !isGenerating && genType === "crossword" && (
            <motion.div
              key="crossword-paper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-border overflow-y-auto"
              style={{ aspectRatio: "210/297", maxHeight: "80vh" }}
            >
              <div className="p-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <img src={thompsonLogo} alt="Logo" className="w-8 h-8 rounded object-cover" />
                    <span className="text-sm font-bold font-serif text-gray-800">Thompson International</span>
                  </div>
                  <span className="text-xs text-gray-500 font-sans">{language} • {crosswordTopic}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1 font-serif">Crossword Puzzle</h3>
                <p className="text-xs text-gray-500 text-center mb-1 font-sans">Topic: {crosswordTopic}</p>
                <p className="text-xs text-gray-400 text-center mb-6 font-sans">Name: _________________ Date: _____________</p>

                {/* Crossword Grid Placeholder */}
                <div className="mb-6 flex justify-center">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(generatedWords.length + 3, 10)}, 1fr)` }}>
                    {/* Just visual noise for preview */}
                    {Array.from({ length: (Math.min(generatedWords.length + 3, 10)) * 8 }).map((_, i) => (
                      <div key={i} className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs font-mono text-gray-700 bg-white">
                        {Math.random() > 0.7 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Word list */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 font-sans uppercase tracking-wider">Words to find:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedWords.map((word, i) => (
                      <span key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {i + 1}. {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!generated && !isGenerating && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center"
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

        {/* Floating Toolbar */}
        {generated && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border rounded-full shadow-lg px-2 py-1.5"
          >
            <button className="p-3 rounded-full hover:bg-muted transition-colors" title="Print">
              <Printer className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-3 rounded-full hover:bg-muted transition-colors" title="Download">
              <Download className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-3 rounded-full hover:bg-muted transition-colors" title="Edit">
              <Pencil className="w-5 h-5 text-foreground" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Generator;
