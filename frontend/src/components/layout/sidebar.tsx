"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavigation } from "@/constants/navigation";
import { cn } from "@/lib/cn";
import { Crown, Swords } from "lucide-react";

export function Sidebar({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <aside className="hidden min-h-screen w-72 border-r border-border/70 bg-surface/70 px-4 py-6 lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-3">
        <Image
          src="/logo.png"
          alt="CodeArena logo"
          width={52}
          height={52}
          className="h-[52px] w-[52px] object-contain"
          priority
        />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em]">
            CodeArena
            <Swords className="h-4 w-4 text-ranking" />
          </div>
          <p className="text-xs text-muted">Arena control deck</p>
        </div>
      </Link>
      <nav className="mt-8 space-y-1">
        {dashboardNavigation.map((item) => {
          const active = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-action/15 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.22)]"
                  : "text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  active ? "bg-action" : "bg-border",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-3xl border border-ranking/30 bg-ranking/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Crown className="h-4 w-4 text-warning" />
          Elite queue
        </div>
        <p className="mt-2 text-sm text-muted">
          Locked in for premium matchmaking and live ranking updates.
        </p>
      </div>
    </aside>
  );
}
