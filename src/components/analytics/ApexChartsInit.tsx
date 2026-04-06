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
            (ApexCharts as any).defaults = {
              ...currentDefaults,
              theme: {
                mode: "light",
                palette: "palette1",
              },
              colors: DEFAULT_COLORS,
              chart: {
                ...currentDefaults.chart,
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
