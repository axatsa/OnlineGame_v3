import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HelpCircle, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GameShellProps {
  title: string;
  children: ReactNode;
  onBack: string;
  onRestart?: () => void;
  howToPlay?: string;
}

const GameShell = ({ title, children, onBack, onRestart, howToPlay }: GameShellProps) => {
  const navigate = useNavigate();
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
          Библиотека игр
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

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>

      {/* How to Play Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              How to Play: {title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground font-sans text-sm leading-relaxed">{howToPlay}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameShell;
