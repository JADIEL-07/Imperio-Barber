"use client";

import React from "react";
import QRCode from "react-qr-code";
import { Appointment } from "@/types/booking";
import { formatDateLongBogota, formatTimeRangeBogota } from "@/lib/format";

interface AppointmentTicketProps {
  appointment: Appointment;
  onCheckIn: () => void;
  checkingIn: boolean;
}

/**
 * El QR codifica un identificador propio ("IMPERIO-CHECKIN:<id>"), no un link
 * a un escaner externo que no existe todavia - el check-in real ocurre con el
 * boton "Avisar que ya llegué" (el cliente autenticado llama al endpoint de
 * check-in) o lo marca el personal manualmente desde su agenda.
 */
export const AppointmentTicket: React.FC<AppointmentTicketProps> = ({ appointment, onCheckIn, checkingIn }) => {
  const qrValue = `IMPERIO-CHECKIN:${appointment.id}`;
  const canCheckIn = ["pending", "confirmed"].includes(appointment.status) && !appointment.checked_in_at;

  return (
    <div className="relative bg-surface-container-low rounded-xl border border-primary/30 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary-container to-secondary" />
      <div className="p-space-lg flex flex-col items-center gap-space-md text-center">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
          {appointment.checked_in_at ? "Check-in registrado" : "Check-in habilitado"}
        </span>

        <div className="p-space-sm bg-white rounded-lg">
          <QRCode value={qrValue} size={140} level="M" />
        </div>

        <div className="flex flex-col">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            {appointment.items.map((i) => i.name).join(" + ")}
          </h3>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{appointment.barber.name}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-space-sm font-data-mono text-data-mono text-primary">
          <span>{formatDateLongBogota(appointment.start)}</span>
          <span className="text-on-surface-variant">•</span>
          <span>{formatTimeRangeBogota(appointment.start, appointment.end)}</span>
        </div>

        <span className="font-data-mono-sm text-data-mono-sm text-on-surface-variant">
          Boleto #{appointment.id.slice(0, 8).toUpperCase()}
        </span>

        {appointment.checked_in_at ? (
          <div className="flex items-center gap-1 text-success font-label-md text-label-md font-bold">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Llegada registrada
          </div>
        ) : canCheckIn ? (
          <button
            onClick={onCheckIn}
            disabled={checkingIn}
            className="w-full py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg font-bold rounded-lg shadow-[0_0_14px_rgba(212,175,55,0.3)] cursor-pointer disabled:opacity-50"
          >
            {checkingIn ? "Registrando..." : "Avisar que ya llegué"}
          </button>
        ) : null}
      </div>
    </div>
  );
};
