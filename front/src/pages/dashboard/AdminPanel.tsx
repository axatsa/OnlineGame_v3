import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, X, Cpu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { toast } from "sonner";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { adminService } from "@/api/adminService";
import { useAdminData } from "@/hooks/useAdminData";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { OrgManagement } from "@/components/admin/OrgManagement";
import { AiMonitoring } from "@/components/admin/AiMonitoring";
import { FinancialReporting } from "@/components/admin/FinancialReporting";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { Section } from "@/types/admin";

const AdminPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResetModal, setShowResetModal] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const {
    teachers, orgs, payments, financials, auditLogs,
    systemAlert, setSystemAlert, alertEnabled, setAlertEnabled,
    aiProvider, setAiProvider, adminTelegram, setAdminTelegram,
    isLoading, fetchData, pageSize,
  } = useAdminData({ page, searchQuery });

  const handleImpersonate = async (id: number) => {
    try {
      const data = await adminService.impersonateUser(id);
      login(data.access_token, data.user);
      const role = data.user?.role;
      navigate(role === "super_admin" ? "/admin" : role === "org_admin" ? "/org-admin" : "/teacher");
      toast.success("Вход в аккаунт выполнен");
    } catch {
      toast.error("Ошибка при входе в аккаунт");
    }
  };

  const toggleBlock = async (id: number) => {
    try {
      await adminService.toggleTeacherStatus(id);
      fetchData();
      toast.success("Статус изменен");
    } catch { toast.error("Ошибка при изменении статуса"); }
  };

  const handleRoleChange = async (id: number, promote: boolean) => {
    try {
      if (promote) await adminService.promoteToOrgAdmin(id);
      else await adminService.demoteFromOrgAdmin(id);
      fetchData();
      toast.success("Роль обновлена. Пользователь должен перезайти.");
    } catch { toast.error("Ошибка при изменении роли"); }
  };

  const sectionTitles: Record<Section, { title: string; sub: string }> = {
    dashboard:     { title: t("admin_dash_title"),     sub: t("admin_dash_sub") },
    teachers:      { title: t("admin_teachers_title"), sub: t("admin_teachers_sub") },
    organizations: { title: t("admin_orgs_title"),     sub: t("admin_orgs_sub") },
    "ai-monitor":  { title: t("admin_monitor_title"),  sub: t("admin_monitor_sub") },
    finances:      { title: t("admin_finances_title"), sub: t("admin_finances_sub") },
    system:        { title: t("admin_system_title"),   sub: t("admin_system_sub") },
  };
  const current = sectionTitles[activeSection];

  const sidebarProps = {
    activeSection, setActiveSection, setSidebarOpen, aiProvider,
    counts: {
      expiringTeachers: teachers.filter(t_ => t_.status === "expiring").length,
      pendingPayments: payments.filter(p => p.status === "pending").length,
    },
  };

  const hasMorePages = teachers.length >= pageSize || orgs.length >= pageSize || payments.length >= pageSize;
  const showPager = ["teachers", "organizations", "finances"].includes(activeSection) && !isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar fixed inset-y-0 left-0 z-30">
        <AdminSidebar {...sidebarProps} />
      </aside>

      {/* Mobile sidebar overlay */}
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
              className="fixed inset-y-0 left-0 w-64 bg-sidebar z-50 flex flex-col lg:hidden"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground/60">
                <X className="w-5 h-5" />
              </button>
              <AdminSidebar {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-64">
        {alertEnabled && systemAlert && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2.5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700 font-sans">{systemAlert}</p>
          </div>
        )}

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
              <Cpu className="w-3.5 h-3.5" /> {aiProvider === "gemini" ? "Gemini" : "OpenAI"} • Онлайн
            </div>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <img src="/logo_sticker.webp" className="w-full h-full object-contain" />
            </button>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              {activeSection === "dashboard" && (
                <AdminDashboard teachers={teachers} orgs={orgs} payments={payments} auditLogs={auditLogs} isLoading={isLoading} />
              )}
              {activeSection === "teachers" && (
                <UserManagement
                  teachers={teachers} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  toggleBlock={toggleBlock} showResetModal={showResetModal} setShowResetModal={setShowResetModal}
                  isLoading={isLoading} onRefresh={fetchData} onImpersonate={handleImpersonate}
                  selectedIds={selectedIds} setSelectedIds={setSelectedIds}
                  onPromote={id => handleRoleChange(id, true)} onDemote={id => handleRoleChange(id, false)}
                />
              )}
              {activeSection === "organizations" && (
                <OrgManagement orgs={orgs} isLoading={isLoading} onRefresh={fetchData} />
              )}
              {activeSection === "ai-monitor" && (
                <AiMonitoring teachers={teachers} aiProvider={aiProvider} setAiProvider={setAiProvider} toggleBlock={toggleBlock} isLoading={isLoading} />
              )}
              {activeSection === "finances" && (
                <FinancialReporting payments={payments} financials={financials} isLoading={isLoading} orgs={orgs} teachers={teachers} />
              )}
              {activeSection === "system" && (
                <SystemSettings
                  aiProvider={aiProvider} setAiProvider={setAiProvider}
                  systemAlert={systemAlert} setSystemAlert={setSystemAlert}
                  alertEnabled={alertEnabled} setAlertEnabled={setAlertEnabled}
                  auditLogs={auditLogs} isLoading={isLoading}
                  adminTelegram={adminTelegram} setAdminTelegram={setAdminTelegram}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {showPager && (
            <div className="mt-6 flex justify-center gap-2">
              <span className="flex items-center px-4 font-mono text-sm">{t("page")} {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("prev")}</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasMorePages}>{t("next")}</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
