import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "primary"
  | "outline"
  | "ghost"
  | "link"
  | "destructive";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-secondary text-secondary-foreground shadow hover:bg-secondary/80",
  primary:
    "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all duration-300",
  outline:
    "border border-border bg-transparent hover:bg-muted hover:border-primary/50 transition-all duration-300",
  ghost: "hover:bg-muted hover:text-foreground transition-all duration-200",
  link: "text-primary underline-offset-4 hover:underline",
  destructive:
    "bg-destructive text-white shadow-sm hover:bg-destructive/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, disabled, children, ...props }, ref) => {
    const mergedDisabled = disabled || isLoading;
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98] transition-all duration-200",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={mergedDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
