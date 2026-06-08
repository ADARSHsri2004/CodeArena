"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export function DashboardShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-76px)]">
      <div className="fixed left-4 top-3 z-[70]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isSidebarOpen ? "close" : "open"}
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-11 rounded-2xl border border-white/10 bg-black/45 px-0 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:bg-white/10"
              onClick={() => setIsSidebarOpen((current) => !current)}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      <Sidebar
        activePath={activePath}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex min-h-[calc(100vh-76px)] flex-1 flex-col">
        {/* <Topbar /> */}
        <main className="flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
