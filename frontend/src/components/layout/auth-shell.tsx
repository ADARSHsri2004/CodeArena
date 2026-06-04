"use client";

import { motion } from "framer-motion";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100vh-0px)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-fade opacity-45" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        {children}
      </motion.div>
    </main>
  );
}
