import type { auth } from "@agentic-company-researcher/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? (process.env.SERVER_URL || "http://localhost:3000").replace(/\/$/, "") +
        "/api/auth"
      : window.location.origin + "/api/auth",
  plugins: [inferAdditionalFields<typeof auth>()],
});
