import prisma from "@agentic-company-researcher/db";
import { betterAuth } from "better-auth";
import { createId } from "@paralleldrive/cuid2";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { BetterAuthOptions } from "better-auth/types";

// Server URL is where the auth API is hosted (backend)
const serverUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
// Client URL is where users should be redirected after auth (frontend)
const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";
const clientOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3001",
  clientUrl,
];

export const auth = betterAuth<BetterAuthOptions>({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/api/auth",
  baseURL: serverUrl,
  trustedOrigins: clientOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update session every day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    database: {
      generateId: (_options: { model: string; size?: number }) => {
        return createId();
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      redirectURI: `${serverUrl}/api/auth/callback/google`,
    },
  },
});
