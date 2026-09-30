"use client";

import React from "react";

interface CancellationAlertProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const CancellationAlert: React.FC<CancellationAlertProps> = ({ isOpen, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="p-space-md rounded-xl bg-error-container text-on-error-container mb-space-md shadow-lg flex items-center justify-between animate-fadeIn">
      <div className="flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-[24px]">lock_clock</span>
        <div className="flex flex-col">
          <span className="font-title-sm text-title-sm font-bold">Cancelación Bloqueada</span>
          <span className="font-body-sm text-body-sm">
            Faltan menos de 2 horas para el servicio (1h 14m restantes). Por favor comunícate a la sede al +57 (601)
            745-9820 para asistencia con un anfitrión.
          </span>
        </div>
      </div>
      <button className="p-1 hover:bg-black/20 rounded cursor-pointer" onClick={onDismiss}>
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
