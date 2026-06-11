"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavigation } from "@/constants/navigation";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { UserAvatarMenu } from "@/components/user-avatar-menu";

export function PublicNavbar() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  if (pathname?.startsWith("/battle/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-black-100/95 backdrop-blur-xl">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="CodeArena logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
              <div className="leading-tight">
                <h1 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
                  CodeArena
                </h1>
                <p className="text-xs text-muted">Live competitive coding</p>
              </div>
            </Link>

            {!user ? (
              <div className="flex items-center gap-2 sm:hidden">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-3 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <nav className="hidden items-center gap-1 sm:flex">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="hidden h-9 items-center justify-center rounded-xl border border-border px-3.5 text-sm font-medium text-white transition hover:bg-white/5 sm:inline-flex"
                >
                  Dashboard
                </Link>
                <UserAvatarMenu />
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3.5 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3.5 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                  Sign Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-2 sm:hidden">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl border border-border/70 px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
