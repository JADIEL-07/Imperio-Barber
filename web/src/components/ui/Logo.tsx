import React from "react";

interface LogoMarkProps {
  className?: string;
}

/**
 * Monograma de la marca: una "A" (de AURA) geométrica cuyo travesaño está
 * estilizado como una navaja recta de barbero, en línea con el motivo de
 * "ritual de afeitado" / "navaja artesanal" del resto de la marca.
 * Se dibuja con `fill="currentColor"` para heredar el color de texto
 * (normalmente `text-primary`) de donde se use.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ className = "" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <polygon points="16,3 3,29 10,29 16,16" />
    <polygon points="16,3 29,29 22,29 16,16" />
    <polygon points="2,20.5 7,17.5 25,17.5 30,20.5 25,23.5 7,23.5" />
  </svg>
);
