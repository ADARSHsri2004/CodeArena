import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function DashboardShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath?: string;
}) {
  return (
    <div className="min-h-[calc(100vh-76px)] lg:flex">
      <Sidebar activePath={activePath} />
      <div className="flex min-h-[calc(100vh-76px)] flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
