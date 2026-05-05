// Add avatar SVG/PNG files to front/public/avatars/ and list filenames (without extension) here
const AVATARS = ["smiley", "robot", "cat", "panda", "placeholder"];

interface AvatarPickerProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {AVATARS.map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all
            ${selected === id ? "border-primary scale-110 shadow-lg" : "border-border hover:border-primary/50"}`}
        >
          <img
            src={`/avatars/${id}.svg`}
            alt={id}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/avatars/placeholder.svg"; }}
          />
        </button>
      ))}
    </div>
  );
}
