import { LeaderboardBoard } from "@/features/leaderboard/leaderboard-board";

export default function Page() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-white/8 pb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400/80">global ladder</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Leaderboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
          Follow the live ranking order, search players, and track who is climbing the fastest.
        </p>
      </div>
      <LeaderboardBoard />
    </main>
  );
}
