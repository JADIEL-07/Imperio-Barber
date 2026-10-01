"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api/catalog";
import { Combo } from "@/types/catalog";
import { formatCOP } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = async () => {
    setState("loading");
    try {
      setCombos(await catalogApi.getCombos());
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
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Experiencias</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">
          Combos
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          Rituales completos que combinan varios servicios con un precio preferencial frente a reservarlos por
          separado.
        </p>
      </div>

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && combos.length === 0 && (
        <EmptyState icon="local_offer" title="Aún no hay combos publicados" />
      )}
      {state === "ready" && combos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {combos.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-space-sm p-space-lg rounded-xl bg-surface-container-low border border-primary/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">{c.name}</h3>
                {c.savings > 0 && (
                  <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                    Ahorras {formatCOP(c.savings)}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{c.description}</p>
              <div className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Incluye</span>
                <ul className="flex flex-col gap-0.5">
                  {c.services.map((s) => (
                    <li key={s.id} className="font-body-sm text-body-sm text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                      {s.name} <span className="text-on-surface-variant">({s.duration_minutes} min)</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between mt-space-sm pt-space-xs border-t border-surface-container-high">
                <span className="font-label-xs text-label-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                  {c.duration_minutes} min
                </span>
                <span className="font-title-md text-title-md font-bold text-primary">{formatCOP(c.price)}</span>
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
