"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Appointment, Slot } from "@/types/booking";
import { formatTimeBogota } from "@/lib/format";

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled: (updated: Appointment) => void;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onRescheduled,
}) => {
  const [date, setDate] = useState<string>(() => appointment.start.slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const durationMinutes = Math.max(
    15,
    Math.round((new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60000)
  );

  const loadSlots = async (d: string) => {
    setLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);
    try {
      const res = await bookingApi.getAvailability(d, appointment.barber.id, undefined, undefined, durationMinutes);
      setSlots(res.slots);
    } catch {
      setError("No pudimos cargar los turnos disponibles para esa fecha.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await bookingApi.updateAppointment(appointment.id, { start: selectedSlot.start });
      onRescheduled(updated);
    } catch (err: any) {
      if (err?.status === 409) {
        setError("Esa franja se acaba de ocupar por otro cliente. Elige otra.");
        loadSlots(date);
      } else {
        setError(err?.message || "No pudimos reprogramar la cita.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
    >
      <div className="w-full max-w-lg bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h4 id="reschedule-title" className="font-title-md text-title-md font-bold text-on-surface">
            Reprogramar cita
          </h4>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded cursor-pointer" aria-label="Cerrar">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="reschedule-date" className="font-label-md text-label-md text-on-surface-variant">
            Nueva fecha
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              loadSlots(e.target.value);
            }}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-space-xs">
          <span className="font-label-md text-label-md text-on-surface-variant">Turnos disponibles</span>
          {loadingSlots && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">Cargando turnos...</span>
          )}
          {!loadingSlots && slots.length === 0 && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">No hay turnos disponibles ese día.</span>
          )}
          <div className="grid grid-cols-3 gap-space-xs">
            {slots.map((slot) => (
              <button
                key={slot.start}
                onClick={() => setSelectedSlot(slot)}
                className={`p-2 rounded-lg text-center font-label-md text-label-md cursor-pointer transition-all ${
                  selectedSlot?.start === slot.start
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {formatTimeBogota(slot.start)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button
            onClick={onClose}
            className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-md cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-md font-bold cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Confirmar nuevo horario"}
          </button>
        </div>
      </div>
    </div>
  );
};
