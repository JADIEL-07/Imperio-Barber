"use client";

import React, { useEffect, useMemo, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Appointment, AppointmentStatus, Barber } from "@/types/booking";
import { formatCOP, formatDateBogota, formatTimeRangeBogota, statusLabel } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

const STATUS_OPTIONS: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export default function CitasAdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [barberFilter, setBarberFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const [res, barberList] = await Promise.all([
        bookingApi.listAppointments("all", statusFilter || undefined, fromDate || undefined, toDate || undefined, 1, 200),
        barbers.length ? Promise.resolve(barbers) : bookingApi.getBarbers(),
      ]);
      setAppointments(res.items);
      if (!barbers.length) setBarbers(barberList);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (barberFilter && a.barber.id !== barberFilter) return false;
      if (clientFilter) {
        const q = clientFilter.toLowerCase();
        if (!a.client.name.toLowerCase().includes(q) && !a.client.phone.includes(q)) return false;
      }
      return true;
    });
  }, [appointments, barberFilter, clientFilter]);

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

  return (
    <div className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Todas las Citas</h1>
      </div>

      <AdminNav />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-space-sm bg-surface-container-low p-space-sm rounded-xl border border-surface-container-high">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface text-sm">
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface text-sm">
          <option value="">Todos los barberos</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface text-sm" placeholder="Desde" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface text-sm" placeholder="Hasta" />
        <input
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          placeholder="Buscar cliente..."
          className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface text-sm"
        />
      </div>

      {actionError && (
        <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          {actionError}
        </div>
      )}

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && filtered.length === 0 && <EmptyState icon="event_busy" title="No hay citas que coincidan con los filtros" />}

      {state === "ready" && filtered.length > 0 && (
        <div className="flex flex-col gap-space-sm">
          {filtered.map((appt) => (
            <div key={appt.id} className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-surface-container-high">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-bold uppercase">
                    {statusLabel(appt.status)}
                  </span>
                  {appt.checked_in_at && (
                    <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-success/20 text-success font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Check-in
                    </span>
                  )}
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{formatDateBogota(appt.start)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface">{formatTimeRangeBogota(appt.start, appt.end)}</span>
                </div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface">
                  {appt.items.map((i) => i.name).join(" + ")}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                    {appt.client.name} ({appt.client.phone})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">content_cut</span>
                    {appt.barber.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                    {formatCOP(appt.total_price)}
                  </span>
                  {appt.commission_amount != null && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">percent</span>
                      Comisión {formatCOP(appt.commission_amount)} {appt.commission_paid ? "(pagada)" : "(pendiente)"}
                    </span>
                  )}
                </div>
              </div>

              <select
                disabled={busyId === appt.id}
                value={appt.status}
                onChange={(e) => handleStatusChange(appt, e.target.value as AppointmentStatus)}
                className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest shrink-0 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
