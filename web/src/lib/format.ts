export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTimeBogota(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    ...opts,
  }).format(new Date(iso));
}

export function formatDateBogota(iso: string): string {
  return formatDateTimeBogota(iso, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateLongBogota(iso: string): string {
  return formatDateTimeBogota(iso, { day: "2-digit", month: "long", year: "numeric" });
}

export function formatTimeBogota(iso: string): string {
  return formatDateTimeBogota(iso, { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatTimeRangeBogota(startIso: string, endIso: string): string {
  return `${formatTimeBogota(startIso)} - ${formatTimeBogota(endIso)}`;
}

export function formatDayNumberBogota(iso: string): string {
  return formatDateTimeBogota(iso, { day: "2-digit" });
}

export function formatMonthShortBogota(iso: string): string {
  return formatDateTimeBogota(iso, { month: "short" }).replace(".", "").toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

const WEEKDAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? `Día ${weekday}`;
}
