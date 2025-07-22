'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export function useDynamicChartOptions(type: 'imu' | 'pwm') {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const isDark = resolvedTheme === 'dark';

    const tickColor = isDark ? '#e5e5e5' : '#1f2937';
    const gridColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)';
    const legendColor = isDark ? '#e5e5e5' : '#1f2937';

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: type === 'imu'
          ? { top: 20, bottom: 20, left: 5, right: 5 }
          : { top: 50, bottom: 50, left: 50, right: 50 },
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: tickColor },
          grid: { color: gridColor },
          min: type === 'pwm' ? 0 : -20,
          max: type === 'pwm' ? 255 : 20,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: legendColor,
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#333' : '#f9f9f9',
          titleColor: isDark ? '#fff' : '#000',
          bodyColor: isDark ? '#fff' : '#000',
        },
      },
    };
  }, [resolvedTheme, type]);
}
