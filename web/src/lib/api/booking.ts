import { apiClient, USE_MOCKS } from "./client";
import { mockBookingApi } from "../mocks/mockBooking";
import {
  Barber,
  BarberSchedule,
  BarberTimeOff,
  CreateTimeOffPayload,
  Slot,
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  BookingSettings,
  UpdateBookingSettingsPayload,
  StatsResponse,
  PageResponse,
} from "@/types/booking";

export const bookingApi = {
  async getBarbers(): Promise<Barber[]> {
    if (USE_MOCKS) return mockBookingApi.getBarbers();
    return apiClient<Barber[]>("/bookings/barbers");
  },

  async getAvailability(
    dateStr: string,
    barberId?: string,
    serviceIds?: string[],
    comboId?: string,
    durationMinutes: number = 45
  ): Promise<{ slots: Slot[] }> {
    if (USE_MOCKS) return mockBookingApi.getAvailability(dateStr, barberId, durationMinutes);

    const params = new URLSearchParams({ date: dateStr, duration_minutes: durationMinutes.toString() });
    if (barberId) params.append("barber_id", barberId);
    if (serviceIds?.length) params.append("service_ids", serviceIds.join(","));
    if (comboId) params.append("combo_id", comboId);

    return apiClient<{ slots: Slot[] }>(`/bookings/availability?${params.toString()}`);
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    if (USE_MOCKS) return mockBookingApi.createAppointment(payload);
    return apiClient<Appointment>("/bookings/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listAppointments(
    scope: "mine" | "barber" | "all" = "mine",
    status?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PageResponse<Appointment>> {
    if (USE_MOCKS) return mockBookingApi.listAppointments(scope, page, pageSize);

    const params = new URLSearchParams({ scope, page: page.toString(), page_size: pageSize.toString() });
    if (status) params.append("status", status);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    return apiClient<PageResponse<Appointment>>(`/bookings/appointments?${params.toString()}`);
  },

  async updateAppointment(id: string, payload: UpdateAppointmentPayload): Promise<Appointment> {
    if (USE_MOCKS) return mockBookingApi.updateAppointment(id, payload);
    return apiClient<Appointment>(`/bookings/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getBarberSchedule(barberId: string): Promise<BarberSchedule[]> {
    return apiClient<BarberSchedule[]>(`/bookings/barbers/${barberId}/schedule`);
  },

  async updateBarberSchedule(barberId: string, schedules: BarberSchedule[]): Promise<BarberSchedule[]> {
    return apiClient<BarberSchedule[]>(`/bookings/barbers/${barberId}/schedule`, {
      method: "PUT",
      body: JSON.stringify(schedules),
    });
  },

  async listBarberTimeOffs(barberId: string): Promise<BarberTimeOff[]> {
    return apiClient<BarberTimeOff[]>(`/bookings/barbers/${barberId}/time-off`);
  },

  async addBarberTimeOff(barberId: string, payload: CreateTimeOffPayload): Promise<BarberTimeOff> {
    return apiClient<BarberTimeOff>(`/bookings/barbers/${barberId}/time-off`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteBarberTimeOff(barberId: string, timeOffId: string): Promise<void> {
    return apiClient<void>(`/bookings/barbers/${barberId}/time-off/${timeOffId}`, {
      method: "DELETE",
    });
  },

  async getSettings(): Promise<BookingSettings> {
    if (USE_MOCKS) return mockBookingApi.getSettings();
    return apiClient<BookingSettings>("/bookings/settings");
  },

  async updateSettings(payload: UpdateBookingSettingsPayload): Promise<BookingSettings> {
    return apiClient<BookingSettings>("/bookings/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async getStats(): Promise<StatsResponse> {
    if (USE_MOCKS) return mockBookingApi.getStats();
    return apiClient<StatsResponse>("/bookings/stats");
  },
};
