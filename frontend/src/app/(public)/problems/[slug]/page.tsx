"use-client"
import { notFound } from "next/navigation";
import { fetchProblemBySlug } from "@/lib/problems-api";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-auto max-h-screen py-2 sm:px-6 lg:px-8">
      <ProblemDetailView problem={problem} />
    </main>
  );
}
