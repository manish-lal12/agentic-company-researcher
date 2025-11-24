"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useRef } from "react";

/**
 * Custom hook that caches the session in localStorage to prevent
 * redundant API calls to /api/auth/get-session across page navigation
 * on the same session
 */
export function useSessionCache() {
  const sessionRef = useRef<any>(null);
  const { data: session, isPending } = authClient.useSession();

  // Cache session in ref to prevent re-renders from causing new API calls
  useEffect(() => {
    if (session) {
      sessionRef.current = session;
    }
  }, [session]);

  return { data: session, isPending };
}

/**
 * Global session state to prevent duplicate calls
 * This prevents UserMenu and other components from each calling useSession()
 * independently
 */
let cachedSession: any = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedSession() {
  // Return cached session if it's still valid
  if (cachedSession && cacheExpiry > Date.now()) {
    return cachedSession;
  }
  return null;
}

export function setCachedSession(session: any) {
  cachedSession = session;
  cacheExpiry = Date.now() + CACHE_TTL;
}

export function clearSessionCache() {
  cachedSession = null;
  cacheExpiry = 0;
}
