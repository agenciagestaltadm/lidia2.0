"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyToClipboardButtonProps {
  text: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  buttonClassName?: string;
  isSensitive?: boolean;
  onCopy?: () => void;
}

export function CopyToClipboardButton({
  text,
  label = "Copiar",
  showLabel = false,
  className,
  buttonClassName,
  isSensitive = false,
  onCopy
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showValue, setShowValue] = useState(!isSensitive);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [text, onCopy]);

  const toggleVisibility = useCallback(() => {
    setShowValue(prev => !prev);
  }, []);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isSensitive && (
        <button
          onClick={toggleVisibility}
          type="button"
          className={cn(
            "p-2 rounded-lg transition-colors",
            "dark:text-slate-400 text-slate-500",
            "dark:hover:bg-white/10 hover:bg-slate-100"
          )}
          title={showValue ? "Ocultar" : "Mostrar"}
        >
          {showValue ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
      
      <button
        onClick={handleCopy}
        type="button"
        disabled={copied}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          "text-sm font-medium",
          copied
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "dark:bg-white/10 bg-slate-100 dark:text-slate-300 text-slate-600 dark:hover:bg-white/20 hover:bg-slate-200",
          buttonClassName
        )}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            {showLabel && "Copiado!"}
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            {showLabel && label}
          </>
        )}
      </button>
    </div>
  );
}

// Component for displaying a value with copy button
interface CopyableFieldProps {
  value: string;
  label: string;
  isSensitive?: boolean;
  showValue?: boolean;
  className?: string;
}

export function CopyableField({
  value,
  label,
  isSensitive = false,
  showValue: controlledShowValue,
  className
}: CopyableFieldProps) {
  const [internalShowValue, setInternalShowValue] = useState(!isSensitive);
  const showValue = controlledShowValue ?? internalShowValue;

  const displayValue = isSensitive && !showValue
    ? "•".repeat(Math.min(value.length, 32))
    : value;

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium dark:text-slate-300 text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 font-mono text-sm dark:text-slate-300 text-slate-700 truncate">
          {displayValue}
        </div>
        <CopyToClipboardButton
          text={value}
          isSensitive={isSensitive}
          buttonClassName="h-10"
        />
      </div>
    </div>
  );
}
