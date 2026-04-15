import { useState, useEffect } from "react";
import {
  User, Mail, Phone, School, Lock, Edit3, Save, X,
  Zap, BookOpen, BarChart2, Clock, QrCode, Copy, Check, LogOut,
  Star, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
}

interface SubscriptionData {
  plan: string;
  expires_at: string;
  is_active: boolean;
}

interface Stats {
  total_resources: number;
  total_tokens: number;
  active_classes: number;
  activity_by_day?: { date: string; count: number }[];
  top_features?: { name: string; count: number }[];
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", school: "" });
  const [pwdForm, setPwdForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const { logout } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await api.get("/payments/subscription/me");
      setSubscription(res.data);
    } catch {}
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
    } catch {}
  };

  const loadStats = async () => {
    try {
      const [res, classRes, historyRes, fullStatsRes] = await Promise.allSettled([
        api.get("/generator/usage-stats"),
        api.get("/classes/"),
        api.get("/history/"),
        api.get("/generate/stats/me"),
      ]);
      setStats({
        total_resources: historyRes.status === "fulfilled" ? (historyRes.value.data?.items?.length || historyRes.value.data?.length || 0) : 0,
        total_tokens: res.status === "fulfilled" ? (res.value.data?.tokens_used_this_month || 0) : 0,
        active_classes: classRes.status === "fulfilled" ? (classRes.value.data?.length || 0) : 0,
        activity_by_day: fullStatsRes.status === "fulfilled" ? fullStatsRes.value.data?.activity_by_day : [],
        top_features: fullStatsRes.status === "fulfilled" ? fullStatsRes.value.data?.top_features : [],
      });
    } catch {}
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.patch("/auth/me", editForm);
      setProfile(p => p ? { ...p, ...editForm } : p);
      setEditing(false);
      flash("Profile updated", "success");
    } catch {
      flash("Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      flash("Passwords do not match", "error");
      return;
    }
    setSavingPwd(true);
    try {
      await api.put("/auth/change-password", {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ old_password: "", new_password: "", confirm: "" });
      flash("Password changed", "success");
    } catch (e: any) {
      flash(e?.response?.data?.detail || "Failed to change password", "error");
    } finally {
      setSavingPwd(false);
    }
  };

  const flash = (text: string, type: "success" | "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const copyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const usagePercent = profile && profile.tokens_limit > 0
    ? Math.min(100, Math.round((profile.tokens_used_this_month / profile.tokens_limit) * 100))
    : 0;

  const usageColor = usagePercent > 80 ? "#ef4444" : usagePercent > 50 ? "#f59e0b" : "#10b981";

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
          msg.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-sky-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(profile.full_name || profile.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile.full_name || "—"}</h1>
              <div className="flex items-center gap-2 mt-1 opacity-90">
                <span className="text-sm">{profile.email}</span>
                <button onClick={copyEmail} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {profile.created_at && (
                <p className="text-xs opacity-70 mt-1">
                  С нами с {new Date(profile.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/10 border-b border-black/5 dark:border-white/10">
          {[
            { icon: BookOpen, label: "Материалы", value: stats?.total_resources ?? "—" },
            { icon: BarChart2, label: "Классы", value: stats?.active_classes ?? "—" },
            { icon: Zap, label: "Токены/мес", value: profile.tokens_used_this_month?.toLocaleString() ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-1">
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Token Usage Bar */}
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>AI лимит месяца</span>
            <span style={{ color: usageColor }}>{usagePercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePercent}%`, background: usageColor }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {profile.tokens_used_this_month?.toLocaleString()} / {profile.tokens_limit === -1 ? "∞" : profile.tokens_limit?.toLocaleString()}
          </p>
        </div>

        {/* Subscription Status */}
        <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subscription?.is_active ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                {subscription?.is_active ? `План ${subscription.plan}` : "Бесплатный план"}
              </p>
              {subscription?.is_active ? (
                <p className="text-xs text-gray-500">
                  Активен до {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Доступны базовые функции
                </p>
              )}
            </div>
          </div>
          <Link
            to="/checkout"
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              subscription?.is_active 
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600" 
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {subscription?.is_active ? "Продлить" : "Улучшить"}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Profile Fields */}
        <div className="p-4 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Имя</span>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-700 text-sm"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Иван Иванов"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Телефон</span>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-700 text-sm"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 900 000 00 00"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Школа</span>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-700 text-sm"
                  value={editForm.school}
                  onChange={e => setEditForm(f => ({ ...f, school: e.target.value }))}
                  placeholder="Школа №1"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? "Сохраняем..." : "Сохранить"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-xl text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { icon: Mail, label: profile.email },
                { icon: Phone, label: profile.phone || "—" },
                { icon: School, label: profile.school || "—" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-6">
        <h3 className="text-sm font-bold flex items-center gap-3 mb-6">
          <BarChart3 className="w-4 h-4 text-emerald-500" /> Активность за 2 недели
        </h3>
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats?.activity_by_day || []}>
                 <XAxis dataKey="date" hide />
                 <YAxis hide />
                 <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                   labelStyle={{ display: 'none' }}
                 />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                   {(stats?.activity_by_day || []).map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === (stats?.activity_by_day?.length || 0) - 1 ? '#10b981' : '#10b98140'} />
                   ))}
                 </Bar>
               </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Features */}
      {stats?.top_features && stats.top_features.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-6">
           <h3 className="text-sm font-bold mb-6">Популярное у вас</h3>
           <div className="space-y-3">
              {stats.top_features.map((feat, i) => (
                <div key={feat.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-black/5 dark:border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center font-bold text-emerald-500 text-xs shadow-sm">
                        {i + 1}
                     </div>
                     <span className="font-bold capitalize text-sm">{feat.name}</span>
                   </div>
                   <span className="text-xs font-medium text-gray-500">{feat.count} раз</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Change Password Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          Сменить пароль
        </h2>
        <div className="space-y-2">
          {[
            { key: "old_password", placeholder: "Текущий пароль" },
            { key: "new_password", placeholder: "Новый пароль" },
            { key: "confirm", placeholder: "Подтвердить пароль" },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="password"
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-700 text-sm"
              value={pwdForm[key as keyof typeof pwdForm]}
              onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
            />
          ))}
          <button
            onClick={changePassword}
            disabled={savingPwd || !pwdForm.old_password || !pwdForm.new_password}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {savingPwd ? "Меняем..." : "Изменить пароль"}
          </button>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-sm font-semibold transition-colors border border-red-200"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
