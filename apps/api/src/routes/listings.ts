import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { requireAuth } from "../lib/clerk.js";
import { saveFile } from "../lib/storage.js";
import { Listing, User, CatalogCard } from "@tradeup/db";

export const listingRoutes = new Hono();

// ─── Validation Schema ─────────────────────────────────────────────────────────
const CONDITIONS = [
  "mint",
  "near_mint",
  "excellent",
  "good",
  "played",
  "poor",
] as const;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB per photo
const MAX_BODY_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB total

const createListingSchema = z.object({
  catalogCardId: z
    .string()
    .min(24, "catalogCardId must be a valid MongoDB ObjectId"),
  condition: z.enum(CONDITIONS, { message: "Invalid condition value" }),
  // askingPrice comes as string from multipart; undefined means trade-only listing
  askingPrice: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : NaN;
    })
    .refine((val) => val === undefined || (!Number.isNaN(val) && val >= 0), {
      message: "askingPrice must be a positive number in cents",
    }),
  // wantsCards is a JSON-stringified array of CatalogCard IDs
  wantsCards: z
    .string()
    .optional()
    .transform((val): string[] => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }),
});

// ─── GET /api/listings ─────────────────────────────────────────────────────────
listingRoutes.get("/", async (c) => {
  const {
    game,
    rarity,
    condition,
    minPrice,
    maxPrice,
    page = "1",
    limit = "20",
  } = c.req.query();

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);

  // Build the listing-level filter
  const listingFilter: Record<string, unknown> = { status: "active" };
  if (
    condition &&
    CONDITIONS.includes(condition as (typeof CONDITIONS)[number])
  ) {
    listingFilter["condition"] = condition;
  }
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter["$gte"] = Number(minPrice);
    if (maxPrice) priceFilter["$lte"] = Number(maxPrice);
    listingFilter["askingPrice"] = priceFilter;
  }

  // game and rarity live in CatalogCard, so we need an aggregation or
  // a match after populate. For simplicity, filter after populate.
  let query = Listing.find(listingFilter)
    .populate({
      path: "catalogCard",
      ...(game || rarity
        ? {
            match: { ...(game ? { game } : {}), ...(rarity ? { rarity } : {}) },
          }
        : {}),
    })
    .populate("seller", "username reputation reviewCount")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const listings = (await query).filter((l) => l.catalogCard !== null);
  const total = await Listing.countDocuments(listingFilter);

  return c.json({
    listings,
    total,
    page: pageNum,
    limit: limitNum,
  });
});

// ─── GET /api/listings/:id ─────────────────────────────────────────────────────
listingRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const listing = await Listing.findById(id)
    .populate("catalogCard")
    .populate("seller", "username reputation reviewCount");

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  // Increment view counter (fire and forget)
  Listing.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

  return c.json({ listing });
});

// ─── POST /api/listings ────────────────────────────────────────────────────────
listingRoutes.post(
  "/",
  requireAuth,
  bodyLimit({
    maxSize: MAX_BODY_SIZE_BYTES,
    onError: (c) =>
      c.json(
        {
          error: `Payload too large. Max allowed: ${MAX_BODY_SIZE_BYTES / 1024 / 1024}MB`,
        },
        413,
      ),
  }),
  async (c) => {
    const clerkId = c.get("userId");

    // Parse multipart body — all: true handles multiple files with the same field name
    const body = await c.req.parseBody({ all: true });

    // 1. Validate text fields
    const parsed = createListingSchema.safeParse({
      catalogCardId: body["catalogCardId"],
      condition: body["condition"],
      askingPrice: body["askingPrice"],
      wantsCards: body["wantsCards"],
    });

    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        400,
      );
    }

    // 2. Extract and validate photo files
    const photoField = body["photos"];
    const files: File[] = Array.isArray(photoField)
      ? photoField.filter((item): item is File => item instanceof File)
      : photoField instanceof File
        ? [photoField]
        : [];

    if (files.length === 0) {
      return c.json({ error: "At least one photo is required" }, 400);
    }
    if (files.length > MAX_PHOTOS) {
      return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400);
    }

    const badType = files.find((f) => !ALLOWED_MIME_TYPES.includes(f.type));
    if (badType) {
      return c.json(
        {
          error: `Invalid file type "${badType.type}". Allowed: JPG, PNG, WEBP`,
        },
        400,
      );
    }

    const oversized = files.find((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    if (oversized) {
      return c.json(
        { error: `"${oversized.name}" exceeds the 4MB per-photo limit` },
        400,
      );
    }

    // 3. Resolve seller from MongoDB
    const seller = await User.findOne({ clerkId });
    if (!seller) {
      return c.json(
        { error: "User not found. Call POST /api/auth/sync first." },
        400,
      );
    }
    if (seller.isBanned) {
      return c.json({ error: "Your account has been banned." }, 403);
    }

    // 4. Validate catalog card exists
    const catalogCard = await CatalogCard.findById(parsed.data.catalogCardId);
    if (!catalogCard) {
      return c.json({ error: "Catalog card not found" }, 404);
    }

    // 5. Save photos (dev: disk, prod: swap saveFile() for cloud)
    let photoPaths: string[];
    try {
      photoPaths = await Promise.all(files.map((f) => saveFile(f)));
    } catch (err) {
      console.error("Photo upload error:", err);
      return c.json({ error: "Failed to save photos. Try again." }, 500);
    }

    // 6. Create the listing
    const listing = await Listing.create({
      seller: seller._id,
      catalogCard: catalogCard._id,
      condition: parsed.data.condition,
      photos: photoPaths,
      askingPrice: parsed.data.askingPrice,
      wantsCards: parsed.data.wantsCards ?? [],
      status: "active",
    });

    const populated = await Listing.findById(listing._id)
      .populate("catalogCard")
      .populate("seller", "username reputation reviewCount");

    return c.json({ message: "Listing created", listing: populated }, 201);
  },
);

// ─── PATCH /api/listings/:id ───────────────────────────────────────────────────
listingRoutes.patch("/:id", requireAuth, async (c) => {
  const { id } = c.req.param();
  const clerkId = c.get("userId");

  const listing = await Listing.findById(id);
  if (!listing) return c.json({ error: "Listing not found" }, 404);

  const seller = await User.findOne({ clerkId });
  if (!seller || String(listing.seller) !== String(seller._id)) {
    return c.json({ error: "Forbidden: you do not own this listing" }, 403);
  }

  if (listing.status !== "active") {
    return c.json({ error: "Only active listings can be edited" }, 400);
  }

  const body = await c.req.json<{ askingPrice?: number; condition?: string }>();

  await Listing.findByIdAndUpdate(id, { $set: body });
  return c.json({ message: "Listing updated" });
});

// ─── DELETE /api/listings/:id ──────────────────────────────────────────────────
listingRoutes.delete("/:id", requireAuth, async (c) => {
  const { id } = c.req.param();
  const clerkId = c.get("userId");

  const listing = await Listing.findById(id);
  if (!listing) return c.json({ error: "Listing not found" }, 404);

  const seller = await User.findOne({ clerkId });
  if (!seller || String(listing.seller) !== String(seller._id)) {
    return c.json({ error: "Forbidden: you do not own this listing" }, 403);
  }

  await Listing.findByIdAndUpdate(id, { status: "cancelled" });
  return c.json({ message: "Listing cancelled" });
});
