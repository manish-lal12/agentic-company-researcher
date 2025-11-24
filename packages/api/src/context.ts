import type { Context as HonoContext } from "hono";
import { auth } from "@agentic-company-researcher/auth";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  try {
    // better-auth stores session in cookies
    // The auth.api.getSession expects a Request object with headers
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
    });

    return {
      session,
    };
  } catch (error) {
    console.error("Failed to get session from context:", error);
    return {
      session: null,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
