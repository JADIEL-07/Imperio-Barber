"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

const ROLE_REDIRECT: Record<string, string> = {
  client: "/mis-citas",
  employee: "/empleado/agenda",
  admin: "/admin",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto w-full px-margin py-space-xl"><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Ingresa un correo válido.";
    if (!password) errors.password = "La contraseña es obligatoria.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await authApi.login({ email, password });
      setUser(user);
      const target = searchParams.get("next") || ROLE_REDIRECT[user.role] || "/";
      router.push(target);
    } catch (err: any) {
      setServerError(err?.message || "No pudimos iniciar sesión. Verifica tus datos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs text-center">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Bienvenido de nuevo</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Inicia sesión</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high">
        {serverError && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="email" className="font-label-md text-label-md text-on-surface-variant">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.email && (
            <span id="email-error" className="font-label-xs text-label-xs text-error">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="password" className="font-label-md text-label-md text-on-surface-variant">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.password && (
            <span id="password-error" className="font-label-xs text-label-xs text-error">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-space-xs px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_14px_rgba(212,175,55,0.3)] transition-all disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
}
