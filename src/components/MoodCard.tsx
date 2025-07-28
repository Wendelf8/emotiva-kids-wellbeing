import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MoodCardProps {
  currentMood: string;
  className?: string;
}

const MoodCard = ({ currentMood, className }: MoodCardProps) => {
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "happy":
        return "😀";
      case "neutral":
        return "😐";
      case "sad":
        return "😢";
      default:
        return "😐";
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case "happy":
        return "Feliz";
      case "neutral":
        return "Neutro";
      case "sad":
        return "Triste";
      default:
        return "Neutro";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "happy":
        return "bg-secondary/30 border-secondary";
      case "neutral":
        return "bg-primary-soft/30 border-primary-soft";
      case "sad":
        return "bg-accent/30 border-accent";
      default:
        return "bg-primary-soft/30 border-primary-soft";
    }
  };

  return (
    <Card className={cn(
      "p-6 text-center border-2 shadow-card",
      getMoodColor(currentMood),
      className
    )}>
      <div className="text-8xl mb-4 animate-bounce-emoji">
        {getMoodEmoji(currentMood)}
      </div>
      <h3 className="text-xl font-semibold text-foreground">
        Humor atual: {getMoodLabel(currentMood)}
      </h3>
    </Card>
  );
};

export default MoodCard;