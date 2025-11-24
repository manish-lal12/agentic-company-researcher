import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  useSessionCache,
  setCachedSession,
  getCachedSession,
} from "@/hooks/useSessionCache";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = useSessionCache();

  // Update global session cache when session changes
  useEffect(() => {
    if (session) {
      setCachedSession(session);
    }
  }, [session]);

  // Memoize session to prevent unnecessary re-renders
  const memoizedSession = useMemo(() => session, [session]);

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!memoizedSession) {
    return (
      <Button variant="outline" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{memoizedSession.user.name}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{memoizedSession.user.email}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
