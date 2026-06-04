import { notFound } from "next/navigation";
import { getProblemBySlug } from "@/lib/data";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);

  if (!problem) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProblemDetailView problem={problem} />
    </main>
  );
}
