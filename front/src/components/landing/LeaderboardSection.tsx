import { useNavigate } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const LEADERBOARD_DEMO = [
  { name: "Kaiser S.", level: 12, xp: 3240, rank: 1 },
  { name: "Salamov A.", level: 11, xp: 2980, rank: 2 },
  { name: "Abdullaev B.", level: 10, xp: 2710, rank: 3 },
  { name: "Ibragimov F.", level: 9, xp: 2490, rank: 4 },
  { name: "Khegai P.", level: 9, xp: 2301, rank: 5 },
];

export default function LeaderboardSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="bg-sidebar py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-sidebar-foreground">
            <div className="inline-flex items-center gap-2 bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Trophy className="w-3.5 h-3.5" />
              {t("land_lb_badge")}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif mb-5 leading-tight">
              {t("land_lb_title")}
            </h2>
            <p className="text-sidebar-foreground/70 text-lg leading-relaxed mb-8">
              {t("land_lb_desc")}
            </p>
            <Button className="rounded-2xl px-6 gap-2" onClick={() => navigate("/login")}>
              {t("land_lb_btn")} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold font-serif text-foreground">{t("land_lb_class")}</span>
            </div>
            <div className="divide-y divide-border">
              {LEADERBOARD_DEMO.map((item) => (
                <div key={item.rank} className={`flex items-center gap-4 px-6 py-4 ${item.rank === 1 ? "bg-primary/5" : ""}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${item.rank === 1 ? "bg-yellow-400 text-white" :
                    item.rank === 2 ? "bg-gray-300 text-gray-700" :
                      item.rank === 3 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{t("land_lb_level")} {item.level}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">{item.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
