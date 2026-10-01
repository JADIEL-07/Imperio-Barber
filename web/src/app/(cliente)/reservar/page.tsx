"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizardNav } from "@/components/booking/StepWizardNav";
import { StepServices } from "@/components/booking/StepServices";
import { StepBarbers } from "@/components/booking/StepBarbers";
import { StepDateTime } from "@/components/booking/StepDateTime";
import { StepConfirmation } from "@/components/booking/StepConfirmation";
import { InteractivePreview } from "@/components/booking/InteractivePreview";
import { ConflictToast } from "@/components/booking/ConflictToast";
import { ServiceItem, Barber } from "@/types/booking";
import { catalogApi } from "@/lib/api/catalog";
import { bookingApi } from "@/lib/api/booking";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

type LoadState = "loading" | "error" | "ready";

export default function ReservarPage() {
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [step, setStep] = useState<number>(1);
  const [monthIndex, setMonthIndex] = useState<number>(9);
  const [currentMonth, setCurrentMonth] = useState<string>("Octubre 2026");
  const [selectedDayNum, setSelectedDayNum] = useState<number>(24);
  const [selectedSlot, setSelectedSlot] = useState<string>("11:15 AM");
  const [isConflictOpen, setIsConflictOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"dual" | "mobile-only">("dual");

  const loadData = async () => {
    setLoadState("loading");
    try {
      const [catServices, loadedBarbers] = await Promise.all([
        catalogApi.getServices(),
        bookingApi.getBarbers(),
      ]);

      const mappedServices: ServiceItem[] = catServices.map((s, idx) => ({
        id: s.id,
        title: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration_minutes,
        checked: idx < 2,
      }));
      setServices(mappedServices);

      const mappedBarbers: Barber[] = loadedBarbers.map((b, idx) => ({
        id: b.id,
        name: b.name,
        role: idx === 0 ? "Senior" : idx === 1 ? "Master" : "Artista",
        detail: idx === 0 ? "Especialista en skin fade" : "Experto en navaja y diseño",
        rating: 4.95 + idx * 0.02,
        reviewsCount: 200 + idx * 100,
        location: "Bogotá Chicó",
      }));

      setBarbers([
        {
          id: "any",
          name: "Cualquiera disponible",
          role: "Inmediato",
          detail: "Próxima butaca libre sin tiempos de espera extra.",
        },
        ...mappedBarbers,
      ]);
      setSelectedBarber(mappedBarbers[0] || null);
      setLoadState("ready");
    } catch (err) {
      console.error("Error loading catalog/barbers:", err);
      setLoadState("error");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedServices = services.filter((s) => s.checked);
  const totalDuration = selectedServices.reduce((acc, curr) => acc + curr.duration, 0);
  const totalPrice = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

  const handleToggleService = (id: string) => {
    setServices((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s));
      const hasChecked = next.some((s) => s.checked);
      return hasChecked ? next : prev;
    });
  };

  const handleToggleMonth = (dir: "prev" | "next") => {
    if (dir === "next") {
      setMonthIndex(10);
      setCurrentMonth("Noviembre 2026");
    } else {
      setMonthIndex(9);
      setCurrentMonth("Octubre 2026");
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const monthNum = (monthIndex + 1).toString().padStart(2, "0");
      const dayNum = selectedDayNum.toString().padStart(2, "0");
      const [time, meridiem] = selectedSlot.split(" ");
      let [hourStr, minuteStr] = time.split(":");
      let hour = parseInt(hourStr, 10);
      if (meridiem === "PM" && hour !== 12) hour += 12;
      if (meridiem === "AM" && hour === 12) hour = 0;
      const startIso = `2026-${monthNum}-${dayNum}T${hour.toString().padStart(2, "0")}:${minuteStr}:00-05:00`;

      await bookingApi.createAppointment({
        barber_id: selectedBarber?.id === "any" ? undefined : selectedBarber?.id,
        start: startIso,
        service_ids: selectedServices.map((s) => s.id),
      });

      setIsSubmitting(false);
      setIsConfirmed(true);
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.status === 409 || err.code === "CONFLICT") {
        setIsConflictOpen(true);
        setStep(3);
      } else {
        console.error("Error creating appointment:", err);
      }
    }
  };

  const handleAdvance = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 120, behavior: "smooth" });
    } else {
      handleConfirmBooking();
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
        <ErrorState message="No pudimos cargar los servicios o barberos disponibles." onRetry={loadData} />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-margin py-space-xl">
        <EmptyState icon="content_cut" title="No hay servicios disponibles para reservar en este momento." />
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden bg-surface-container-lowest">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full bg-tertiary-container/10 blur-[120px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg md:py-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
          <div className="flex flex-col gap-space-xs">
            <div className="inline-flex items-center gap-space-xs text-primary font-label-xs text-label-xs uppercase tracking-[0.25em]">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Santuario Masculino • Bogotá Chicó Norte
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              Reserva de Autor
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Selecciona tu ritual, maestro de corte y horario preferido.
            </p>
          </div>

          <div className="flex items-center gap-space-xs bg-surface-container-high p-1 rounded-xl">
            <button
              onClick={() => setViewMode("dual")}
              className={`flex items-center gap-1.5 px-space-md py-space-xs rounded font-label-sm text-label-md transition-all cursor-pointer ${
                viewMode === "dual"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
              <span>Estación Dual</span>
            </button>
            <button
              onClick={() => setViewMode("mobile-only")}
              className={`flex items-center gap-1.5 px-space-md py-space-xs rounded font-label-sm text-label-md transition-all cursor-pointer ${
                viewMode === "mobile-only"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
              <span>Solo Smartphone</span>
            </button>
          </div>
        </div>

        <StepWizardNav currentStep={step} onStepClick={(s) => setStep(s)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          <div className={`${viewMode === "mobile-only" ? "hidden" : "lg:col-span-8 flex flex-col gap-space-lg"}`}>
            <ConflictToast isOpen={isConflictOpen} onDismiss={() => setIsConflictOpen(false)} />

            {step === 1 && (
              <StepServices services={services} onToggleService={handleToggleService} onNext={() => setStep(2)} />
            )}

            {step === 2 && (
              <StepBarbers
                barbers={barbers}
                selectedBarber={selectedBarber}
                onSelectBarber={(b) => setSelectedBarber(b)}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <StepDateTime
                monthIndex={monthIndex}
                currentMonth={currentMonth}
                selectedDayNum={selectedDayNum}
                selectedSlot={selectedSlot}
                onToggleMonth={handleToggleMonth}
                onSelectDay={(day) => setSelectedDayNum(day)}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  setIsConflictOpen(false);
                }}
                onTriggerConflict={() => setIsConflictOpen(true)}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <StepConfirmation
                selectedServices={selectedServices}
                selectedBarber={selectedBarber}
                selectedDate={`${selectedDayNum} de ${currentMonth}`}
                selectedSlot={selectedSlot}
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                isSubmitting={isSubmitting}
                isConfirmed={isConfirmed}
                onConfirm={handleConfirmBooking}
                onEditSchedule={() => setStep(3)}
                onViewMyBookings={() => router.push("/mis-citas")}
              />
            )}
          </div>

          <div className={`${viewMode === "mobile-only" ? "lg:col-span-12" : "lg:col-span-4"} flex flex-col gap-space-md`}>
            <InteractivePreview
              selectedServices={selectedServices}
              selectedBarber={selectedBarber}
              selectedSlot={selectedSlot}
              selectedDateText={`${selectedDayNum} ${monthIndex === 9 ? "Oct" : "Nov"}`}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
              onAdvance={handleAdvance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
