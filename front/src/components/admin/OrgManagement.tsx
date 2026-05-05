import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Building2, Users, Upload, Settings, Plus, Zap, Ban, BarChart3, X 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, PlanBadge, ExportMenu } from "./shared/AdminShared";
import { Org, OrgUser } from "@/types/admin";
import { adminService } from "@/api/adminService";
import { exportOrgsCSV, exportOrgsDOCX } from "@/lib/adminExport";
import OrgModal, { OrgFormData } from "@/components/admin/OrgModal";
import BulkImportModal from "@/components/dashboard/BulkImportModal";
import OrgStatsModal from "@/components/dashboard/OrgStatsModal";
import InviteModal from "@/components/dashboard/InviteModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface OrgManagementProps {
  orgs: Org[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const OrgManagement: React.FC<OrgManagementProps> = ({ orgs, isLoading, onRefresh }) => {
  const { t } = useTranslation();
  const [importOrg, setImportOrg] = useState<{ id: number, name: string } | null>(null);
  const [statsOrg, setStatsOrg] = useState<number | null>(null);
  const [usersOrg, setUsersOrg] = useState<{ id: number, name: string } | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [inviteOrg, setInviteOrg] = useState<{ id: number, name: string } | null>(null);
  const [modal, setModal] = useState<{isOpen: boolean, data?: OrgFormData}>({isOpen: false});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [tokenLimitOrg, setTokenLimitOrg] = useState<{ id: number, name: string } | null>(null);
  const [tokenLimitValue, setTokenLimitValue] = useState("30000");

  const handleSave = async (data: OrgFormData) => {
    if (data.id) await adminService.updateOrganization(data.id, data);
    else { const { id: _id, ...createData } = data; await adminService.createOrganization(createData); }
    onRefresh();
    toast.success("Saved correctly");
  };

  const handleDelete = (id: number) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    await adminService.deleteOrganization(confirmDeleteId);
    onRefresh();
    toast.success("Organization deleted");
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
          orgs.map((org, i) => {
            const statusBorder = org.status === "expired"
              ? "border-l-4 border-l-destructive"
              : org.status === "expiring"
              ? "border-l-4 border-l-yellow-400"
              : "border-l-4 border-l-green-500";
            return (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`bg-card border border-border rounded-2xl p-5 ${statusBorder}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground font-sans">{org.name}</h3>
                    <StatusBadge status={org.status} />
                    {(() => {
                      const plan = org.seats <= 10 ? "FREE" : org.seats <= 50 ? "PRO" : "SCHOOL";
                      const cls = plan === "FREE" ? "bg-muted text-muted-foreground" : plan === "PRO" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600";
                      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{plan}</span>;
                    })()}
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
                      className="rounded-xl font-sans h-8 text-xs gap-1"
                      onClick={async () => {
                        setUsersOrg({ id: org.id, name: org.name });
                        const users = await adminService.getOrgUsers(org.id);
                        setOrgUsers(users);
                      }}
                    >
                      <Users className="w-3 h-3" /> {org.used}/{org.seats}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-sans h-8 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/20"
                      onClick={() => setImportOrg({ id: org.id, name: org.name })}
                    >
                      <Upload className="w-3 h-3" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setModal({ isOpen: true, data: { id: org.id, name: org.name, contact_person: org.contact, license_seats: org.seats, expires_at: org.expires, status: org.status } })} className="rounded-xl font-sans h-8 text-xs gap-1">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-sans h-8 text-xs gap-1 border-yellow-500/40 text-yellow-700 hover:bg-yellow-500/10"
                      onClick={() => { setTokenLimitOrg({ id: org.id, name: org.name }); setTokenLimitValue("30000"); }}
                      title="Установить лимит токенов для всех учителей орги"
                    >
                      <Zap className="w-3 h-3" /> Токены
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(org.id)} className="rounded-xl font-sans h-8 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                      <Ban className="w-3 h-3" /> Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })
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
      <AnimatePresence>
        {tokenLimitOrg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
            onClick={() => setTokenLimitOrg(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-sans">Лимит токенов</h3>
                  <p className="text-xs text-muted-foreground font-sans">{tokenLimitOrg.name}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                Установит одинаковый лимит токенов/месяц для <b>всех учителей</b> этой организации.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {[30000, 50000, 100000, 200000].map(v => (
                    <button
                      key={v}
                      onClick={() => setTokenLimitValue(String(v))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border transition-colors ${
                        tokenLimitValue === String(v) ? "bg-primary text-background border-primary" : "border-border hover:bg-muted"
                      }`}
                    >
                      {(v / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={tokenLimitValue}
                  onChange={e => setTokenLimitValue(e.target.value)}
                  className="rounded-xl font-mono"
                  placeholder="Например: 50000"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 rounded-xl font-sans" onClick={() => setTokenLimitOrg(null)}>Отмена</Button>
                <Button className="flex-1 rounded-xl font-sans" onClick={async () => {
                  const limit = parseInt(tokenLimitValue);
                  if (isNaN(limit) || limit < 0) { toast.error("Некорректное значение"); return; }
                  try {
                    const res = await adminService.setOrgTokenLimit(tokenLimitOrg.id, limit);
                    toast.success(`Лимит обновлён для ${res.updated} учителей`);
                    setTokenLimitOrg(null);
                    onRefresh();
                  } catch { toast.error("Ошибка обновления лимита"); }
                }}>
                  Применить
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {usersOrg && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
          onClick={() => setUsersOrg(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">{usersOrg.name}</h3>
                <p className="text-xs text-muted-foreground font-sans">{orgUsers.length} учителей</p>
              </div>
              <button onClick={() => setUsersOrg(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {orgUsers.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/30">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground font-sans">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <PlanBadge plan={user.plan?.toUpperCase() || "FREE"} expiresAt={user.expires_at} />
                    <span className={`text-xs font-sans px-2 py-1 rounded ${user.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {user.is_active ? "Активен" : "Заблокирован"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
      {inviteOrg && <InviteModal orgId={inviteOrg.id} orgName={inviteOrg.name} onClose={() => setInviteOrg(null)} />}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Удалить организацию?"
        message="Организация и все её данные будут удалены безвозвратно. Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
