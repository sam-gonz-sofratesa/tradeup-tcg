import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { requireAuth } from "../lib/clerk.js";
import { saveFile } from "../lib/storage.js";
import { Listing, User, CatalogCard } from "@tradeup/db";

export const listingRoutes = new Hono();

const createListingSchema = z.object({
  catalogCardId: z.string().min(1, "catalogCardId is required"),
  condition: z.enum([
    "mint",
    "near_mint",
    "excellent",
    "good",
    "played",
    "poor",
  ]),
  askingPrice: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim() === "") return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .refine(
      (value) => value === undefined || (!Number.isNaN(value) && value >= 0),
      {
        message: "askingPrice must be a valid number >= 0",
      },
    ),
  wantsCards: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }),
});

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

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const filters: Record<string, any> = { status: "active" };

  if (condition) filters.condition = condition;

  if (minPrice || maxPrice) {
    filters.askingPrice = {};
    if (minPrice) filters.askingPrice.$gte = Number(minPrice);
    if (maxPrice) filters.askingPrice.$lte = Number(maxPrice);
  }

  const listings = await Listing.find(filters)
    .populate("catalogCard")
    .populate("seller", "username reputation reviewCount")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await Listing.countDocuments(filters);

  return c.json({
    listings,
    total,
    page: pageNumber,
    limit: limitNumber,
    filters: { game, rarity, condition, minPrice, maxPrice },
  });
});

listingRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const listing = await Listing.findById(id)
    .populate("catalogCard")
    .populate("seller", "username reputation reviewCount");

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  return c.json({ listing });
});

listingRoutes.post(
  "/",
  requireAuth,
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (c) => c.json({ error: "Payload too large" }, 413),
  }),
  async (c) => {
    const clerkId = c.get("userId") as string;
    const body = await c.req.parseBody({ all: true });

    const parsed = createListingSchema.safeParse({
      catalogCardId: body["catalogCardId"],
      condition: body["condition"],
      askingPrice: body["askingPrice"],
      wantsCards: body["wantsCards"],
    });

    if (!parsed.success) {
      return c.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        400,
      );
    }

    const photoField = body["photos"];
    const files = Array.isArray(photoField)
      ? photoField.filter((item): item is File => item instanceof File)
      : photoField instanceof File
        ? [photoField]
        : [];

    if (files.length === 0) {
      return c.json({ error: "At least one photo is required" }, 400);
    }

    if (files.length > 5) {
      return c.json({ error: "Maximum 5 photos allowed" }, 400);
    }

    const invalidType = files.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    if (invalidType) {
      return c.json(
        { error: "Only JPG, PNG, and WEBP images are allowed" },
        400,
      );
    }

    const oversized = files.find((file) => file.size > 4 * 1024 * 1024);
    if (oversized) {
      return c.json({ error: "Each image must be 4MB or less" }, 400);
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return c.json(
        { error: "User not synced. Call /api/auth/sync first." },
        400,
      );
    }

    const catalogCard = await CatalogCard.findById(parsed.data.catalogCardId);
    if (!catalogCard) {
      return c.json({ error: "Catalog card not found" }, 404);
    }

    const photoPaths = await Promise.all(files.map((file) => saveFile(file)));

    const listing = await Listing.create({
      seller: user._id,
      catalogCard: catalogCard._id,
      condition: parsed.data.condition,
      photos: photoPaths,
      askingPrice: parsed.data.askingPrice,
      wantsCards: parsed.data.wantsCards,
      status: "active",
    });

    const populatedListing = await Listing.findById(listing._id)
      .populate("catalogCard")
      .populate("seller", "username reputation reviewCount");

    return c.json(
      {
        message: "Listing created",
        listing: populatedListing,
      },
      201,
    );
  },
);

listingRoutes.patch("/:id", requireAuth, async (c) => {
  return c.json({ message: "listing updated" });
});

listingRoutes.delete("/:id", requireAuth, async (c) => {
  return c.json({ message: "listing deleted" });
});
