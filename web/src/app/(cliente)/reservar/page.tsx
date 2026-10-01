"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/lib/api/catalog";
import { bookingApi } from "@/lib/api/booking";
import { Service, Combo } from "@/types/catalog";
import { Barber, Slot } from "@/types/booking";
import { formatCOP, formatTimeBogota, formatDateLongBogota } from "@/lib/format";
import { StepWizardNav } from "@/components/booking/StepWizardNav";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";
type SelectionMode = "services" | "combo";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservarPage() {
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [step, setStep] = useState(1);

  const [services, setServices] = useState<Service[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [mode, setMode] = useState<SelectionMode>("services");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);

  const [selectedBarberId, setSelectedBarberId] = useState<string>("any");

  const [date, setDate] = useState(todayISODate());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const loadCatalogAndBarbers = async () => {
    setLoadState("loading");
    try {
      const [svcs, cmbs, brbs] = await Promise.all([
        catalogApi.getServices(),
        catalogApi.getCombos(),
        bookingApi.getBarbers(),
      ]);
      setServices(svcs);
      setCombos(cmbs);
      setBarbers(brbs);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  };

  useEffect(() => {
    loadCatalogAndBarbers();
  }, []);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );
  const selectedCombo = useMemo(
    () => combos.find((c) => c.id === selectedComboId) || null,
    [combos, selectedComboId]
  );

  const totalDuration =
    mode === "combo" ? selectedCombo?.duration_minutes || 0 : selectedServices.reduce((a, s) => a + s.duration_minutes, 0);
  const totalPrice =
    mode === "combo" ? selectedCombo?.price || 0 : selectedServices.reduce((a, s) => a + s.price, 0);
  const hasSelection = mode === "combo" ? !!selectedCombo : selectedServices.length > 0;

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const loadSlots = async (d: string, barberId: string) => {
    if (!hasSelection || totalDuration <= 0) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const res = await bookingApi.getAvailability(
        d,
        barberId === "any" ? undefined : barberId,
        mode === "services" ? selectedServiceIds : undefined,
        mode === "combo" ? selectedComboId || undefined : undefined,
        totalDuration
      );
      setSlots(res.slots);
    } catch {
      setSlotsError("No pudimos cargar los turnos disponibles.");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3) loadSlots(date, selectedBarberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, date, selectedBarberId]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookingApi.createAppointment({
        barber_id: selectedBarberId === "any" ? undefined : selectedBarberId,
        start: selectedSlot.start,
        service_ids: mode === "services" ? selectedServiceIds : undefined,
        combo_id: mode === "combo" ? selectedComboId || undefined : undefined,
      });
      setConfirmed(true);
    } catch (err: any) {
      if (err?.status === 409) {
        setSubmitError("Esa franja se acaba de ocupar por otro cliente. Elige otra.");
        setStep(3);
        loadSlots(date, selectedBarberId);
      } else {
        setSubmitError(err?.message || "No pudimos confirmar tu cita. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-margin py-space-xl">
        <Spinner label="Cargando carta y maestros disponibles..." />
      </div>
    );
  }
  if (loadState === "error") {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-margin py-space-xl">
        <ErrorState message="No pudimos cargar los servicios o barberos disponibles." onRetry={loadCatalogAndBarbers} />
      </div>
    );
  }
  if (services.length === 0 && combos.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-margin py-space-xl">
        <EmptyState icon="content_cut" title="No hay servicios disponibles para reservar en este momento." />
      </div>
    );
  }

  const allBarberOptions: Array<Barber & { isAny?: boolean }> = [
    { id: "any", name: "Cualquiera disponible", detail: "Próxima butaca libre, sin tiempos de espera extra.", isAny: true },
    ...barbers,
  ];
  const selectedBarber = allBarberOptions.find((b) => b.id === selectedBarberId) || null;

  return (
    <div className="w-full relative overflow-hidden bg-surface-container-lowest">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full bg-tertiary-container/10 blur-[100px] pointer-events-none" />

      <div className="max-w-[900px] mx-auto px-margin md:px-margin-tablet py-space-lg md:py-space-xl relative">
        <div className="flex flex-col gap-space-xs mb-space-lg">
          <div className="inline-flex items-center gap-space-xs text-primary font-label-caps text-label-caps uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Reserva en línea
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface tracking-tight">
            Reserva tu experiencia
          </h1>
        </div>

        <StepWizardNav currentStep={step} onStepClick={(s) => setStep(s)} />

        {/* Paso 1: servicios o combo */}
        {step === 1 && (
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs bg-surface-container-high p-1 rounded-lg w-fit">
              <button
                onClick={() => setMode("services")}
                className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
                  mode === "services" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
                }`}
              >
                Servicios individuales
              </button>
              <button
                onClick={() => setMode("combo")}
                className={`px-space-md py-space-xs rounded font-label-md text-label-md transition-all cursor-pointer ${
                  mode === "combo" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
                }`}
              >
                Combos
              </button>
            </div>

            {mode === "services" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {services.map((s) => {
                  const checked = selectedServiceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border ${
                        checked ? "border-primary/50 bg-surface-container/60" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-space-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(s.id)}
                          className="accent-primary-container w-5 h-5 rounded mt-0.5"
                        />
                        <div>
                          <h3 className="font-title-md text-title-md font-bold text-on-surface">{s.name}</h3>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{s.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-space-md pt-space-xs">
                        <span className="font-label-xs text-label-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {s.duration_minutes} min
                        </span>
                        <span className="font-data-mono text-data-mono font-bold text-primary">{formatCOP(s.price)}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {mode === "combo" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {combos.map((c) => {
                  const checked = selectedComboId === c.id;
                  return (
                    <label
                      key={c.id}
                      className={`flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border ${
                        checked ? "border-primary/50 bg-surface-container/60" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-space-sm">
                        <input
                          type="radio"
                          name="combo"
                          checked={checked}
                          onChange={() => setSelectedComboId(c.id)}
                          className="accent-primary-container w-5 h-5 mt-0.5"
                        />
                        <div>
                          {c.savings > 0 && (
                            <div className="inline-block bg-primary/20 text-primary font-label-xs text-label-xs px-2 py-0.5 rounded uppercase mb-1 font-bold">
                              Ahorras {formatCOP(c.savings)}
                            </div>
                          )}
                          <h3 className="font-title-md text-title-md font-bold text-on-surface">{c.name}</h3>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{c.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-space-md pt-space-xs">
                        <span className="font-label-xs text-label-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {c.duration_minutes} min
                        </span>
                        <span className="font-data-mono text-data-mono font-bold text-primary">{formatCOP(c.price)}</span>
                      </div>
                    </label>
                  );
                })}
                {combos.length === 0 && <EmptyState icon="local_offer" title="No hay combos disponibles" />}
              </div>
            )}

            <div className="flex items-center justify-end gap-space-md mt-space-md">
              <button
                onClick={() => setStep(2)}
                disabled={!hasSelection}
                className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_14px_rgba(212,175,55,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continuar a Selección de Barbero</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: barbero */}
        {step === 2 && (
          <div className="flex flex-col gap-space-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {allBarberOptions.map((b) => {
                const isSelected = selectedBarberId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBarberId(b.id)}
                    className={`cursor-pointer p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between border ${
                      isSelected ? "border-primary shadow-[0_0_16px_rgba(212,175,55,0.2)] bg-surface-container" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-space-md">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-[26px]">{b.isAny ? "bolt" : "person"}</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <h4 className="font-title-md text-title-md font-bold text-on-surface">{b.name}</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{b.detail || "Especialista en barbería de autor"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-space-md mt-space-md">
              <button
                onClick={() => setStep(1)}
                className="px-space-md py-space-sm text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Regresar
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_14px_rgba(212,175,55,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar a Calendario</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: fecha y hora */}
        {step === 3 && (
          <div className="flex flex-col gap-space-md">
            {submitError && (
              <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-space-xs max-w-xs">
              <label htmlFor="booking-date" className="font-label-md text-label-md text-on-surface-variant">
                Fecha
              </label>
              <input
                id="booking-date"
                type="date"
                min={todayISODate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-space-sm py-space-sm rounded-lg bg-surface-container-low text-on-surface border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant">Turnos disponibles</span>
              {slotsLoading && <Spinner label="Buscando turnos..." />}
              {!slotsLoading && slotsError && <ErrorState message={slotsError} onRetry={() => loadSlots(date, selectedBarberId)} />}
              {!slotsLoading && !slotsError && slots.length === 0 && (
                <EmptyState icon="event_busy" title="No hay turnos disponibles ese día" description="Prueba con otra fecha o con otro barbero." />
              )}
              {!slotsLoading && !slotsError && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-space-xs">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg text-center font-title-sm text-title-sm font-bold transition-all cursor-pointer ${
                        selectedSlot?.start === slot.start
                          ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {formatTimeBogota(slot.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-space-md mt-space-md">
              <button
                onClick={() => setStep(2)}
                className="px-space-md py-space-sm text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Regresar
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedSlot}
                className="px-space-xl py-space-sm bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_14px_rgba(212,175,55,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Ver Resumen</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Paso 4: confirmación */}
        {step === 4 && !confirmed && selectedSlot && (
          <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md shadow-xl">
            {submitError && (
              <div role="alert" className="p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md pb-space-md border-b border-surface-container-high">
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Especialista</span>
                <span className="font-title-md text-title-md font-bold text-primary mt-1">{selectedBarber?.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Fecha y hora</span>
                <span className="font-title-md text-title-md font-bold text-on-surface mt-1">{formatDateLongBogota(selectedSlot.start)}</span>
                <span className="font-data-mono text-data-mono text-primary">
                  {formatTimeBogota(selectedSlot.start)} - {formatTimeBogota(selectedSlot.end)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase">Duración total</span>
                <span className="font-title-md text-title-md font-bold text-on-surface mt-1">{totalDuration} min</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-title-sm text-title-sm font-bold text-on-surface">
                {mode === "combo" ? "Combo seleccionado" : "Servicios seleccionados"}
              </span>
              {(mode === "combo" && selectedCombo ? selectedCombo.services : selectedServices).map((s) => (
                <div key={s.id} className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface">{s.name}</span>
                  <span className="text-on-surface-variant">{formatCOP(s.price)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-space-sm border-t border-surface-container-high font-headline-sm text-headline-sm font-bold text-on-surface">
              <span>Total a pagar</span>
              <span className="text-primary font-data-mono">{formatCOP(totalPrice)}</span>
            </div>

            <div className="flex items-center gap-space-md">
              <button
                onClick={() => setStep(3)}
                className="px-space-md py-space-sm text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Editar
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-space-md bg-gradient-to-r from-primary-container to-secondary text-on-primary font-headline-sm text-headline-sm font-bold rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all flex items-center justify-center gap-space-sm cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">verified</span>
                <span>{submitting ? "Confirmando..." : "Confirmar y Reservar"}</span>
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <div className="p-space-lg rounded-xl bg-surface-container flex flex-col items-center text-center gap-space-sm shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.5)]">
              <span className="material-symbols-outlined text-[32px]">check</span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">¡Cita Agendada con Éxito!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              Te esperamos en Imperio Barber. Revisa el boleto con código QR en "Mis Citas" para hacer check-in al llegar.
            </p>
            <button
              onClick={() => router.push("/mis-citas")}
              className="mt-space-sm px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-bold cursor-pointer"
            >
              Ver Mis Citas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
