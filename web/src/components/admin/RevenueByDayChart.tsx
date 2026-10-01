"use client";

import React from "react";
import { formatCOP, formatDateBogota } from "@/lib/format";

interface RevenueByDayChartProps {
  data: Array<{ date: string; total: number }>;
}

/**
 * Barras verticales de una sola serie (ingresos por día) - escala secuencial de
 * un solo tono (dorado de marca), sin necesidad de paleta categórica. Cada
 * barra expone su valor exacto via title (tooltip nativo) y las etiquetas del
 * eje se muestran solo en el primer/último día para no saturar.
 */
export const RevenueByDayChart: React.FC<RevenueByDayChartProps> = ({ data }) => {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-end gap-[2px] h-40">
        {data.map((d, idx) => {
          const heightPct = Math.max(2, (d.total / max) * 100);
          return (
            <div
              key={d.date}
              className="flex-1 flex items-end h-full group relative"
              title={`${formatDateBogota(d.date)}: ${formatCOP(d.total)}`}
            >
              <div
                className="w-full bg-primary-container rounded-t-sm group-hover:bg-primary transition-colors"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between font-data-mono-sm text-data-mono-sm text-on-surface-variant">
        <span>{formatDateBogota(data[0].date)}</span>
        <span>{formatDateBogota(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
};
