import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@agentic-company-researcher/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache successful queries for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 10 minutes before garbage collection
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus for auth endpoints
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
    },
  },
});

function getApiUrl() {
  // When runs on server, window is undefined:
  if (typeof window === "undefined") {
    return process.env.TRPC_SERVER_URL ?? "http://localhost:3000/api/trpc";
  }

  // When runs on browser:
  return (
    (window as any).__TRPC_SERVER_URL ??
    process.env.NEXT_PUBLIC_TRPC_SERVER_URL ??
    "http://localhost:3000/api/trpc"
  );
}

const apiUrl = getApiUrl();

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: apiUrl,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
