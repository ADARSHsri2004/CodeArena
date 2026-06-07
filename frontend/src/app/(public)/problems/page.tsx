import { fetchProblems } from "@/lib/problems-api";
import { ProblemsBrowser } from "@/features/problems/problems-browser";

export default async function Page() {
  const problems = await fetchProblems();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">problem set</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Battle-ready problem pool</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Search, sort, and filter through a compact competitive programming catalog designed for fast decision making.
        </p>
      </div>
      <ProblemsBrowser problems={problems} />
    </main>
  );
}
