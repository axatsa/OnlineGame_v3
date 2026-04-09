import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Plus, X, Trash2, Clock, CheckCircle2, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminService } from "@/api/adminService";

interface Invite {
  id: number;
  token: string;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  is_active: number;
  created_at: string;
}

export default function InviteModal({ orgId, orgName, onClose }: { orgId: number, orgName: string, onClose: () => void }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(30);

  useEffect(() => {
    fetchInvites();
  }, [orgId]);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getOrgInvites(orgId);
      setInvites(data);
    } catch (error) {
      toast.error("Ошибка при загрузке приглашений");
    } finally {
      setIsLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      setIsCreating(true);
      await adminService.createInvite(orgId, { max_uses: maxUses });
      toast.success("Ссылка приглашения создана");
      fetchInvites();
    } catch (error) {
      toast.error("Не удалось создать ссылку");
    } finally {
      setIsCreating(false);
    }
  };

  const revokeInvite = async (id: number) => {
    try {
      await adminService.revokeInvite(id);
      toast.success("Приглашение отозвано");
      fetchInvites();
    } catch (error) {
      toast.error("Ошибка при отзыве");
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована в буфер обмена");
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Приглашения для {orgName}</h3>
              <p className="text-xs text-muted-foreground font-sans">Создавайте ссылки для быстрой регистрации учителей</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" /> Новое приглашение
            </h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Мax учителей</p>
                <Input 
                  type="number" 
                  value={maxUses} 
                  onChange={(e) => setMaxUses(parseInt(e.target.value))} 
                  className="rounded-xl font-sans h-10"
                />
              </div>
              <Button 
                onClick={createInvite} 
                disabled={isCreating} 
                className="mt-5 rounded-xl font-sans h-10 px-6 gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Создать
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground px-1">Активные ссылки</h4>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-sans">Активных ссылок пока нет</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-mono text-muted-foreground">
                        {invite.token.slice(0, 8)}...
                      </code>
                      <span className="text-xs font-semibold text-primary">
                        {invite.uses_count} / {invite.max_uses} мест занято
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> до {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" /> Активна
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(invite.token)}
                      className="rounded-lg h-9 w-9 p-0 hover:bg-primary hover:text-white transition-colors border-primary/20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => revokeInvite(invite.id)}
                      className="rounded-lg h-9 w-9 p-0 hover:bg-destructive hover:text-white transition-colors border-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted/10 rounded-b-3xl text-center">
          <p className="text-[11px] text-muted-foreground font-sans">
            Ссылки приглашения позволяют учителям самостоятельно регистрироваться.
            После использования лимита или истечения срока ссылка станет недействительной.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
