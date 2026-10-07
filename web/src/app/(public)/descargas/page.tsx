import React from "react";
import type { Metadata } from "next";
import { DOWNLOADS } from "@/lib/app-download";

export const metadata: Metadata = {
  title: "Descargar la app | Imperio Barber",
  description: "Instala Imperio Barber en Android, iPhone, Windows o Linux.",
};

export default function DescargasPage() {
  return (
    <div className="max-w-[1600px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Aplicación</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">
          Descargar la app
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          Reserva y gestiona tus citas desde tu dispositivo. Elige tu plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {DOWNLOADS.map((d) => (
          <div
            key={d.id}
            id={d.id}
            className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[28px]">{d.icon}</span>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">{d.platform}</h2>
            </div>

            <div className="flex flex-wrap gap-space-xs">
              {d.files.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  className="inline-flex items-center gap-2 px-space-md py-space-xs border border-primary text-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  {f.label}
                </a>
              ))}
            </div>

            <ul className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant list-disc pl-5">
              {d.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
