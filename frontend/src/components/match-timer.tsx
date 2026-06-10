import { Clock3 } from "lucide-react";

export function MatchTimer({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center p-2 gap-2 rounded-md  border-black bg-yellow-300 backdrop-blur-lg px-3 py-1.5 text-[11px] font-medium tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <Clock3 className="h-3 w-3 text-muted color-black" />
      <span className="font-mono tabular-nums text-black text-bold ">{value}</span>
    </div>
  );
}
