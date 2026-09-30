import { fetchApi } from "./apiClient";

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getProfile(): Promise<AuthResponse["user"]> {
    return fetchApi("/api/v1/auth/me");
  },
};
