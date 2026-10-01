import { RouteGuard } from "@/components/auth/RouteGuard";

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard roles={["employee"]}>{children}</RouteGuard>;
}
