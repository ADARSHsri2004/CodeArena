import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MatchTimer({ value }: { value: string }) {
  return (
    <Badge variant="outline" className="gap-2">
      <Clock3 className="h-3.5 w-3.5" />
      {value}
    </Badge>
  );
}
