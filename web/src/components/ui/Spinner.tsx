import React from "react";

interface SpinnerProps {
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ label = "Cargando...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-space-sm py-space-xl text-on-surface-variant ${className}`}>
      <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
      <span className="font-body-sm text-body-sm">{label}</span>
    </div>
  );
};
