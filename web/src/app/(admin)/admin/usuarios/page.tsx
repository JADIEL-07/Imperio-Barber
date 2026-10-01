"use client";

import React, { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { User, UserRole } from "@/types/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";
const PAGE_SIZE = 10;

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  employee: "Empleado",
  client: "Cliente",
};

interface ModalState {
  mode: "create" | "edit";
  user?: User;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const res = await authApi.listUsers(roleFilter || undefined, search || undefined, page, PAGE_SIZE);
      setUsers(res.items);
      setTotal(res.total);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleToggleActive = async (user: User) => {
    setActionError(null);
    try {
      const updated = await authApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      setActionError(err?.message || "No pudimos actualizar el usuario.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-md">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Panel Administrador</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Usuarios</h1>
      </div>

      <AdminNav />

      {actionError && (
        <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
          {actionError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-space-sm items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-space-xs flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="flex-1 px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="px-space-md py-space-xs rounded bg-surface-container-high text-on-surface cursor-pointer">
            Buscar
          </button>
        </form>
        <div className="flex gap-space-xs items-center">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface border border-surface-container-high"
          >
            <option value="">Todos los roles</option>
            <option value="client">Cliente</option>
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer whitespace-nowrap"
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      {state === "loading" && <Spinner />}
      {state === "error" && <ErrorState onRetry={load} />}
      {state === "ready" && users.length === 0 && <EmptyState icon="group" title="No se encontraron usuarios" />}

      {state === "ready" && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-surface-container-high">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Nombre</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Correo</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Rol</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Estado</th>
                <th className="p-space-sm font-label-xs text-label-xs text-on-surface-variant uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-surface-container-high bg-surface-container-low">
                  <td className="p-space-sm font-body-sm text-body-sm text-on-surface">{u.name}</td>
                  <td className="p-space-sm font-body-sm text-body-sm text-on-surface-variant">{u.email}</td>
                  <td className="p-space-sm font-body-sm text-body-sm text-on-surface">{ROLE_LABEL[u.role]}</td>
                  <td className="p-space-sm">
                    <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded font-bold uppercase ${u.is_active ? "bg-primary/20 text-primary" : "bg-error-container/40 text-on-error-container"}`}>
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <button
                        onClick={() => setModal({ mode: "edit", user: u })}
                        className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-md cursor-pointer"
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state === "ready" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-space-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface disabled:opacity-40 cursor-pointer"
          >
            Anterior
          </button>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface disabled:opacity-40 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}

      {modal && (
        <UserModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={(user) => {
            setModal(null);
            if (modal.mode === "create") {
              setPage(1);
              load();
            } else {
              setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
            }
          }}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  modal: ModalState;
  onClose: () => void;
  onSaved: (user: User) => void;
}

function UserModal({ modal, onClose, onSaved }: UserModalProps) {
  const editing = modal.mode === "edit" && modal.user;
  const [name, setName] = useState(editing ? modal.user!.name : "");
  const [email, setEmail] = useState(editing ? modal.user!.email : "");
  const [phone, setPhone] = useState(editing ? modal.user!.phone : "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(editing ? modal.user!.role : "client");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (modal.mode === "create") {
        if (!name.trim() || !email.trim() || !phone.trim() || !password) {
          setError("Todos los campos son obligatorios.");
          setSubmitting(false);
          return;
        }
        const created = await authApi.createUser({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, role });
        onSaved(created);
      } else {
        const updated = await authApi.updateUser(modal.user!.id, { name: name.trim(), phone: phone.trim(), role });
        onSaved(updated);
      }
    } catch (err: any) {
      setError(err?.message || "No pudimos guardar el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-space-md" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface-container-high rounded-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h4 className="font-title-md text-title-md font-bold text-on-surface">
            {modal.mode === "create" ? "Nuevo usuario" : "Editar usuario"}
          </h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-black/20 rounded cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Correo</label>
          <input
            type="email"
            value={email}
            disabled={modal.mode === "edit"}
            onChange={(e) => setEmail(e.target.value)}
            className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
        </div>

        {modal.mode === "create" && (
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface-variant">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest" />
          </div>
        )}

        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-label-md text-on-surface-variant">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface border border-surface-container-highest">
            <option value="client">Cliente</option>
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button type="button" onClick={onClose} className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-label-sm text-label-md cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-md font-bold cursor-pointer disabled:opacity-50">
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
