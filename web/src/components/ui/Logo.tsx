import React from "react";

interface LogoMarkProps {
  className?: string;
}

/**
 * Marca de Imperio Barber: estrella/escudo de 8 puntas tomada del logo real
 * exportado del diseño (imperio_barber_logo/code.html), no un placeholder.
 * Se dibuja con `fill="currentColor"` para heredar el color de texto
 * (normalmente `text-primary`) de donde se use.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ className = "" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20 5 L24 14 L33 11 L29 22 L36 30 L25 31 L20 40 L15 31 L4 30 L11 22 L7 11 L16 14 Z" />
  </svg>
);
