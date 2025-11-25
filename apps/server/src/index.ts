import "dotenv/config";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@agentic-company-researcher/api/context";
import { appRouter } from "@agentic-company-researcher/api/routers/index";
import { auth } from "@agentic-company-researcher/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CLIENT_URL || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// tRPC routes
app.all("/api/trpc/*", async (c) => {
  return await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: async () => {
      return createContext({ context: c });
    },
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path}:`, error);
    },
  });
});

app.get("/", (c) => {
  return c.text("OK");
});

// Export for Vercel serverless
export default app;

// Only run local server in development
if (process.env.NODE_ENV !== "production") {
  import("@hono/node-server").then(({ serve }) => {
    serve(
      {
        fetch: app.fetch,
        port: 3000,
      },
      (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
      }
    );
  });
}
