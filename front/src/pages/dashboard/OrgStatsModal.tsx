import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Users, Activity, BarChart3, Loader2 } from "lucide-react";
import { adminService } from "@/api/adminService";

interface OrgStatsModalProps {
  orgId: number;
  onClose: () => void;
}

const OrgStatsModal = ({ orgId, onClose }: OrgStatsModalProps) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await adminService.getOrgStats(orgId);
        setData(stats);
      } catch (e) {
        console.error("Failed to load org stats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [orgId]);

  return (
    <div className="fixed inset-0 bg-foreground/40 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div>
            <h3 className="font-bold text-foreground font-sans text-lg">Статистика: {data?.org_name || "Загрузка..."}</h3>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">Детализация активности учителей организации</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
          ) : !data ? (
            <div className="text-center py-10 text-muted-foreground">Не удалось загрузить данные</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                     <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-sans">Всего учителей</p>
                    <p className="text-2xl font-bold font-sans">{data.total_teachers}</p>
                  </div>
                </div>
                <div className="bg-muted/30 border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                     <Activity className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-sans">Активны (7 дней)</p>
                    <p className="text-2xl font-bold font-sans">{data.active_last_7_days}</p>
                  </div>
                </div>
                <div className="bg-muted/30 border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                     <BarChart3 className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-sans">Генераций (30 дней)</p>
                    <p className="text-2xl font-bold font-sans">{data.total_generations}</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">Учитель</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">Генерации (30 дн)</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teachers.map((t: any, idx: number) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-5 py-3 text-sm font-medium font-sans text-foreground">{t.name}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{t.email}</td>
                        <td className="px-5 py-3 text-sm font-sans font-bold text-foreground">{t.generations_30d}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{t.last_active || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OrgStatsModal;
