import { Service, Combo } from "@/types/catalog";

export const mockServices: Service[] = [
  {
    id: "srv-1",
    name: "Corte Signature Aura",
    description: "Diagnóstico capilar + fade con tijera + toalla fría",
    duration_minutes: 45,
    price: 75000,
    is_active: true,
  },
  {
    id: "srv-2",
    name: "Ritual Afeitado Imperial",
    description: "Vapor ozono + navaja artesanal + bálsamo sándalo",
    duration_minutes: 40,
    price: 60000,
    is_active: true,
  },
  {
    id: "srv-3",
    name: "Camuflaje de Canas & Barba",
    description: "Pigmentación sutil antiedad sin amoníaco",
    duration_minutes: 30,
    price: 55000,
    is_active: true,
  },
];

export const mockCombos: Combo[] = [
  {
    id: "combo-1",
    name: "Combo Presidencial Black",
    description: "Corte de autor + barba spa + exfoliación volcánica",
    services: [mockServices[0], mockServices[1]],
    price: 120000,
    duration_minutes: 85,
    savings: 15000,
    is_active: true,
  },
];

export const mockCatalogApi = {
  async getServices(all: boolean = false): Promise<Service[]> {
    return all ? mockServices : mockServices.filter((s) => s.is_active);
  },
  async getCombos(all: boolean = false): Promise<Combo[]> {
    return all ? mockCombos : mockCombos.filter((c) => c.is_active);
  },
};
