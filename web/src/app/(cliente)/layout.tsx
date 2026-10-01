import { RouteGuard } from "@/components/auth/RouteGuard";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard roles={["client"]}>{children}</RouteGuard>;
}
