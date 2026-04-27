import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";

export const clerkClient = createClerkClient({
  secretKey: process.env["CLERK_SECRET_KEY"],
  publishableKey: process.env["CLERK_PUBLISHABLE_KEY"],
});

type AppRole = "buyer" | "seller" | "admin";

export async function requireAuth(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.replace("Bearer ", "")
    : undefined;

  if (!token) {
    return c.json({ error: "Unauthorized: missing bearer token" }, 401);
  }

  const secretKey = process.env["CLERK_SECRET_KEY"];
  if (!secretKey) {
    return c.json(
      { error: "Server misconfiguration: missing CLERK_SECRET_KEY" },
      500,
    );
  }

  try {
    const payload = await verifyToken(token, {
      secretKey,
      authorizedParties: ["http://localhost:3000", "http://localhost:3002"],
    });

    const userId = payload.sub;
    const role =
      (payload as any).metadata?.role ??
      (payload as any).public_metadata?.role ??
      (payload as any).unsafe_metadata?.role ??
      "buyer";

    c.set("auth", payload);
    c.set("userId", userId);
    c.set("role", role as AppRole);

    await next();
  } catch {
    return c.json({ error: "Unauthorized: invalid token" }, 401);
  }
}

export async function requireAdmin(c: Context, next: Next) {
  await requireAuth(c, async () => {});
  const role = c.get("role") as AppRole | undefined;

  if (!role) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
}
