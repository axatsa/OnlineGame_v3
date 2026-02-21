import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAMES_CONFIG } from "@/lib/mock-data";
import { useState } from "react";
import gameTugOfWar from "@/assets/game-tug-of-war.png";
import gameJeopardy from "@/assets/game-jeopardy.png";
import gameMemory from "@/assets/game-memory.png";
import gameScales from "@/assets/game-scales.png";
import gameWordSearch from "@/assets/game-word-search.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/context/LangContext";

const coverImages: Record<string, string> = {
  "tug-of-war": gameTugOfWar,
  "jeopardy": gameJeopardy,
  "memory": gameMemory,
  "scales": gameScales,
  "word-search": gameWordSearch,
};

const GamesLibrary = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [howToPlayGame, setHowToPlayGame] = useState<typeof GAMES_CONFIG[0] | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </button>
          <h1 className="text-xl font-bold text-foreground font-serif">{t("gamesTitle")}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t("gamesHeading")}</h2>
          <p className="text-muted-foreground font-sans">{t("gamesSub")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {GAMES_CONFIG.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              whileHover={{ scale: 1.04, y: -6 }}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={coverImages[game.coverImage]}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-4">
                <p className="text-xs text-muted-foreground font-sans mb-0.5">{t(`game_${game.id.replace(/-/g, "_")}_cat` as any)}</p>
                <h3 className="text-sm font-bold text-foreground font-serif mb-0.5">{t(`game_${game.id.replace(/-/g, "_")}_title` as any)}</h3>
                <p className="text-xs text-muted-foreground font-sans mb-3">{t(`game_${game.id.replace(/-/g, "_")}_sub` as any)}</p>

                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className={`w-3 h-3 ${si < Math.floor(game.rating) ? "text-yellow-500 fill-yellow-500" : "text-border"}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1 font-sans">{game.rating}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-xl"
                    onClick={() => setHowToPlayGame(game)}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    className="flex-1 h-9 rounded-xl font-sans font-semibold gap-1.5 text-xs"
                    size="sm"
                    onClick={() => navigate(game.route)}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {t("launch")}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Dialog open={!!howToPlayGame} onOpenChange={() => setHowToPlayGame(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {t("howToPlay")}: {t(`game_${howToPlayGame?.id.replace(/-/g, "_")}_title` as any)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">
            {t(`game_${howToPlayGame?.id.replace(/-/g, "_")}_how` as any)}
          </p>
          <Button onClick={() => howToPlayGame && navigate(howToPlayGame.route)} className="w-full mt-2 gap-2">
            <Play className="w-4 h-4" />
            {t("launch")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamesLibrary;
