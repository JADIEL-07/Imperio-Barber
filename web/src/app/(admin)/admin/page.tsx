"use client";

import React, { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/booking";
import { StatsResponse } from "@/types/booking";
import { formatCOP, statusLabel } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { RevenueByDayChart } from "@/components/admin/RevenueByDayChart";
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

  const maxServiceRevenue = stats ? Math.max(...stats.revenue_by_service.map((s) => s.total), 1) : 1;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Dashboard</h1>
      </div>

      <AdminNav />

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}

      {state === "ready" && stats && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Citas de hoy</span>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{stats.today_appointments}</span>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Ingresos del mes</span>
              <span className="font-headline-lg text-headline-lg font-bold text-primary font-data-mono">{formatCOP(stats.month_revenue)}</span>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Fondo de comisiones pagadas</span>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface font-data-mono">{formatCOP(stats.total_commissions_paid)}</span>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Citas por estado (hoy)</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.status_counts).map(([status, count]) => (
                  <span key={status} className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface">
                    {statusLabel(status)}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high">
              <h2 className="font-title-md text-title-md font-bold text-on-surface mb-space-md">Ingresos por día (mes en curso)</h2>
              {stats.revenue_by_day.length === 0 ? (
                <EmptyState icon="trending_up" title="Aún no hay ingresos registrados este mes" />
              ) : (
                <RevenueByDayChart data={stats.revenue_by_day} />
              )}
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high">
              <h2 className="font-title-md text-title-md font-bold text-on-surface mb-space-md">Ingresos por servicio</h2>
              {stats.revenue_by_service.length === 0 ? (
                <EmptyState icon="content_cut" title="Aún no hay suficientes datos" />
              ) : (
                <div className="flex flex-col gap-space-sm">
                  {stats.revenue_by_service.map((s) => (
                    <div key={s.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between font-body-sm text-body-sm">
                        <span className="text-on-surface">{s.name}</span>
                        <span className="text-primary font-data-mono font-bold">{formatCOP(s.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full"
                          style={{ width: `${Math.max(4, (s.total / maxServiceRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high">
            <h2 className="font-title-md text-title-md font-bold text-on-surface mb-space-sm">Servicios más pedidos (mes)</h2>
            {stats.top_services.length === 0 ? (
              <EmptyState icon="trending_up" title="Aún no hay suficientes datos" />
            ) : (
              <div className="flex flex-col gap-space-xs">
                {stats.top_services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container">
                    <span className="font-body-md text-body-md text-on-surface">{s.name}</span>
                    <span className="font-title-sm text-title-sm font-bold text-primary font-data-mono">{s.count}</span>
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
