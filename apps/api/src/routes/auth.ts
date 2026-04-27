import { Hono } from "hono";
import { requireAuth, clerkClient } from "../lib/clerk.js";
import { User } from "@tradeup/db";

export const authRoutes = new Hono();

authRoutes.post("/sync", requireAuth, async (c) => {
  const clerkId = c.get("userId") as string;
  const role =
    (c.get("role") as "buyer" | "seller" | "admin" | undefined) ?? "buyer";

  const clerkUser = await clerkClient.users.getUser(clerkId);

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? "";

  const username =
    clerkUser.username ??
    `${clerkUser.firstName ?? "user"}-${clerkUser.id.slice(-6)}`.toLowerCase();

  const user = await User.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      email: primaryEmail,
      username,
      role,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return c.json({
    message: "user synced",
    user: {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      role: user.role,
      stripeConnectStatus: user.stripeConnectStatus,
    },
  });
});
