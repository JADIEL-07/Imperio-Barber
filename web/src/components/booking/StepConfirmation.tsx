"use client";

import React from "react";
import { ServiceItem, Barber } from "../../types/booking";

interface StepConfirmationProps {
  selectedServices: ServiceItem[];
  selectedBarber: Barber | null;
  selectedDate: string;
  selectedSlot: string;
  totalDuration: number;
  totalPrice: number;
  isSubmitting: boolean;
  isConfirmed: boolean;
  onConfirm: () => void;
  onEditSchedule: () => void;
  onViewMyBookings: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  selectedServices,
  selectedBarber,
  selectedDate,
  selectedSlot,
  totalDuration,
  totalPrice,
  isSubmitting,
  isConfirmed,
  onConfirm,
  onEditSchedule,
  onViewMyBookings,
}) => {
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">
            Paso 04 • Confirmación Final
          </span>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Resumen de tu experiencia</h2>
        </div>
        {!isConfirmed && (
          <button
            onClick={onEditSchedule}
            className="font-label-sm text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Editar Horario
          </button>
        )}
      </div>

      {!isConfirmed ? (
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pb-space-md">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Especialista</span>
              <span className="font-title-md text-title-md font-bold text-primary mt-1">
                {selectedBarber?.name || "Cualquiera Disponible"}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Silla #01 Chicó</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">
                Fecha &amp; Ventana Horaria
              </span>
              <span className="font-title-md text-title-md font-bold text-on-surface mt-1">{selectedDate}</span>
              <span className="font-body-sm text-body-sm text-primary">
                {selectedSlot} ({totalDuration} min)
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">
                Ubicación Santuario
              </span>
              <span className="font-title-md text-title-md font-bold text-on-surface mt-1">Calle 94 # 11A - 28</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Incluye Valet Parking</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm pt-space-xs">
            <span className="font-title-sm text-title-sm font-bold text-on-surface">Rituales Añadidos</span>
            <div className="flex flex-col gap-2">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold">{s.title}</span>
                    <span className="font-label-xs text-label-xs text-on-surface-variant">({s.duration} min)</span>
                  </div>
                  <span className="font-title-sm text-title-sm text-primary font-bold">{formatCOP(s.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-space-xs pt-space-md bg-surface-container p-space-md rounded-xl">
            <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Subtotal Servicios</span>
              <span>{formatCOP(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Bebida de Cortesía (Whisky Bourbon / Espresso)</span>
              <span className="text-primary font-bold">Cortesia VIP</span>
            </div>
            <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Impuesto al Consumo (IVA 19% Incluido)</span>
              <span>Incluido</span>
            </div>
            <div className="flex items-center justify-between pt-space-sm font-headline-sm text-headline-sm font-bold text-on-surface">
              <span>Total a Pagar en Sede</span>
              <span className="text-primary">{formatCOP(totalPrice)}</span>
            </div>
          </div>

          <div className="p-space-sm rounded-lg bg-surface-container-high/60 flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified_user</span>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">Política de Garantía Aura:</p>
              <p>
                Puedes reprogramar o cancelar libremente sin recargo hasta 2 horas antes de tu cita. Notificaciones
                instantáneas vía WhatsApp y correo.
              </p>
            </div>
          </div>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-space-md bg-gradient-to-r from-primary-container to-secondary hover:from-primary hover:to-secondary text-on-primary-container font-headline-sm text-headline-sm font-bold rounded shadow-[0_0_28px_rgba(245,158,11,0.45)] transition-all flex items-center justify-center gap-space-sm cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                <span>Bloqueando Sillón VIP...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">verified</span>
                <span>Confirmar y Reservar Cita</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-space-lg rounded-xl bg-surface-container flex flex-col items-center text-center gap-space-sm shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[32px] shadow-[0_0_24px_rgba(245,158,11,0.6)]">
            <span className="material-symbols-outlined text-[36px]">check</span>
          </div>
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">¡Cita Agendada Exitosamente!</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Código de Reserva: <span className="font-mono font-bold text-primary">AUR-2026-9812</span>. Te esperamos en
            Sede Chicó Norte con café de origen tostado y el maestro preparado.
          </p>
          <div className="flex items-center gap-space-md mt-space-sm">
            <button
              onClick={onViewMyBookings}
              className="px-space-md py-space-xs rounded bg-surface-container-high text-on-surface hover:text-primary font-label-md text-label-md cursor-pointer"
            >
              Ver en Mis Citas
            </button>
            <button
              onClick={() => typeof window !== "undefined" && window.print()}
              className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer"
            >
              Descargar Voucher Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
