import { fetchApi } from "./apiClient";
import { Barber } from "../types/booking";

export const usersService = {
  async getBarbers(): Promise<Barber[]> {
    return fetchApi<Barber[]>("/api/v1/users/barbers");
  },
  async getBarberById(id: string): Promise<Barber> {
    return fetchApi<Barber>(`/api/v1/users/barbers/${id}`);
  },
};
