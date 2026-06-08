import { fetchProblems } from "@/lib/problems-api";
import { ProblemsBrowser } from "@/features/problems/problems-browser";

export const dynamic = "force-dynamic";

export default async function Page() {
  const problems = await fetchProblems();

  return <ProblemsBrowser problems={problems} />;
}
