import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <AuthForm mode="register" />
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-white underline decoration-action decoration-2 underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
