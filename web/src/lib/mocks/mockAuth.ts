import { User, PageResponse } from "@/types/auth";

export const mockUsers: User[] = [
  {
    id: "user-admin-1",
    name: "Administrador General",
    email: "admin@imperiobarber.com",
    phone: "3109876543",
    role: "admin",
    is_active: true,
  },
  {
    id: "user-employee-1",
    name: "Mateo 'Fade Master' Silva",
    email: "mateo@imperiobarber.com",
    phone: "3001112233",
    role: "employee",
    is_active: true,
  },
  {
    id: "user-client-1",
    name: "Jadiel Sierra",
    email: "sierrajadiel07@gmail.com",
    phone: "3004445566",
    role: "client",
    is_active: true,
  },
];

export let mockCurrentUser: User | null = mockUsers[2];

export const mockAuthApi = {
  async register(payload: { name: string; email: string; phone?: string; password: string }): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      role: "client",
      is_active: true,
    };
    mockUsers.push(newUser);
    mockCurrentUser = newUser;
    return newUser;
  },

  async login(payload: { email: string; password: string }): Promise<User> {
    const user = mockUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      throw new Error("Credenciales inválidas: correo o contraseña incorrectos");
    }
    mockCurrentUser = user;
    return user;
  },

  async logout(): Promise<void> {
    mockCurrentUser = null;
  },

  async me(): Promise<User> {
    if (!mockCurrentUser) {
      throw new Error("No autenticado");
    }
    return mockCurrentUser;
  },

  async updateMe(payload: { name?: string; phone?: string }): Promise<User> {
    if (!mockCurrentUser) throw new Error("No autenticado");
    if (payload.name) mockCurrentUser.name = payload.name;
    if (payload.phone) mockCurrentUser.phone = payload.phone;
    return mockCurrentUser;
  },

  async listUsers(role?: string, search?: string, page: number = 1, page_size: number = 20): Promise<PageResponse<User>> {
    let filtered = [...mockUsers];
    if (role) filtered = filtered.filter((u) => u.role === role);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    return {
      items: filtered.slice((page - 1) * page_size, page * page_size),
      total: filtered.length,
      page,
      page_size,
    };
  },
};
