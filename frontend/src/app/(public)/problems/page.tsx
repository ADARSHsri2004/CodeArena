import { fetchProblems } from "@/lib/problems-api";
import { ProblemsBrowser } from "@/features/problems/problems-browser";

export const dynamic = "force-dynamic";

export default async function Page() {
  const problems = await fetchProblems();

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">  
      <ProblemsBrowser problems={problems} />
    </main>
  );
}
