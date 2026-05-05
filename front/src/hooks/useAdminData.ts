import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/api/adminService";
import {
  Teacher, Org, Payment, FinancialStats, AuditLog,
  ApiTeacher, ApiAnalyticEntry, ApiOrg, ApiPayment, ApiAuditLog,
} from "@/types/admin";

const LIMIT = 50;

interface UseAdminDataOptions {
  page: number;
  searchQuery: string;
}

export function useAdminData({ page, searchQuery }: UseAdminDataOptions) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [financials, setFinancials] = useState<FinancialStats>({
    mrr: 0, total_revenue: 0, active_subscriptions: 0, pending_payments: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemAlert, setSystemAlert] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [adminTelegram, setAdminTelegram] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * LIMIT;
      const [
        teachersData, analyticsData, orgsData, paymentsData, logsData,
        alertData, enabledData, providerData, financialsData, telegramData,
      ] = await Promise.all([
        adminService.getTeachers(skip, LIMIT, searchQuery),
        adminService.getAnalytics(),
        adminService.getOrganizations(skip, LIMIT),
        adminService.getPayments(skip, LIMIT),
        adminService.getAuditLogs(skip, LIMIT),
        adminService.getSetting("system_alert").catch(() => null),
        adminService.getSetting("alert_enabled").catch(() => null),
        adminService.getSetting("ai_provider").catch(() => null),
        adminService.getFinancials().catch(() => null),
        adminService.getSetting("admin_telegram").catch(() => null),
      ]);

      if (alertData) setSystemAlert(alertData.value);
      if (enabledData) setAlertEnabled(enabledData.value === "true");
      if (providerData) setAiProvider(providerData.value as "gemini" | "openai");
      if (telegramData) setAdminTelegram(telegramData.value || "");
      if (financialsData) setFinancials({
        mrr: financialsData.mrr ?? 0,
        total_revenue: financialsData.total_revenue ?? 0,
        active_subscriptions: financialsData.active_subscriptions ?? 0,
        pending_payments: financialsData.pending_payments ?? 0,
      });

      const analyticsMap = new Map(
        (analyticsData as ApiAnalyticEntry[]).map(a => [a.user_id, a])
      );
      setTeachers((teachersData as ApiTeacher[]).map(u => {
        const stats = analyticsMap.get(u.id);
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
          tokens_limit: u.tokens_limit || 0,
          expires_at: u.expires_at || null,
          organization_id: u.organization_id ?? null,
          role: u.role || "teacher",
        };
      }));
      setOrgs((orgsData as ApiOrg[]).map(o => ({
        id: o.id, name: o.name, contact: o.contact_person,
        seats: o.license_seats, used: o.used_seats || 0,
        expires: o.expires_at, status: o.status,
      })));
      setPayments((paymentsData as ApiPayment[]).map(p => ({
        id: p.id, org: p.org_name || "Unknown", amount: p.amount,
        currency: p.currency, date: p.date, method: p.method,
        status: p.status, period: p.period,
      })));
      setAuditLogs((logsData as ApiAuditLog[]).map(l => ({
        id: l.id, action: l.action, target: l.target,
        time: new Date(l.timestamp).toLocaleString("ru-RU"), type: l.log_type,
      })));
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return {
    teachers, orgs, payments, financials, auditLogs,
    systemAlert, setSystemAlert,
    alertEnabled, setAlertEnabled,
    aiProvider, setAiProvider,
    adminTelegram, setAdminTelegram,
    isLoading,
    fetchData,
    pageSize: LIMIT,
  };
}
