import { apiClient, USE_MOCKS } from "./client";
import { mockAuthApi } from "../mocks/mockAuth";
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
    if (USE_MOCKS) return mockAuthApi.register(payload);
    return apiClient<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: LoginPayload): Promise<User> {
    if (USE_MOCKS) return mockAuthApi.login(payload);
    return apiClient<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<void> {
    if (USE_MOCKS) return mockAuthApi.logout();
    return apiClient<void>("/auth/logout", {
      method: "POST",
    });
  },

  async me(): Promise<User> {
    if (USE_MOCKS) return mockAuthApi.me();
    return apiClient<User>("/auth/me");
  },

  async updateMe(payload: UpdateMePayload): Promise<User> {
    if (USE_MOCKS) return mockAuthApi.updateMe(payload);
    return apiClient<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async listUsers(role?: string, search?: string, page: number = 1, page_size: number = 20): Promise<PageResponse<User>> {
    if (USE_MOCKS) return mockAuthApi.listUsers(role, search, page, page_size);
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
