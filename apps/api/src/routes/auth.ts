import { Hono } from "hono";
import { requireAuth, clerkClient } from "../lib/clerk.js";
import { User } from "@tradeup/db";

export const authRoutes = new Hono();

/**
 * POST /api/auth/sync
 * Called by the frontend right after Clerk sign-in / sign-up.
 * Creates or updates the MongoDB User document.
 *
 * Frontend sends: Authorization: Bearer <clerk_session_token>
 */
authRoutes.post("/sync", requireAuth, async (c) => {
  const clerkId = c.get("userId");
  const role = c.get("role") ?? "buyer";

  // Fetch user details from Clerk
  let clerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(clerkId);
  } catch {
    return c.json({ error: "Failed to fetch user data from Clerk" }, 502);
  }

  // Resolve primary email
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? "";

  if (!primaryEmail) {
    return c.json({ error: "Clerk user has no verified email address" }, 400);
  }

  // Generate a username: clerk username → firstName-lastSixChars
  const username =
    clerkUser.username ??
    `${(clerkUser.firstName ?? "user").toLowerCase()}-${clerkUser.id.slice(-6)}`;

  // Upsert: create on first sync, update fields on subsequent calls
  const user = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        email: primaryEmail,
        username,
        // Only allow role update if it's explicitly set via Clerk metadata
        // (avoids overwriting an admin role with 'buyer' on re-sync)
        ...(role !== "buyer" ? { role } : {}),
      },
      $setOnInsert: {
        clerkId,
        role: "buyer", // Default role on first creation
        reputation: 0,
        reviewCount: 0,
        stripeConnectStatus: "none",
        isBanned: false,
      },
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
      reputation: user.reputation,
    },
  });
});
