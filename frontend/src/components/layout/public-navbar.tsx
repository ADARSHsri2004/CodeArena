import Link from "next/link";
import { publicNavigation } from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-action to-ranking text-lg font-bold text-white shadow-lg shadow-action/30">
            CA
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-[0.2em] uppercase">CodeArena</h1>
              <Badge variant="ranking">live</Badge>
            </div>
            <p className="text-xs text-muted">Competitive coding arena</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <Zap className="h-4 w-4" />
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-action px-4 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Zap className="h-4 w-4" />
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
