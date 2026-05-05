import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, FileText, Clock, Loader2, ChevronLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface HistoryItem {
  id: number;
  generator_type: string;
  topic: string;
  content: string;
  created_at: string;
}

const TIME_OPTIONS = [10, 15, 20, 30];

const CreateSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLogId = searchParams.get("log_id") ? Number(searchParams.get("log_id")) : null;
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [timePerQ, setTimePerQ] = useState(20);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/generate/history", { params: { limit: 100, offset: 0 } })
      .then((r) => {
        const filtered = r.data.filter((x: HistoryItem) => x.generator_type === "quiz" || x.generator_type === "assignment");
        setItems(filtered);
        if (preselectedLogId) {
          const match = filtered.find((x: HistoryItem) => x.id === preselectedLogId);
          if (match) setSelected(match);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      const res = await api.post("/sessions/create", { log_id: selected.id, time_per_q: timePerQ });
      navigate(`/games/session/${res.data.code}/host`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Новая сессия</h1>
          <p className="text-sm text-muted-foreground">Выберите материал и настройте время</p>
        </div>
      </div>

      {/* Time selector */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Секунд на вопрос</span>
        </div>
        <div className="flex gap-2">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTimePerQ(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                ${timePerQ === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {t}с
            </button>
          ))}
        </div>
      </div>

      {/* Material list */}
      <p className="text-sm font-medium text-foreground mb-3">Выберите материал</p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">
          Нет доступных Quiz или Assignment. Сначала сгенерируйте их.
        </p>
      ) : (
        <div className="space-y-2 mb-6">
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(item)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all
                ${selected?.id === item.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"}`}
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {item.generator_type === "quiz"
                  ? <Brain className="w-4 h-4 text-violet-500" />
                  : <FileText className="w-4 h-4 text-yellow-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{item.topic || "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.generator_type === "quiz" ? "Quiz" : "Assignment"} • {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              {selected?.id === item.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <Button
        onClick={handleCreate}
        disabled={!selected || creating}
        className="w-full h-12 rounded-xl gap-2"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {creating ? "Создаём..." : "Запустить сессию"}
      </Button>
    </div>
  );
};

export default CreateSession;
