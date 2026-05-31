import { ProtectedRoute } from "@/components/protected-route";
import { RouteGuard } from "@/components/route-guard";
import { DashboardLayout } from "@/layouts/dashboard-layout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <RouteGuard>{children}</RouteGuard>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
