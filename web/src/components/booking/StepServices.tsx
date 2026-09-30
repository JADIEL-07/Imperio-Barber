"use client";

import React from "react";
import { ServiceItem } from "../../types/booking";

interface StepServicesProps {
  services: ServiceItem[];
  onToggleService: (id: string) => void;
  onNext: () => void;
}

export const StepServices: React.FC<StepServicesProps> = ({ services, onToggleService, onNext }) => {
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">
            Paso 01 • Carta de Servicios
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Escoge tu experiencia</h2>
        </div>
        <span className="font-label-sm text-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
          Precios COP con IVA
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {services.map((item) => (
          <label
            key={item.id}
            className={`service-item relative flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group shadow-sm border ${
              item.checked ? "border-primary/40 bg-surface-container/60" : "border-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <input
                  type="checkbox"
                  name="service"
                  checked={!!item.checked}
                  onChange={() => onToggleService(item.id)}
                  className="accent-primary-container w-5 h-5 rounded cursor-pointer mt-0.5"
                />
                <div>
                  {item.badge && (
                    <div className="inline-block bg-primary/20 text-primary font-label-xs text-label-xs px-2 py-0.5 rounded uppercase mb-1 font-bold">
                      {item.badge}
                    </div>
                  )}
                  <h3 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-space-md pt-space-xs">
              <span className="font-label-sm text-label-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span> {item.duration} min
              </span>
              <span className="font-title-md text-title-md font-bold text-primary">{formatCOP(item.price)}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-end gap-space-md mt-space-md">
        <button
          onClick={onNext}
          className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer"
        >
          <span>Continuar a Selección de Barbero</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
