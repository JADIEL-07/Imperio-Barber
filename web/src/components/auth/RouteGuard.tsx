"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole } from "@/types/auth";
import { Spinner } from "@/components/ui/Spinner";

interface RouteGuardProps {
  roles?: UserRole[];
  children: React.ReactNode;
}

/**
 * Protección de rutas por rol a nivel de UX. El backend es quien realmente
 * aplica los permisos (401/403); esto solo evita que un usuario sin sesión
 * o sin el rol adecuado vea una pantalla que de todas formas le fallará.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, loading, roles, router]);

  if (loading || !allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner label="Verificando sesión..." />
      </div>
    );
  }

  return <>{children}</>;
};
