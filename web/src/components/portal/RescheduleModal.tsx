"use client";

import React from "react";

interface RescheduleModalProps {
  isOpen: boolean;
  bookingCode: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  bookingCode,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-space-md rounded-xl bg-surface-container-high mb-space-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-space-md border border-primary/30 animate-fadeIn">
      <div className="flex items-center gap-space-md">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">update</span>
        </div>
        <div>
          <h4 className="font-title-sm text-title-sm font-bold text-on-surface">
            Reprogramar Cita #{bookingCode}
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Selecciona tu nuevo horario sin costo de reasignación.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <button
          className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-md cursor-pointer hover:bg-surface-container-low"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-md font-bold cursor-pointer hover:opacity-90"
          onClick={onConfirm}
        >
          Mover a Mañana 04:00 PM
        </button>
      </div>
    </div>
  );
};
