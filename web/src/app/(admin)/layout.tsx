import { RouteGuard } from "@/components/auth/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard roles={["admin"]}>{children}</RouteGuard>;
}
