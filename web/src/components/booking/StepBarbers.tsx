"use client";

import React from "react";
import Image from "next/image";
import { Barber } from "../../types/booking";

interface StepBarbersProps {
  barbers: Barber[];
  selectedBarber: Barber | null;
  onSelectBarber: (barber: Barber) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepBarbers: React.FC<StepBarbersProps> = ({
  barbers,
  selectedBarber,
  onSelectBarber,
  onNext,
  onBack,
}) => {
  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">
            Paso 02 • Maestros de la Navaja
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Selecciona tu especialista</h2>
        </div>
        <button
          onClick={onBack}
          className="font-label-sm text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Regresar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        {barbers.map((b) => {
          const isSelected = selectedBarber?.id === b.id;

          return (
            <div
              key={b.id}
              onClick={() => onSelectBarber(b)}
              className={`barber-card cursor-pointer p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between group relative overflow-hidden border ${
                isSelected
                  ? "border-primary shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-surface-container"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-space-md">
                {b.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="w-16 h-16 rounded-xl object-cover grayscale contrast-125"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[32px]">bolt</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="font-title-md text-title-md font-bold text-on-surface">{b.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.role === "Senior" || b.role === "Inmediato"
                          ? "bg-primary-container/20 text-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {b.role}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{b.detail}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-space-md pt-space-xs font-label-xs text-label-xs text-on-surface-variant">
                {b.rating ? (
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {b.rating} ({b.reviewsCount} reseñas)
                  </span>
                ) : (
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Máxima disponibilidad
                  </span>
                )}
                <span>{b.location || "Sin costo adicional"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-space-md mt-space-md">
        <button
          onClick={onNext}
          className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer"
        >
          <span>Continuar a Calendario</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
