"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { Barber } from "@/types/booking";
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

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Panel Administrador</span>
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
              <div className="flex items-center justify-between p-space-md gap-space-sm">
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
                    {b.phone && <span className="font-body-sm text-body-sm text-on-surface-variant">{b.phone}</span>}
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
                <div className="flex items-center gap-space-xs shrink-0">
                  <button
                    onClick={() => setEditingPhoto(b)}
                    className="px-space-sm py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer whitespace-nowrap"
                  >
                    Foto
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
            Pega el link de una foto ya alojada (por ejemplo, subida a un servicio de imágenes). Déjalo vacío para quitar la foto.
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
