"use client";

import React, { useEffect, useMemo, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Appointment, AppointmentStatus } from "@/types/booking";
import { formatCOP, formatDateBogota, formatTimeRangeBogota, statusLabel } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";
type ViewMode = "day" | "week";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // 0 = lunes
  copy.setDate(copy.getDate() - day);
  return copy;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-secondary/20 text-secondary",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-surface-container-high text-on-surface-variant",
  cancelled: "bg-error-container/40 text-on-error-container",
  no_show: "bg-error-container/40 text-on-error-container",
};

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (viewMode === "day") {
      return { from: toISODate(anchorDate), to: toISODate(anchorDate) };
    }
    const start = startOfWeek(anchorDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: toISODate(start), to: toISODate(end) };
  }, [viewMode, anchorDate]);

  const load = async () => {
    setState("loading");
    try {
      const res = await bookingApi.listAppointments("barber", undefined, range.from, range.to, 1, 100);
      setAppointments(res.items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  const shiftDate = (days: number) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + days);
    setAnchorDate(next);
  };

  const handleStatusChange = async (appt: Appointment, status: AppointmentStatus) => {
    setBusyId(appt.id);
    setActionError(null);
    try {
      const updated = await bookingApi.updateAppointment(appt.id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos actualizar la cita.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckIn = async (appt: Appointment) => {
    setBusyId(appt.id);
    setActionError(null);
    try {
      const updated = await bookingApi.checkInAppointment(appt.id);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos registrar el check-in.");
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = appt.start.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments]);

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex flex-col gap-0.5">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Barbero</span>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Mi Agenda</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg">
          <button
            onClick={() => setViewMode("day")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              viewMode === "day" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
              viewMode === "week" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg border border-surface-container-high">
        <button onClick={() => shiftDate(viewMode === "day" ? -1 : -7)} className="w-8 h-8 rounded bg-surface-container flex items-center justify-center cursor-pointer hover:text-primary">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="font-title-sm text-title-sm font-bold text-on-surface">
          {viewMode === "day" ? formatDateBogota(anchorDate.toISOString()) : `${range.from} — ${range.to}`}
        </span>
        <button onClick={() => shiftDate(viewMode === "day" ? 1 : 7)} className="w-8 h-8 rounded bg-surface-container flex items-center justify-center cursor-pointer hover:text-primary">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {actionError && (
        <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          {actionError}
        </div>
      )}

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && appointments.length === 0 && (
        <EmptyState icon="event_busy" title="No tienes citas en este rango de fechas" />
      )}

      {state === "ready" &&
        grouped.map(([day, items]) => (
          <div key={day} className="flex flex-col gap-space-sm">
            {viewMode === "week" && (
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                {formatDateBogota(items[0].start)}
              </span>
            )}
            {items.map((appt) => (
              <div
                key={appt.id}
                className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-surface-container-high"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded font-bold uppercase ${STATUS_BADGE[appt.status] || ""}`}>
                      {statusLabel(appt.status)}
                    </span>
                    {appt.checked_in_at && (
                      <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-success/20 text-success font-bold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Llegó
                      </span>
                    )}
                    <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                      {formatTimeRangeBogota(appt.start, appt.end)}
                    </span>
                  </div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">
                    {appt.items.map((i) => i.name).join(" + ")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                      {appt.client.name} • {appt.client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                      {formatCOP(appt.total_price)}
                    </span>
                  </div>
                </div>

                {(appt.status === "pending" || appt.status === "confirmed") && (
                  <div className="flex items-center gap-space-xs shrink-0 flex-wrap">
                    {!appt.checked_in_at && (
                      <button
                        disabled={busyId === appt.id}
                        onClick={() => handleCheckIn(appt)}
                        className="px-space-sm py-space-xs rounded bg-success/15 hover:bg-success/25 text-success font-label-sm text-label-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        Check-in
                      </button>
                    )}
                    <button
                      disabled={busyId === appt.id}
                      onClick={() => handleStatusChange(appt, "completed")}
                      className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface font-label-sm text-label-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      Completada
                    </button>
                    <button
                      disabled={busyId === appt.id}
                      onClick={() => handleStatusChange(appt, "no_show")}
                      className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-highest text-on-surface-variant font-label-sm text-label-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      No asistió
                    </button>
                    <button
                      disabled={busyId === appt.id}
                      onClick={() => handleStatusChange(appt, "cancelled")}
                      className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-sm text-label-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
