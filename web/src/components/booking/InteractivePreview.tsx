"use client";

import React from "react";
import { ServiceItem, Barber } from "../../types/booking";

interface InteractivePreviewProps {
  selectedServices: ServiceItem[];
  selectedBarber: Barber | null;
  selectedSlot: string;
  selectedDateText: string;
  totalDuration: number;
  totalPrice: number;
  onAdvance: () => void;
}

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({
  selectedServices,
  selectedBarber,
  selectedSlot,
  selectedDateText,
  totalDuration,
  totalPrice,
  onAdvance,
}) => {
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="sticky top-28 flex flex-col gap-space-md">
      <div className="bg-surface-container-lowest p- space-md rounded-[2.5rem] shadow-2xl flex flex-col max-w-[340px] mx-auto w-full border border-surface-container-high">
        {/* Smartphone top bar */}
        <div className="pt-2 pb-1 flex justify-center">
          <div className="w-20 h-4 bg-surface-container-highest rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-container-low mr-2"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          </div>
        </div>

        {/* Smartphone Screen */}
        <div className="bg-surface rounded-[2rem] p-space-md flex flex-col gap-space-sm overflow-hidden min-h-[540px]">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">content_cut</span>
              <span className="font-label-sm text-label-xs font-bold text-on-surface tracking-wider uppercase">
                AURA APP VIP
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col gap-1">
            <span className="font-label-xs text-[10px] text-on-surface-variant uppercase tracking-wider">
              Duración Acumulada
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{totalDuration} min</span>
              <span className="font-label-xs text-label-xs text-primary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">timelapse</span> Tiempo continuo
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-xs text-[10px] text-on-surface-variant uppercase">
              Servicios en Carrito ({selectedServices.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedServices.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-body-sm text-[11px] bg-surface-container-high/60 px-2 py-1 rounded"
                >
                  <span className="text-on-surface truncate pr-1">{s.title}</span>
                  <span className="text-primary font-bold shrink-0">{formatCOP(s.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container p-2.5 rounded-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-xs text-[10px] text-on-surface-variant uppercase">Maestro Asignado</span>
              <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                {selectedBarber?.name || "Cualquiera disponible"}
              </span>
            </div>
          </div>

          <div className="bg-surface-container p-2.5 rounded-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">event</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-xs text-[10px] text-on-surface-variant uppercase">Horario</span>
              <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                {selectedDateText}, {selectedSlot}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Subtotal Estimado:</span>
              <span className="font-title-md text-title-md font-bold text-primary">{formatCOP(totalPrice)}</span>
            </div>
            <button
              onClick={onAdvance}
              className="w-full py-2.5 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container rounded font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Avanzar en Smartphone</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="pb-2 pt-1 flex justify-center">
          <div className="w-24 h-1 bg-surface-container-highest rounded-full"></div>
        </div>
      </div>

      <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs text-center max-w-[340px] mx-auto w-full">
        <span className="font-title-sm text-title-sm font-bold text-on-surface">Lounge &amp; Cava Chicó</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Llega 15 min antes y disfruta cortesía de nuestro blend de autor en la terraza privada.
        </p>
      </div>
    </div>
  );
};
