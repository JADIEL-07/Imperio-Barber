"use client";

import React from "react";

interface StepDateTimeProps {
  monthIndex: number;
  currentMonth: string;
  selectedDayNum: number;
  selectedSlot: string;
  onToggleMonth: (dir: "prev" | "next") => void;
  onSelectDay: (day: number) => void;
  onSelectSlot: (slot: string) => void;
  onTriggerConflict: (slot: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepDateTime: React.FC<StepDateTimeProps> = ({
  monthIndex,
  currentMonth,
  selectedDayNum,
  selectedSlot,
  onToggleMonth,
  onSelectDay,
  onSelectSlot,
  onTriggerConflict,
  onNext,
  onBack,
}) => {
  const totalDays = monthIndex === 9 ? 31 : 30;
  const startOffset = monthIndex === 9 ? 3 : 6;

  const slots = [
    { time: "10:00 AM", available: true, label: "Libre inmediato" },
    { time: "11:15 AM", available: true, label: "Libre" },
    { time: "01:30 PM", available: false, label: "Ocupado" },
    { time: "03:00 PM", available: true, label: "Libre" },
    { time: "04:30 PM", available: false, label: "Ocupado" },
    { time: "06:00 PM", available: true, label: "Libre" },
  ];

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">
            Paso 03 • Agenda Chicó Norte (GMT-5)
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Fecha &amp; Horario Disponible</h2>
        </div>
        <button
          onClick={onBack}
          className="font-label-sm text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Regresar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
        {/* Calendar Box */}
        <div className="md:col-span-6 bg-surface-container-low p-space-md rounded-xl">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex flex-col">
              <span className="font-title-md text-title-md font-bold text-on-surface">{currentMonth}</span>
              <span className="font-label-xs text-label-xs text-on-surface-variant">
                Hora local: America/Bogota (UTC-5)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleMonth("prev")}
                className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => onToggleMonth("next")}
                className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-label-xs text-label-xs text-on-surface-variant mb-2">
            <span>LU</span>
            <span>MA</span>
            <span>MI</span>
            <span>JU</span>
            <span>VI</span>
            <span>SA</span>
            <span>DO</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-body-sm text-body-sm">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="p-2 opacity-10 text-on-surface-variant">
                -
              </div>
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDayNum;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "font-bold bg-primary text-on-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      : day % 7 === 0
                      ? "text-on-surface-variant hover:bg-surface-container opacity-60"
                      : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Box */}
        <div className="md:col-span-6 bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-title-sm text-title-sm font-bold text-on-surface">Turnos Disponibles</span>
              <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
                {selectedDayNum} {currentMonth}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Los turnos se bloquean automáticamente durante 10 minutos para tu reserva.
            </p>

            <div className="grid grid-cols-2 gap-space-sm">
              {slots.map((slot) => {
                const isSelected = slot.time === selectedSlot && slot.available;

                if (!slot.available) {
                  return (
                    <button
                      key={slot.time}
                      onClick={() => onTriggerConflict(slot.time)}
                      className="p-3 rounded-lg bg-surface-container-lowest opacity-40 cursor-not-allowed text-left flex flex-col"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-title-sm text-title-sm font-bold line-through text-on-surface-variant">
                          {slot.time}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-error">lock</span>
                      </div>
                      <span className="font-label-xs text-label-xs text-error">Ocupado</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={slot.time}
                    onClick={() => onSelectSlot(slot.time)}
                    className={`time-slot-btn p-3 rounded-lg text-left transition-all group flex flex-col cursor-pointer border ${
                      isSelected
                        ? "bg-surface-container border-primary shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                        : "bg-surface-container hover:bg-surface-container-high border-transparent"
                    }`}
                  >
                    <span
                      className={`font-title-sm text-title-sm font-bold ${
                        isSelected ? "text-primary" : "text-on-surface group-hover:text-primary"
                      }`}
                    >
                      {slot.time}
                    </span>
                    <span
                      className={`font-label-xs text-label-xs ${
                        isSelected ? "text-primary/80" : "text-on-surface-variant"
                      }`}
                    >
                      {isSelected ? "Seleccionado" : slot.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-space-xs mt-space-md pt-space-xs text-on-surface-variant font-label-xs text-label-xs">
            <span className="w-2 h-2 rounded-full bg-primary"></span> Franja dorada: Alta recomendación
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-space-md mt-space-md">
        <button
          onClick={onNext}
          className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer"
        >
          <span>Ver Resumen de Reserva</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
