import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatar_id?: string | null;
  score: number;
  delta?: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightNickname?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({ entries, highlightNickname }: LeaderboardProps) {
  return (
    <div className="w-full space-y-2">
      <AnimatePresence>
        {entries.map((entry, i) => {
          const isMe = entry.nickname === highlightNickname;
          return (
            <motion.div
              key={entry.nickname}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
                ${isMe ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}
            >
              <span className="text-2xl w-8 text-center">
                {i < 3 ? MEDAL[i] : `${entry.rank}`}
              </span>
              <img
                src={entry.avatar_id ? `/avatars/${entry.avatar_id}.svg` : "/avatars/placeholder.svg"}
                alt={entry.nickname}
                className="w-8 h-8 rounded-full object-cover bg-muted"
                onError={(e) => { (e.target as HTMLImageElement).src = "/avatars/placeholder.svg"; }}
              />
              <span className="flex-1 font-semibold text-foreground truncate">{entry.nickname}</span>
              <div className="text-right">
                <span className="font-bold text-foreground">{entry.score}</span>
                {entry.delta !== undefined && entry.delta > 0 && (
                  <span className="ml-1 text-xs text-green-500">+{entry.delta}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
