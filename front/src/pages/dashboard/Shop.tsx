import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, ArrowLeft, Loader2, ShoppingBag, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gamificationService } from "@/api/gamificationService";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const Shop = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [items, setItems] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [shopItems, prof] = await Promise.all([
                gamificationService.getShopItems(),
                gamificationService.getProfile()
            ]);
            setItems(shopItems);
            setProfile(prof);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load shop data");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (itemId: number) => {
        setIsPurchasing(itemId);
        try {
            const result = await gamificationService.purchaseItem(itemId);
            toast.success(result.message);
            setProfile((prev: any) => ({ ...prev, coins: result.remaining_coins }));
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Purchase failed");
        } finally {
            setIsPurchasing(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t("back")}
                        </button>
                        <h1 className="text-xl font-bold text-foreground font-serif">{t('game_shop_title')}</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                        <Coins className="w-4 h-4 text-primary" />
                        <span className="font-black text-primary font-mono">{profile.coins}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-bold text-foreground font-serif mb-2 flex items-center justify-center md:justify-start gap-3">
                        <ShoppingBag className="w-10 h-10 text-primary" />
                        {t('game_shop_header')}
                    </h2>
                    <p className="text-muted-foreground font-sans text-lg">{t('game_shop_desc')}</p>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-border opacity-50">
                        <AlertTriangle className="w-12 h-12 mb-4 text-muted-foreground" />
                        <p className="font-bold text-xl text-muted-foreground font-serif">{t('game_shop_empty')}</p>
                        <p className="text-sm text-muted-foreground">{t('game_shop_empty_desc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group flex flex-col">
                                <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Sparkles className="w-16 h-16 text-primary/10 group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-border capitalize">
                                        {item.category}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground font-serif mb-2">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground font-sans line-clamp-2">{item.description}</p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-primary">
                                                <Coins className="w-4 h-4" />
                                                <span className="font-black text-lg font-mono">{item.price}</span>
                                            </div>
                                            {profile.coins < item.price && (
                                                <span className="text-[10px] text-destructive font-bold uppercase tracking-tighter">{t('game_shop_need_more', { count: item.price - profile.coins })}</span>
                                            )}
                                        </div>

                                        <Button
                                            className="w-full rounded-xl gap-2 h-12"
                                            disabled={profile.coins < item.price || isPurchasing === item.id}
                                            onClick={() => handlePurchase(item.id)}
                                        >
                                            {isPurchasing === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <ShoppingBag className="w-4 h-4" />
                                                    {t('game_shop_buy_now')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Shop;
