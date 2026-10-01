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
              <div className="flex items-center justify-between p-space-md">
                <div className="flex flex-col gap-1">
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
                <button
                  onClick={() => setExpandedId((prev) => (prev === b.id ? null : b.id))}
                  className="px-space-md py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer whitespace-nowrap"
                >
                  {expandedId === b.id ? "Ocultar horario" : "Gestionar horario"}
                </button>
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
    </div>
  );
}
