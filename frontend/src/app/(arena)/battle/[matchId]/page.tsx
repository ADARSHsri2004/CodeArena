import { BattleArenaClient } from "@/features/battle/battle-arena-client";

export default async function Page({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
      <BattleArenaClient matchId={matchId} />
    </main>
  );
}
