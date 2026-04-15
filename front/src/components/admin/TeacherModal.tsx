import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, School, Phone, X, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TeacherFormData {
  id?: number;
  full_name: string;
  email: string;
  password?: string;
  school: string;
  phone: string;
  tokens_limit: number;
  plan: string;
}

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TeacherFormData) => Promise<void>;
  initialData?: Partial<TeacherFormData>;
}

export default function TeacherModal({ isOpen, onClose, onSave, initialData }: TeacherModalProps) {
  const [form, setForm] = useState<TeacherFormData>({
    full_name: "", email: "", password: "", school: "", phone: "", tokens_limit: 100000, plan: "FREE"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          id: initialData.id,
          full_name: initialData.full_name || "",
          email: initialData.email || "",
          password: "", // Leave blank on edit
          school: initialData.school || "",
          phone: initialData.phone || "",
          tokens_limit: initialData.tokens_limit ?? 100000,
          plan: initialData.plan || "FREE"
        });
      } else {
        setForm({ full_name: "", email: "", password: "", school: "", phone: "", tokens_limit: 100000, plan: "FREE" });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.95, y: 10 }}
          className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {isEdit ? "Редактировать учителя" : "Новый учитель"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ФИО / Название</span>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Алексей Иванов"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email (Логин)</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </label>

              {!isEdit && (
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Пароль</span>
                  <div className="relative mt-1">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Надежный пароль"
                    />
                  </div>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Школа / ВУЗ</span>
                  <div className="relative mt-1">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={form.school}
                      onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                      placeholder="МГУ"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Телефон</span>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+7 900 000 0000"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Лимит токенов (AI)</span>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.tokens_limit}
                    onChange={e => setForm(f => ({ ...f, tokens_limit: parseInt(e.target.value) || 0 }))}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">План / Тариф</span>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="SCHOOL">SCHOOL</option>
                  </select>
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">-1 в лимите означает безлимит. Смена плана создаст/обновит подписку.</p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" className="flex-1 rounded-xl gap-2" disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
