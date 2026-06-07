import { notFound } from "next/navigation";
import { fetchProblemBySlug } from "@/lib/problems-api";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await fetchProblemBySlug(slug).catch(() => null);

  if (!problem) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProblemDetailView problem={problem} />
    </main>
  );
}
