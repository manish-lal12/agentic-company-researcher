// apps/web/src/app/dashboard/layout.tsx

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] h-full gap-0">
      {/* Sidebar */}
      <nav className="border-r bg-slate-50 p-4 md:min-h-screen">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Menu</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="text-sm hover:underline block py-1"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href={"/dashboard/research" as any}
                className="text-sm hover:underline block py-1"
              >
                Research Sessions
              </Link>
            </li>
            <li>
              <Link
                href={"/dashboard/plans" as any}
                className="text-sm hover:underline block py-1"
              >
                Account Plans
              </Link>
            </li>
            <li>
              <Link
                href={"/dashboard/research/new" as any}
                className="text-sm hover:underline block py-1 text-blue-600 font-semibold"
              >
                + New Research
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 overflow-auto">{children}</main>
    </div>
  );
}
