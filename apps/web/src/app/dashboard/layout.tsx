"use client";

import { DynamicSidebar } from "@/components/dashboard/DynamicSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] h-full overflow-hidden gap-0">
      {/* Sidebar */}
      <DynamicSidebar />

      {/* Main Content */}
      <main className="flex flex-col h-full overflow-hidden px-4 py-4">
        {children}
      </main>
    </div>
  );
}
