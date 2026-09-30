export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  services: Service[];
  price: number;
  duration_minutes: number;
  savings: number;
  is_active: boolean;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_active?: boolean;
}

export interface CreateComboPayload {
  name: string;
  description?: string;
  service_ids: string[];
  price: number;
  is_active?: boolean;
}

export interface UpdateComboPayload {
  name?: string;
  description?: string;
  service_ids?: string[];
  price?: number;
  is_active?: boolean;
}
