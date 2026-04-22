import { ReactNode, Component } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HelpCircle, Volume2, VolumeX, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// ── Error Boundary ────────────────────────────────────────────
interface EBState { hasError: boolean; error?: Error }
class GameErrorBoundary extends Component<{ children: ReactNode; title: string }, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-lg text-foreground mb-1">Игра «{this.props.title}» упала</p>
            <p className="text-sm text-muted-foreground">Попробуйте перезапустить или вернитесь в библиотеку.</p>
          </div>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Перезапустить
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Shell ─────────────────────────────────────────────────────
interface GameShellProps {
  title: string;
  children: ReactNode;
  onBack: string;
  onRestart?: () => void;
  howToPlay?: string;
}

const GameShell = ({ title, children, onBack, onRestart, howToPlay }: GameShellProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);
  const [muted, setMuted] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <button
          onClick={() => navigate(onBack)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("gamesTitle", "Библиотека игр")}
        </button>

        <span className="text-gray-800 font-bold font-serif text-lg">{title}</span>

        <div className="flex items-center gap-2">
          <button onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {onRestart && (
            <button onClick={onRestart}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {howToPlay && (
            <button onClick={() => setShowHelp(true)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Game area with error boundary */}
      <div className="flex-1 relative overflow-hidden">
        <GameErrorBoundary title={title}>
          {children}
        </GameErrorBoundary>
      </div>

      {/* How to Play Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {t("howToPlay", "Как играть")}: {title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">{howToPlay}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameShell;
