import { cn } from "@/lib/utils";

interface EmojiSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: string) => void;
  size?: "sm" | "md" | "lg";
}

const EmojiSelector = ({ selectedMood, onMoodSelect, size = "md" }: EmojiSelectorProps) => {
  const moods = [
    { emoji: "😀", label: "Feliz", value: "happy" },
    { emoji: "😐", label: "Neutro", value: "neutral" },
    { emoji: "😢", label: "Triste", value: "sad" }
  ];

  const sizes = {
    sm: "text-4xl p-3",
    md: "text-6xl p-4",
    lg: "text-8xl p-6"
  };

  return (
    <div className="flex gap-4 justify-center">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onMoodSelect(mood.value)}
          className={cn(
            "rounded-3xl border-2 transition-all duration-300 hover:scale-110",
            sizes[size],
            selectedMood === mood.value
              ? "border-primary bg-primary-soft shadow-soft animate-bounce-emoji"
              : "border-border bg-card hover:border-primary/50 hover:bg-primary-soft/30"
          )}
          aria-label={mood.label}
        >
          <span className="block">{mood.emoji}</span>
          <span className="text-sm font-medium text-muted-foreground mt-1 block">
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default EmojiSelector;