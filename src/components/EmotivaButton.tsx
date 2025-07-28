import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EmotivaButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "soft";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const EmotivaButton = ({ 
  children, 
  variant = "primary", 
  size = "md",
  className,
  onClick,
  type = "button",
  disabled = false
}: EmotivaButtonProps) => {
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft",
    secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    soft: "bg-primary-soft hover:bg-primary-soft/80 text-primary"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl font-medium transition-all duration-200",
        !disabled && "hover:scale-105",
        disabled && "opacity-50 cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Button>
  );
};

export default EmotivaButton;