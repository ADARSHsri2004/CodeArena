import { notFound } from "next/navigation";
import { getBattleMatch } from "@/lib/data";
import { BattleArena } from "@/features/battle/battle-arena";

export default async function Page({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  if (!matchId) {
    notFound();
  }

  const match = getBattleMatch(matchId);

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
      <BattleArena match={match} />
    </main>
  );
}
