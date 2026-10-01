const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Session cookie
  });

  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP Error ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).code = errorBody?.error?.code || "UNKNOWN_ERROR";
    throw error;
  }

  return response.json();
}
