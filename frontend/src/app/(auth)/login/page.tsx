import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";

export default function Page() {
  return (
    <div className="space-y-6">
      <AuthForm mode="login" />
      <p className="text-center text-sm text-muted">
        New to the arena?{" "}
        <Link href="/register" className="text-white underline decoration-action decoration-2 underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
