import { motion } from "framer-motion";

const COLORS = [
  { bg: "bg-red-500 hover:bg-red-600",   label: "A", shape: "▲" },
  { bg: "bg-blue-500 hover:bg-blue-600", label: "B", shape: "◆" },
  { bg: "bg-yellow-400 hover:bg-yellow-500", label: "C", shape: "●" },
  { bg: "bg-green-500 hover:bg-green-600", label: "D", shape: "■" },
];

interface AnswerButtonProps {
  index: number;
  text: string;
  disabled?: boolean;
  selected?: boolean;
  correct?: boolean | null;
  onClick: () => void;
}

export function AnswerButton({ index, text, disabled, selected, correct, onClick }: AnswerButtonProps) {
  const color = COLORS[index % 4];
  let overlay = "";
  if (selected && correct === true) overlay = "ring-4 ring-white brightness-110";
  if (selected && correct === false) overlay = "opacity-60 ring-4 ring-white/40";
  if (!selected && correct !== null && correct !== undefined && disabled) overlay = "opacity-40";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-bold text-base transition-all cursor-pointer
        ${color.bg} ${overlay} ${disabled ? "cursor-default" : "active:scale-95"}`}
    >
      <span className="text-xl w-6 text-center opacity-80">{color.shape}</span>
      <span className="flex-1 text-left leading-snug">{text}</span>
    </motion.button>
  );
}
