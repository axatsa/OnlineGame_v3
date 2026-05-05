import React from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, BarChart3, CreditCard, Receipt, Building2, ArrowUpRight, 
  Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard, PieChart, MrrChart, ExportMenu } from "./shared/AdminShared";
import { Payment, FinancialStats, Org, Teacher } from "@/types/admin";
import { exportPaymentsCSV, exportPaymentsDOCX } from "@/lib/adminExport";

interface FinancialReportingProps {
  payments: Payment[];
  financials: FinancialStats;
  orgs: Org[];
  teachers: Teacher[];
  isLoading: boolean;
}

export const FinancialReporting: React.FC<FinancialReportingProps> = ({
  payments, financials, orgs, teachers, isLoading
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const fmtUZS = (n: number) => n.toLocaleString("ru-RU") + " сум";

  // Compute real MRR from paid payments in the last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentPaid = payments.filter(p => p.status === "paid" && new Date(p.date).getTime() > thirtyDaysAgo);
  const realMRR = recentPaid.reduce((s, p) => s + p.amount, 0) || financials.mrr;

  const totalMRR = realMRR;
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) || financials.total_revenue;
  const pendingCount = payments.filter(p => p.status === "pending").length || financials.pending_payments;
  const arr = totalMRR * 12;

  // Real monthly chart from paid payments
  const monthlyMap: Record<string, number> = {};
  payments.filter(p => p.status === "paid").forEach(p => {
    const d = new Date(p.date);
    const key = d.toLocaleString("ru-RU", { month: "short" });
    monthlyMap[key] = (monthlyMap[key] || 0) + p.amount;
  });
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const mrrData = months
    .map(m => ({ month: m, mrr: monthlyMap[m] || 0 }))
    .filter((_, i) => i <= new Date().getMonth())
    .slice(-5);
  if (mrrData.length === 0) {
    const m = new Date().toLocaleString("ru-RU", { month: "short" });
    mrrData.push({ month: m, mrr: totalMRR });
  }

  // MRR growth: compare last two months
  const lastMRR = mrrData.length >= 2 ? mrrData[mrrData.length - 2].mrr : 0;
  const mrrGrowth = lastMRR > 0 ? Math.round(((totalMRR - lastMRR) / lastMRR) * 100) : 0;

  const payStatusData = [
    { label: "Оплачено", value: payments.filter(p => p.status === "paid").length },
    { label: "Ожидание", value: payments.filter(p => p.status === "pending").length },
    { label: "Ошибка", value: payments.filter(p => p.status === "failed").length },
  ];

  const orgStatusData = [
    { label: "Активно", value: orgs.filter(o => o.status === "active").length },
    { label: "Истекает", value: orgs.filter(o => o.status === "expiring").length },
    { label: "Истёк", value: orgs.filter(o => o.status === "expired").length },
  ];

  const planDistData = [
    { label: "FREE", value: teachers.filter(t_ => t_.plan === "FREE").length },
    { label: "PRO", value: teachers.filter(t_ => t_.plan === "PRO").length },
    { label: "SCHOOL", value: teachers.filter(t_ => t_.plan === "SCHOOL").length },
  ];

  const teacherStatusData = [
    { label: "Активно", value: teachers.filter(t_ => t_.status === "active").length },
    { label: "Скоро", value: teachers.filter(t_ => t_.status === "expiring").length },
    { label: "Истёк", value: teachers.filter(t_ => t_.status === "expired" || t_.status === "blocked").length },
  ];

  const revByPlan = [
    { plan: "FREE", count: teachers.filter(t_ => t_.plan === "FREE").length, mrr: 0 },
    { plan: "PRO", count: teachers.filter(t_ => t_.plan === "PRO").length, mrr: teachers.filter(t_ => t_.plan === "PRO").length * 190000 },
    { plan: "SCHOOL", count: teachers.filter(t_ => t_.plan === "SCHOOL").length, mrr: teachers.filter(t_ => t_.plan === "SCHOOL").length * 620000 },
  ];

  const payStatusMap: Record<string, { label: string; cls: string }> = {
    paid: { label: `✅ ${t("adminStatusPaid")}`, cls: "bg-success/15 text-success border-0" },
    pending: { label: `⏳ ${t("adminStatusPending")}`, cls: "bg-yellow-500/15 text-yellow-600 border-0" },
    failed: { label: `❌ ${t("adminStatusFailed")}`, cls: "bg-destructive/15 text-destructive border-0" },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label={t("adminMetricMRR")} value={fmtUZS(totalMRR)} sub={mrrGrowth !== 0 ? `${mrrGrowth > 0 ? "+" : ""}${mrrGrowth}% vs пред. месяц` : "текущий месяц"} trend={mrrGrowth > 0 ? "up" : mrrGrowth < 0 ? "down" : undefined} color="bg-success/10 text-success" />
        <MetricCard icon={BarChart3} label={t("adminMetricARR")} value={fmtUZS(arr)} sub={`× 12 ${lang === "ru" ? "от" : "dan"} MRR`} color="bg-primary/10 text-primary" />
        <MetricCard icon={CreditCard} label={t("adminMetricTotal")} value={fmtUZS(totalPaid)} sub={lang === "ru" ? "за все время" : "barcha vaqt davomida"} color="bg-violet-500/10 text-violet-600" />
        <MetricCard icon={Receipt} label={t("adminMetricPending")} value={String(pendingCount)} sub={lang === "ru" ? "требуют звонка" : "qo'ng'iroq kutilmoqda"} trend={pendingCount > 0 ? "down" : undefined} color="bg-yellow-500/10 text-yellow-600" />
      </div>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Статус платежей</h3>
          <PieChart data={payStatusData} colors={["#10b981", "#f59e0b", "#ef4444"]} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Статус организаций</h3>
          <PieChart data={orgStatusData} colors={["#10b981", "#f59e0b", "#ef4444"]} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Распределение планов (учителя)</h3>
          <PieChart data={planDistData} colors={["#94a3b8", "#3b82f6", "#8b5cf6"]} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Статус подписок учителей</h3>
          <PieChart data={teacherStatusData} colors={["#10b981", "#f59e0b", "#ef4444"]} />
        </div>
      </div>

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
                        <span className="text-sm font-bold text-foreground font-sans">{p.amount.toLocaleString("ru-RU")}</span>
                        <span className="text-xs text-muted-foreground font-sans ml-1">{p.currency || "UZS"}</span>
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

      {/* Revenue by plan breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Доход по тарифам (расчётный MRR)</h3>
        <div className="space-y-3">
          {revByPlan.map(({ plan, count, mrr }) => {
            const pct = revByPlan.reduce((s, r) => s + r.mrr, 0) > 0
              ? (mrr / revByPlan.reduce((s, r) => s + r.mrr, 0)) * 100
              : 0;
            const color = plan === "FREE" ? "bg-slate-400" : plan === "PRO" ? "bg-blue-500" : "bg-purple-500";
            return (
              <div key={plan} className="flex items-center gap-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${color}`}>{plan}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right min-w-28">
                  <span className="text-sm font-bold text-foreground">{fmtUZS(mrr)}</span>
                  <span className="text-xs text-muted-foreground ml-2">({count} чел.)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
