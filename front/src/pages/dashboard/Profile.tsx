import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail, Phone, School, Lock, Edit3, Save, X,
  Zap, BookOpen, BarChart2, Copy, Check, LogOut,
  Star, ChevronRight, Calendar, User, Info, Shield, ArrowLeft, Camera
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  school: string | null;
  created_at: string | null;
  tokens_limit: number;
  tokens_used_this_month: number;
  avatar_url: string | null;
}

interface SubscriptionData {
  plan: string;
  expires_at: string | null;
  is_active: boolean;
  tokens_used: number;
  tokens_limit: number;
  tokens_remaining: number;
  reset_at: string | null;
  limits: {
    books_per_day: number;
    generations_per_month: number;
  };
}

interface Stats {
  total_resources: number;
  total_tokens: number;
  active_classes: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", school: "" });
  const [pwdForm, setPwdForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [copied, setCopied] = useState(false);
  const { logout, updateUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadStats();
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await api.get("/payments/subscription/me");
      setSubscription(res.data);
    } catch { }
  };

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
      setEditForm({
        full_name: res.data.full_name || "",
        phone: res.data.phone || "",
        school: res.data.school || "",
      });
    } catch { }
  };

  const loadStats = async () => {
    try {
      const [res, classRes, historyRes] = await Promise.allSettled([
        api.get("/generator/usage-stats"),
        api.get("/classes/"),
        api.get("/history/"),
      ]);
      setStats({
        total_resources: historyRes.status === "fulfilled" ? (historyRes.value.data?.items?.length || historyRes.value.data?.length || 0) : 0,
        total_tokens: res.status === "fulfilled" ? (res.value.data?.tokens_used_this_month || 0) : 0,
        active_classes: classRes.status === "fulfilled" ? (classRes.value.data?.length || 0) : 0,
      });
    } catch { }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.patch("/auth/me", editForm);
      setProfile(p => p ? { ...p, ...editForm } : p);
      updateUser({ full_name: editForm.full_name });
      setEditing(false);
      flash("Профиль обновлён", "success");
    } catch {
      flash("Ошибка при сохранении", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        flash("Размер файла не должен превышать 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await api.patch("/auth/me", { avatar_url: base64String });
          setProfile(p => p ? { ...p, avatar_url: base64String } : p);
          updateUser({ avatar_url: base64String });
          flash("Аватар обновлён", "success");
        } catch {
          flash("Ошибка обновления аватара", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const changePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      flash("Пароли не совпадают", "error");
      return;
    }
    setSavingPwd(true);
    try {
      await api.put("/auth/change-password", {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ old_password: "", new_password: "", confirm: "" });
      flash("Пароль изменён", "success");
    } catch (e: any) {
      flash(e?.response?.data?.detail || "Ошибка смены пароля", "error");
    } finally {
      setSavingPwd(false);
    }
  };

  const flash = (text: string, type: "success" | "error") => {
    if (type === "success") toast.success(text);
    else toast.error(text);
  };

  const copyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const usagePercent = profile && profile.tokens_limit > 0
    ? Math.min(100, Math.round((profile.tokens_used_this_month / profile.tokens_limit) * 100))
    : 0;

  const usageColor = usagePercent > 80 ? "#ef4444" : usagePercent > 50 ? "#f59e0b" : "#10b981";

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
      </div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки профиля</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Управляйте настройками вашего аккаунта и подпиской.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Left Column: Avatar & Quick Info & Usage */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-emerald-500 to-sky-500 p-6 flex flex-col items-center justify-center text-white relative">
              <button
                onClick={() => setEditing(!editing)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                title="Редактировать профиль"
              >
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>

              <label className="relative block w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30 mb-4 shadow-lg group cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (profile.full_name || profile.email)[0].toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </label>
              <h2 className="text-xl font-bold mb-1 text-center">{profile.full_name || "Без имени"}</h2>
              <div className="flex items-center gap-2 opacity-90 p-1.5 px-3 bg-black/10 rounded-full">
                <span className="text-sm">{profile.email}</span>
                <button onClick={copyEmail} className="hover:text-emerald-200 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Роль</p>
                  <p className="font-medium capitalize">{profile.role || "Пользователь"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">На платформе с</p>
                  <p className="font-medium">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Токены</h3>
            </div>
            <div className="mb-3 flex justify-between text-sm font-medium">
              <span className="text-gray-600 dark:text-gray-300">Использовано</span>
              <span style={{ color: usageColor }}>{usagePercent}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-700 ease-out relative" style={{ width: `${usagePercent}%`, background: usageColor }}>
                {usagePercent > 10 && <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
              {profile.tokens_used_this_month?.toLocaleString()} / {profile.tokens_limit === -1 ? "Неограниченно" : profile.tokens_limit?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Right Column: Details & Stats & Subscription */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Info Box */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Личные данные</h3>
            </div>
            <div className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Имя и фамилия</span>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                        value={editForm.full_name}
                        onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="Иван Иванов"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Телефон</span>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+7 900 000 00 00"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Учебное заведение</span>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                        value={editForm.school}
                        onChange={e => setEditForm(f => ({ ...f, school: e.target.value }))}
                        placeholder="Школа №1 / Университет"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      {savingProfile ? "Сохраняем..." : "Сохранить изменения"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email-адрес</span>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      {profile.email}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Номер телефона</span>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      {profile.phone || <span className="text-gray-400 italic">Не указано</span>}
                    </div>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Учебное заведение</span>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                      <School className="w-4 h-4 text-emerald-500" />
                      {profile.school || <span className="text-gray-400 italic">Не указано</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Сгенерировано</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_resources ?? 0}</p>
                <p className="text-xs text-gray-400">материалов</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Мои классы</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_classes ?? 0}</p>
                <p className="text-xs text-gray-400">активных групп</p>
              </div>
            </div>
          </div>

          {/* Settings Section (Plan & Password) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Subscription */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star className={`w-5 h-5 ${subscription?.is_active ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <h3 className="font-bold text-gray-900 dark:text-white">Текущий план</h3>
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold capitalize mb-1 text-gray-900 dark:text-white">
                  {subscription?.is_active ? `План ${subscription.plan}` : "Бесплатный"}
                </div>
                {subscription?.is_active && subscription.expires_at ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Действителен до {formatDate(subscription.expires_at)}</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Базовый доступ к платформе</p>
                )}
              </div>
              <Link
                to="/checkout"
                className={`flex items-center justify-center gap-2 w-full py-2.5 mt-4 rounded-xl font-bold transition-all ${subscription?.is_active
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                  }`}
              >
                {subscription?.is_active ? "Управление подпиской" : "Улучшить план"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Смена пароля</h3>
              </div>
              <div className="space-y-3 flex-1">
                <input
                  type="password"
                  placeholder="Текущий пароль"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={pwdForm.old_password}
                  onChange={e => setPwdForm(f => ({ ...f, old_password: e.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Новый пароль"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={pwdForm.new_password}
                  onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Повторите новый пароль"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                />
              </div>
              <button
                onClick={changePassword}
                disabled={savingPwd || !pwdForm.old_password || !pwdForm.new_password || pwdForm.new_password !== pwdForm.confirm}
                className="w-full py-2.5 mt-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
              >
                {savingPwd ? "Сохранение..." : "Обновить пароль"}
              </button>
            </div>
          </div>

          {/* Helper / Info Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Полезная информация</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                При использовании платформы, каждый сгенерированный материал расходует токены. Вы можете отслеживать количество оставшихся токенов в панели слева. Если вам не хватает токенов, вы всегда можете улучшить свой тарифный план. Приглашайте коллег и делитесь материалами в классах.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

