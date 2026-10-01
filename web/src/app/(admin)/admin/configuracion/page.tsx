"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { weekdayLabel } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

type LoadState = "loading" | "error" | "ready";

interface DayHours {
  open: string;
  close: string;
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function defaultHours(): Record<string, DayHours> {
  const map: Record<string, DayHours> = {};
  WEEKDAYS.forEach((w) => {
    map[String(w)] = { open: "08:00", close: "20:00" };
  });
  return map;
}

export default function ConfiguracionPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [openingHours, setOpeningHours] = useState<Record<string, DayHours>>(defaultHours());
  const [cancelMinHours, setCancelMinHours] = useState(2);
  const [slotMinutes, setSlotMinutes] = useState(15);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setState("loading");
    try {
      const settings = await bookingApi.getSettings();
      const merged = defaultHours();
      Object.entries(settings.opening_hours || {}).forEach(([key, value]) => {
        merged[key] = value as DayHours;
      });
      setOpeningHours(merged);
      setCancelMinHours(settings.cancel_min_hours);
      setSlotMinutes(settings.slot_minutes);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateDay = (weekday: number, patch: Partial<DayHours>) => {
    setOpeningHours((prev) => ({ ...prev, [String(weekday)]: { ...prev[String(weekday)], ...patch } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await bookingApi.updateSettings({
        opening_hours: openingHours,
        cancel_min_hours: cancelMinHours,
        slot_minutes: slotMinutes,
      });
      setMessage("Configuración guardada correctamente.");
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto w-full px-margin md:px-margin-tablet py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Configuración</h1>
      </div>

      <AdminNav />

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}

      {state === "ready" && (
        <form onSubmit={handleSave} className="flex flex-col gap-space-lg">
          {error && (
            <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="p-space-sm rounded-lg bg-primary/15 text-primary font-body-sm text-body-sm">
              {message}
            </div>
          )}

          <section className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high flex flex-col gap-space-sm">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Horario general de apertura</h2>
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container">
                <span className="font-label-md text-label-md text-on-surface w-28 shrink-0">{weekdayLabel(wd)}</span>
                <input
                  type="time"
                  value={openingHours[String(wd)]?.open || "08:00"}
                  onChange={(e) => updateDay(wd, { open: e.target.value })}
                  className="px-space-xs py-1 rounded bg-surface-container-high text-on-surface"
                />
                <span className="text-on-surface-variant">—</span>
                <input
                  type="time"
                  value={openingHours[String(wd)]?.close || "20:00"}
                  onChange={(e) => updateDay(wd, { close: e.target.value })}
                  className="px-space-xs py-1 rounded bg-surface-container-high text-on-surface"
                />
              </div>
            ))}
          </section>

          <section className="bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="cancel-hours" className="font-label-md text-label-md text-on-surface-variant">
                Anticipación mínima para cancelar (horas)
              </label>
              <input
                id="cancel-hours"
                type="number"
                min={0}
                max={48}
                value={cancelMinHours}
                onChange={(e) => setCancelMinHours(parseInt(e.target.value, 10) || 0)}
                className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest"
              />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="slot-minutes" className="font-label-md text-label-md text-on-surface-variant">
                Duración de las franjas (minutos)
              </label>
              <input
                id="slot-minutes"
                type="number"
                min={5}
                max={60}
                step={5}
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(parseInt(e.target.value, 10) || 5)}
                className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_14px_rgba(212,175,55,0.3)] transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
