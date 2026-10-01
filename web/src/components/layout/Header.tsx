"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

const ROLE_HOME: Record<string, { href: string; label: string }> = {
  client: { href: "/mis-citas", label: "Mis Citas" },
  employee: { href: "/empleado/agenda", label: "Mi Agenda" },
  admin: { href: "/admin", label: "Panel Admin" },
};

export const Header: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  const roleHome = user ? ROLE_HOME[user.role] : null;
  const reserveHref = !user ? "/login" : user.role === "client" ? "/reservar" : roleHome?.href || "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-gutter">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-space-md">
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
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-space-lg">
          <Link className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="/">
            Inicio
          </Link>
          <Link className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="/servicios">
            Servicios
          </Link>
          <Link className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors" href="/combos">
            Combos
          </Link>
          {roleHome && (
            <Link className="font-label-lg text-label-lg text-primary font-bold hover:text-on-surface transition-colors" href={roleHome.href}>
              {roleHome.label}
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-space-sm md:gap-space-md">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
          ) : user ? (
            <div className="relative flex items-center gap-space-sm">
              <Link
                href={reserveHref}
                className="hidden sm:inline-flex items-center justify-center px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02]"
              >
                {user.role === "client" ? "Reservar Cita" : roleHome?.label || "Ir al panel"}
              </Link>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-label-sm text-label-md font-bold text-on-primary cursor-pointer"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Menú de usuario"
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-surface-container-high rounded-xl shadow-2xl p-space-sm flex flex-col gap-1 border border-surface-container-highest">
                  <span className="px-space-sm py-space-xs font-body-sm text-body-sm text-on-surface-variant truncate">
                    {user.name}
                  </span>
                  {user.role === "client" && (
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="px-space-sm py-space-xs rounded hover:bg-surface-container font-label-md text-label-md text-on-surface"
                    >
                      Mi perfil
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-space-sm py-space-xs rounded hover:bg-surface-container text-left font-label-md text-label-md text-error cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02]"
              >
                Reservar Cita
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
