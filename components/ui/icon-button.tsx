import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

/**
 * Accessible icon-only button with aria-label.
 * Sized at 36px for comfortable touch targets.
 */
export function IconButton({
  label,
  className = "",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
