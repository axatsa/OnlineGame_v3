import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Building2, BrainCircuit, Settings,
  Menu, X, LogOut, Shield, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Ban, Key, Bell,
  Eye, Lock, Unlock,
  DollarSign, Zap, Activity, Search, Plus,
  Filter, Download, Calendar, Cpu,
  ToggleLeft, ToggleRight, FileText,
  ArrowUpRight, ArrowDownRight, WifiOff, Wifi,
  CreditCard, Receipt, BarChart3, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "teachers" | "organizations" | "ai-monitor" | "finances" | "system";

type Teacher = {
  id: number; name: string; login: string; school: string;
  status: string; lastLogin: string; plan: string; tokenUsage: number; ip: string;
};

type Org = {
  id: number; name: string; contact: string; seats: number;
  used: number; expires: string; status: string;
};

type Payment = {
  id: number; org: string; amount: number; currency: string;
  date: string; method: string; status: "paid" | "pending" | "failed"; period: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DAILY_TOKENS = [
  { day: "Mon", tokens: 2400 },
  { day: "Tue", tokens: 1398 },
  { day: "Wed", tokens: 9800 },
  { day: "Thu", tokens: 3908 },
  { day: "Fri", tokens: 4800 },
  { day: "Sat", tokens: 3800 },
  { day: "Sun", tokens: 4300 },
];

const MRR_DATA = [
  { month: "Aug", mrr: 1200 },
  { month: "Sep", mrr: 1900 },
  { month: "Oct", mrr: 2100 },
  { month: "Nov", mrr: 2400 },
  { month: "Dec", mrr: 2800 },
  { month: "Jan", mrr: 3400 },
];

// ─── Export Utilities ─────────────────────────────────────────────────────────
const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const csvContent = bom + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportTeachersCSV = (teachers: Teacher[]) => {
  downloadCSV(
    `classplay_teachers_${new Date().toISOString().slice(0, 10)}.csv`,
    ["ФИО", "Логин", "Школа", "Статус", "Последний вход", "Тариф", "Токены", "IP"],
    teachers.map(t => [t.name, t.login, t.school, t.status, t.lastLogin, t.plan, String(t.tokenUsage), t.ip])
  );
};

const exportOrgsCSV = (orgs: Org[]) => {
  downloadCSV(
    `classplay_organizations_${new Date().toISOString().slice(0, 10)}.csv`,
    ["Организация", "Контакт", "Лицензии (всего)", "Лицензии (занято)", "Истекает", "Статус"],
    orgs.map(o => [o.name, o.contact, String(o.seats), String(o.used), o.expires, o.status])
  );
};

const exportAiUsageCSV = (teachers: Teacher[]) => {
  downloadCSV(
    `classplay_ai_usage_${new Date().toISOString().slice(0, 10)}.csv`,
    ["#", "Учитель", "Школа", "IP", "Токены использовано", "Статус"],
    [...teachers]
      .sort((a, b) => b.tokenUsage - a.tokenUsage)
      .map((t, i) => [String(i + 1), t.name, t.school, t.ip, String(t.tokenUsage), t.status])
  );
};

const exportPaymentsCSV = (payments: Payment[]) => {
  downloadCSV(
    `classplay_payments_${new Date().toISOString().slice(0, 10)}.csv`,
    ["Организация", "Сумма", "Валюта", "Дата", "Метод оплаты", "Статус", "Период"],
    payments.map(p => [p.org, String(p.amount), p.currency, p.date, p.method, p.status, p.period])
  );
};

// HTML-to-PDF export via print dialog
const exportPDF = (title: string, htmlContent: string) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p.meta { color: #666; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        .active   { background: #dcfce7; color: #166534; }
        .expiring { background: #fef9c3; color: #854d0e; }
        .expired  { background: #fee2e2; color: #991b1b; }
        .blocked  { background: #f3f4f6; color: #6b7280; }
        .paid     { background: #dcfce7; color: #166534; }
        .pending  { background: #fef9c3; color: #854d0e; }
        .failed   { background: #fee2e2; color: #991b1b; }
        @media print { body { padding: 12px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Экспорт: ClassPlay Super Admin • ${new Date().toLocaleString("ru-RU")}</p>
      ${htmlContent}
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
};

const exportTeachersPDF = (teachers: Teacher[]) => {
  const rows = teachers.map(t => `
    <tr>
      <td>${t.name}<br/><small style="color:#6b7280">@${t.login}</small></td>
      <td>${t.school}</td>
      <td>${t.lastLogin}</td>
      <td>${t.tokenUsage.toLocaleString()}</td>
      <td><span class="badge ${t.status}">${t.status}</span></td>
      <td>${t.plan}</td>
    </tr>
  `).join("");
  exportPDF("Список учителей", `
    <table>
      <thead><tr><th>ФИО / Логин</th><th>Школа</th><th>Посл. вход</th><th>Токены</th><th>Статус</th><th>Тариф</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
};

const exportOrgsPDF = (orgs: Org[]) => {
  const rows = orgs.map(o => `
    <tr>
      <td>${o.name}</td>
      <td>${o.contact}</td>
      <td>${o.used}/${o.seats}</td>
      <td>${new Date(o.expires).toLocaleDateString("ru-RU")}</td>
      <td><span class="badge ${o.status}">${o.status}</span></td>
    </tr>
  `).join("");
  exportPDF("Организации", `
    <table>
      <thead><tr><th>Название</th><th>Контакт</th><th>Лицензии</th><th>Истекает</th><th>Статус</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
};

const exportAiUsagePDF = (teachers: Teacher[]) => {
  const sorted = [...teachers].sort((a, b) => b.tokenUsage - a.tokenUsage);
  const rows = sorted.map((t, i) => `
    <tr style="${t.tokenUsage > 5000 ? "background:#fff7ed" : ""}">
      <td>#${i + 1}</td>
      <td>${t.name}</td>
      <td>${t.school}</td>
      <td style="font-family:monospace">${t.ip}</td>
      <td style="${t.tokenUsage > 5000 ? "color:#b91c1c;font-weight:bold" : ""}">${t.tokenUsage.toLocaleString()}</td>
      <td><span class="badge ${t.status}">${t.status}</span></td>
    </tr>
  `).join("");
  exportPDF("AI Usage — Топ пользователей", `
    <table>
      <thead><tr><th>#</th><th>Учитель</th><th>Школа</th><th>IP</th><th>Токены</th><th>Статус</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
};

const exportPaymentsPDF = (payments: Payment[]) => {
  const rows = payments.map(p => `
    <tr>
      <td>${p.org}</td>
      <td><b>$${p.amount}</b></td>
      <td>${new Date(p.date).toLocaleDateString("ru-RU")}</td>
      <td>${p.method}</td>
      <td><span class="badge ${p.status}">${p.status}</span></td>
      <td>${p.period}</td>
    </tr>
  `).join("");
  exportPDF("История платежей", `
    <table>
      <thead><tr><th>Организация</th><th>Сумма</th><th>Дата</th><th>Метод</th><th>Статус</th><th>Период</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
};

// ─── Reusable Sub-components ──────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "🟢 Активен", cls: "bg-success/15 text-success border-0" },
    expiring: { label: "🟡 Истекает", cls: "bg-yellow-500/15 text-yellow-600 border-0" },
    expired: { label: "🔴 Истёк", cls: "bg-destructive/15 text-destructive border-0" },
    blocked: { label: "⛔ Заблокирован", cls: "bg-foreground/10 text-muted-foreground border-0" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge className={`font-sans rounded-full px-3 ${s.cls}`}>{s.label}</Badge>;
};

const MetricCard = ({
  icon: Icon, label, value, sub, trend, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend?: "up" | "down"; color: string;
}) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      {sub && (
        <p className="text-xs text-muted-foreground font-sans mt-0.5 flex items-center gap-1">
          {trend === "up"
            ? <ArrowUpRight className="w-3 h-3 text-success" />
            : trend === "down"
              ? <ArrowDownRight className="w-3 h-3 text-destructive" />
              : null}
          {sub}
        </p>
      )}
    </div>
  </div>
);

const BarChart = ({ data }: { data: typeof DAILY_TOKENS }) => {
  const max = Math.max(...data.map(d => d.tokens));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-sans">{d.tokens.toLocaleString()}</span>
          <div
            className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-all cursor-default"
            style={{ height: `${(d.tokens / max) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground font-sans">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const MrrChart = ({ data }: { data: typeof MRR_DATA }) => {
  const max = Math.max(...data.map(d => d.mrr));
  return (
    <div className="flex items-end gap-3 h-36">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-sans">${d.mrr}</span>
          <div
            className={`w-full rounded-t-lg transition-all cursor-default ${i === data.length - 1 ? "bg-success" : "bg-success/40 hover:bg-success/70"
              }`}
            style={{ height: `${(d.mrr / max) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground font-sans">{d.month}</span>
        </div>
      ))}
    </div>
  );
};

// ─── ExportMenu Component ─────────────────────────────────────────────────────
const ExportMenu = ({
  onCSV, onPDF,
}: { onCSV: () => void; onPDF: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-sans rounded-xl h-8 text-xs"
        onClick={() => setOpen(o => !o)}
      >
        <Download className="w-3 h-3" /> Экспорт
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-50 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[140px]"
          >
            <button
              onClick={() => { onCSV(); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-success" /> Скачать CSV
            </button>
            <button
              onClick={() => { onPDF(); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-destructive" /> Печать / PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Dashboard View ───────────────────────────────────────────────────────────
const DashboardView = ({ teachers, orgs, payments, auditLogs, isLoading }: { teachers: Teacher[]; orgs: Org[]; payments: Payment[]; auditLogs: any[]; isLoading: boolean }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={Users} label="Всего учителей" value={String(teachers.length)} sub="+12 за месяц" trend="up" color="bg-primary/10 text-primary" />
      <MetricCard icon={Building2} label="Организации" value={String(orgs.length)} sub={`${orgs.filter(o => o.status === "expiring").length} истекают`} color="bg-yellow-500/10 text-yellow-600" />
      <MetricCard icon={Zap} label="Всего токенов ИИ" value={`${(teachers.reduce((acc, t) => acc + t.tokenUsage, 0) / 1000).toFixed(1)}K`} sub="суммарно" trend="up" color="bg-primary/10 text-primary" />
      <MetricCard icon={DollarSign} label="MRR" value={`$${payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0)}`} sub="+24% vs прошл." trend="up" color="bg-success/10 text-success" />
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Потребление токенов (7 дней)</h3>
          <span className="text-xs text-muted-foreground font-sans">Текущая неделя</span>
        </div>
        <BarChart data={DAILY_TOKENS} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Топ пользователей AI</h3>
        <div className="space-y-3">
          {[...teachers].sort((a, b) => b.tokenUsage - a.tokenUsage).slice(0, 5).map((t, i) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className={`text-xs font-bold w-5 ${i === 0 ? "text-yellow-500" : "text-muted-foreground"}`}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate font-sans">{t.name}</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${i === 0 ? "bg-yellow-500" : "bg-primary/60"}`}
                    style={{ width: `${(t.tokenUsage / 13000) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-sans flex-shrink-0">{t.tokenUsage.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Журнал действий (Audit Log)</h3>
        <ExportMenu
          onCSV={() => downloadCSV(
            `classplay_audit_${new Date().toISOString().slice(0, 10)}.csv`,
            ["Действие", "Объект", "Время", "Тип"],
            auditLogs.map(l => [l.action, l.target, l.time, l.type])
          )}
          onPDF={() => {
            const rows = auditLogs.map(l => `<tr><td>${l.action}</td><td>${l.target}</td><td>${l.time}</td></tr>`).join("");
            exportPDF("Журнал действий", `<table><thead><tr><th>Действие</th><th>Объект</th><th>Время</th></tr></thead><tbody>${rows}</tbody></table>`);
          }}
        />
      </div>
      <div className="space-y-0">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={5} columns={3} />
          </div>
        ) : auditLogs.length === 0 ? (
          <EmptyState icon={Search} title="Нет данных" description="Журнал действий пуст" />
        ) : (
          auditLogs.map((log, i) => {
            const colorMap: Record<string, string> = {
              success: "text-success", warning: "text-yellow-500",
              danger: "text-destructive", info: "text-primary",
            };
            const iconMap: Record<string, React.ElementType> = {
              success: CheckCircle2, warning: AlertTriangle, danger: Ban, info: Activity,
            };
            const Icon = iconMap[log.type];
            return (
              <div key={log.id} className={`flex items-center gap-3 py-3 ${i < auditLogs.length - 1 ? "border-b border-border" : ""}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${colorMap[log.type]}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground font-sans">{log.action}: </span>
                  <span className="text-sm text-muted-foreground font-sans">{log.target}</span>
                </div>
                <span className="text-xs text-muted-foreground font-sans flex-shrink-0">{log.time}</span>
              </div>
            );
          }))}
      </div>
    </div>
  </div>
);

// ─── Teachers View ────────────────────────────────────────────────────────────
const TeachersView = ({
  teachers, searchQuery, setSearchQuery, toggleBlock, showResetModal, setShowResetModal, isLoading
}: {
  teachers: Teacher[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  toggleBlock: (id: number) => void;
  showResetModal: number | null;
  setShowResetModal: (v: number | null) => void;
  isLoading: boolean;
}) => {
  // Local filtering removed, handled by backend
  const filtered = teachers;
  const [tmpPwd] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ФИО, логину, школе..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl font-sans"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl font-sans">
          <Filter className="w-4 h-4" /> Фильтр
        </Button>
        <ExportMenu
          onCSV={() => exportTeachersCSV(teachers)}
          onPDF={() => exportTeachersPDF(teachers)}
        />
        <Button className="gap-2 rounded-xl font-sans">
          <Plus className="w-4 h-4" /> Добавить учителя
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["ФИО / Логин", "Школа", "Последний вход", "Токены", "Статус", "Действия"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Users} title="Учителей не найдено" description="Попробуйте изменить запрос" />
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground font-sans text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-sans">@{t.login}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-sans">{t.school}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-sans">{t.lastLogin}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-sans font-semibold ${t.tokenUsage > 5000 ? "text-destructive" : "text-foreground"}`}>
                        {t.tokenUsage.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowResetModal(t.id)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Сбросить пароль">
                          <Key className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Войти как...">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => toggleBlock(t.id)}
                          className={`p-2 rounded-lg transition-colors ${t.status === "blocked" ? "hover:bg-success/10" : "hover:bg-destructive/10"}`}
                          title={t.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                        >
                          {t.status === "blocked"
                            ? <Unlock className="w-3.5 h-3.5 text-success" />
                            : <Lock className="w-3.5 h-3.5 text-destructive" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Сброс пароля</h3>
                  <p className="text-xs text-muted-foreground font-sans">{teachers.find(t => t.id === showResetModal)?.name}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground font-sans mb-1">Временный пароль</p>
                <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{tmpPwd}</p>
              </div>
              <p className="text-xs text-muted-foreground font-sans mb-4">Продиктуйте этот пароль учителю. Он будет действителен 24 часа.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl font-sans" onClick={() => setShowResetModal(null)}>Отмена</Button>
                <Button className="flex-1 rounded-xl font-sans" onClick={() => setShowResetModal(null)}>Подтвердить</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Organizations View ───────────────────────────────────────────────────────
const OrgsView = ({ orgs, isLoading }: { orgs: Org[]; isLoading: boolean }) => (
  <div className="space-y-4">
    <div className="flex justify-end gap-2">
      <ExportMenu
        onCSV={() => exportOrgsCSV(orgs)}
        onPDF={() => exportOrgsPDF(orgs)}
      />
      <Button className="gap-2 rounded-xl font-sans"><Plus className="w-4 h-4" /> Новая организация</Button>
    </div>
    <div className="grid gap-4">
      {isLoading ? (
        <TableSkeleton rows={3} columns={1} />
      ) : orgs.length === 0 ? (
        <EmptyState icon={Building2} title="Нет организаций" description="Список организаций пуст" />
      ) : (
        orgs.map((org, i) => (
          <motion.div
            key={org.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground font-sans">{org.name}</h3>
                  <StatusBadge status={org.status} />
                </div>
                <p className="text-xs text-muted-foreground font-sans">{org.contact}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-sans">Лицензии</p>
                  <p className="font-bold text-foreground">{org.used}/{org.seats}</p>
                  <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(org.used / org.seats) * 100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-sans">Истекает</p>
                  <p className={`font-bold font-sans ${org.status === "expired" ? "text-destructive" : org.status === "expiring" ? "text-yellow-600" : "text-foreground"
                    }`}>
                    {new Date(org.expires).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-sans h-8 text-xs gap-1">
                    <Calendar className="w-3 h-3" /> Продлить
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl font-sans h-8 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                    <Ban className="w-3 h-3" /> Блок
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  </div>
);

// ─── AI Monitor View ──────────────────────────────────────────────────────────
const AiMonitorView = ({
  teachers, aiProvider, setAiProvider, toggleBlock, dailyTokens = [], isLoading
}: {
  teachers: Teacher[];
  aiProvider: "gemini" | "openai";
  setAiProvider: (p: "gemini" | "openai") => void;
  toggleBlock: (id: number) => void;
  dailyTokens?: { day: string; tokens: number; cost: number }[];
  isLoading: boolean;
}) => {
  const totalTokens = dailyTokens.reduce((s, d) => s + d.tokens, 0);
  const totalCost = dailyTokens.reduce((s, d) => s + d.cost, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Токенов за неделю" value={totalTokens.toLocaleString()} sub="все учителя" color="bg-violet-500/10 text-violet-600" />
        <MetricCard icon={DollarSign} label="Расходы за неделю" value={`$${totalCost.toFixed(2)}`} sub={`≈ $${(totalCost / 7).toFixed(2)}/день`} color="bg-success/10 text-success" />
        <MetricCard icon={Users} label="Активных сессий" value="-" sub="недоступно" color="bg-primary/10 text-primary" />
        <MetricCard icon={AlertTriangle} label="Аномалий" value={String(teachers.filter(t => t.tokenUsage > 10000).length)} sub="> 10k токенов" color="bg-destructive/10 text-destructive" />
      </div>

      {/* Provider Switch */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Переключение AI провайдера</h3>
            <p className="text-sm text-muted-foreground font-sans">Если один провайдер недоступен — переключите одной кнопкой.</p>
          </div>
          <div className="flex gap-3">
            {(["gemini", "openai"] as const).map(p => (
              <button
                key={p}
                onClick={() => setAiProvider(p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-sans text-sm font-medium ${aiProvider === p
                  ? p === "gemini" ? "border-violet-500 bg-violet-500/10 text-violet-700" : "border-success bg-success/10 text-success"
                  : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
              >
                {aiProvider === p ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {p === "gemini" ? "🟣 Gemini" : "🟢 OpenAI"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">График потребления токенов</h3>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <BarChart data={dailyTokens} />
        )}
        <div className="mt-3 pt-3 border-t border-border flex gap-6">
          {dailyTokens.map(d => (
            <div key={d.day} className="text-center">
              <p className="text-xs text-muted-foreground font-sans">{d.day}</p>
              <p className="text-xs font-semibold text-foreground font-sans">${d.cost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top users */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">Топ пользователей AI</h3>
            <Badge className="bg-destructive/10 text-destructive border-0 font-sans">1 аномалия</Badge>
          </div>
          <ExportMenu
            onCSV={() => exportAiUsageCSV(teachers)}
            onPDF={() => exportAiUsagePDF(teachers)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["#", "Учитель", "Школа", "IP", "Токены", "Статус", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <TableSkeleton rows={10} columns={7} />
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Users} title="Нет учителей" description="Список учителей пуст" />
                  </td>
                </tr>
              ) : (
                [...teachers].sort((a, b) => b.tokenUsage - a.tokenUsage).map((t, i) => (
                  <tr key={t.id} className={`border-b border-border last:border-0 ${t.tokenUsage > 5000 ? "bg-destructive/5" : ""}`}>
                    <td className="px-5 py-3 text-sm font-bold text-muted-foreground font-sans">#{i + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-foreground font-sans">{t.name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-sans">{t.school}</td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{t.ip}</td>
                    <td className={`px-5 py-3 text-sm font-bold font-sans ${t.tokenUsage > 5000 ? "text-destructive" : "text-foreground"}`}>
                      {t.tokenUsage.toLocaleString()}
                      {t.tokenUsage > 5000 && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3">
                      {t.tokenUsage > 5000 && (
                        <button onClick={() => toggleBlock(t.id)} className="text-xs text-destructive hover:underline font-sans">
                          {t.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                        </button>
                      )}
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Finances View ────────────────────────────────────────────────────────────
const FinancesView = ({ payments, isLoading }: { payments: Payment[]; isLoading: boolean }) => {
  // Aggregate payments by month for simple MRR viz
  const mrrData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.toLocaleString('ru', { month: 'short' });
    // Sum paid payments in this month
    const mrr = payments.filter(p => p.status === 'paid' && new Date(p.date).getMonth() === d.getMonth() && new Date(p.date).getFullYear() === d.getFullYear())
      .reduce((sum, p) => sum + p.amount, 0);
    return { month: m, mrr };
  });

  const totalMRR = mrrData[mrrData.length - 1].mrr;
  const prevMRR = mrrData[mrrData.length - 2].mrr || 1; // avoid /0
  const mrrGrowth = (((totalMRR - prevMRR) / prevMRR) * 100).toFixed(1);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === "pending").length;
  const arr = totalMRR * 12;

  const payStatusMap: Record<string, { label: string; cls: string }> = {
    paid: { label: "✅ Оплачено", cls: "bg-success/15 text-success border-0" },
    pending: { label: "⏳ Ожидание", cls: "bg-yellow-500/15 text-yellow-600 border-0" },
    failed: { label: "❌ Ошибка", cls: "bg-destructive/15 text-destructive border-0" },
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="MRR (янв)" value={`$${totalMRR}`} sub={`+${mrrGrowth}% vs дек`} trend="up" color="bg-success/10 text-success" />
        <MetricCard icon={BarChart3} label="ARR (прогноз)" value={`$${arr.toLocaleString()}`} sub="× 12 от MRR" color="bg-primary/10 text-primary" />
        <MetricCard icon={CreditCard} label="Получено всего" value={`$${totalPaid}`} sub="за все время" color="bg-violet-500/10 text-violet-600" />
        <MetricCard icon={Receipt} label="Ожидают оплаты" value={String(pendingCount)} sub="требуют звонка" trend={pendingCount > 0 ? "down" : undefined} color="bg-yellow-500/10 text-yellow-600" />
      </div>

      {/* MRR Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">MRR — Monthly Recurring Revenue</h3>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Последние 6 месяцев</p>
          </div>
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold font-sans">+{mrrGrowth}%</span>
          </div>
        </div>
        {isLoading ? (
          <div className="h-36 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MrrChart data={mrrData} />
        )}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-sans">Новые клиенты</p>
            <p className="text-lg font-bold text-foreground">+3</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">Churn rate</p>
            <p className="text-lg font-bold text-foreground">2.4%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">LTV средний</p>
            <p className="text-lg font-bold text-foreground">$480</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">История платежей</h3>
          <ExportMenu
            onCSV={() => exportPaymentsCSV(payments)}
            onPDF={() => exportPaymentsPDF(payments)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Организация", "Сумма", "Дата", "Метод", "Период", "Статус", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <TableSkeleton rows={5} columns={7} />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={CreditCard} title="Нет платежей" description="История платежей пуста" />
                  </td>
                </tr>
              ) : (
                payments.map((p, i) => {
                  const st = payStatusMap[p.status] ?? { label: p.status, cls: "" };
                  return (
                    <tr key={p.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground font-sans">{p.org}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-foreground font-sans">${p.amount}</span>
                        <span className="text-xs text-muted-foreground font-sans ml-1">{p.currency}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-sans">
                        {new Date(p.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-sans">{p.method}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-sans">{p.period}</td>
                      <td className="px-5 py-4">
                        <Badge className={`font-sans rounded-full px-3 text-xs ${st.cls}`}>{st.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        {p.status === "pending" && (
                          <Button variant="outline" size="sm" className="rounded-xl h-7 text-xs font-sans gap-1">
                            <Receipt className="w-3 h-3" /> Счёт
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring orgs quick-actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-foreground">Требуют продления</h3>
          <Badge className="bg-yellow-500/15 text-yellow-600 border-0 font-sans">2 организации</Badge>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <TableSkeleton rows={2} columns={1} />
          ) : orgs.filter(o => o.status !== "active").length === 0 ? (
            <EmptyState icon={Building2} title="Нет организаций" description="Все организации активны" />
          ) : (
            orgs.filter(o => o.status !== "active").map(org => (
              <div key={org.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground font-sans">{org.name}</p>
                  <p className="text-xs text-muted-foreground font-sans">{org.contact} • {org.seats} мест</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold font-sans ${org.status === "expired" ? "text-destructive" : "text-yellow-600"}`}>
                    {new Date(org.expires).toLocaleDateString("ru-RU")}
                  </span>
                  <Button size="sm" className="rounded-xl h-7 text-xs font-sans gap-1">
                    <Calendar className="w-3 h-3" /> Продлить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── System View ──────────────────────────────────────────────────────────────
const SystemView = ({
  aiProvider, systemAlert, setSystemAlert, alertEnabled, setAlertEnabled, auditLogs, isLoading
}: {
  aiProvider: "gemini" | "openai";
  systemAlert: string;
  setSystemAlert: (v: string) => void;
  alertEnabled: boolean;
  setAlertEnabled: (v: boolean) => void;
  auditLogs: any[];
  isLoading: boolean;
}) => (
  <div className="space-y-6 max-w-2xl">
    {/* System Alert */}
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-foreground" />
          <h3 className="font-semibold text-foreground">Глобальное объявление</h3>
        </div>
        <button
          onClick={() => setAlertEnabled(!alertEnabled)}
          className={`flex items-center gap-2 text-sm font-sans font-medium transition-colors ${alertEnabled ? "text-success" : "text-muted-foreground"}`}
        >
          {alertEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {alertEnabled ? "Включено" : "Выключено"}
        </button>
      </div>
      <textarea
        value={systemAlert}
        onChange={e => setSystemAlert(e.target.value)}
        rows={3}
        className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground font-sans resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Напишите объявление для всех учителей..."
      />
      <p className="text-xs text-muted-foreground font-sans mt-2">Это сообщение увидят все учителя в своих кабинетах.</p>
      <Button className="mt-3 rounded-xl font-sans gap-2">
        <Bell className="w-4 h-4" /> Опубликовать
      </Button>
    </div>

    {/* API Keys */}
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-4 h-4 text-foreground" />
        <h3 className="font-semibold text-foreground">API Ключи</h3>
      </div>
      <div className="space-y-3">
        {[
          { label: "Gemini API Key", placeholder: "AIzaSy...xxxxx", active: aiProvider === "gemini" },
          { label: "OpenAI API Key", placeholder: "sk-proj-...xxxxx", active: aiProvider === "openai" },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.active ? "border-primary/40 bg-primary/5" : "border-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground font-sans">{k.label}</label>
              {k.active && <Badge className="bg-success/15 text-success border-0 font-sans text-xs">Активный</Badge>}
            </div>
            <div className="flex gap-2">
              <Input type="password" placeholder={k.placeholder} className="rounded-xl font-mono text-sm" />
              <Button variant="outline" className="rounded-xl font-sans px-4 flex-shrink-0">Сохранить</Button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Audit Log */}
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-foreground" />
        <h3 className="font-semibold text-foreground">Журнал действий</h3>
      </div>
      <div className="space-y-0">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={5} columns={3} />
          </div>
        ) : auditLogs.length === 0 ? (
          <EmptyState icon={Search} title="Нет данных" description="Журнал действий пуст" />
        ) : (
          auditLogs.map((log, i) => {
            const colorMap: Record<string, string> = {
              success: "bg-success/15 text-success", warning: "bg-yellow-500/15 text-yellow-600",
              danger: "bg-destructive/15 text-destructive", info: "bg-primary/15 text-primary",
            };
            return (
              <div key={log.id} className={`flex items-center gap-3 py-3 ${i < auditLogs.length - 1 ? "border-b border-border" : ""}`}>
                <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium flex-shrink-0 ${colorMap[log.type]}`}>
                  {log.action}
                </span>
                <span className="text-sm text-foreground font-sans flex-1 min-w-0 truncate">{log.target}</span>
                <span className="text-xs text-muted-foreground font-sans flex-shrink-0">{log.time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumbs } from "@/components/Breadcrumbs";

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [systemAlert, setSystemAlert] = useState("В субботу плановое обновление системы с 02:00 до 04:00.");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [showResetModal, setShowResetModal] = useState<number | null>(null);

  // Real Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]); // simplified type for logs
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const skip = (page - 1) * LIMIT;

        // Parallel fetching with pagination params
        const [teachersRes, analyticsRes, orgsRes, paymentsRes, logsRes] = await Promise.all([
          api.get(`/admin/teachers?skip=${skip}&limit=${LIMIT}&search=${searchQuery}`),
          api.get("/admin/analytics"),
          api.get(`/admin/organizations?skip=${skip}&limit=${LIMIT}`),
          api.get(`/admin/payments?skip=${skip}&limit=${LIMIT}`),
          api.get(`/admin/audit-logs?skip=${skip}&limit=${LIMIT}`),
        ]);

        // ... processing logic remains the same ...
        // Process Teachers/Analytics
        const analyticsMap = new Map(analyticsRes.data.map((a: any) => [a.user_id, a]));

        const mappedTeachers: Teacher[] = teachersRes.data.map((u: any) => {
          const stats = analyticsMap.get(u.id) as any;
          return {
            id: u.id,
            name: u.full_name || "Unknown",
            login: u.email,
            school: "Online",
            status: "active",
            lastLogin: stats?.last_active ? new Date(stats.last_active).toLocaleString("ru-RU") : "—",
            plan: "Pro",
            tokenUsage: stats?.total_tokens || 0,
            ip: "—"
          };
        });
        setTeachers(mappedTeachers);

        // Process Orgs
        setOrgs(orgsRes.data.map((o: any) => ({
          id: o.id,
          name: o.name,
          contact: o.contact_person,
          seats: o.license_seats,
          used: o.used_seats || 0,
          expires: o.expires_at,
          status: o.status
        })));

        // Process Payments
        setPayments(paymentsRes.data.map((p: any) => ({
          id: p.id,
          org: p.org_name || "Unknown",
          amount: p.amount,
          currency: p.currency,
          date: p.date,
          method: p.method,
          status: p.status,
          period: p.period
        })));

        // Process Logs
        setAuditLogs(logsRes.data.map((l: any) => ({
          id: l.id,
          action: l.action,
          target: l.target,
          time: new Date(l.timestamp).toLocaleString("ru-RU"),
          type: l.log_type
        })));

      } catch (e) {
        console.error("Failed to fetch admin data", e);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  const toggleBlock = (id: number) => {
    setTeachers(prev =>
      prev.map(t => t.id === id ? { ...t, status: t.status === "blocked" ? "active" : "blocked" } : t)
    );
  };

  const navItems: { icon: React.ElementType; label: string; section: Section; badge?: number }[] = [
    { icon: LayoutDashboard, label: "Дашборд", section: "dashboard" },
    { icon: Users, label: "Учителя", section: "teachers", badge: teachers.filter(t => t.status === "expiring").length },
    { icon: Building2, label: "Организации", section: "organizations" },
    { icon: BrainCircuit, label: "AI Мониторинг", section: "ai-monitor" },
    { icon: DollarSign, label: "Финансы", section: "finances", badge: payments.filter(p => p.status === "pending").length },
    { icon: Settings, label: "Система", section: "system" },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
          <img src="/favicon.webp" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-base font-bold text-sidebar-foreground font-serif block">ClassPlay</span>
          <span className="text-xs text-sidebar-foreground/50 font-sans">Super Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => { setActiveSection(item.section); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-colors ${activeSection === item.section
              ? "bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
              <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <div className="px-4 py-2 rounded-xl bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/40 font-sans">AI провайдер</p>
          <p className="text-sm font-semibold text-sidebar-primary font-sans">{aiProvider === "gemini" ? "🟣 Gemini" : "🟢 OpenAI"}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </>
  );

  const sectionTitles: Record<Section, { title: string; sub: string }> = {
    dashboard: { title: "Дашборд", sub: "Общая финансовая и техническая сводка" },
    teachers: { title: "Учителя", sub: "Управление аккаунтами и доступом" },
    organizations: { title: "Организации", sub: "Школы и пакетные лицензии" },
    "ai-monitor": { title: "AI Мониторинг", sub: "Контроль токенов, расходов и провайдеров" },
    finances: { title: "Финансы", sub: "MRR, история платежей и выставление счётов" },
    system: { title: "Система", sub: "Настройки, API ключи, объявления" },
  };
  const current = sectionTitles[activeSection];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/80 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-sidebar z-50 flex flex-col lg:hidden"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground/60">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        {/* System Alert Banner */}
        {alertEnabled && systemAlert && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2.5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700 font-sans">{systemAlert}</p>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <Breadcrumbs items={[{ label: "Admin Panel", href: "/admin" }, { label: current.title }]} />
              <h1 className="text-xl font-bold text-foreground">{current.title}</h1>
              <p className="text-xs text-muted-foreground font-sans">{current.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-sans bg-muted px-3 py-1.5 rounded-full">
              <Cpu className="w-3.5 h-3.5" />
              {aiProvider === "gemini" ? "Gemini" : "OpenAI"} • Онлайн
            </div>
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors overflow-hidden">
              <img src="/favicon.webp" alt="Logo" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "dashboard" && <DashboardView teachers={teachers} orgs={orgs} payments={payments} auditLogs={auditLogs} isLoading={isLoading} />}
              {activeSection === "teachers" && (
                <TeachersView
                  teachers={teachers}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  toggleBlock={toggleBlock}
                  showResetModal={showResetModal}
                  setShowResetModal={setShowResetModal}
                  isLoading={isLoading}
                />
              )}
              {activeSection === "organizations" && <OrgsView orgs={orgs} isLoading={isLoading} />}
              {activeSection === "ai-monitor" && (
                <AiMonitorView
                  teachers={teachers}
                  aiProvider={aiProvider}
                  setAiProvider={setAiProvider}
                  toggleBlock={toggleBlock}
                  dailyTokens={[]} // No history data yet
                  isLoading={isLoading}
                />
              )}
              {activeSection === "finances" && <FinancesView payments={payments} isLoading={isLoading} />}
              {activeSection === "system" && (
                <SystemView
                  aiProvider={aiProvider}
                  systemAlert={systemAlert}
                  setSystemAlert={setSystemAlert}
                  alertEnabled={alertEnabled}
                  setAlertEnabled={setAlertEnabled}
                  auditLogs={auditLogs}
                  isLoading={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Pagination Controls */}
          {["teachers", "organizations", "finances", "audit-logs"].includes(activeSection) && !isLoading && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl font-sans"
              >
                Назад
              </Button>
              <span className="flex items-center px-4 font-mono text-sm">{page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={teachers.length < LIMIT && orgs.length < LIMIT && payments.length < LIMIT && auditLogs.length < LIMIT}
                className="rounded-xl font-sans"
              >
                Вперед
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
