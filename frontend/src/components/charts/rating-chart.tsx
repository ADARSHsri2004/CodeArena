"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { getRatingSeries } from "@/lib/data";

type RatingTooltipPayload = {
  payload: {
    name: string;
  };
  value: number;
};

type RatingTooltipProps = {
  active?: boolean;
  payload?: RatingTooltipPayload[];
};

function RatingTooltip({ active, payload }: RatingTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
      <p className="text-muted">{payload[0].payload.name}</p>
      <p className="font-semibold text-white">{payload[0].value} Elo</p>
    </div>
  );
}

export function RatingChart() {
  return (
    <Card className="border-border/70">
      <CardContent className="h-[320px] p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Rating progression</h3>
          <p className="text-sm text-muted">Your battle Elo over the last six months.</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getRatingSeries()}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<RatingTooltip />} />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="#3b82f6"
              fill="url(#ratingGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
