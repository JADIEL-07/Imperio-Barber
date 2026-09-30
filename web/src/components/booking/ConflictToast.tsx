"use client";

import React from "react";

interface ConflictToastProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const ConflictToast: React.FC<ConflictToastProps> = ({ isOpen, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="flex items-center justify-between p-space-md rounded-xl bg-error-container text-on-error-container shadow-xl animate-fadeIn">
      <div className="flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-[24px] text-error">error</span>
        <div className="flex flex-col">
          <span className="font-title-sm text-title-sm font-bold">Conflicto de Horario (Error 409)</span>
          <span className="font-body-sm text-body-sm">
            Esa franja se acaba de ocupar por otro miembro VIP. Selecciona otra opción.
          </span>
        </div>
      </div>
      <button className="p-1 hover:bg-black/20 rounded cursor-pointer" onClick={onDismiss}>
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
