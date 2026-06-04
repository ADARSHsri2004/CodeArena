import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="border-border/70 bg-surface/85">
        <CardContent className="space-y-6">
          <Badge variant="ranking">about</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-white">A competitive arena for DSA duels</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            CodeArena blends the intensity of matchmaking, the precision of coding platforms, and the
            tactical feel of esports so developers can compete with focus and momentum.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
