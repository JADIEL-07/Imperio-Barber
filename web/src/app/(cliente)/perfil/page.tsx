"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authApi } from "@/lib/api/auth";
import { Spinner } from "@/components/ui/Spinner";

export default function PerfilPage() {
  const { user, loading, setUser } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="max-w-xl mx-auto w-full px-margin py-space-xl">
        <Spinner />
      </div>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "El nombre es obligatorio.";
    if (!phone.trim()) errors.phone = "El teléfono es obligatorio.";
    if (password && password.length < 8) errors.password = "Mínimo 8 caracteres.";
    if (password && password !== confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const updated = await authApi.updateMe({
        name: name.trim(),
        phone: phone.trim(),
        ...(password ? { password } : {}),
      });
      setUser(updated);
      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("Tu perfil se actualizó correctamente.");
    } catch (err: any) {
      setServerError(err?.message || "No pudimos actualizar tu perfil.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Cuenta</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Mi Perfil</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high">
        {serverError && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div role="status" className="p-space-sm rounded-lg bg-primary/15 text-primary font-body-sm text-body-sm">
            {successMessage}
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="email" className="font-label-md text-label-md text-on-surface-variant">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="px-space-sm py-space-sm rounded-lg bg-surface-container-high text-on-surface-variant border border-surface-container-high cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="name" className="font-label-md text-label-md text-on-surface-variant">
            Nombre completo
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.name && <span className="font-label-xs text-label-xs text-error">{fieldErrors.name}</span>}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="phone" className="font-label-md text-label-md text-on-surface-variant">
            Teléfono
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.phone && <span className="font-label-xs text-label-xs text-error">{fieldErrors.phone}</span>}
        </div>

        <div className="h-px bg-surface-container-high my-space-xs" />

        <span className="font-label-md text-label-md text-on-surface-variant">Cambiar contraseña (opcional)</span>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="password" className="font-label-md text-label-md text-on-surface-variant">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.password && <span className="font-label-xs text-label-xs text-error">{fieldErrors.password}</span>}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="confirmPassword" className="font-label-md text-label-md text-on-surface-variant">
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.confirmPassword && (
            <span className="font-label-xs text-label-xs text-error">{fieldErrors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-space-xs px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
