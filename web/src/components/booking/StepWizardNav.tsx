"use client";

import React from "react";

const STEPS = [
  { n: 1, label: "Rituales" },
  { n: 2, label: "Maestro" },
  { n: 3, label: "Fecha y Hora" },
  { n: 4, label: "Confirmación" },
];

interface StepWizardNavProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepWizardNav: React.FC<StepWizardNavProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="bg-surface-container p-space-md rounded-xl mb-space-xl shadow-lg">
      <div className="grid grid-cols-4 gap-space-sm text-center">
        {STEPS.map((s) => {
          const active = currentStep >= s.n;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => (s.n < currentStep ? onStepClick(s.n) : undefined)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                s.n < currentStep ? "cursor-pointer" : "cursor-default"
              } ${active ? "text-primary font-bold" : "text-on-surface-variant"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-md font-bold ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {s.n}
              </div>
              <span className="font-label-xs text-label-xs uppercase tracking-wider hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className="w-full bg-surface-container-highest h-1 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-container to-secondary transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};
