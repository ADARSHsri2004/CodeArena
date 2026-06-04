"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Swords, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { publicNavigation } from "@/constants/navigation";
import { getFeaturedStats, getTopThree } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const features = [
  { title: "Real-time 1v1 battles", description: "Queue into ranked duels with live timers, state sync, and dramatic momentum shifts.", icon: Swords },
  { title: "Dense problem workflows", description: "Browse, filter, and jump into problems with a fast table-first interface.", icon: Shield },
  { title: "Competitive progression", description: "Track your Elo, peaks, and form as you climb through the arena.", icon: Trophy },
];

export function LandingPage() {
  const stats = getFeaturedStats();
  const topThree = getTopThree();

  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative">
            <Badge variant="ranking" className="mb-6">ranked arena</Badge>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Compete. Solve. Climb.
            </motion.h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Real-time 1v1 coding battles against developers worldwide. Built for dense
              problem solving, elite matchmaking, and premium competitive focus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="shadow-lg shadow-action/20">
                  Start Competing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/problems">
                <Button variant="outline" size="lg">
                  Browse Problems
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="rounded-2xl border border-border bg-surface/85 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-border/70 bg-surface/90">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">matchmaking</p>
                    <h3 className="mt-1 text-xl font-semibold">Ready to queue</h3>
                  </div>
                  <Badge variant="action">
                    <Zap className="mr-1 h-3 w-3" />
                    live
                  </Badge>
                </div>
                <div className="rounded-2xl border border-action/30 bg-action/10 p-5">
                  <p className="text-sm text-muted">Estimated wait</p>
                  <p className="mt-2 text-4xl font-semibold text-white">22s</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-action via-ranking to-success" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted">
                    <span>Preferred difficulty</span>
                    <span className="text-white">Medium</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-surface/85">
              <CardContent>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Leaderboard preview</h3>
                  <Badge variant="outline">top 3</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {topThree.map((player) => (
                    <div key={player.username} className="flex items-center justify-between rounded-2xl border border-border bg-white/4 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">#{player.rank} {player.username}</p>
                        <p className="text-xs text-muted">{player.wins} wins</p>
                      </div>
                      <span className="text-lg font-semibold text-white">{formatNumber(player.elo)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/70 bg-surface/80">
              <CardContent className="space-y-4">
                <feature.icon className="h-5 w-5 text-action" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-6 text-muted">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/70 bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">CodeArena</p>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Built for high-stakes practice, fast decisions, and battle-tested ranking growth.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-muted">
            {publicNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
