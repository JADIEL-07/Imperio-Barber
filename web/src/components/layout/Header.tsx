"use client";

import React from "react";

interface HeaderProps {
  onReserveClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReserveClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-gutter">
        {/* Logo */}
        <div className="flex items-center gap-space-md">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-surface-container-high shadow-[0_0_16px_rgba(245,158,11,0.25)]">
            <span className="material-symbols-outlined text-primary text-[24px]">content_cut</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface uppercase">
              AURA
            </span>
            <span className="font-label-xs text-label-xs text-primary tracking-[0.2em] uppercase">
              Barber Lounge
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-space-lg">
          <a className="font-label-lg text-label-lg text-primary font-bold hover:text-on-surface transition-colors" href="#inicio">
            Inicio
          </a>
          <a className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="#servicios">
            Servicios
          </a>
          <a className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="#combos">
            Combos
          </a>
          <a className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="#barberos">
            Maestros
          </a>
        </nav>

        {/* Action Buttons & Role Switcher */}
        <div className="flex items-center gap-space-sm md:gap-space-md">
          <div className="hidden sm:flex items-center bg-surface-container-high p-space-xs rounded-lg">
            <span className="font-label-xs text-label-xs text-on-surface-variant px-space-xs">VISTA:</span>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-xs text-label-xs px-space-xs py-space-xs rounded bg-surface-container text-primary font-semibold cursor-pointer">
                Cliente
              </span>
              <span className="font-label-xs text-label-xs px-space-xs py-space-xs rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                Barbero
              </span>
              <span className="font-label-xs text-label-xs px-space-xs py-space-xs rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                Admin
              </span>
            </div>
          </div>

          <button
            onClick={onReserveClick}
            className="inline-flex items-center justify-center px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
          >
            Reservar Cita
          </button>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
