"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ANDROID_APK_URL } from "@/lib/app-download";
import { catalogApi } from "@/lib/api/catalog";
import { Service, Combo } from "@/types/catalog";
import { formatCOP } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = async () => {
    setState("loading");
    try {
      const [s, c] = await Promise.all([catalogApi.getServices(), catalogApi.getCombos()]);
      setServices(s.slice(0, 4));
      setCombos(c.slice(0, 2));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <div className="w-full relative overflow-hidden bg-surface-container-lowest">
        <img
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=70"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/85 to-surface-container-lowest/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full bg-tertiary-container/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1600px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl md:py-[6rem] flex flex-col gap-space-lg">
          <div className="inline-flex items-center gap-space-xs text-primary font-label-caps text-label-caps uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            Atelier de Barbería • Bogotá Chicó Norte
          </div>
          <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero font-bold text-on-surface tracking-tight max-w-2xl">
            Precisión de autor en cada corte.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Reserva en minutos con nuestros maestros de la navaja. Rituales de afeitado, cortes de precisión y una
            experiencia pensada para el hombre moderno.
          </p>
          <div className="flex flex-wrap items-center gap-space-md">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all hover:brightness-105 active:scale-95"
            >
              <span>Reservar Cita</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 px-space-xl py-space-sm bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg font-bold hover:bg-surface-container-highest transition-all"
            >
              Ver Servicios
            </Link>
            <a
              href={ANDROID_APK_URL}
              className="inline-flex items-center gap-2 px-space-xl py-space-sm border border-primary text-primary font-label-lg text-label-lg rounded-lg font-bold hover:bg-primary/10 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">android</span>
              Descargar para Android
            </a>
          </div>
        </div>
      </div>

      {/* Servicios destacados */}
      <section className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Carta</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Servicios destacados</h2>
          </div>
          <Link href="/servicios" className="font-label-md text-label-md text-primary hover:underline">
            Ver todos
          </Link>
        </div>

        {state === "loading" && <Spinner />}
        {state === "error" && <ErrorState onRetry={load} />}
        {state === "ready" && services.length === 0 && (
          <EmptyState icon="content_cut" title="Aún no hay servicios publicados" />
        )}
        {state === "ready" && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-md">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-xl bg-surface-container-low border border-surface-container-high overflow-hidden hover:border-primary/40 transition-colors"
              >
                {s.image_url && <img src={s.image_url} alt={s.name} className="w-full h-28 object-cover" />}
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
                    <span className="font-data-mono text-data-mono font-bold text-primary">{formatCOP(s.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Combos destacados */}
      <section className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Rituales</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Combos exclusivos</h2>
          </div>
          <Link href="/combos" className="font-label-md text-label-md text-primary hover:underline">
            Ver todos
          </Link>
        </div>

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
                {c.image_url && (
                  <img src={c.image_url} alt={c.name} className="w-full h-32 object-cover rounded-lg -mt-space-xs" />
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">{c.name}</h3>
                  {c.savings > 0 && (
                    <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                      Ahorras {formatCOP(c.savings)}
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{c.description}</p>
                <div className="flex flex-wrap gap-1">
                  {c.services.map((s) => (
                    <span key={s.id} className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {s.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-space-sm pt-space-xs border-t border-surface-container-high">
                  <span className="font-label-xs text-label-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                    {c.duration_minutes} min
                  </span>
                  <span className="font-data-mono text-data-mono font-bold text-primary">{formatCOP(c.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Horario y ubicación */}
      <section className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg bg-surface-container-low rounded-xl p-space-lg border border-surface-container-high">
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Sede Chicó Norte</span>
            <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">location_on</span>
              <span>Calle 94 # 11A - 28, Chicó Norte, Bogotá D.C.</span>
            </div>
            <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">call</span>
              <span>+57 (601) 745-9820</span>
            </div>
          </div>
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Horario de Atención</span>
            <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <div><span className="text-on-surface font-medium">Lunes a Viernes:</span> 08:00 AM – 09:00 PM</div>
              <div><span className="text-on-surface font-medium">Sábados:</span> 08:00 AM – 08:00 PM</div>
              <div><span className="text-on-surface font-medium">Domingos y Festivos:</span> 10:00 AM – 06:00 PM</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
