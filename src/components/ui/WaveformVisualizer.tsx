"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  /** Array of amplitude values (0-1) representing the waveform */
  data: number[];
  /** Current playback progress (0-100) */
  progress?: number;
  /** Whether the audio is currently playing (used for animation states) */
  isPlaying?: boolean;
  /** Visual theme variant */
  variant?: "recording" | "playback" | "paused" | "inactive";
  /** Height of the waveform container in pixels */
  height?: number;
  /** Width of each bar in pixels */
  barWidth?: number;
  /** Gap between bars in pixels */
  barGap?: number;
  /** Whether to use animation for recording state */
  animated?: boolean;
  /** Custom className */
  className?: string;
  /** Dark mode flag */
  isDarkMode?: boolean;
}

/**
 * WaveformVisualizer - Real-time audio waveform visualization component
 * 
 * Displays audio amplitude data as vertical bars with support for:
 * - Real-time recording visualization
 * - Playback progress indication
 * - Responsive bar sizing
 * - Dark/light mode theming
 */
export function WaveformVisualizer({
  data,
  progress = 0,
  isPlaying = false,
  variant = "playback",
  height = 32,
  barWidth = 3,
  barGap = 2,
  animated = false,
  className,
  isDarkMode = true,
}: WaveformVisualizerProps) {
  // Normalize data to ensure valid values
  const normalizedData = useMemo(() => {
    return data.map((value) => {
      const normalized = Math.max(0, Math.min(1, value || 0.05));
      return normalized;
    });
  }, [data]);

  // Calculate bar count based on available width
  const barCount = normalizedData.length;

  // Get color based on variant and state
  const getBarColor = (isActive: boolean): string => {
    if (variant === "recording") {
      return "bg-[#00a884]";
    }
    if (variant === "paused") {
      return "bg-yellow-500";
    }
    if (isActive) {
      return "bg-[#00a884]";
    }
    return isDarkMode ? "bg-[#374045]" : "bg-gray-300";
  };

  // Calculate which bars are "active" based on progress
  const getActiveBars = useMemo(() => {
    const activeCount = Math.floor((progress / 100) * barCount);
    return normalizedData.map((_, index) => index < activeCount);
  }, [progress, barCount, normalizedData]);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden",
        isPlaying && "animate-pulse",
        className
      )}
      style={{ height }}
    >
      <div
        className="flex items-center gap-[2px]"
        style={{ gap: barGap }}
      >
        {normalizedData.map((amplitude, index) => {
          const isActive = getActiveBars[index];
          const barHeight = Math.max(12, amplitude * height);

          return (
            <motion.div
              key={index}
              className={cn(
                "rounded-full transition-colors duration-150",
                getBarColor(isActive)
              )}
              style={{
                width: barWidth,
                minHeight: 3,
              }}
              initial={false}
              animate={{
                height: barHeight,
                opacity: isActive || variant === "recording" ? 1 : 0.6,
              }}
              transition={{
                type: "spring",
                stiffness: animated ? 300 : 500,
                damping: animated ? 20 : 30,
                mass: 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simplified waveform for compact display
 */
export function CompactWaveform({
  data,
  isDarkMode = true,
  className,
}: {
  data: number[];
  isDarkMode?: boolean;
  className?: string;
}) {
  const minHeight = 20;
  const maxHeight = 32;

  return (
    <div className={cn("flex items-center gap-[1px]", className)}>
      {data.map((amplitude, index) => {
        const height = minHeight + (amplitude * (maxHeight - minHeight));
        return (
          <div
            key={index}
            className={cn(
              "w-[2px] rounded-full",
              isDarkMode ? "bg-[#00a884]/60" : "bg-[#00a884]/40"
            )}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

/**
 * Animated waveform for recording state with real-time feel
 */
export function RecordingWaveform({
  data,
  isDarkMode = true,
  className,
}: {
  data: number[];
  isDarkMode?: boolean;
  className?: string;
}) {
  return (
    <WaveformVisualizer
      data={data}
      variant="recording"
      animated={true}
      height={32}
      barWidth={3}
      barGap={2}
      className={className}
      isDarkMode={isDarkMode}
    />
  );
}

export default WaveformVisualizer;
