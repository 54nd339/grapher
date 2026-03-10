import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90",
    ghost: "hover:bg-foreground/5 text-foreground/70 hover:text-foreground",
    outline: "border border-border hover:bg-foreground/5 text-foreground/70",
  };

  const sizes = {
    sm: "h-8 px-2.5 text-xs",
    md: "h-9 px-3 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
