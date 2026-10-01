"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api/catalog";
import { Service } from "@/types/catalog";
import { formatCOP } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = async () => {
    setState("loading");
    try {
      setServices(await catalogApi.getServices());
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Carta Completa</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">
          Servicios
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          Cada ritual incluye diagnóstico capilar y acabado con productos de alta cosmética masculina. Precios en
          pesos colombianos.
        </p>
      </div>

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && services.length === 0 && (
        <EmptyState icon="content_cut" title="Aún no hay servicios publicados" description="Vuelve pronto, estamos actualizando la carta." />
      )}
      {state === "ready" && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-xl bg-surface-container-low border border-surface-container-high hover:bg-surface-container transition-colors overflow-hidden"
            >
              {s.image_url && (
                <img src={s.image_url} alt={s.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-space-md flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">{s.name}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{s.description}</p>
                </div>
                <div className="flex items-center justify-between mt-space-md pt-space-xs">
                  <span className="font-label-xs text-label-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                    {s.duration_minutes} min
                  </span>
                  <span className="font-title-md text-title-md font-bold text-primary">{formatCOP(s.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-space-md">
        <Link
          href="/reservar"
          className="inline-flex items-center gap-2 px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02]"
        >
          <span>Reservar Cita</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
