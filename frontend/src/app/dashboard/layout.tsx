import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGate } from "@/components/auth-gate";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
