import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, Coins, Zap, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { gamificationService } from "@/api/gamificationService";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [dailyStats, setDailyStats] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [prof, stats, leaders] = await Promise.all([
                gamificationService.getProfile(),
                gamificationService.getDailyStats(),
                gamificationService.getLeaderboard()
            ]);
            setProfile(prof);
            setDailyStats(stats);
            setLeaderboard(leaders);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // Level Progress Calculation
    const currentLevelXP = Math.floor(100 * Math.pow(profile.level - 1, 1.5));
    const nextLevelXP = Math.floor(100 * Math.pow(profile.level, 1.5));
    const progressXP = profile.xp - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t("back")}
                        </button>
                        <h1 className="text-xl font-bold text-foreground font-serif">{t('student_dashboard_title')}</h1>
                    </div>
                    <Button variant="default" className="rounded-xl gap-2" onClick={() => navigate("/shop")}>
                        <Coins className="w-4 h-4" />
                        {profile.coins} {t('coins_label')}
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                {/* Hero Section: Level & XP */}
                <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy className="w-48 h-48 text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center relative">
                            <span className="text-4xl font-black text-primary font-serif">{profile.level}</span>
                            <div className="absolute -bottom-2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                {t('game_level')}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 w-full text-center md:text-left">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground font-serif">{t('welcome_user', { name: user?.full_name || "Hero" })}</h2>
                                <p className="text-muted-foreground font-sans">{t('student_dashboard_subtitle')}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-primary">{t('xp_total', { count: profile.xp })}</span>
                                    <span className="text-muted-foreground">{t('xp_to_next_level', { count: nextLevelXP - profile.xp, level: profile.level + 1 })}</span>
                                </div>
                                <Progress value={progressPercent} className="h-4 rounded-full bg-secondary" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Daily Progress */}
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-foreground font-serif flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            {t('daily_mission')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('daily_xp')}</span>
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-3xl font-black font-serif">{dailyStats.xp_today} / {dailyStats.limit_xp}</div>
                                <Progress value={(dailyStats.xp_today / dailyStats.limit_xp) * 100} className="h-2" />
                            </div>

                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('daily_coins')}</span>
                                    <Coins className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-3xl font-black font-serif">{dailyStats.coins_today} / {dailyStats.limit_coins}</div>
                                <Progress value={(dailyStats.coins_today / dailyStats.limit_coins) * 100} className="h-2" />
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-primary" />
                                {t('smart_tip_title')}
                            </h4>
                            <p className="text-sm text-primary/80 font-sans">
                                {t('smart_tip_desc')}
                            </p>
                        </div>
                    </div>

                    {/* Leaderboard Snippet */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-foreground font-serif flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary" />
                            {t('top_friends')}
                        </h3>

                        <div className="bg-card rounded-2xl border border-border overflow-hidden">
                            <div className="divide-y divide-border">
                                {leaderboard.map((item, index) => (
                                    <div key={index} className={`flex items-center gap-4 p-4 ${item.name === user?.full_name ? "bg-primary/5" : ""}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-yellow-400 text-white" :
                                                index === 1 ? "bg-gray-300 text-white" :
                                                    index === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{t('game_level')} {item.level}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-xs font-bold text-primary">{t('xp_total', { count: item.xp })}</p>
                                        </div>
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="p-10 text-center text-muted-foreground italic">{t('no_ratings_yet')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
