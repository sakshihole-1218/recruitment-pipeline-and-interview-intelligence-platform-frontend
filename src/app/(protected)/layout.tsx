import { ProtectedRoute } from "@/shared/components/protected-route";
import { RouteGuard } from "@/shared/components/route-guard";
import { DashboardLayout } from "@/shared/layouts/dashboard-layout";

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
