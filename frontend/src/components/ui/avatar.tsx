import { cn } from "@/lib/cn";
import Image from "next/image";
import type { HTMLAttributes } from "react";

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative inline-flex overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      unoptimized
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function AvatarFallback({ className, children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-sm font-semibold text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}
