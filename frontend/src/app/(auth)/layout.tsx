import { AuthShell } from "@/components/layout/auth-shell";
import { AuthGate } from "@/components/auth-gate";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate mode="guest">
      <AuthShell>{children}</AuthShell>
    </AuthGate>
  );
}
