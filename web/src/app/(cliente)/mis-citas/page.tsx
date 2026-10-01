"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Appointment } from "@/types/booking";
import { formatCOP, formatDayNumberBogota, formatMonthShortBogota, formatTimeRangeBogota, statusLabel } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancellationAlert } from "@/components/portal/CancellationAlert";
import { RescheduleAppointmentModal } from "@/components/booking/RescheduleAppointmentModal";
import { AppointmentTicket } from "@/components/booking/AppointmentTicket";

type LoadState = "loading" | "error" | "ready";
type Tab = "upcoming" | "history";

const UPCOMING_STATUSES = ["pending", "confirmed"];

export default function MisCitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [lockAlertFor, setLockAlertFor] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const res = await bookingApi.listAppointments("mine", undefined, undefined, undefined, 1, 50);
      setAppointments(res.items);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const history = appointments
    .filter((a) => !UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  const nextAppointment = upcoming[0] || null;

  const handleCancel = async (appt: Appointment) => {
    if (!appt.can_cancel) {
      setLockAlertFor(appt.id);
      return;
    }
    if (!window.confirm("¿Seguro que deseas cancelar esta cita? Esta acción no se puede deshacer.")) return;
    setActionError(null);
    try {
      const updated = await bookingApi.updateAppointment(appt.id, { status: "cancelled" });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos cancelar la cita.");
    }
  };

  const handleRescheduled = (updated: Appointment) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setRescheduling(null);
  };

  const handleCheckIn = async (appt: Appointment) => {
    setCheckingInId(appt.id);
    setActionError(null);
    try {
      const updated = await bookingApi.checkInAppointment(appt.id);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos registrar tu llegada.");
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex flex-col gap-0.5">
          <div className="inline-flex items-center gap-1 text-primary font-label-caps text-label-caps uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">history_edu</span> Portal Privado
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Mis Citas</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg">
          <button
            onClick={() => setTab("upcoming")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              tab === "upcoming" ? "bg-primary-container text-on-primary-container font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Próximas ({upcoming.length})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              tab === "history" ? "bg-primary-container text-on-primary-container font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Historial ({history.length})
          </button>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          {actionError}
        </div>
      )}

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}

      {state === "ready" && tab === "upcoming" && upcoming.length === 0 && (
        <EmptyState icon="event_available" title="No tienes citas próximas" description="Reserva tu próxima experiencia cuando quieras." />
      )}

      {state === "ready" && tab === "upcoming" && upcoming.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-start">
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            {upcoming.map((appt) => (
              <div key={appt.id} className="flex flex-col gap-space-sm">
                {lockAlertFor === appt.id && (
                  <CancellationAlert isOpen onDismiss={() => setLockAlertFor(null)} />
                )}
                <div className="bg-surface-container-low p-space-md md:p-space-lg rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-md border border-surface-container-high">
                  <div className="flex items-start md:items-center gap-space-md">
                    <div className="w-14 h-14 rounded-xl bg-surface-container-high flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="font-title-md text-title-md font-bold leading-none">{formatDayNumberBogota(appt.start)}</span>
                      <span className="font-label-xs text-label-xs uppercase">{formatMonthShortBogota(appt.start)}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                          {statusLabel(appt.status)}
                        </span>
                        {appt.checked_in_at && (
                          <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-success/20 text-success font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Check-in
                          </span>
                        )}
                        <span className="font-data-mono-sm text-data-mono-sm text-on-surface-variant">#{appt.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <h3 className="font-title-md text-title-md font-bold text-on-surface mt-1">
                        {appt.items.map((i) => i.name).join(" + ")}
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm mt-1">
                        <span className="flex items-center gap-1 text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {formatTimeRangeBogota(appt.start, appt.end)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                          {appt.barber.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
                          {formatCOP(appt.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-end md:self-center">
                    <button
                      onClick={() => (appt.can_cancel ? setRescheduling(appt) : setLockAlertFor(appt.id))}
                      className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      <span>Reprogramar</span>
                    </button>
                    <button
                      onClick={() => handleCancel(appt)}
                      className="px-space-md py-space-xs rounded bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md text-label-md transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {nextAppointment && (
            <div className="lg:sticky lg:top-24">
              <AppointmentTicket
                appointment={nextAppointment}
                onCheckIn={() => handleCheckIn(nextAppointment)}
                checkingIn={checkingInId === nextAppointment.id}
              />
            </div>
          )}
        </div>
      )}

      {state === "ready" && tab === "history" && history.length === 0 && (
        <EmptyState icon="history" title="Aún no tienes historial de citas" />
      )}

      {state === "ready" && tab === "history" && history.length > 0 && (
        <div className="flex flex-col gap-space-md">
          {history.map((appt) => (
            <div
              key={appt.id}
              className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md opacity-80 border border-surface-container-high"
            >
              <div className="flex items-start md:items-center gap-space-md">
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant shrink-0">
                  <span className="font-title-md text-title-md font-bold leading-none">{formatDayNumberBogota(appt.start)}</span>
                  <span className="font-label-xs text-label-xs uppercase">{formatMonthShortBogota(appt.start)}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase font-bold">
                      {statusLabel(appt.status)}
                    </span>
                    <span className="font-data-mono-sm text-data-mono-sm text-on-surface-variant">#{appt.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <h4 className="font-title-md text-title-md font-bold text-on-surface mt-1">
                    {appt.items.map((i) => i.name).join(" + ")}
                  </h4>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Atendido por {appt.barber.name} • {formatCOP(appt.total_price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rescheduling && (
        <RescheduleAppointmentModal
          appointment={rescheduling}
          isOpen={!!rescheduling}
          onClose={() => setRescheduling(null)}
          onRescheduled={handleRescheduled}
        />
      )}
    </div>
  );
}
