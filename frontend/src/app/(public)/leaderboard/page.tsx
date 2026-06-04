import { LeaderboardBoard } from "@/features/leaderboard/leaderboard-board";

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">global ladder</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Climb the ranked board</h1>
      </div>
      <LeaderboardBoard />
    </main>
  );
}
