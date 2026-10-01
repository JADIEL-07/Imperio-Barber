"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/empleados", label: "Empleados" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/combos", label: "Combos" },
  { href: "/admin/citas", label: "Citas" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export const AdminNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto bg-surface-container-high p-1 rounded-lg">
      {ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-space-md py-space-xs rounded font-label-md text-label-md whitespace-nowrap transition-all ${
              active
                ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
