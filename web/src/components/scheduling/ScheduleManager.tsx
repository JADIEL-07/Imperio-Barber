"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { BarberSchedule, BarberTimeOff } from "@/types/booking";
import { formatDateBogota, weekdayLabel } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

interface DayRow {
  enabled: boolean;
  start: string;
  end: string;
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function emptyWeek(): DayRow[] {
  return WEEKDAYS.map(() => ({ enabled: false, start: "08:00", end: "20:00" }));
}

interface ScheduleManagerProps {
  barberId: string;
}

/**
 * Editor de horario semanal + bloqueos puntuales de un barbero.
 * Lo usa tanto el propio empleado (/empleado/disponibilidad) como el admin
 * (/admin/empleados) para gestionar la disponibilidad de cualquier barbero.
 */
export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ barberId }) => {
  const [state, setState] = useState<LoadState>("loading");
  const [week, setWeek] = useState<DayRow[]>(emptyWeek());
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [timeOffs, setTimeOffs] = useState<BarberTimeOff[]>([]);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newReason, setNewReason] = useState("");
  const [timeOffError, setTimeOffError] = useState<string | null>(null);
  const [savingTimeOff, setSavingTimeOff] = useState(false);

  const load = async () => {
    setState("loading");
    try {
      const [schedule, offs] = await Promise.all([
        bookingApi.getBarberSchedule(barberId),
        bookingApi.listBarberTimeOffs(barberId),
      ]);
      const w = emptyWeek();
      schedule.forEach((s) => {
        w[s.weekday] = { enabled: true, start: s.start, end: s.end };
      });
      setWeek(w);
      setTimeOffs(offs);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  const updateDay = (idx: number, patch: Partial<DayRow>) => {
    setWeek((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleMessage(null);
    setScheduleError(null);
    try {
      const payload: BarberSchedule[] = week
        .map((d, idx) => ({ weekday: idx, start: d.start, end: d.end, enabled: d.enabled }))
        .filter((d) => d.enabled)
        .map(({ weekday, start, end }) => ({ weekday, start, end }));
      await bookingApi.updateBarberSchedule(barberId, payload);
      setScheduleMessage("Horario actualizado correctamente.");
    } catch (err: any) {
      setScheduleError(err?.message || "No pudimos guardar el horario.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeOffError(null);
    if (!newFrom || !newTo || !newReason.trim()) {
      setTimeOffError("Completa fecha de inicio, fin y motivo.");
      return;
    }
    setSavingTimeOff(true);
    try {
      const created = await bookingApi.addBarberTimeOff(barberId, {
        from: new Date(newFrom).toISOString(),
        to: new Date(newTo).toISOString(),
        reason: newReason.trim(),
      });
      setTimeOffs((prev) => [...prev, created]);
      setNewFrom("");
      setNewTo("");
      setNewReason("");
    } catch (err: any) {
      setTimeOffError(err?.message || "No pudimos crear el bloqueo.");
    } finally {
      setSavingTimeOff(false);
    }
  };

  const handleDeleteTimeOff = async (id: string) => {
    if (!window.confirm("¿Eliminar este bloqueo de agenda?")) return;
    try {
      await bookingApi.deleteBarberTimeOff(barberId, id);
      setTimeOffs((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setTimeOffError(err?.message || "No pudimos eliminar el bloqueo.");
    }
  };

  if (state === "loading") return <Spinner />;
  if (state === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="flex flex-col gap-space-lg">
      <section className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high flex flex-col gap-space-md">
        <h2 className="font-title-md text-title-md font-bold text-on-surface">Horario semanal</h2>

        {scheduleError && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {scheduleError}
          </div>
        )}
        {scheduleMessage && (
          <div role="status" className="p-space-sm rounded-lg bg-primary/15 text-primary font-body-sm text-body-sm">
            {scheduleMessage}
          </div>
        )}

        <div className="flex flex-col gap-space-sm">
          {WEEKDAYS.map((wd) => {
            const row = week[wd];
            return (
              <div key={wd} className="flex flex-col sm:flex-row sm:items-center gap-space-sm p-space-sm rounded-lg bg-surface-container">
                <label className="flex items-center gap-space-xs w-36 shrink-0">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateDay(wd, { enabled: e.target.checked })}
                    className="accent-primary-container w-4 h-4"
                  />
                  <span className="font-label-md text-label-md text-on-surface">{weekdayLabel(wd)}</span>
                </label>
                <div className="flex items-center gap-space-xs">
                  <input
                    type="time"
                    value={row.start}
                    disabled={!row.enabled}
                    onChange={(e) => updateDay(wd, { start: e.target.value })}
                    className="px-space-xs py-1 rounded bg-surface-container-high text-on-surface disabled:opacity-40"
                  />
                  <span className="text-on-surface-variant">—</span>
                  <input
                    type="time"
                    value={row.end}
                    disabled={!row.enabled}
                    onChange={(e) => updateDay(wd, { end: e.target.value })}
                    className="px-space-xs py-1 rounded bg-surface-container-high text-on-surface disabled:opacity-40"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSchedule}
            disabled={savingSchedule}
            className="px-space-lg py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold disabled:opacity-60 cursor-pointer"
          >
            {savingSchedule ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </section>

      <section className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high flex flex-col gap-space-md">
        <h2 className="font-title-md text-title-md font-bold text-on-surface">Bloqueos y vacaciones</h2>

        {timeOffError && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {timeOffError}
          </div>
        )}

        {timeOffs.length === 0 ? (
          <EmptyState icon="event_busy" title="No hay bloqueos registrados" />
        ) : (
          <div className="flex flex-col gap-space-sm">
            {timeOffs.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">{t.reason}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {formatDateBogota(t.from)} — {formatDateBogota(t.to)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTimeOff(t.id)}
                  className="p-1 rounded hover:bg-error-container hover:text-on-error-container text-on-surface-variant cursor-pointer"
                  aria-label="Eliminar bloqueo"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddTimeOff} className="flex flex-col sm:flex-row gap-space-sm items-end pt-space-sm border-t border-surface-container-high">
          <div className="flex flex-col gap-space-xs flex-1">
            <label className="font-label-xs text-label-xs text-on-surface-variant">Desde</label>
            <input type="date" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface" />
          </div>
          <div className="flex flex-col gap-space-xs flex-1">
            <label className="font-label-xs text-label-xs text-on-surface-variant">Hasta</label>
            <input type="date" value={newTo} onChange={(e) => setNewTo(e.target.value)} className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface" />
          </div>
          <div className="flex flex-col gap-space-xs flex-[2]">
            <label className="font-label-xs text-label-xs text-on-surface-variant">Motivo</label>
            <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Vacaciones, permiso médico..." className="px-space-xs py-1.5 rounded bg-surface-container text-on-surface" />
          </div>
          <button
            type="submit"
            disabled={savingTimeOff}
            className="px-space-md py-1.5 rounded bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer disabled:opacity-60"
          >
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
};
