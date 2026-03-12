import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
  children: React.ReactNode;
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-[#00a884] text-white hover:bg-[#008f72]",
    secondary: "dark:bg-[#2a3942] dark:text-[#e9edef] bg-gray-100 text-gray-700",
    outline: "border border-[#00a884] text-[#00a884] bg-transparent",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
