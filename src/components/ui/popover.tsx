"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a Popover");
  }
  return context;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, setOpen } = usePopover();
  
  return (
    <div onClick={() => setOpen(!open)} className="inline-block cursor-pointer">
      {children}
    </div>
  );
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

function PopoverContent({ children, className, side = "bottom", align = "center", ...props }: PopoverContentProps) {
  const { open, setOpen } = usePopover();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          side === "top" && "bottom-full mb-2",
          side === "bottom" && "top-full mt-2",
          side === "left" && "right-full mr-2",
          side === "right" && "left-full ml-2",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
