import { apiClient } from "./client";
import {
  Service,
  Combo,
  CreateServicePayload,
  UpdateServicePayload,
  CreateComboPayload,
  UpdateComboPayload,
} from "@/types/catalog";

export const catalogApi = {
  async getServices(all: boolean = false): Promise<Service[]> {
    const url = all ? "/catalog/services?all=true" : "/catalog/services";
    return apiClient<Service[]>(url);
  },

  async createService(payload: CreateServicePayload): Promise<Service> {
    return apiClient<Service>("/catalog/services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateService(id: string, payload: UpdateServicePayload): Promise<Service> {
    return apiClient<Service>(`/catalog/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getCombos(all: boolean = false): Promise<Combo[]> {
    const url = all ? "/catalog/combos?all=true" : "/catalog/combos";
    return apiClient<Combo[]>(url);
  },

  async createCombo(payload: CreateComboPayload): Promise<Combo> {
    return apiClient<Combo>("/catalog/combos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateCombo(id: string, payload: UpdateComboPayload): Promise<Combo> {
    return apiClient<Combo>(`/catalog/combos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
