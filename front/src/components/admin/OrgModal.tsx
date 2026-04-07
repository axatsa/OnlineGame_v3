import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, Key, Calendar, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OrgFormData {
  id?: number;
  name: string;
  contact_person: string;
  license_seats: number;
  expires_at: string;
  status: string;
}

interface OrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrgFormData) => Promise<void>;
  initialData?: Partial<OrgFormData>;
}

export default function OrgModal({ isOpen, onClose, onSave, initialData }: OrgModalProps) {
  const [form, setForm] = useState<OrgFormData>({
    name: "", contact_person: "", license_seats: 10, expires_at: "", status: "active"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          id: initialData.id,
          name: initialData.name || "",
          contact_person: initialData.contact_person || "",
          license_seats: initialData.license_seats ?? 10,
          expires_at: initialData.expires_at ? initialData.expires_at.slice(0, 10) : "",
          status: initialData.status || "active"
        });
      } else {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setForm({ 
          name: "", 
          contact_person: "", 
          license_seats: 10, 
          expires_at: nextMonth.toISOString().slice(0, 10), 
          status: "active" 
        });
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
              <Building2 className="w-5 h-5 text-primary" />
              {isEdit ? "Редактировать организацию" : "Новая организация"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Название</span>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Название школы..."
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Контактное лицо</span>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.contact_person}
                    onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                    placeholder="Иванов Иван..."
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Места (сиденья)</span>
                  <div className="relative mt-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="number"
                      min={1}
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={form.license_seats}
                      onChange={e => setForm(f => ({ ...f, license_seats: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Истекает</span>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="date"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={form.expires_at}
                      onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Статус</span>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Активна (Active)</option>
                  <option value="expiring">Истекает (Expiring)</option>
                  <option value="expired">Истекла (Expired)</option>
                  <option value="blocked">Заблокирована (Blocked)</option>
                </select>
              </label>
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
