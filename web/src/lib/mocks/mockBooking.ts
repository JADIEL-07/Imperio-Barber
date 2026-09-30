import {
  Barber,
  BarberSchedule,
  BarberTimeOff,
  Slot,
  Appointment,
  BookingSettings,
  StatsResponse,
  PageResponse,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from "@/types/booking";
import { mockServices } from "./mockCatalog";
import { mockCurrentUser } from "./mockAuth";

export const mockBarbers: Barber[] = [
  {
    id: "barber-1",
    name: "Mateo 'Fade Master' Silva",
    phone: "3001112233",
    is_active: true,
    services: mockServices,
  },
  {
    id: "barber-2",
    name: "Carlos Barber King",
    phone: "3004445566",
    is_active: true,
    services: mockServices,
  },
  {
    id: "barber-3",
    name: "Andrés Razor Craft",
    phone: "3007778899",
    is_active: true,
    services: mockServices,
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: "AUR-8921",
    client: {
      id: "user-client-1",
      name: "Jadiel Sierra",
      phone: "3004445566",
    },
    barber: {
      id: "barber-1",
      name: "Mateo 'Fade Master' Silva",
    },
    items: [
      { name: "Corte Signature Aura", duration_minutes: 45, price: 75000 },
      { name: "Ritual Afeitado Imperial", duration_minutes: 40, price: 60000 },
    ],
    start: "2026-10-24T11:15:00-05:00",
    end: "2026-10-24T12:40:00-05:00",
    total_price: 135000,
    status: "confirmed",
    can_cancel: true,
  },
  {
    id: "AUR-7840",
    client: {
      id: "user-client-1",
      name: "Jadiel Sierra",
      phone: "3004445566",
    },
    barber: {
      id: "barber-2",
      name: "Carlos Barber King",
    },
    items: [{ name: "Ritual Afeitado Imperial", duration_minutes: 40, price: 60000 }],
    start: "2026-09-12T10:00:00-05:00",
    end: "2026-09-12T10:40:00-05:00",
    total_price: 60000,
    status: "completed",
    can_cancel: false,
  },
];

export const mockBookingSettings: BookingSettings = {
  opening_hours: {
    "0": { open: "08:00", close: "21:00" },
    "1": { open: "08:00", close: "21:00" },
    "2": { open: "08:00", close: "21:00" },
    "3": { open: "08:00", close: "21:00" },
    "4": { open: "08:00", close: "21:00" },
    "5": { open: "08:00", close: "20:00" },
    "6": { open: "10:00", close: "18:00" },
  },
  cancel_min_hours: 2,
  slot_minutes: 15,
};

export const mockBookingApi = {
  async getBarbers(): Promise<Barber[]> {
    return mockBarbers;
  },

  async getAvailability(dateStr: string, barberId?: string, duration: number = 45): Promise<{ slots: Slot[] }> {
    const slots: Slot[] = [
      { start: `${dateStr}T10:00:00-05:00`, end: `${dateStr}T10:45:00-05:00`, barber_id: barberId || "barber-1" },
      { start: `${dateStr}T11:15:00-05:00`, end: `${dateStr}T12:00:00-05:00`, barber_id: barberId || "barber-1" },
      { start: `${dateStr}T15:00:00-05:00`, end: `${dateStr}T15:45:00-05:00`, barber_id: barberId || "barber-1" },
      { start: `${dateStr}T18:00:00-05:00`, end: `${dateStr}T18:45:00-05:00`, barber_id: barberId || "barber-1" },
    ];
    return { slots };
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    const newAppt: Appointment = {
      id: `AUR-${Math.floor(1000 + Math.random() * 9000)}`,
      client: {
        id: mockCurrentUser?.id || "user-client-1",
        name: mockCurrentUser?.name || "Cliente VIP",
        phone: mockCurrentUser?.phone || "3000000000",
      },
      barber: {
        id: payload.barber_id || "barber-1",
        name: "Mateo 'Fade Master' Silva",
      },
      items: [
        { name: "Corte Signature Aura", duration_minutes: 45, price: 75000 },
        { name: "Ritual Afeitado Imperial", duration_minutes: 40, price: 60000 },
      ],
      start: payload.start,
      end: payload.start,
      total_price: 135000,
      status: "confirmed",
      can_cancel: true,
    };
    mockAppointments.unshift(newAppt);
    return newAppt;
  },

  async listAppointments(scope: string = "mine", page: number = 1, page_size: number = 20): Promise<PageResponse<Appointment>> {
    return {
      items: mockAppointments.slice((page - 1) * page_size, page * page_size),
      total: mockAppointments.length,
      page,
      page_size,
    };
  },

  async updateAppointment(id: string, payload: UpdateAppointmentPayload): Promise<Appointment> {
    const appt = mockAppointments.find((a) => a.id === id);
    if (!appt) throw new Error("Cita no encontrada");
    if (payload.status) appt.status = payload.status;
    if (payload.start) appt.start = payload.start;
    return appt;
  },

  async getSettings(): Promise<BookingSettings> {
    return mockBookingSettings;
  },

  async getStats(): Promise<StatsResponse> {
    return {
      today_appointments: 14,
      status_counts: { confirmed: 10, completed: 3, cancelled: 1, no_show: 0 },
      month_revenue: 4850000,
      top_services: [
        { name: "Corte Signature Aura", count: 28 },
        { name: "Ritual Afeitado Imperial", count: 19 },
      ],
    };
  },
};
