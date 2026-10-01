import { apiClient } from "./client";
import {
  Barber,
  BarberSchedule,
  BarberTimeOff,
  CreateTimeOffPayload,
  Slot,
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  UpdateBarberPayload,
  CommissionSummary,
  CommissionPayout,
  BookingSettings,
  UpdateBookingSettingsPayload,
  StatsResponse,
  PageResponse,
} from "@/types/booking";

// El backend devuelve el perfil del barbero en snake_case (avatar_url);
// aquí lo mapeamos una sola vez a la forma que usa la UI (imageUrl).
function mapBarber(raw: Barber & { avatar_url?: string | null }): Barber {
  const { avatar_url, ...rest } = raw;
  return { ...rest, imageUrl: avatar_url || rest.imageUrl };
}

export const bookingApi = {
  async getBarbers(): Promise<Barber[]> {
    const raw = await apiClient<Array<Barber & { avatar_url?: string | null }>>("/bookings/barbers");
    return raw.map(mapBarber);
  },

  async updateBarber(barberId: string, payload: UpdateBarberPayload): Promise<Barber> {
    const raw = await apiClient<Barber & { avatar_url?: string | null }>(`/bookings/barbers/${barberId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return mapBarber(raw);
  },

  async getAvailability(
    dateStr: string,
    barberId?: string,
    serviceIds?: string[],
    comboId?: string,
    durationMinutes: number = 45
  ): Promise<{ slots: Slot[] }> {
    const params = new URLSearchParams({ date: dateStr, duration_minutes: durationMinutes.toString() });
    if (barberId) params.append("barber_id", barberId);
    if (serviceIds?.length) params.append("service_ids", serviceIds.join(","));
    if (comboId) params.append("combo_id", comboId);

    return apiClient<{ slots: Slot[] }>(`/bookings/availability?${params.toString()}`);
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
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
    const params = new URLSearchParams({ scope, page: page.toString(), page_size: pageSize.toString() });
    if (status) params.append("status", status);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    return apiClient<PageResponse<Appointment>>(`/bookings/appointments?${params.toString()}`);
  },

  async updateAppointment(id: string, payload: UpdateAppointmentPayload): Promise<Appointment> {
    return apiClient<Appointment>(`/bookings/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async checkInAppointment(id: string): Promise<Appointment> {
    return apiClient<Appointment>(`/bookings/appointments/${id}/check-in`, {
      method: "POST",
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

  async getBarberCommissions(barberId: string): Promise<CommissionSummary> {
    return apiClient<CommissionSummary>(`/bookings/barbers/${barberId}/commissions`);
  },

  async payBarberCommissions(barberId: string): Promise<CommissionPayout> {
    return apiClient<CommissionPayout>(`/bookings/barbers/${barberId}/commissions/payout`, {
      method: "POST",
    });
  },

  async getSettings(): Promise<BookingSettings> {
    return apiClient<BookingSettings>("/bookings/settings");
  },

  async updateSettings(payload: UpdateBookingSettingsPayload): Promise<BookingSettings> {
    return apiClient<BookingSettings>("/bookings/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async getStats(): Promise<StatsResponse> {
    return apiClient<StatsResponse>("/bookings/stats");
  },
};
