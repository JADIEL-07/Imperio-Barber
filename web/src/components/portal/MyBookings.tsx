"use client";

import React, { useState } from "react";
import { RescheduleModal } from "./RescheduleModal";
import { CancellationAlert } from "./CancellationAlert";

interface MyBookingsProps {
  onRepeatService: (serviceId: string) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onRepeatService }) => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancellationLocked, setIsCancellationLocked] = useState(false);

  const handleConfirmReschedule = () => {
    setIsRescheduleOpen(false);
    alert("Cita reagendada para Mañana 04:00 PM con Mateo Silva.");
  };

  return (
    <div className="mt-space-xl pt-space-xl" id="mis-citas-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
        <div className="flex flex-col gap-0.5">
          <div className="inline-flex items-center gap-1 text-primary font-label-xs text-label-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">history_edu</span> Portal Privado
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Mis Citas • Panel de Miembro
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Próximas (1)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Historial (2)
          </button>
        </div>
      </div>

      <RescheduleModal
        isOpen={isRescheduleOpen}
        bookingCode="AUR-8921"
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={handleConfirmReschedule}
      />

      <CancellationAlert
        isOpen={isCancellationLocked}
        onDismiss={() => setIsCancellationLocked(false)}
      />

      {activeTab === "upcoming" && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-low p-space-md md:p-space-lg rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-md border border-surface-container-high">
            <div className="flex items-start md:items-center gap-space-md">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high flex flex-col items-center justify-center text-primary shrink-0">
                <span className="font-title-md text-title-md font-bold leading-none">24</span>
                <span className="font-label-xs text-label-xs uppercase">OCT</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                    Confirmada
                  </span>
                  <span className="font-mono text-label-xs text-label-xs text-on-surface-variant">#AUR-8921</span>
                </div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface mt-1">
                  Corte Signature Aura + Ritual Afeitado Imperial
                </h3>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm mt-1">
                  <span className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span> 11:15 AM - 12:40 PM
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">person</span> Mateo Silva
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">payments</span> COP $135.000
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-sm shrink-0 self-end md:self-center">
              <button
                onClick={() => setIsRescheduleOpen(true)}
                className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Reprogramar</span>
              </button>
              <button
                onClick={() => setIsCancellationLocked(true)}
                className="px-space-md py-space-xs rounded bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md text-label-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Cancelar Cita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md opacity-80 border border-surface-container-high">
            <div className="flex items-start md:items-center gap-space-md">
              <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant shrink-0">
                <span className="font-title-md text-title-md font-bold leading-none">12</span>
                <span className="font-label-xs text-label-xs uppercase">SEP</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase font-bold">
                    Completada
                  </span>
                  <span className="font-mono text-label-xs text-label-xs text-on-surface-variant">#AUR-7840</span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mt-1">
                  Ritual Afeitado Imperial Kamisori
                </h4>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Atendido por Carlos Barber King • COP $60.000
                </span>
              </div>
            </div>
            <button
              onClick={() => onRepeatService("afeitado-spa")}
              className="px-space-md py-space-xs rounded bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-primary font-label-md text-label-md font-semibold transition-all cursor-pointer"
            >
              Volver a Reservar
            </button>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md opacity-80 border border-surface-container-high">
            <div className="flex items-start md:items-center gap-space-md">
              <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant shrink-0">
                <span className="font-title-md text-title-md font-bold leading-none">18</span>
                <span className="font-label-xs text-label-xs uppercase">AGO</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase font-bold">
                    Completada
                  </span>
                  <span className="font-mono text-label-xs text-label-xs text-on-surface-variant">#AUR-6712</span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mt-1">
                  Corte Signature Aura + Camuflaje Barba
                </h4>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Atendido por Mateo Silva • COP $130.000
                </span>
              </div>
            </div>
            <button
              onClick={() => onRepeatService("combo-black")}
              className="px-space-md py-space-xs rounded bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-primary font-label-md text-label-md font-semibold transition-all cursor-pointer"
            >
              Volver a Reservar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
