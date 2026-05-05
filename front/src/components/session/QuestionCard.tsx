interface QuestionCardProps {
  index: number;
  total: number;
  question: string;
}

export function QuestionCard({ index, total, question }: QuestionCardProps) {
  return (
    <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs text-muted-foreground font-sans mb-2">
        Вопрос {index + 1} из {total}
      </p>
      <p className="text-xl font-bold text-foreground leading-snug">{question}</p>
    </div>
  );
}
