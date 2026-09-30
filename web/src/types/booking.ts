export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  badge?: string;
  checked?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  detail: string;
  rating?: number;
  reviewsCount?: number;
  location?: string;
  imageUrl?: string;
  isAvailableNow?: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  statusLabel?: string;
}

export interface BookingState {
  step: number;
  selectedServices: ServiceItem[];
  selectedBarber: Barber | null;
  selectedDate: string;
  selectedDayNum: number;
  monthIndex: number;
  currentMonth: string;
  selectedSlot: string;
  isSubmitting: boolean;
  isConfirmed: boolean;
  bookingCode?: string;
}

export interface AppointmentRecord {
  id: string;
  bookingCode: string;
  day: number;
  month: string;
  servicesTitle: string;
  timeRange: string;
  barberName: string;
  totalPrice: number;
  status: "confirmada" | "completada" | "cancelada";
}
