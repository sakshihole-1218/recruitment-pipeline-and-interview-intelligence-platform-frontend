import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="p-6">{children}</section>
    </main>
  );
}