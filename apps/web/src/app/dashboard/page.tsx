import { redirect } from "next/navigation";
import Link from "next/link";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-lg font-semibold mb-2">
          Welcome back, {session.user.name}!
        </h2>
        <p className="text-gray-600 mb-4">
          Start by creating a new research session or reviewing your previous
          plans.
        </p>
        <div className="flex gap-3">
          <Link
            href={"/dashboard/research/new" as any}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Research Session
          </Link>
          <Link
            href={"/dashboard/plans" as any}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            View Plans
          </Link>
        </div>
      </div>
      <Dashboard session={session} />
    </div>
  );
}
