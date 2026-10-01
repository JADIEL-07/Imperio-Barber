"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Barber, CommissionSummary } from "@/types/booking";
import { formatCOP, formatPercent } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { ScheduleManager } from "@/components/scheduling/ScheduleManager";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function EmpleadosPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Barber | null>(null);
  const [editingCommission, setEditingCommission] = useState<Barber | null>(null);

  const load = async () => {
    setState("loading");
    try {
      setBarbers(await bookingApi.getBarbers());
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePhotoSaved = (updated: Barber) => {
    setBarbers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingPhoto(null);
  };

  const handleCommissionRateSaved = (updated: Barber) => {
    setBarbers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Empleados</h1>
      </div>

      <AdminNav />

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && barbers.length === 0 && (
        <EmptyState icon="badge" title="No hay barberos registrados" description="Crea usuarios con rol Empleado en la sección Usuarios." />
      )}

      {state === "ready" && barbers.length > 0 && (
        <div className="flex flex-col gap-space-sm">
          {barbers.map((b) => (
            <div key={b.id} className="bg-surface-container-low rounded-xl border border-surface-container-high overflow-hidden">
              <div className="flex items-center justify-between p-space-md gap-space-sm flex-wrap">
                <div className="flex items-center gap-space-md min-w-0">
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="w-14 h-14 rounded-full object-cover shrink-0 border border-surface-container-highest"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{b.name}</h3>
                    <div className="flex items-center gap-space-sm flex-wrap">
                      {b.phone && <span className="font-body-sm text-body-sm text-on-surface-variant">{b.phone}</span>}
                      <span className="font-data-mono-sm text-data-mono-sm text-primary">
                        Comisión: {formatPercent(b.commission_rate || 0)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(b.services || []).length === 0 ? (
                        <span className="font-label-xs text-label-xs text-on-surface-variant">Sin servicios asignados</span>
                      ) : (
                        b.services!.map((s) => (
                          <span key={s.id} className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            {s.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs shrink-0 flex-wrap">
                  <button
                    onClick={() => setEditingPhoto(b)}
                    className="px-space-sm py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer whitespace-nowrap"
                  >
                    Foto
                  </button>
                  <button
                    onClick={() => setEditingCommission(b)}
                    className="px-space-sm py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer whitespace-nowrap"
                  >
                    Comisiones
                  </button>
                  <button
                    onClick={() => setExpandedId((prev) => (prev === b.id ? null : b.id))}
                    className="px-space-md py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer whitespace-nowrap"
                  >
                    {expandedId === b.id ? "Ocultar horario" : "Gestionar horario"}
                  </button>
                </div>
              </div>
              {expandedId === b.id && (
                <div className="p-space-md border-t border-surface-container-high bg-surface-container">
                  <ScheduleManager barberId={b.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingPhoto && (
        <BarberPhotoModal barber={editingPhoto} onClose={() => setEditingPhoto(null)} onSaved={handlePhotoSaved} />
      )}

      {editingCommission && (
        <BarberCommissionModal
          barber={editingCommission}
          onClose={() => setEditingCommission(null)}
          onRateSaved={handleCommissionRateSaved}
        />
      )}
    </div>
  );
}

function BarberPhotoModal({
  barber,
  onClose,
  onSaved,
}: {
  barber: Barber;
  onClose: () => void;
  onSaved: (updated: Barber) => void;
}) {
  const [url, setUrl] = useState(barber.imageUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await bookingApi.updateBarber(barber.id, { avatar_url: url.trim() });
      onSaved(updated);
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar la foto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface">Foto de {barber.name}</h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-black/20 rounded cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {error}
          </div>
        )}

        {url && (
          <img src={url} alt="Vista previa" className="w-24 h-24 rounded-full object-cover mx-auto border border-surface-container-highest" />
        )}

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="avatar-url" className="font-label-md text-label-md text-on-surface-variant">
            URL de la imagen
          </label>
          <input
            id="avatar-url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest"
          />
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            Pega el link de una foto ya alojada. Déjalo vacío para quitar la foto.
          </span>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button type="button" onClick={onClose} className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-md cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-md font-bold cursor-pointer disabled:opacity-50">
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BarberCommissionModal({
  barber,
  onClose,
  onRateSaved,
}: {
  barber: Barber;
  onClose: () => void;
  onRateSaved: (updated: Barber) => void;
}) {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [ratePercent, setRatePercent] = useState(((barber.commission_rate || 0) * 100).toString());
  const [savingRate, setSavingRate] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoadState("loading");
    try {
      const res = await bookingApi.getBarberCommissions(barber.id);
      setSummary(res);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barber.id]);

  const handleSaveRate = async () => {
    const pct = parseFloat(ratePercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError("La comisión debe ser un número entre 0 y 100.");
      return;
    }
    setError(null);
    setSavingRate(true);
    try {
      const updated = await bookingApi.updateBarber(barber.id, { commission_rate: pct / 100 });
      onRateSaved(updated);
      setMessage("Tarifa de comisión actualizada.");
      loadSummary();
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar la tarifa.");
    } finally {
      setSavingRate(false);
    }
  };

  const handlePayout = async () => {
    if (!summary || summary.pending_amount <= 0) return;
    if (!window.confirm(`¿Pagar ${formatCOP(summary.pending_amount)} de comisión pendiente a ${barber.name}?`)) return;
    setPayingOut(true);
    setError(null);
    try {
      await bookingApi.payBarberCommissions(barber.id);
      setMessage("Pago de comisión registrado.");
      loadSummary();
    } catch (err: any) {
      setError(err?.message || "No pudimos registrar el pago.");
    } finally {
      setPayingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface">Comisiones de {barber.name}</h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-black/20 rounded cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

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

        <div className="flex items-end gap-space-sm">
          <div className="flex flex-col gap-space-xs flex-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Tarifa de comisión (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest"
            />
          </div>
          <button
            onClick={handleSaveRate}
            disabled={savingRate}
            className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-md font-bold cursor-pointer disabled:opacity-50"
          >
            {savingRate ? "..." : "Guardar"}
          </button>
        </div>
        <p className="font-label-xs text-label-xs text-on-surface-variant -mt-space-sm">
          Se aplica a cada cita cuando pase a estado "Completada" (el % vigente en ese momento queda fijo para esa cita).
        </p>

        {loadState === "loading" && <Spinner />}
        {loadState === "error" && <ErrorState onRetry={loadSummary} />}
        {loadState === "ready" && summary && (
          <div className="flex flex-col gap-space-sm pt-space-sm border-t border-surface-container-highest">
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-0.5">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Pendiente</span>
                <span className="font-data-mono text-data-mono font-bold text-primary">{formatCOP(summary.pending_amount)}</span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">{summary.pending_count} citas</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-0.5">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Pagado histórico</span>
                <span className="font-data-mono text-data-mono font-bold text-on-surface">{formatCOP(summary.paid_amount)}</span>
              </div>
            </div>
            <button
              onClick={handlePayout}
              disabled={payingOut || summary.pending_amount <= 0}
              className="px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold cursor-pointer disabled:opacity-40"
            >
              {payingOut ? "Procesando..." : "Pagar comisión pendiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
