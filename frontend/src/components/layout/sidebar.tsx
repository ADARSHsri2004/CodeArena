"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavigation } from "@/constants/navigation";
import { cn } from "@/lib/cn";
import { Crown, Swords } from "lucide-react";

export function Sidebar({
  activePath,
  isOpen,
  onClose,
}: {
  activePath?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-[76px] z-50 flex h-[calc(100vh-76px)] w-72 flex-col border-r border-border/70 bg-surface/92 px-4 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 px-3" onClick={onClose}>
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
                onClick={onClose}
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
        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Crown className="h-4 w-4 text-warning" />
            Elite queue enabled
          </div>
          <p className="mt-2 text-sm text-muted">
            Premium matchmaking and live ranking updates are active.
          </p>
        </div>
      </aside>
    </>
  );
}
