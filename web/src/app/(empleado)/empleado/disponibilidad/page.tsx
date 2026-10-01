"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ScheduleManager } from "@/components/scheduling/ScheduleManager";
import { Spinner } from "@/components/ui/Spinner";

export default function DisponibilidadPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="max-w-[1000px] mx-auto w-full px-margin py-space-xl">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto w-full px-margin md:px-margin-tablet py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-0.5">
        <span className="font-label-xs text-label-xs text-primary uppercase tracking-widest">Panel Barbero</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Mi Disponibilidad</h1>
      </div>

      <ScheduleManager barberId={user.id} />
    </div>
  );
}
