"use client";

import { useEffect } from "react";

// Default colors for ApexCharts
const DEFAULT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];

export function ApexChartsInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import apexcharts to initialize defaults
      import("apexcharts").then((ApexChartsModule) => {
        const ApexCharts = ApexChartsModule.default || ApexChartsModule;
        
        if (ApexCharts && typeof ApexCharts === 'function') {
          try {
            // Set defaults using the static defaults property
            const currentDefaults = (ApexCharts as any).defaults || {};
            const currentChart = currentDefaults.chart || {};
            const currentTheme = currentDefaults.theme || {};
            (ApexCharts as any).defaults = {
              ...currentDefaults,
              theme: {
                ...currentTheme,
                mode: currentTheme.mode || "light",
                palette: currentTheme.palette || "palette1",
                monochrome: currentTheme.monochrome || { enabled: false },
              },
              colors: DEFAULT_COLORS,
              chart: {
                ...currentChart,
                fontFamily: "inherit",
                background: "transparent",
              },
            };
            console.log("[ApexChartsInit] ApexCharts defaults initialized");
          } catch (err) {
            console.error("[ApexChartsInit] Error setting defaults:", err);
          }
        }
      }).catch((err) => {
        console.error("[ApexChartsInit] Failed to initialize ApexCharts:", err);
      });
    }
  }, []);

  return null;
}
