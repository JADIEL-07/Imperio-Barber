import { apiClient } from "./client";
import {
  User,
  RegisterPayload,
  LoginPayload,
  UpdateMePayload,
  CreateUserPayload,
  UpdateUserPayload,
  PageResponse,
} from "@/types/auth";

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    return apiClient<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: LoginPayload): Promise<User> {
    return apiClient<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<void> {
    return apiClient<void>("/auth/logout", {
      method: "POST",
    });
  },

  async me(): Promise<User> {
    return apiClient<User>("/auth/me");
  },

  async updateMe(payload: UpdateMePayload): Promise<User> {
    return apiClient<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async listUsers(role?: string, search?: string, page: number = 1, page_size: number = 20): Promise<PageResponse<User>> {
    const params = new URLSearchParams({ page: page.toString(), page_size: page_size.toString() });
    if (role) params.append("role", role);
    if (search) params.append("search", search);
    return apiClient<PageResponse<User>>(`/auth/users?${params.toString()}`);
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    return apiClient<User>("/auth/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
    return apiClient<User>(`/auth/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
