"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { StatsResponse } from "@/types/booking";
import { formatCOP, statusLabel } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = async () => {
    setState("loading");
    try {
      setStats(await bookingApi.getStats());
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
      <div className="flex flex-col gap-0.5">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Dashboard</h1>
      </div>

      <AdminNav />

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}

      {state === "ready" && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Citas de hoy</span>
              <span className="font-headline-md text-headline-md font-bold text-primary">{stats.today_appointments}</span>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Ingresos del mes</span>
              <span className="font-headline-md text-headline-md font-bold text-primary">{formatCOP(stats.month_revenue)}</span>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Citas por estado</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.status_counts).map(([status, count]) => (
                  <span key={status} className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface">
                    {statusLabel(status)}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high">
            <h2 className="font-title-md text-title-md font-bold text-on-surface mb-space-sm">Servicios más pedidos</h2>
            {stats.top_services.length === 0 ? (
              <EmptyState icon="trending_up" title="Aún no hay suficientes datos" />
            ) : (
              <div className="flex flex-col gap-space-xs">
                {stats.top_services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container">
                    <span className="font-body-md text-body-md text-on-surface">{s.name}</span>
                    <span className="font-title-sm text-title-sm font-bold text-primary">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
