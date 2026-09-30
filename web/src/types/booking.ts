import { Service } from "./catalog";

export interface Barber {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  services?: Service[];
}

export interface BarberSchedule {
  weekday: number; // 0-6
  start: string;   // "08:00"
  end: string;     // "20:00"
}

export interface BarberTimeOff {
  id: string;
  from: string;    // ISO 8601
  to: string;      // ISO 8601
  reason: string;
}

export interface CreateTimeOffPayload {
  from: string;
  to: string;
  reason: string;
}

export interface Slot {
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  barber_id: string;
}

export interface AvailabilityResponse {
  slots: Slot[];
}

export interface AppointmentItem {
  name: string;
  duration_minutes: number;
  price: number;
}

export interface ClientRef {
  id: string;
  name: string;
  phone: string;
}

export interface BarberRef {
  id: string;
  name: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  client: ClientRef;
  barber: BarberRef;
  items: AppointmentItem[];
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  total_price: number;
  status: AppointmentStatus;
  can_cancel: boolean;
}

export interface CreateAppointmentPayload {
  barber_id?: string;
  start: string;
  service_ids?: string[];
  combo_id?: string;
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus;
  start?: string;
}

export interface BookingSettings {
  opening_hours: Record<string, { open: string; close: string }>;
  cancel_min_hours: number;
  slot_minutes: number;
}

export interface UpdateBookingSettingsPayload {
  opening_hours?: Record<string, { open: string; close: string }>;
  cancel_min_hours?: number;
  slot_minutes?: number;
}

export interface StatsResponse {
  today_appointments: number;
  status_counts: Record<string, number>;
  month_revenue: number;
  top_services: Array<{ name: string; count: number }>;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
