import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { ResourceQRCode } from "@/components/common/ResourceQRCode";

interface HistoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export const HistoryDetailsModal = ({ isOpen, onClose, item }: HistoryDetailsModalProps) => {
  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-bold text-lg text-foreground font-sans truncate pr-4">{item.topic || "Без темы"}</h3>
                <p className="text-sm text-muted-foreground font-sans">{new Date(item.created_at).toLocaleString("ru-RU")}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-background hover:bg-muted rounded-full transition-colors shrink-0">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
              <div className="prose dark:prose-invert max-w-none font-sans">
                {/* Check if content is string or object */}
                {typeof item.content === "string" ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{
                    item.content.length > 5000 ? item.content.slice(0, 5000) + "...\n\n(Контент слишком большой для предпросмотра)" : item.content
                  }</pre>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{JSON.stringify(item.content, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area for Export & QR */}
          <div className="w-full md:w-80 bg-muted/10 border-t md:border-t-0 md:border-l border-border p-6 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h4 className="font-bold text-foreground mb-1">Экспорт материала</h4>
              <p className="text-xs text-muted-foreground font-sans mb-4">
                Отправьте на печать или сохраните
              </p>
              
              <ResourceQRCode logId={item.id} topic={item.topic || "Материал"} />
            </div>

            <div className="mt-auto space-y-3 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                <ExternalLink className="w-4 h-4 shrink-0 text-primary" />
                <span>Ссылка для телефонов работает без авторизации, чтобы легко сканировать с доски.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
