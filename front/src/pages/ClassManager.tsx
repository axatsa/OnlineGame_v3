import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Pencil, Trash2, Users, GraduationCap,
  Sparkles, Check, X, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClass, ClassGroup, GradeLevel } from "@/context/ClassContext";
import { useLang } from "@/context/LangContext";

const GRADES: GradeLevel[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

const GRADE_HINTS: Record<GradeLevel, string> = {
  "1": "Счёт до 100, сложение/вычитание в пределах 20",
  "2": "Сложение/вычитание до 1000, таблица умножения начинается",
  "3": "Таблица умножения, деление, дроби — начало",
  "4": "Дроби, порядок действий, геометрия — периметр",
  "5": "Десятичные дроби, проценты, площади фигур",
  "6": "Рациональные числа, уравнения, пропорции",
  "7": "Линейные функции, степени, алгебраические выражения",
  "8": "Квадратные уравнения, неравенства, геометрия",
  "9": "Тригонометрия, системы уравнений, статистика",
  "10": "Производная, логарифмы, вероятность",
  "11": "Интегралы, комбинаторика, подготовка к ЕГЭ/SAT",
};

interface FormState {
  name: string;
  grade: GradeLevel;
  studentCount: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: "", grade: "3", studentCount: "", description: "" };

export default function ClassManager() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { classes, activeClassId, setActiveClassId, addClass, updateClass, deleteClass } = useClass();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (cls: ClassGroup) => {
    setEditingId(cls.id);
    setForm({
      name: cls.name,
      grade: cls.grade,
      studentCount: String(cls.studentCount),
      description: cls.description,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      grade: form.grade,
      studentCount: parseInt(form.studentCount) || 0,
      description: form.description,
    };
    if (editingId) {
      updateClass(editingId, payload);
    } else {
      addClass(payload);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    deleteClass(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backToDash")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-foreground font-serif">{t("myClasses")}</span>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> {t("addClass")}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground font-serif mb-1">{t("classGroups")}</h1>
          <p className="text-muted-foreground font-sans text-sm">
            {t("classGroupsDesc")}
          </p>
        </motion.div>

        {/* Class cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`relative rounded-2xl border-2 bg-card p-6 transition-all ${activeClassId === cls.id
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/40"
                }`}
            >
              {/* Active badge */}
              {activeClassId === cls.id && (
                <span className="absolute top-4 right-4 text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-sans">
                  {t("activeLabel")}
                </span>
              )}

              {/* Top row */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-serif leading-tight">{cls.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-sans">{t("gradeLabel")} {cls.grade}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                      <Users className="w-3 h-3" />{cls.studentCount} {t("studentsLabel")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grade hint */}
              <div className="mb-3 rounded-lg bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">{t("gradeLabel")} {cls.grade} level:</span>&nbsp;{GRADE_HINTS[cls.grade]}
                </p>
              </div>

              {/* Description */}
              {cls.description && (
                <p className="text-sm text-muted-foreground font-sans leading-relaxed line-clamp-3 mb-4">
                  "{cls.description}"
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                {activeClassId !== cls.id && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl flex-1 gap-1"
                    onClick={() => setActiveClassId(cls.id)}
                  >
                    <Check className="w-3.5 h-3.5" /> {t("select")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={() => openEdit(cls)}
                >
                  <Pencil className="w-3.5 h-3.5" /> {t("editClass")}
                </Button>
                {deleteConfirm === cls.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl gap-1 text-xs"
                      onClick={() => handleDelete(cls.id)}
                    >
                      <Trash2 className="w-3 h-3" /> {t("confirm")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm(cls.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add new card placeholder */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * classes.length }}
            onClick={openAdd}
            className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-card p-6 flex flex-col items-center justify-center gap-3 transition-all group min-h-[180px]"
          >
            <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground font-sans transition-colors">
              {t("addNewClass")}
            </span>
          </motion.button>
        </div>
      </main>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeForm()}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground font-serif">
                  {editingId ? t("editClassTitle") : t("newClassTitle")}
                </h2>
                <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("className")}</Label>
                  <Input
                    placeholder="e.g. 3B, 4A — Advanced, Morning Group..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                {/* Grade selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("classGrade")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, grade: g })}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold font-sans border transition-all ${form.grade === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/60"
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {form.grade && (
                    <p className="text-xs text-muted-foreground font-sans flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2">
                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{t("aiDifficultyBaseline")}</span>&nbsp;{GRADE_HINTS[form.grade]}
                    </p>
                  )}
                </div>

                {/* Student count */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("classStudents")}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 28"
                    value={form.studentCount}
                    onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                    className="h-11 rounded-xl font-sans"
                  />
                </div>

                {/* Description / Personalization */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("classDesc")}
                  </Label>
                  <Textarea
                    placeholder={`Describe your class so AI generates better content:\n• Is the group advanced, average, or struggling?\n• What topics have they covered?\n• Interests (space, animals, sport…)\n• Any weak spots the AI should keep in mind?`}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-[130px] rounded-xl font-sans text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground font-sans">
                    This description + grade level will be passed to AI when generating worksheets & crosswords.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={closeForm}>{t("cancel")}</Button>
                <Button
                  className="flex-1 rounded-xl gap-2"
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                >
                  <Check className="w-4 h-4" />
                  {editingId ? t("save") : t("save")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
