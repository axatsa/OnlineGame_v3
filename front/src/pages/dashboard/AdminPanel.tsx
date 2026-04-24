import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Building2, BrainCircuit, Settings,
  Menu, X, LogOut, Shield, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Ban, Key, Bell,
  Eye, Lock, Unlock, LogIn,
  DollarSign, Zap, Activity, Search, Plus,
  Filter, Download, Calendar, Cpu,
  ToggleLeft, ToggleRight, FileText,
  ArrowUpRight, ArrowDownRight, WifiOff, Wifi,
  CreditCard, Receipt, BarChart3, Loader2, Globe, Sun, Moon,
  Upload, ChevronDown, ChevronUp, BarChart2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClass } from "@/context/ClassContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import BulkImportModal from "./BulkImportModal";
import OrgStatsModal from "./OrgStatsModal";
import InviteModal from "./InviteModal";
import TeacherModal, { TeacherFormData } from "@/components/admin/TeacherModal";
import OrgModal, { OrgFormData } from "@/components/admin/OrgModal";
import * as docx from "docx";
import { saveAs } from "file-saver";

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = docx;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { toast } from "sonner";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { adminService } from "@/api/adminService";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "teachers" | "organizations" | "ai-monitor" | "finances" | "system";

type Teacher = {
  id: number; name: string; login: string; school: string;
  status: string; lastLogin: string; plan: string; tokenUsage: number; ip: string;
  is_active: boolean;
  tokens_limit: number;
};

type Org = {
  id: number; name: string; contact: string; seats: number;
  used: number; expires: string; status: string;
};

type Payment = {
  id: number; org: string; amount: number; currency: string;
  date: string; method: string; status: "paid" | "pending" | "failed"; period: string;
};

type FinancialStats = {
  mrr: number;
  total_revenue: number;
  active_subscriptions: number;
  pending_payments: number;
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

const exportTeachersCSV = (teachers: Teacher[], t: any) => {
  downloadCSV(
    `classplay_teachers_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_name"), t("exp_login"), t("exp_school"), t("exp_status"), t("exp_last_login"), t("exp_plan"), t("exp_tokens"), t("exp_ip")],
    teachers.map(t_ => [t_.name, t_.login, t_.school, t_.status, t_.lastLogin, t_.plan, String(t_.tokenUsage), t_.ip])
  );
};

const exportOrgsCSV = (orgs: Org[], t: any) => {
  downloadCSV(
    `classplay_organizations_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_org_name"), t("exp_contact"), t("exp_seats_total"), t("exp_seats_used"), t("exp_expires"), t("exp_status")],
    orgs.map(o => [o.name, o.contact, String(o.seats), String(o.used), o.expires, o.status])
  );
};

const exportAiUsageCSV = (teachers: Teacher[], t: any) => {
  downloadCSV(
    `classplay_ai_usage_${new Date().toISOString().slice(0, 10)}.csv`,
    ["#", t("exp_teacher"), t("exp_school"), t("exp_ip"), t("exp_tokens_used"), t("exp_status")],
    [...teachers]
      .sort((a, b) => b.tokenUsage - a.tokenUsage)
      .map((t_, i) => [String(i + 1), t_.name, t_.school, t_.ip, String(t_.tokenUsage), t_.status])
  );
};

const exportPaymentsCSV = (payments: Payment[], t: any) => {
  downloadCSV(
    `classplay_payments_${new Date().toISOString().slice(0, 10)}.csv`,
    [t("exp_org_name"), t("exp_amount"), t("exp_currency"), t("exp_date"), t("exp_method"), t("exp_status"), t("exp_period")],
    payments.map(p => [p.org, String(p.amount), p.currency, p.date, p.method, p.status, p.period])
  );
};

// HTML-to-PDF export via print dialog
// structured DOCX export
const exportTeachersDOCX = async (teachers: Teacher[], t: any) => {
  try {

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Super Admin Report: Teachers List", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_teacher_login"), t("exp_school"), t("exp_last_login"), t("exp_tokens"), t("exp_status"), t("exp_plan")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" }
                }))
              }),
              ...teachers.map(t_ => new TableRow({
                children: [
                  `${t_.name} (@${t_.login})`,
                  t_.school,
                  t_.lastLogin,
                  t_.tokenUsage.toLocaleString(),
                  t_.status,
                  t_.plan
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `teachers_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Teachers report DOCX downloaded!");
  } catch (e) { console.error(e); toast.error("DOCX failed"); }
};

const exportOrgsDOCX = async (orgs: Org[], t: any) => {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Organizations Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_org_name"), t("exp_contact"), t("exp_seats_total"), t("exp_expires"), t("exp_status")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" }
                }))
              }),
              ...orgs.map(o => new TableRow({
                children: [
                  o.name, o.contact, `${o.used}/${o.seats}`, new Date(o.expires).toLocaleDateString("ru-RU"), o.status
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `organizations_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Orgs report DOCX downloaded!");
  } catch (e) { console.error(e); }
};

const exportAiUsageDOCX = async (teachers: Teacher[], t: any) => {
  try {
    const sorted = [...teachers].sort((a, b) => b.tokenUsage - a.tokenUsage);
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "AI Usage Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["#", t("exp_teacher"), t("exp_school"), t("exp_ip"), t("exp_tokens"), t("exp_status")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" }
                }))
              }),
              ...sorted.map((t_, i) => new TableRow({
                children: [
                  String(i + 1), t_.name, t_.school, t_.ip, t_.tokenUsage.toLocaleString(), t_.status
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `ai_usage_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("AI Usage report DOCX downloaded!");
  } catch (e) { console.error(e); }
};

const exportPaymentsDOCX = async (payments: Payment[], t: any) => {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Payments History Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_org_name"), t("exp_amount"), t("exp_date"), t("exp_method"), t("exp_status"), t("exp_period")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" }
                }))
              }),
              ...payments.map(p => new TableRow({
                children: [
                  p.org, `$${p.amount}`, new Date(p.date).toLocaleDateString("ru-RU"), p.method, p.status, p.period
                ].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `payments_report_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Payments report DOCX downloaded!");
  } catch (e) { console.error(e); }
};

const exportAuditLogDOCX = async (logs: any[], t: any) => {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Audit Log Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [t("exp_action"), t("exp_target"), t("exp_time")].map(h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: "f3f4f6" }
                }))
              }),
              ...logs.map(l => new TableRow({
                children: [l.action, l.target, l.time].map(v => new TableCell({ children: [new Paragraph({ text: v })] }))
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `audit_log_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success("Audit Log DOCX downloaded!");
  } catch (e) { console.error(e); }
};

// ─── Reusable Sub-components ──────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: `🟢 ${t("admin_status_active")}`, cls: "bg-success/15 text-success border-0" },
    expiring: { label: `🟡 ${t("admin_status_expiring")}`, cls: "bg-yellow-500/15 text-yellow-600 border-0" },
    expired: { label: `🔴 ${t("admin_status_expired")}`, cls: "bg-destructive/15 text-destructive border-0" },
    blocked: { label: `⛔ ${t("admin_status_blocked")}`, cls: "bg-foreground/10 text-muted-foreground border-0" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge className={`font-sans rounded-full px-3 ${s.cls}`}>{s.label}</Badge>;
};

const MetricCard = ({
  icon: Icon, label, value, sub,
  trend, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend?: "up" | "down"; color: string;
}) => {
  return (
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
};

const BarChart = ({ data }: { data: (typeof DAILY_TOKENS) | any[] }) => {
  const max = Math.max(...data.map(d => d.tokens || 0)) || 1;
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-sans">{d.tokens?.toLocaleString()}</span>
          <div
            className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-all cursor-default"
            style={{ height: `${((d.tokens || 0) / max) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground font-sans">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const MrrChart = ({ data }: { data: typeof MRR_DATA }) => {
  const max = Math.max(...data.map(d => d.mrr)) || 1;
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

const ExportMenu = ({ onCSV, onPDF }: { onCSV: () => void; onPDF: () => void }) => {
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
              <FileText className="w-3.5 h-3.5 text-destructive" /> Скачать DOCX
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardView = ({ teachers, orgs, payments, auditLogs, isLoading }: { teachers: Teacher[]; orgs: Org[]; payments: Payment[]; auditLogs: any[]; isLoading: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label={t("admin_total_teachers")} value={String(teachers.length)} sub="+12 за месяц" trend="up" color="bg-primary/10 text-primary" />
        <MetricCard icon={Building2} label={t("admin_orgs")} value={String(orgs.length)} sub={`${orgs.filter(o => o.status === "expiring").length} истекают`} color="bg-yellow-500/10 text-yellow-600" />
        <MetricCard icon={DollarSign} label={t("admin_revenue")} value={`$${payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toLocaleString()}`} sub="+18% рост" trend="up" color="bg-success/10 text-success" />
        <MetricCard icon={BrainCircuit} label={t("admin_tokens_stat")} value="1.2M" sub="24.5k сегодня" color="bg-violet-500/10 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">{t("admin_recent_payments")}</h3>
            <button className="text-xs font-semibold text-primary hover:underline">{t("admin_all_ops")}</button>
          </div>
          <div className="space-y-4">
            {isLoading ? <TableSkeleton rows={4} columns={3} /> : payments.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.org}</p>
                    <p className="text-xs text-muted-foreground">{p.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${p.amount}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-5">{t("admin_ai_activity")}</h3>
          <BarChart data={DAILY_TOKENS} />
        </div>
      </div>
    </div>
  );
};

const TeachersView = ({
  teachers, searchQuery, setSearchQuery, toggleBlock, showResetModal, setShowResetModal, isLoading, onRefresh, onImpersonate,
  selectedIds, setSelectedIds,
}: {
  teachers: Teacher[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  toggleBlock: (id: number) => void;
  showResetModal: number | null;
  setShowResetModal: (v: number | null) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onImpersonate: (id: number) => void;
  selectedIds: number[];
  setSelectedIds: (v: number[] | ((prev: number[]) => number[])) => void;
}) => {
  const { t } = useTranslation();
  const filtered = teachers;
  const [tmpPwd] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [modal, setModal] = useState<{isOpen: boolean, data?: TeacherFormData}>({isOpen: false});

  const handleSave = async (data: TeacherFormData) => {
    if (data.id) await adminService.updateTeacher(data.id, data);
    else await adminService.createTeacher(data as any);
    onRefresh();
    toast.success("Saved successfully");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Вы уверены, что хотите удалить этого учителя?")) {
      await adminService.deleteTeacher(id);
      onRefresh();
      toast.success("Deleted");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin_search_placeholder")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl font-sans"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl font-sans">
          <Filter className="w-4 h-4" /> {t("adminFilter")}
        </Button>
        <ExportMenu
          onCSV={() => exportTeachersCSV(teachers, t)}
          onPDF={() => exportTeachersDOCX(teachers, t)}
        />
        <Button className="gap-2 rounded-xl font-sans" onClick={() => setModal({ isOpen: true })}>
          <Plus className="w-4 h-4" /> {t("admin_add_teacher")}
        </Button>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6"
          >
            <span className="text-sm font-semibold font-sans">Выбрано: {selectedIds.length}</span>
            <div className="h-4 w-px bg-background/20" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-background/10 text-background gap-2 h-8 text-xs font-sans"
                onClick={async () => {
                  await adminService.bulkBlockTeachers(selectedIds);
                  setSelectedIds([]);
                  onRefresh();
                  toast.success("Пользователи заблокированы");
                }}
              >
                <Lock className="w-3.5 h-3.5" /> Блокировать
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-background/10 text-background gap-2 h-8 text-xs font-sans"
                onClick={async () => {
                  await adminService.bulkUnblockTeachers(selectedIds);
                  setSelectedIds([]);
                  onRefresh();
                  toast.success("Пользователи разблокированы");
                }}
              >
                <Unlock className="w-3.5 h-3.5" /> Разблокировать
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-destructive/20 text-destructive gap-2 h-8 text-xs font-sans"
                onClick={async () => {
                  if (confirm(`Вы уверены, что хотите удалить ${selectedIds.length} учителей?`)) {
                    await adminService.bulkDeleteTeachers(selectedIds);
                    setSelectedIds([]);
                    onRefresh();
                    toast.success("Пользователи удалены");
                  }
                }}
              >
                <X className="w-3.5 h-3.5" /> Удалить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-10 px-5">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filtered.map(t => t.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                {[t("exp_teacher_login"), t("exp_school"), t("exp_last_login"), t("exp_tokens"), t("exp_status"), t("exp_action")].map(h => (
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
                    <EmptyState icon={Users} title={t("admin_teachers_not_found")} description={t("admin_no_teachers")} />
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
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(prev => [...prev, t.id]);
                          else setSelectedIds(prev => prev.filter(id => id !== t.id));
                        }}
                      />
                    </td>
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
                        <button onClick={() => onImpersonate(t.id)} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Войти как пользователь">
                          <LogIn className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button onClick={() => setModal({ isOpen: true, data: { id: t.id, full_name: t.name, email: t.login, tokens_limit: t.tokens_limit, password: "", phone: "", plan: t.plan } as any })} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Редактировать">
                          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => setShowResetModal(t.id)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Сбросить пароль">
                          <Key className="w-3.5 h-3.5 text-muted-foreground" />
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
                        <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Удалить">
                          <X className="w-3.5 h-3.5 text-destructive" />
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
                  <h3 className="font-semibold text-foreground">{t("admin_reset_pwd_title")}</h3>
                  <p className="text-xs text-muted-foreground font-sans">{teachers.find(t => t.id === showResetModal)?.name}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground font-sans mb-1">{t("admin_temp_pwd")}</p>
                <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{tmpPwd}</p>
              </div>
              <p className="text-xs text-muted-foreground font-sans mb-4">{t("admin_pwd_hint")}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl font-sans" onClick={() => setShowResetModal(null)}>Отмена</Button>
                <Button className="flex-1 rounded-xl font-sans" onClick={async () => {
                  try {
                    await adminService.resetTeacherPassword(showResetModal, tmpPwd);
                    toast.success("Пароль успешно изменён");
                    setShowResetModal(null);
                  } catch (e) {
                    toast.error("Ошибка при сбросе пароля");
                  }
                }}>Подтвердить</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TeacherModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ isOpen: false })} 
        onSave={handleSave} 
        initialData={modal.data} 
      />
    </div>
  );
};

const OrgsView = ({ orgs, isLoading, onRefresh }: { orgs: Org[]; isLoading: boolean; onRefresh: () => void }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [importOrg, setImportOrg] = useState<{ id: number, name: string } | null>(null);
  const [statsOrg, setStatsOrg] = useState<number | null>(null);
  const [inviteOrg, setInviteOrg] = useState<{ id: number, name: string } | null>(null);
  const [modal, setModal] = useState<{isOpen: boolean, data?: OrgFormData}>({isOpen: false});

  const handleSave = async (data: OrgFormData) => {
    if (data.id) await adminService.updateOrganization(data.id, data);
    else await adminService.createOrganization(data as any);
    onRefresh();
    toast.success("Saved correctly");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Вы уверены?")) {
      await adminService.deleteOrganization(id);
      onRefresh();
      toast.success("Organization deleted");
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <ExportMenu
          onCSV={() => exportOrgsCSV(orgs, t)}
          onPDF={() => exportOrgsDOCX(orgs, t)}
        />
        <Button className="gap-2 rounded-xl font-sans" onClick={() => setModal({ isOpen: true })}><Plus className="w-4 h-4" /> {t("admin_new_org")}</Button>
      </div>
      <div className="grid gap-4">
        {isLoading ? (
          <TableSkeleton rows={3} columns={1} />
        ) : orgs.length === 0 ? (
          <EmptyState icon={Building2} title={t("adminNoOrgs", "Нет организаций")} description={t("adminNoOrgsDesc", "Список организаций пуст")} />
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
                    <button 
                      onClick={() => setStatsOrg(org.id)}
                      className="ml-2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-primary"
                      title="Статистика использования"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-sans h-8 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/20"
                      onClick={() => setImportOrg({ id: org.id, name: org.name })}
                    >
                      <Upload className="w-3 h-3" /> CSV Импорт
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setModal({ isOpen: true, data: org as any })} className="rounded-xl font-sans h-8 text-xs gap-1">
                      <Settings className="w-3 h-3" /> Орг
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-sans h-8 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/5"
                      onClick={() => setInviteOrg({ id: org.id, name: org.name })}
                    >
                      <Plus className="w-3 h-3" /> Инвайт
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(org.id)} className="rounded-xl font-sans h-8 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                      <Ban className="w-3 h-3" /> Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <OrgModal isOpen={modal.isOpen} onClose={() => setModal({isOpen: false})} onSave={handleSave} initialData={modal.data} />
      {importOrg && (
        <BulkImportModal 
          orgId={importOrg.id} 
          orgName={importOrg.name} 
          onClose={() => setImportOrg(null)} 
          onSuccess={() => { onRefresh(); }} 
        />
      )}
      {statsOrg && <OrgStatsModal orgId={statsOrg} onClose={() => setStatsOrg(null)} />}
      {inviteOrg && <InviteModal orgId={inviteOrg.id} orgName={inviteOrg.name} onClose={() => setInviteOrg(null)} />}
    </div>
  );
};

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
  const { t } = useTranslation();
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
            <h3 className="font-semibold text-foreground mb-1">{t("admin_ai_switch")}</h3>
            <p className="text-sm text-muted-foreground font-sans">{t("admin_ai_switch_sub")}</p>
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
            <h3 className="font-semibold text-foreground">{t("admin_top_ai")}</h3>
            <Badge className="bg-destructive/10 text-destructive border-0 font-sans">1 {t("admin_anomaly")}</Badge>
          </div>
          <ExportMenu
            onCSV={() => exportAiUsageCSV(teachers, t)}
            onPDF={() => exportAiUsageDOCX(teachers, t)}
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
                    <EmptyState icon={Users} title={t("adminNoTeachers", "Нет учителей")} description={t("adminNoTeachersDesc", "Список учителей пуст")} />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinancesView = ({ payments, financials, isLoading }: { payments: Payment[]; financials: FinancialStats; isLoading: boolean }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const mrrData = [
    { month: "Aug", mrr: 1200 },
    { month: "Sep", mrr: 1900 },
    { month: "Oct", mrr: 2100 },
    { month: "Nov", mrr: 2400 },
    { month: "Dec", mrr: 2800 },
    { month: "Jan", mrr: financials.mrr || 3400 },
  ];

  const totalMRR = financials.mrr || mrrData[mrrData.length - 1].mrr;
  const prevMRR = mrrData[mrrData.length - 2].mrr || 1; // avoid /0
  const mrrGrowth = (((totalMRR - prevMRR) / prevMRR) * 100).toFixed(1);
  const totalPaid = financials.total_revenue || payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingCount = financials.pending_payments || payments.filter(p => p.status === "pending").length;
  const arr = totalMRR * 12;

  const payStatusMap: Record<string, { label: string; cls: string }> = {
    paid: { label: `✅ ${t("adminStatusPaid")}`, cls: "bg-success/15 text-success border-0" },
    pending: { label: `⏳ ${t("adminStatusPending")}`, cls: "bg-yellow-500/15 text-yellow-600 border-0" },
    failed: { label: `❌ ${t("adminStatusFailed")}`, cls: "bg-destructive/15 text-destructive border-0" },
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label={t("adminMetricMRR")} value={`$${totalMRR}`} sub={`+${mrrGrowth}% vs ${lang === "ru" ? "дек" : "dek"}`} trend="up" color="bg-success/10 text-success" />
        <MetricCard icon={BarChart3} label={t("adminMetricARR")} value={`$${arr.toLocaleString()}`} sub={`× 12 ${lang === "ru" ? "от" : "dan"} MRR`} color="bg-primary/10 text-primary" />
        <MetricCard icon={CreditCard} label={t("adminMetricTotal")} value={`$${totalPaid}`} sub={lang === "ru" ? "за все время" : "barcha vaqt davomida"} color="bg-violet-500/10 text-violet-600" />
        <MetricCard icon={Receipt} label={t("adminMetricPending")} value={String(pendingCount)} sub={lang === "ru" ? "требуют звонка" : "qo'ng'iroq kutilmoqda"} trend={pendingCount > 0 ? "down" : undefined} color="bg-yellow-500/10 text-yellow-600" />
      </div>

      {/* MRR Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">{t("admin_mrr_full")}</h3>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{t("adminChartSub")}</p>
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
            <p className="text-xs text-muted-foreground font-sans">{t("adminNewClients")}</p>
            <p className="text-lg font-bold text-foreground">+3</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">{t("adminChurnRate")}</p>
            <p className="text-lg font-bold text-foreground">2.4%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">{t("adminAvgLTV")}</p>
            <p className="text-lg font-bold text-foreground">$480</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{t("adminPaymentHistory")}</h3>
          <ExportMenu
            onCSV={() => exportPaymentsCSV(payments, t)}
            onPDF={() => exportPaymentsDOCX(payments, t)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[t("adminOrg"), t("adminAmount"), t("adminDate"), t("adminMethod"), t("adminPeriod"), t("adminStatus"), ""].map(h => (
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
                    <EmptyState icon={CreditCard} title={t("adminNoPayments")} description={t("adminPaymentsEmpty")} />
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
                            <Receipt className="w-3 h-3" /> {lang === "ru" ? "Счёт" : "Hisob"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SystemView = ({
  aiProvider, systemAlert, setSystemAlert, alertEnabled, setAlertEnabled, auditLogs, isLoading,
}: {
  aiProvider: string; systemAlert: string; setSystemAlert: (v: string) => void;
  alertEnabled: boolean; setAlertEnabled: (v: boolean) => void;
  auditLogs: any[]; isLoading: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 font-sans">{t("adminSystemSettings")}</h3>
        <div className="space-y-6">
          <div className="p-4 bg-muted/30 rounded-2xl border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> {t("adminSystemAlert")}
            </h4>
            <p className="text-xs text-muted-foreground mb-4 font-sans">{t("adminSystemAlertDesc")}</p>
            <div className="space-y-4">
              <textarea
                value={systemAlert}
                onChange={e => setSystemAlert(e.target.value)}
                className="w-full h-24 bg-card border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-sans"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant={alertEnabled ? "default" : "outline"}
                  onClick={() => setAlertEnabled(!alertEnabled)}
                  className="rounded-xl font-sans text-sm"
                >
                  {alertEnabled ? <ToggleRight className="w-4 h-4 mr-2" /> : <ToggleLeft className="w-4 h-4 mr-2" />}
                  {alertEnabled ? "Активно" : "Выключено"}
                </Button>
                {alertEnabled && <Badge className="bg-success/10 text-success border-0 font-sans">Показывается</Badge>}
                <Button 
                  onClick={() => {
                    adminService.setSetting("system_alert", systemAlert);
                    adminService.setSetting("alert_enabled", String(alertEnabled));
                    toast.success("Объявление сохранено");
                  }}
                  className="ml-auto rounded-xl font-sans h-9 bg-primary/10 text-primary hover:bg-primary/20"
                >
                   Сохранить изменения
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-2xl border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> {t("adminAiProvider")}
            </h4>
            <p className="text-xs text-muted-foreground mb-4 font-sans">{t("adminAiProviderDesc")}</p>
            <div className="flex gap-2">
              {["gemini", "openai"].map(p => (
                <Button
                  key={p}
                  variant={aiProvider === p ? "default" : "outline"}
                  onClick={() => {
                    setAiProvider(p as any);
                    adminService.setSetting("ai_provider", p);
                    toast.success(`Переключено на ${p}`);
                  }}
                  className="rounded-xl font-sans"
                >
                  {p === "gemini" ? "Purple Gemini" : "Green OpenAI"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> {t("adminAuditLogs")}
          </h3>
          <Button variant="outline" size="sm" className="rounded-xl h-8 px-3 text-xs gap-1.5" onClick={() => exportAuditLogDOCX(auditLogs, t)}>
            <Download className="w-3.5 h-3.5" /> {t("admin_export")}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {[t("exp_time"), t("exp_action"), t("exp_target")].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-4">
                    <TableSkeleton rows={5} columns={3} />
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <EmptyState icon={Activity} title={t("adminNoLogs", "Нет логов")} description={t("adminNoLogsDesc", "История действий пуста")} />
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={log.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10 h-10"}`}>
                    <td className="px-6 py-3 text-sm text-muted-foreground font-sans">{log.time}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-foreground font-sans">{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground font-sans">{log.target}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [systemAlert, setSystemAlert] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [showResetModal, setShowResetModal] = useState<number | null>(null);

  // Real Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [financials, setFinancials] = useState<FinancialStats>({ mrr: 0, total_revenue: 0, active_subscriptions: 0, pending_payments: 0 });
  const [auditLogs, setAuditLogs] = useState<any[]>([]); // simplified type for logs
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const handleImpersonate = async (id: number) => {
    try {
      const data = await adminService.impersonateUser(id);
      login(data.access_token, data.user);
      navigate("/dashboard");
      toast.success("Вход в аккаунт выполнен");
    } catch {
      toast.error("Ошибка при входе в аккаунт");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * LIMIT;
      const [teachersData, analyticsData, orgsData, paymentsData, logsData, alertData, enabledData, providerData, financialsData] = await Promise.all([
        adminService.getTeachers(skip, LIMIT, searchQuery),
        adminService.getAnalytics(),
        adminService.getOrganizations(skip, LIMIT),
        adminService.getPayments(skip, LIMIT),
        adminService.getAuditLogs(skip, LIMIT),
        adminService.getSetting("system_alert").catch(() => null),
        adminService.getSetting("alert_enabled").catch(() => null),
        adminService.getSetting("ai_provider").catch(() => null),
        adminService.getFinancials().catch(() => null),
      ]);

      if (alertData) setSystemAlert(alertData.value);
      if (enabledData) setAlertEnabled(enabledData.value === "true");
      if (providerData) setAiProvider(providerData.value as any);
      if (financialsData) setFinancials({
        mrr: financialsData.mrr ?? 0,
        total_revenue: financialsData.total_revenue ?? 0,
        active_subscriptions: financialsData.active_subscriptions ?? 0,
        pending_payments: financialsData.pending_payments ?? 0,
      });

      const analyticsMap = new Map((analyticsData as any).map((a: any) => [a.user_id, a]));
      const mappedTeachers: Teacher[] = (teachersData as any).map((u: any) => {
        const stats = analyticsMap.get(u.id) as any;
        return {
          id: u.id,
          name: u.full_name || "Unknown",
          login: u.email,
          school: u.school || "Online",
          status: u.is_active ? "active" : "blocked",
          lastLogin: stats?.last_active ? new Date(stats.last_active).toLocaleString("ru-RU") : "—",
          plan: u.plan?.toUpperCase() || "FREE",
          tokenUsage: stats?.total_tokens || 0,
          ip: "—",
          is_active: u.is_active,
          tokens_limit: u.tokens_limit || 0
        };
      });
      setTeachers(mappedTeachers);
      setOrgs((orgsData as any).map((o: any) => ({
        id: o.id,
        name: o.name,
        contact: o.contact_person,
        seats: o.license_seats,
        used: o.used_seats || 0,
        expires: o.expires_at,
        status: o.status
      })));
      setPayments((paymentsData as any).map((p: any) => ({
        id: p.id,
        org: p.org_name || "Unknown",
        amount: p.amount,
        currency: p.currency,
        date: p.date,
        method: p.method,
        status: p.status,
        period: p.period
      })));
      setAuditLogs((logsData as any).map((l: any) => ({
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  const toggleBlock = async (id: number) => {
    try {
      await adminService.toggleTeacherStatus(id);
      fetchData();
      toast.success("Статус изменен");
    } catch {
      toast.error("Ошибка при изменении статуса");
    }
  };

  const sectionTitles: Record<Section, { title: string; sub: string }> = {
    dashboard: { title: t("admin_dash_title"), sub: t("admin_dash_sub") },
    teachers: { title: t("admin_teachers_title"), sub: t("admin_teachers_sub") },
    organizations: { title: t("admin_orgs_title"), sub: t("admin_orgs_sub") },
    "ai-monitor": { title: t("admin_monitor_title"), sub: t("admin_monitor_sub") },
    finances: { title: t("admin_finances_title"), sub: t("admin_finances_sub") },
    system: { title: t("admin_system_title"), sub: t("admin_system_sub") },
  };
  const current = sectionTitles[activeSection];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar fixed inset-y-0 left-0 z-30">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setSidebarOpen={setSidebarOpen}
          aiProvider={aiProvider}
          counts={{
            expiringTeachers: teachers.filter(t => t.status === "expiring").length,
            pendingPayments: payments.filter(p => p.status === "pending").length
          }}
        />
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
              <AdminSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                setSidebarOpen={setSidebarOpen}
                aiProvider={aiProvider}
                counts={{
                  expiringTeachers: teachers.filter(t => t.status === "expiring").length,
                  pendingPayments: payments.filter(p => p.status === "pending").length
                }}
              />
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
              <Breadcrumbs items={[{ label: t("adminPanel"), href: "/admin" }, { label: current.title }]} />
              <h1 className="text-xl font-bold text-foreground">{current.title}</h1>
              <p className="text-xs text-muted-foreground font-sans">{current.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-sans bg-muted px-3 py-1.5 rounded-full">
              <Cpu className="w-3.5 h-3.5" />
              {aiProvider === "gemini" ? "Gemini" : "OpenAI"} • Онлайн
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title={isDark ? "Светлая тема" : "Тёмная тема"}
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors overflow-hidden">
              <img src="/logo_sticker.webp" alt="Logo" className="w-full h-full object-contain" />
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
                  onRefresh={fetchData}
                  onImpersonate={handleImpersonate}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                />
              )}
              {activeSection === "organizations" && <OrgsView orgs={orgs} isLoading={isLoading} onRefresh={fetchData} />}
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
              {activeSection === "finances" && <FinancesView payments={payments} financials={financials} isLoading={isLoading} />}
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
              <span className="flex items-center px-4 font-mono text-sm">{t("page")} {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl font-sans"
              >
                {t("prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={teachers.length < LIMIT && orgs.length < LIMIT && payments.length < LIMIT && auditLogs.length < LIMIT}
                className="rounded-xl font-sans"
              >
                {t("next")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
