"use client";

import React, { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api/catalog";
import { Service } from "@/types/catalog";
import { formatCOP } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

interface ModalState {
  mode: "create" | "edit";
  service?: Service;
}

export default function ServiciosAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      setServices(await catalogApi.getServices(true));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = async (service: Service) => {
    setActionError(null);
    try {
      const updated = await catalogApi.updateService(service.id, { is_active: !service.is_active });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos actualizar el servicio.");
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Servicios</h1>
      </div>

      <AdminNav />

      {actionError && (
        <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          {actionError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setModal({ mode: "create" })}
          className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer"
        >
          + Nuevo servicio
        </button>
      </div>

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && services.length === 0 && <EmptyState icon="content_cut" title="Aún no hay servicios" />}

      {state === "ready" && services.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-surface-container-high">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Nombre</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Duración</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Precio</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Estado</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-t border-surface-container-high bg-surface-container-low">
                  <td className="p-space-sm">
                    <div className="flex items-center gap-space-sm">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-surface-container-highest" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">content_cut</span>
                        </div>
                      )}
                      <div>
                        <div className="font-body-sm text-body-sm text-on-surface font-semibold">{s.name}</div>
                        <div className="font-label-xs text-label-xs text-on-surface-variant">{s.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-space-sm font-body-sm text-body-sm text-on-surface">{s.duration_minutes} min</td>
                  <td className="p-space-sm font-body-sm text-body-sm text-primary font-semibold">{formatCOP(s.price)}</td>
                  <td className="p-space-sm">
                    <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded font-bold uppercase ${s.is_active ? "bg-primary/20 text-primary" : "bg-error-container/40 text-on-error-container"}`}>
                      {s.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <button onClick={() => setModal({ mode: "edit", service: s })} className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer">
                        Editar
                      </button>
                      <button onClick={() => handleToggleActive(s)} className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer">
                        {s.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ServiceModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={(service) => {
            setModal(null);
            setServices((prev) => {
              const exists = prev.some((s) => s.id === service.id);
              return exists ? prev.map((s) => (s.id === service.id ? service : s)) : [service, ...prev];
            });
          }}
        />
      )}
    </div>
  );
}

function ServiceModal({
  modal,
  onClose,
  onSaved,
}: {
  modal: ModalState;
  onClose: () => void;
  onSaved: (service: Service) => void;
}) {
  const editing = modal.mode === "edit" ? modal.service : undefined;
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [duration, setDuration] = useState(editing?.duration_minutes?.toString() || "30");
  const [price, setPrice] = useState(editing?.price?.toString() || "0");
  const [imageUrl, setImageUrl] = useState(editing?.image_url || "");
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const durationNum = parseInt(duration, 10);
    const priceNum = parseInt(price, 10);
    if (!name.trim() || Number.isNaN(durationNum) || durationNum <= 0 || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Verifica nombre, duración (minutos) y precio (COP entero).");
      return;
    }
    setSubmitting(true);
    try {
      if (modal.mode === "create") {
        const created = await catalogApi.createService({
          name: name.trim(),
          description: description.trim(),
          duration_minutes: durationNum,
          price: priceNum,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        });
        onSaved(created);
      } else {
        const updated = await catalogApi.updateService(modal.service!.id, {
          name: name.trim(),
          description: description.trim(),
          duration_minutes: durationNum,
          price: priceNum,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        });
        onSaved(updated);
      }
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar el servicio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface">
            {modal.mode === "create" ? "Nuevo servicio" : "Editar servicio"}
          </h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-black/20 rounded cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Duración (min)</label>
            <input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Precio (COP)</label>
            <input type="number" min={0} step={1000} value={price} onChange={(e) => setPrice(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          </div>
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">URL de imagen (opcional)</label>
          <input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          {imageUrl && <img src={imageUrl} alt="Vista previa" className="w-20 h-20 rounded-lg object-cover border border-surface-container-highest" />}
        </div>

        <label className="flex items-center gap-space-xs">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary-container w-4 h-4" />
          <span className="font-label-md text-label-md text-on-surface">Servicio activo</span>
        </label>

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
