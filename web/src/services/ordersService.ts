import { fetchApi } from "./apiClient";
import { ServiceItem, AppointmentRecord } from "../types/booking";

export interface CreateBookingPayload {
  serviceIds: string[];
  barberId: string;
  date: string;
  timeSlot: string;
  totalPrice: number;
}

export interface BookingResponse {
  id: string;
  bookingCode: string;
  status: string;
  createdAt: string;
}

export const ordersService = {
  async getServicesCatalog(): Promise<ServiceItem[]> {
    return fetchApi<ServiceItem[]>("/api/v1/orders/services");
  },
  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    return fetchApi<BookingResponse>("/api/v1/orders/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getMyAppointments(): Promise<AppointmentRecord[]> {
    return fetchApi<AppointmentRecord[]>("/api/v1/orders/bookings/me");
  },
  async rescheduleBooking(bookingId: string, newDateTime: string): Promise<{ success: boolean }> {
    return fetchApi(`/api/v1/orders/bookings/${bookingId}/reschedule`, {
      method: "PUT",
      body: JSON.stringify({ newDateTime }),
    });
  },
  async cancelBooking(bookingId: string): Promise<{ success: boolean }> {
    return fetchApi(`/api/v1/orders/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
  },
};
