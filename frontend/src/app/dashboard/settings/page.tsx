import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-surface/85">
        <CardContent className="space-y-4">
          <Badge variant="ranking">settings</Badge>
          <h1 className="text-3xl font-semibold text-white">Arena preferences</h1>
          <p className="max-w-2xl text-sm text-muted">
            Configure notifications, account details, and queue preferences for your next session.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-surface/85">
        <CardContent className="flex flex-wrap gap-3">
          <Button>Save Changes</Button>
          <Button variant="outline">Reset Defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
