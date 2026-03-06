"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "compact" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

export function Logo({ 
  variant = "full", 
  size = "md", 
  className,
  showText = true 
}: LogoProps) {
  const src = {
    full: "/1.png",      // Logo completa - melhor para login e headers
    compact: "/2.png",   // Logo secundária - boa para sidebars
    icon: "/3.png",      // Logo compacta - ideal para sidebars colapsadas e favicon
  }[variant];

  const sizes = {
    sm: { height: 24, width: variant === "icon" ? 24 : 60 },
    md: { height: 32, width: variant === "icon" ? 32 : 80 },
    lg: { height: 40, width: variant === "icon" ? 40 : 100 },
    xl: { height: 48, width: variant === "icon" ? 48 : 120 },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={src}
        alt="LIDIA"
        width={currentSize.width}
        height={currentSize.height}
        className="object-contain"
        priority
      />
      {showText && variant !== "full" && (
        <span className="font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
          LIDIA
        </span>
      )}
    </div>
  );
}

// Logo component specifically for sidebars
export function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
        <Image
          src="/3.png"
          alt="LIDIA"
          width={32}
          height={32}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
        <Image
          src="/3.png"
          alt="LIDIA"
          width={32}
          height={32}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col whitespace-nowrap">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
          LIDIA
        </span>
        <span className="text-[10px] text-emerald-500/80 uppercase tracking-wider font-medium">
          Super Admin
        </span>
      </div>
    </div>
  );
}

// Logo for login page
export function LoginLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden mb-4">
        <Image
          src="/1.png"
          alt="LIDIA"
          width={80}
          height={80}
          className="object-contain"
          priority
        />
      </div>
      <h1 className="text-3xl font-bold">
        <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
          LIDIA
        </span>
        <span className="dark:text-white text-slate-900"> 2.0</span>
      </h1>
    </div>
  );
}
