import { ProfileOverview } from "@/features/profile/profile-overview";
import { AuthGate } from "@/components/auth-gate";

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AuthGate>
        <ProfileOverview />
      </AuthGate>
    </main>
  );
}
