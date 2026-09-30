"use client";

import React from "react";

interface StepWizardNavProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepWizardNav: React.FC<StepWizardNavProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { num: 1, label: "Rituales" },
    { num: 2, label: "Maestro" },
    { num: 3, label: "Fecha y Hora" },
    { num: 4, label: "Confirmación" },
  ];

  const getProgressWidth = () => {
    switch (currentStep) {
      case 1:
        return "25%";
      case 2:
        return "50%";
      case 3:
        return "75%";
      case 4:
        return "100%";
      default:
        return "25%";
    }
  };

  return (
    <div className="bg-surface-container p-space-md rounded-xl mb-space-xl shadow-lg">
      <div className="grid grid-cols-4 gap-space-sm text-center">
        {steps.map((step) => {
          const isDone = step.num < currentStep;
          const isCurrent = step.num === currentStep;

          return (
            <div
              key={step.num}
              onClick={() => onStepClick(step.num)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-md font-bold transition-all ${
                  isDone
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : isCurrent
                    ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  step.num
                )}
              </div>
              <span className="font-label-xs text-label-xs uppercase tracking-wider">{step.label}</span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-surface-container-highest h-1 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-container to-secondary transition-all duration-300"
          style={{ width: getProgressWidth() }}
        />
      </div>
    </div>
  );
};
