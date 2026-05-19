const express = require("express");
const prisma = require("../lib/prisma");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");
const slugify = require("../utils/slug");

const router = express.Router();

const categories = new Set(["VEHICLE", "HOUSE", "LAND"]);
const statuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

function normalizeEnum(value, allowed) {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).toUpperCase();
  return allowed.has(normalized) ? normalized : undefined;
}

function nullableInt(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? undefined : number;
}

function nullableString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const nextValue = String(value).trim();
  return nextValue.length ? nextValue : null;
}

function nullablePrice(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? String(number) : undefined;
}

async function uniqueSlug(title, preferredSlug, currentId) {
  const base = slugify(preferredSlug || title) || `listing-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.listing.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function listingData(body, mode, currentId) {
  const data = {};

  if (mode === "create") {
    const requiredFields = ["title", "category", "description", "location"];
    const missing = requiredFields.filter((field) => !body[field]);

    if (missing.length) {
      const error = new Error(`Missing required fields: ${missing.join(", ")}`);
      error.status = 400;
      throw error;
    }
  }

  if (body.title !== undefined) {
    data.title = String(body.title).trim();
  }

  if (body.description !== undefined) {
    data.description = String(body.description).trim();
  }

  if (body.location !== undefined) {
    data.location = String(body.location).trim();
  }

  const category = normalizeEnum(body.category, categories);
  const status = normalizeEnum(body.status, statuses);

  if (body.category !== undefined && !category) {
    const error = new Error("Invalid listing category");
    error.status = 400;
    throw error;
  }

  if (body.status !== undefined && !status) {
    const error = new Error("Invalid listing status");
    error.status = 400;
    throw error;
  }

  if (category) {
    data.category = category;
  }

  if (status) {
    data.status = status;
  }

  if (body.featured !== undefined) {
    data.featured = Boolean(body.featured);
  }

  const stringFields = [
    "address",
    "areaSize",
    "condition",
    "currency",
    "fuelType",
    "lotSize",
    "make",
    "model",
    "transmission",
  ];

  for (const field of stringFields) {
    const value = nullableString(body[field]);

    if (value !== undefined) {
      data[field] = value;
    }
  }

  const intFields = ["bathrooms", "bedrooms", "mileage", "year"];

  for (const field of intFields) {
    const value = nullableInt(body[field]);

    if (value !== undefined) {
      data[field] = value;
    }
  }

  const price = nullablePrice(body.price);

  if (price !== undefined) {
    data.price = price;
  }

  if (Array.isArray(body.imageUrls)) {
    data.imageUrls = body.imageUrls
      .map((url) => String(url).trim())
      .filter(Boolean);
  } else if (mode === "create") {
    data.imageUrls = [];
  }

  if (mode === "create" || body.slug !== undefined) {
    data.slug = await uniqueSlug(data.title || body.title, body.slug, currentId);
  }

  return data;
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const where = {};
    const category = normalizeEnum(req.query.category, categories);
    const status = normalizeEnum(req.query.status, statuses);

    if (category) {
      where.category = category;
    }

    if (req.user) {
      if (status) {
        where.status = status;
      }
    } else {
      where.status = "PUBLISHED";
    }

    if (req.query.featured !== undefined) {
      where.featured = req.query.featured === "true";
    }

    if (req.query.q) {
      const query = String(req.query.q).trim();

      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    return res.json({ listings });
  })
);

router.get(
  "/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const listing = await prisma.listing.findFirst({
      where: {
        OR: [{ slug: req.params.slug }, { id: req.params.slug }],
      },
    });

    if (!listing || (!req.user && listing.status !== "PUBLISHED")) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.json({ listing });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await listingData(req.body, "create");

    const listing = await prisma.listing.create({
      data: {
        ...data,
        createdById: req.user.id,
      },
    });

    return res.status(201).json({ listing });
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = await listingData(req.body, "update", req.params.id);

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data,
    });

    return res.json({ listing });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: { status: "ARCHIVED" },
    });

    return res.json({ listing });
  })
);

module.exports = router;
