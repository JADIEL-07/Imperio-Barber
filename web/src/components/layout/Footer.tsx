import React from "react";
import { ANDROID_APK_URL, IOS_IPA_URL } from "@/lib/app-download";
import { LogoMark } from "@/components/ui/Logo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-lowest py-space-xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border-t border-surface-container-high/60">
      <div className="max-w-[1600px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-space-xl">
          {/* Brand Col */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-md bg-surface-container-high flex items-center justify-center">
                <LogoMark className="w-5 h-5 text-primary" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface uppercase">Imperio Barber</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Atelier de barbería de autor: cortes de precisión, rituales de afeitado y una experiencia pensada para el hombre moderno.
            </p>
            <div className="flex items-center gap-space-xs mt-space-sm">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-space-xs rounded bg-surface-container-high font-label-xs text-label-xs text-primary">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Reservas en línea 24/7
              </span>
            </div>
            <a
              href={ANDROID_APK_URL}
              className="inline-flex w-fit items-center gap-space-xs px-space-sm py-space-xs rounded border border-primary text-primary font-label-xs text-label-xs hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">android</span>
              Descargar para Android
            </a>
            <a
              href={IOS_IPA_URL}
              className="inline-flex w-fit items-center gap-space-xs px-space-sm py-space-xs rounded border border-primary text-primary font-label-xs text-label-xs hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
              Descargar para iOS
            </a>
          </div>

          {/* Location Col */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Sede Central</span>
            <div className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">location_on</span>
              <span>Calle 94 # 11A - 28, Chicó Norte, Bogotá D.C.</span>
            </div>
            <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">call</span>
              <span>+57 (601) 745-9820</span>
            </div>
            <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">concierge</span>
              <span>Valet Parking disponible</span>
            </div>
          </div>

          {/* Schedule Col */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Horario de Atención</span>
            <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <div><span className="text-on-surface font-medium">Lunes a Viernes:</span> 08:00 AM – 09:00 PM</div>
              <div><span className="text-on-surface font-medium">Sábados:</span> 08:00 AM – 08:00 PM</div>
              <div><span className="text-on-surface font-medium">Domingos y Festivos:</span> 10:00 AM – 06:00 PM</div>
            </div>
          </div>

          {/* Craft Col */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">Sello Artesanal</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Técnicas de navaja barbera, productos de alta cosmética masculina y precisión milimétrica en cada corte.
            </p>
            <div className="flex items-center gap-space-sm text-on-surface-variant mt-space-xs">
              <span className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer text-[22px]">share</span>
              <span className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer text-[22px]">photo_camera</span>
              <span className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer text-[22px]">public</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-label-xs text-label-xs border-t border-surface-container-high">
          <p>© 2026 Imperio Barber. Todos los derechos reservados.</p>
          <div className="flex items-center gap-space-md">
            <span className="hover:text-primary transition-colors cursor-pointer">Términos de Reserva</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
