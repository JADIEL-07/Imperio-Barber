"use client";

import React, { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api/catalog";
import { Combo, Service } from "@/types/catalog";
import { formatCOP } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

interface ModalState {
  mode: "create" | "edit";
  combo?: Combo;
}

export default function CombosAdminPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const [c, s] = await Promise.all([catalogApi.getCombos(true), catalogApi.getServices(true)]);
      setCombos(c);
      setServices(s);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = async (combo: Combo) => {
    setActionError(null);
    try {
      const updated = await catalogApi.updateCombo(combo.id, { is_active: !combo.is_active });
      setCombos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos actualizar el combo.");
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Combos</h1>
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
          disabled={services.length === 0}
          className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer disabled:opacity-50"
        >
          + Nuevo combo
        </button>
      </div>

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && services.length === 0 && (
        <EmptyState icon="warning" title="Crea servicios primero" description="Un combo necesita al menos un servicio existente." />
      )}
      {state === "ready" && services.length > 0 && combos.length === 0 && (
        <EmptyState icon="local_offer" title="Aún no hay combos" />
      )}

      {state === "ready" && combos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {combos.map((c) => (
            <div key={c.id} className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
              {c.image_url && (
                <img src={c.image_url} alt={c.name} className="w-full h-32 object-cover rounded-lg border border-surface-container-high" />
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">{c.name}</h3>
                <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded font-bold uppercase ${c.is_active ? "bg-primary/20 text-primary" : "bg-error-container/40 text-on-error-container"}`}>
                  {c.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{c.description}</p>
              <div className="flex flex-wrap gap-1">
                {c.services.map((s) => (
                  <span key={s.id} className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {s.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-high">
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm font-bold text-primary">{formatCOP(c.price)}</span>
                  <span className="font-label-xs text-label-xs text-on-surface-variant">{c.duration_minutes} min</span>
                </div>
                {c.savings > 0 ? (
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                    Ahorra {formatCOP(c.savings)}
                  </span>
                ) : (
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-error-container/40 text-on-error-container font-bold uppercase">
                    Sin ahorro
                  </span>
                )}
              </div>
              <div className="flex items-center gap-space-xs pt-space-xs">
                <button onClick={() => setModal({ mode: "edit", combo: c })} className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer">
                  Editar
                </button>
                <button onClick={() => handleToggleActive(c)} className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer">
                  {c.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ComboModal
          modal={modal}
          services={services}
          onClose={() => setModal(null)}
          onSaved={(combo) => {
            setModal(null);
            setCombos((prev) => {
              const exists = prev.some((c) => c.id === combo.id);
              return exists ? prev.map((c) => (c.id === combo.id ? combo : c)) : [combo, ...prev];
            });
          }}
        />
      )}
    </div>
  );
}

function ComboModal({
  modal,
  services,
  onClose,
  onSaved,
}: {
  modal: ModalState;
  services: Service[];
  onClose: () => void;
  onSaved: (combo: Combo) => void;
}) {
  const editing = modal.mode === "edit" ? modal.combo : undefined;
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [price, setPrice] = useState(editing?.price?.toString() || "0");
  const [imageUrl, setImageUrl] = useState(editing?.image_url || "");
  const [selectedIds, setSelectedIds] = useState<string[]>(editing?.services.map((s) => s.id) || []);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const sumPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const sumDuration = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
  const priceNum = parseInt(price, 10) || 0;
  const willOverSum = selectedServices.length > 0 && priceNum > sumPrice;

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || selectedIds.length === 0 || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Ingresa un nombre, selecciona al menos un servicio y un precio válido.");
      return;
    }
    setSubmitting(true);
    try {
      if (modal.mode === "create") {
        const created = await catalogApi.createCombo({
          name: name.trim(),
          description: description.trim(),
          service_ids: selectedIds,
          price: priceNum,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        });
        onSaved(created);
      } else {
        const updated = await catalogApi.updateCombo(modal.combo!.id, {
          name: name.trim(),
          description: description.trim(),
          service_ids: selectedIds,
          price: priceNum,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        });
        onSaved(updated);
      }
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar el combo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md overflow-y-auto" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md my-space-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface">
            {modal.mode === "create" ? "Nuevo combo" : "Editar combo"}
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

        <div className="flex flex-col gap-space-xs">
          <span className="font-label-md text-label-md text-on-surface-variant">Servicios incluidos</span>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-space-xs rounded-lg bg-surface-container">
            {services.map((s) => (
              <label key={s.id} className="flex items-center justify-between gap-space-sm p-1.5 rounded hover:bg-surface-container-highest cursor-pointer">
                <span className="flex items-center gap-space-xs">
                  <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-primary-container w-4 h-4" />
                  <span className="font-body-sm text-body-sm text-on-surface">{s.name}</span>
                </span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">{formatCOP(s.price)} • {s.duration_minutes} min</span>
              </label>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <span className="font-label-xs text-label-xs text-on-surface-variant">
              Suma individual: {formatCOP(sumPrice)} • Duración total: {sumDuration} min
            </span>
          )}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Precio del combo (COP)</label>
          <input type="number" min={0} step={1000} value={price} onChange={(e) => setPrice(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          {willOverSum && (
            <span className="font-label-xs text-label-xs text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              El precio del combo supera la suma de sus servicios ({formatCOP(sumPrice)}). No habrá ahorro para el cliente.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">URL de imagen (opcional)</label>
          <input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          {imageUrl && <img src={imageUrl} alt="Vista previa" className="w-full h-28 object-cover rounded-lg border border-surface-container-highest" />}
        </div>

        <label className="flex items-center gap-space-xs">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary-container w-4 h-4" />
          <span className="font-label-md text-label-md text-on-surface">Combo activo</span>
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
