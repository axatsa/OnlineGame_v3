import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Zap, BookOpen, ArrowLeft,
  Flame, Target, Calendar, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Stats {
  total_generations: number;
  generations_this_month: number;
  games_launched: number;
  activity_by_day: { date: string; count: number }[];
  top_features: { name: string; count: number }[];
}

interface HistoryItem {
  id: number;
  generator_type: string;
  topic: string;
  created_at: string;
  is_favorite: boolean;
}

const GAME_LABELS: Record<string, string> = {
  quiz: "Викторина",
  jeopardy: "Jeopardy",
  crossword: "Кроссворд",
  hangman: "Виселица",
  spelling: "Орфография",
  "math-puzzle": "Математика",
  "word-pairs": "Перевод слов",
  assignment: "Задание",
  book: "Книга",
};

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted-foreground font-sans">{label}</p>
      </div>
      <p className="text-3xl font-black text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 font-sans">{sub}</p>}
    </motion.div>
  );
}

interface SubscriptionData {
  tokens_used_this_month: number;
  tokens_limit: number;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/generate/stats/me"),
      api.get<HistoryItem[]>("/generate/history?limit=100&offset=0"),
      api.get<SubscriptionData>("/payments/subscription/me").catch(() => ({ data: null })),
    ]).then(([s, h, sub]) => {
      setStats(s.data);
      setHistory(h.data);
      setSubscription(sub.data);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  // Token quota — live from subscription endpoint
  const tokensUsed = subscription?.tokens_used_this_month ?? 0;
  const tokensLimit = subscription?.tokens_limit ?? 30000;
  const tokenPct = Math.min(100, Math.round((tokensUsed / tokensLimit) * 100));

  // Derived: top topics from history
  const topicMap = new Map<string, number>();
  history.forEach((h) => {
    if (h.topic) topicMap.set(h.topic, (topicMap.get(h.topic) ?? 0) + 1);
  });
  const topTopics = [...topicMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));

  // Activity: last 14 days, fill gaps
  const activityData = (() => {
    if (!stats) return [];
    const map = new Map(stats.activity_by_day.map((d) => [d.date, d.count]));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split("T")[0];
      return {
        day: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        count: map.get(key) ?? 0,
      };
    });
  })();

  // Streak: consecutive days with activity
  const streak = (() => {
    if (!stats) return 0;
    const today = new Date().toISOString().split("T")[0];
    const activeDays = new Set(stats.activity_by_day.filter((d) => d.count > 0).map((d) => d.date));
    let s = 0;
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (!activeDays.has(key) && key !== today) break;
      if (activeDays.has(key)) s++;
    }
    return s;
  })();

  // Top features with labels
  const featureData = (stats?.top_features ?? []).map((f) => ({
    name: GAME_LABELS[f.name] ?? f.name,
    count: f.count,
  }));

  // Favorites
  const favorites = history.filter((h) => h.is_favorite).slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-4xl px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2 font-sans" onClick={() => navigate("/teacher")}>
            <ArrowLeft className="w-4 h-4" /> Назад
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-foreground font-sans">Аналитика</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Всего генераций" value={String(stats?.total_generations ?? 0)} color="bg-primary/10 text-primary" />
          <StatCard icon={TrendingUp} label="За этот месяц" value={String(stats?.generations_this_month ?? 0)} color="bg-emerald-500/10 text-emerald-600" />
          <StatCard icon={Flame} label="Дней подряд" value={String(streak)} sub={streak >= 7 ? "🔥 Отличная серия!" : "Заходите каждый день"} color="bg-orange-500/10 text-orange-500" />
          <StatCard icon={Zap} label="Токены / месяц" value={`${tokenPct}%`} sub={`${tokensUsed.toLocaleString()} / ${tokensLimit.toLocaleString()}`} color="bg-yellow-500/10 text-yellow-600" />
        </div>

        {/* Token usage bar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-foreground font-sans">Использование токенов в этом месяце</p>
            <span className="text-sm font-bold font-sans text-foreground">{tokenPct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tokenPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${tokenPct >= 90 ? "bg-destructive" : tokenPct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-sans">
            <span>{tokensUsed.toLocaleString()} использовано</span>
            <span>{(tokensLimit - tokensUsed).toLocaleString()} осталось</span>
          </div>
        </div>

        {/* Activity chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-semibold text-foreground font-sans mb-4">Активность за 14 дней</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={activityData} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} генераций`, ""]}
                labelFormatter={(l) => l}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {activityData.map((entry, i) => (
                  <Cell key={i} fill={entry.count > 0 ? "var(--primary)" : "var(--muted)"} fillOpacity={entry.count > 0 ? 0.85 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Game type breakdown */}
          {featureData.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="font-semibold text-foreground font-sans mb-4">Используемые игры</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={featureData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {featureData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top topics */}
          {topTopics.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="font-semibold text-foreground font-sans mb-4">Популярные темы</p>
              <div className="space-y-2">
                {topTopics.map((t, i) => {
                  const maxCount = topTopics[0].count;
                  return (
                    <div key={t.topic} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-sans text-foreground truncate">{t.topic}</span>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{t.count}×</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(t.count / maxCount) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="h-full rounded-full bg-primary/60"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <p className="font-semibold text-foreground font-sans">Избранные генерации</p>
            </div>
            <div className="space-y-2">
              {favorites.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-sans text-foreground">{h.topic || "—"}</p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {GAME_LABELS[h.generator_type] ?? h.generator_type} · {new Date(h.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA if nothing yet */}
        {stats?.total_generations === 0 && (
          <div className="text-center py-16 space-y-4">
            <Target className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold font-sans">Данных пока нет</p>
            <p className="text-muted-foreground text-sm font-sans">Начните генерировать материалы — статистика появится здесь</p>
            <Button onClick={() => navigate("/generator")} className="rounded-xl">
              Открыть генератор
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
