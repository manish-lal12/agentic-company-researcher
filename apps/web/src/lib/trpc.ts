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
    return process.env.SERVER_URL
      ? `${process.env.SERVER_URL}/api/trpc`
      : "http://localhost:3000/api/trpc";
  }

  // When runs on browser, use relative path to go through Next.js proxy
  return "/api/trpc";
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
