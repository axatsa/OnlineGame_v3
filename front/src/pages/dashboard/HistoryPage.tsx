import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Star, Brain, LayoutGrid, FileText, Calculator, Search, Filter, Loader2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

type HistoryItem = {
  id: number;
  generator_type: "math" | "quiz" | "crossword" | "assignment";
  topic: string;
  content: string;
  created_at: string;
  is_favorite: number;
};

const HistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFav, setFilterFav] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/generate/history");
        setItems(res.data);
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleFavorite = async (id: number) => {
    // optimistic update
    setItems(items.map(item => item.id === id ? { ...item, is_favorite: item.is_favorite === 1 ? 0 : 1 } : item));
    try {
      await api.post(`/generate/history/${id}/favorite`);
    } catch (e) {
      // revert on fail
      setItems(items.map(item => item.id === id ? { ...item, is_favorite: item.is_favorite === 1 ? 0 : 1 } : item));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "math": return <Calculator className="w-4 h-4 text-primary" />;
      case "quiz": return <Brain className="w-4 h-4 text-violet-500" />;
      case "crossword": return <LayoutGrid className="w-4 h-4 text-success" />;
      case "assignment": return <FileText className="w-4 h-4 text-yellow-500" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "math": return t("genMath");
      case "quiz": return t("genQuiz");
      case "crossword": return t("genCrossword");
      case "assignment": return t("genAssignment");
      default: return type;
    }
  };

  const filteredItems = items.filter(item => {
    if (filterFav && item.is_favorite === 0) return false;
    if (filterType !== "all" && item.generator_type !== filterType) return false;
    if (search && !item.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">История генераций</h1>
            <p className="text-sm text-muted-foreground font-sans">Здесь сохраняются все созданные материалы</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-1/3">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
                placeholder="Поиск по теме..." 
                className="pl-10 rounded-xl"
                value={search}
                onChange={e => setSearch(e.target.value)}
             />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <select 
               className="h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary items-center"
               value={filterType}
               onChange={e => setFilterType(e.target.value)}
             >
                <option value="all">Все форматы</option>
                <option value="math">{t("genMath")}</option>
                <option value="quiz">{t("genQuiz")}</option>
                <option value="crossword">{t("genCrossword")}</option>
                <option value="assignment">{t("genAssignment")}</option>
             </select>
             <Button 
                variant={filterFav ? "default" : "outline"} 
                className="gap-2 rounded-xl"
                onClick={() => setFilterFav(!filterFav)}
             >
                <Star className={`w-4 h-4 ${filterFav ? "fill-white" : ""}`} /> Избранное
             </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
             <TableSkeleton columns={1} rows={5} />
          ) : filteredItems.length === 0 ? (
             <EmptyState 
                icon={History} 
                title="Истории пока нет" 
                description="Сгенерируйте новые материалы, и они появятся здесь." 
             />
          ) : (
            <AnimatePresence>
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 hover:border-primary/40 transition-colors"
                >
                   <div className="w-10 h-10 rounded-xl bg-muted flex flex-shrink-0 items-center justify-center">
                     {getTypeIcon(item.generator_type)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground font-sans truncate">{item.topic}</h3>
                     </div>
                     <p className="text-xs text-muted-foreground font-sans mt-0.5">
                       {getTypeName(item.generator_type)} • {new Date(item.created_at).toLocaleString("ru-RU")}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => toggleFavorite(item.id)}
                       className={`p-2.5 rounded-xl transition-colors ${item.is_favorite === 1 ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" : "hover:bg-muted text-muted-foreground"}`}
                     >
                       <Star className={`w-4 h-4 ${item.is_favorite === 1 ? "fill-current" : ""}`} />
                     </button>
                     <Button 
                        variant="ghost" 
                        className="rounded-xl px-4 gap-2 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-sans"
                        onClick={() => {
                          // Logic to view or load this history item would go here
                          // Navigating back to generator with context, or opening a modal.
                          navigate("/generator");
                        }}
                     >
                       <Play className="w-4 h-4" /> Использовать
                     </Button>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
