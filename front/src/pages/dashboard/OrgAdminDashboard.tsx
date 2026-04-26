import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, LogOut, Copy, Check, Ban, Unlock, Trash2,
  Building2, Zap, Shield, RefreshCw, X, Eye, EyeOff, Send, Sparkles, UserCog,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

interface OrgStats {
  org_id: number;
  org_name: string;
  contact_person: string;
  seats_used: number;
  seats_total: number;
  expires_at: string;
  status: string;
  teachers_count: number;
  tokens_this_month: number;
}

interface TeacherRow {
  id: number;
  email: string;
  full_name: string | null;
  school: string | null;
  is_active: boolean;
  plan: string | null;
  expires_at: string | null;
  role: string;
  tokens_limit?: number;
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-sans">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Активен
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-sans">
      <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Заблокирован
    </span>
  );
}

function PlanBadge({ plan }: { plan: string | null }) {
  const p = (plan || "free").toUpperCase();
  const cls =
    p === "SCHOOL" ? "bg-indigo-500/10 text-indigo-600" :
    p === "PRO"    ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground";
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-sans ${cls}`}>{p}</span>;
}

export default function OrgAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [adminTelegram, setAdminTelegramState] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, teachersRes, contactRes] = await Promise.all([
        api.get("/org-admin/me"),
        api.get("/org-admin/teachers"),
        api.get("/org-admin/contact").catch(() => ({ data: { admin_telegram: null } })),
      ]);
      setStats(statsRes.data);
      setTeachers(teachersRes.data);
      setAdminTelegramState(contactRes.data.admin_telegram || null);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleBlock = async (id: number) => {
    try {
      await api.post(`/org-admin/teachers/${id}/toggle-block`);
      fetchData();
    } catch {
      toast.error("Ошибка");
    }
  };

  const deleteTeacher = async (id: number) => {
    if (!confirm("Удалить учителя?")) return;
    try {
      await api.delete(`/org-admin/teachers/${id}`);
      toast.success("Учитель удалён");
      fetchData();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const generateInvite = async () => {
    try {
      const res = await api.post("/org-admin/invite");
      const base = window.location.origin;
      setInviteLink(`${base}/register?invite=${res.data.token}`);
      setShowInviteModal(true);
    } catch {
      toast.error("Ошибка создания инвайта");
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seatsPercent = stats ? Math.round((stats.seats_used / Math.max(stats.seats_total, 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center p-1.5">
              <img src="/logo_sticker.webp" alt="ClassPlay" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-foreground font-sans">ClassPlay</span>
              {stats && (
                <span className="ml-2 text-sm text-muted-foreground font-sans">— {stats.org_name}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-sans hidden sm:block">{user?.email}</span>
            <Button
              size="sm"
              className="gap-2 font-sans rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white border-0 shadow-sm hover:opacity-90"
              onClick={() => setShowUpgradeModal(true)}
            >
              <Sparkles className="w-3.5 h-3.5" /> Купить план
            </Button>
            {adminTelegram && (
              <a
                href={`https://t.me/${adminTelegram}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2 font-sans rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-500/10">
                  <Send className="w-3.5 h-3.5" /> Написать в Telegram
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" className="gap-2 font-sans" onClick={() => navigate("/profile")}>
              <UserCog className="w-4 h-4" /> Настройки
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 font-sans" onClick={logout}>
              <LogOut className="w-4 h-4" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">Мест занято</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.seats_used}<span className="text-lg text-muted-foreground font-sans">/{stats.seats_total}</span>
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">Учителей</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.teachers_count}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">Токенов за месяц</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.tokens_this_month.toLocaleString()}</p>
              </motion.div>
            </div>

            {/* Telegram contact banner */}
            {adminTelegram ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground font-sans">Нужно больше токенов?</p>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    Напишите администратору ClassPlay — он увеличит лимит для всей вашей организации.
                  </p>
                </div>
                <a href={`https://t.me/${adminTelegram}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button size="sm" className="gap-2 font-sans rounded-xl bg-blue-500 hover:bg-blue-600 text-white">
                    <Send className="w-3.5 h-3.5" /> Написать
                  </Button>
                </a>
              </motion.div>
            ) : null}

            {/* Seat usage bar */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground font-sans">Использование лицензий</p>
                <span className="text-sm font-bold text-foreground font-sans">{seatsPercent}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${seatsPercent}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full ${seatsPercent >= 90 ? "bg-destructive" : seatsPercent >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground font-sans">
                <span>Истекает: {new Date(stats.expires_at).toLocaleDateString("ru-RU")}</span>
                <span className={`font-semibold ${stats.status === "active" ? "text-emerald-600" : "text-destructive"}`}>
                  {stats.status === "active" ? "Активна" : stats.status}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Teachers table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-sans">Учителя</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 font-sans rounded-xl" onClick={fetchData}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2 font-sans rounded-xl" onClick={generateInvite}>
                <Building2 className="w-3.5 h-3.5" /> Инвайт
              </Button>
              <Button size="sm" className="gap-2 font-sans rounded-xl" onClick={() => setShowAddModal(true)}>
                <Plus className="w-3.5 h-3.5" /> Добавить
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Учитель", "Школа", "Лимит токенов", "Статус", "Действия"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : teachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground font-sans text-sm">
                        Нет учителей. Добавьте первого учителя или пришлите инвайт-ссылку.
                      </td>
                    </tr>
                  ) : (
                    teachers.map((t, i) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground font-sans text-sm">{t.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground font-sans">{t.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground font-sans">{t.school || "—"}</td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold font-mono text-foreground">
                            {((t.tokens_limit ?? 30000) / 1000).toFixed(0)}k
                          </span>
                          <span className="text-xs text-muted-foreground font-sans ml-1">/ мес</span>
                        </td>
                        <td className="px-5 py-4"><StatusBadge active={t.is_active} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleBlock(t.id)}
                              className={`p-2 rounded-lg transition-colors ${t.is_active ? "hover:bg-destructive/10" : "hover:bg-emerald-500/10"}`}
                              title={t.is_active ? "Заблокировать" : "Разблокировать"}
                            >
                              {t.is_active
                                ? <Ban className="w-3.5 h-3.5 text-destructive" />
                                : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>
                            <button
                              onClick={() => deleteTeacher(t.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTeacherModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { setShowAddModal(false); fetchData(); }}
          />
        )}
      </AnimatePresence>

      {/* Invite Link Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground font-sans">Инвайт-ссылка</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                Отправьте эту ссылку учителю — он зарегистрируется и автоматически попадёт в вашу организацию.
              </p>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-xs rounded-xl" />
                <Button variant="outline" className="rounded-xl shrink-0" onClick={copyInvite}>
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Plan Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradePlanModal
            teacherCount={stats?.teachers_count ?? 1}
            adminTelegram={adminTelegram}
            onClose={() => setShowUpgradeModal(false)}
            onCheckout={(plan) => { setShowUpgradeModal(false); navigate(`/checkout?plan=${plan}`); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddTeacherModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      toast.error("Заполните все обязательные поля");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/org-admin/teachers", { email, full_name: fullName, password, school: school || undefined });
      toast.success("Учитель создан");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Ошибка при создании учителя");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-foreground font-sans">Добавить учителя</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-sans">Email *</label>
            <Input
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-xl font-sans"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-sans">Имя и фамилия *</label>
            <Input
              placeholder="Иван Иванов"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="rounded-xl font-sans"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-sans">Пароль *</label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                placeholder="Минимум 6 символов"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-xl font-sans pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground font-sans">Школа / учреждение</label>
            <Input
              placeholder="Необязательно"
              value={school}
              onChange={e => setSchool(e.target.value)}
              className="rounded-xl font-sans"
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-xl font-sans" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1 rounded-xl font-sans" disabled={isLoading}>
              {isLoading ? "Создаём..." : "Создать"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const PRO_PRICE = 15;
const SCHOOL_PRICE = 49;

function UpgradePlanModal({
  teacherCount,
  adminTelegram,
  onClose,
  onCheckout,
}: {
  teacherCount: number;
  adminTelegram: string | null;
  onClose: () => void;
  onCheckout: (plan: string) => void;
}) {
  const [seats, setSeats] = useState(Math.max(teacherCount, 1));
  const [tab, setTab] = useState<"pro" | "school">("school");

  const proTotal = seats * PRO_PRICE;
  const schoolBetter = SCHOOL_PRICE < proTotal && seats > 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground font-sans">Купить план</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-xl p-1 mb-5 gap-1">
          {(["pro", "school"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold font-sans transition-colors ${
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "pro" ? "PRO (на учителя)" : "SCHOOL (вся орга)"}
            </button>
          ))}
        </div>

        {tab === "pro" ? (
          <div className="space-y-4">
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-sans mb-1">Цена</p>
              <p className="text-2xl font-bold font-sans">${PRO_PRICE}<span className="text-sm font-normal text-muted-foreground"> / учитель / мес</span></p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-sans block mb-2">
                Количество учителей
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                >−</button>
                <Input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={e => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-mono rounded-xl w-20"
                />
                <button
                  onClick={() => setSeats(s => s + 1)}
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                >+</button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[1, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setSeats(n)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold font-sans border transition-colors ${
                      seats === n ? "bg-primary text-background border-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {n === teacherCount ? `${n} (все)` : `${n}`}
                  </button>
                ))}
                {teacherCount > 1 && !([1, 3, 5, 10].includes(teacherCount)) && (
                  <button
                    onClick={() => setSeats(teacherCount)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold font-sans border transition-colors ${
                      seats === teacherCount ? "bg-primary text-background border-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {teacherCount} (все)
                  </button>
                )}
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-sans">Итого / месяц</span>
              <span className="text-xl font-bold text-primary font-sans">${proTotal}</span>
            </div>
            {schoolBetter && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-700 font-sans">
                Выгоднее взять <b>SCHOOL</b> — ${SCHOOL_PRICE}/мес на всю организацию (сэкономите ${proTotal - SCHOOL_PRICE}/мес)
              </div>
            )}
            {adminTelegram && seats > 1 && (
              <p className="text-xs text-muted-foreground font-sans">
                Для оплаты сразу за несколько аккаунтов —&nbsp;
                <a href={`https://t.me/${adminTelegram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  напишите в Telegram
                </a>, оформим корп. счёт.
              </p>
            )}
            <Button
              className="w-full rounded-xl font-sans"
              onClick={() => onCheckout("pro")}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Перейти к оплате PRO
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-sans mb-1">Цена</p>
              <p className="text-2xl font-bold font-sans">${SCHOOL_PRICE}<span className="text-sm font-normal text-muted-foreground"> / мес — вся организация</span></p>
            </div>
            <ul className="space-y-2">
              {[
                "До 10 учителей",
                "2 100 генераций/месяц на всю школу",
                "Панель управления org-admin",
                "CSV-импорт пользователей",
                "Договор и счёт",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm font-sans text-foreground">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-sans">Итого / месяц</span>
              <span className="text-xl font-bold text-primary font-sans">${SCHOOL_PRICE}</span>
            </div>
            <Button
              className="w-full rounded-xl font-sans"
              onClick={() => onCheckout("school")}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Перейти к оплате SCHOOL
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
