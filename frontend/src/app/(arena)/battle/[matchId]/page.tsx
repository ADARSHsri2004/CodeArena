import { BattleArenaClient } from "@/features/battle/battle-arena-client";
import { AuthGate } from "@/components/auth-gate";

export default async function Page({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  return (
    <main className="mx-auto max-w-450 px-4 pb-6 pt-16 sm:px-6 lg:px-8">
      <AuthGate>
        <BattleArenaClient matchId={matchId} />
      </AuthGate>
    </main>
  );
}
