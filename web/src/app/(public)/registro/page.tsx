"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthContext";

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function RegistroPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "El nombre es obligatorio.";
    if (!form.email.trim()) errors.email = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Ingresa un correo válido.";
    if (!form.phone.trim()) errors.phone = "El teléfono es obligatorio.";
    if (form.password.length < 8) errors.password = "Mínimo 8 caracteres.";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "Las contraseñas no coinciden.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      // El registro no abre sesión; iniciamos sesión automáticamente para mejor UX.
      const user = await authApi.login({ email: form.email.trim(), password: form.password });
      setUser(user);
      router.push("/mis-citas");
    } catch (err: any) {
      setServerError(err?.message || "No pudimos crear tu cuenta. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const fields: Array<{ key: keyof FormState; label: string; type: string; autoComplete: string }> = [
    { key: "name", label: "Nombre completo", type: "text", autoComplete: "name" },
    { key: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
    { key: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
    { key: "password", label: "Contraseña", type: "password", autoComplete: "new-password" },
    { key: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password" },
  ];

  return (
    <div className="max-w-md mx-auto w-full px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs text-center">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Únete al club</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Crea tu cuenta</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl border border-surface-container-high">
        {serverError && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {serverError}
          </div>
        )}

        {fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-space-xs">
            <label htmlFor={f.key} className="font-label-md text-label-md text-on-surface-variant">
              {f.label}
            </label>
            <input
              id={f.key}
              type={f.type}
              autoComplete={f.autoComplete}
              value={form[f.key]}
              onChange={update(f.key)}
              aria-invalid={!!fieldErrors[f.key]}
              aria-describedby={fieldErrors[f.key] ? `${f.key}-error` : undefined}
              className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors[f.key] && (
              <span id={`${f.key}-error`} className="font-label-xs text-label-xs text-error">
                {fieldErrors[f.key]}
              </span>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="mt-space-xs px-space-md py-space-sm bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary-container font-label-lg text-label-lg rounded font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "Creando cuenta..." : "Registrarme"}
        </button>

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
