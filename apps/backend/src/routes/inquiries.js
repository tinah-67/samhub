const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();
const statuses = new Set(["NEW", "CONTACTED", "CLOSED"]);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { listingId, name, email, phone, preferredContact, message } = req.body;

    if (!name || !phone || !message) {
      return res
        .status(400)
        .json({ message: "Name, phone, and message are required" });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: listingId || null,
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: String(phone).trim(),
        preferredContact: preferredContact || "phone",
        message: String(message).trim(),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    return res.status(201).json({ inquiry });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    const inquiries = await prisma.inquiry.findMany({
      where: status && statuses.has(status) ? { status } : undefined,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ inquiries });
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = req.body.status ? String(req.body.status).toUpperCase() : null;

    if (!status || !statuses.has(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const inquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    return res.json({ inquiry });
  })
);

module.exports = router;
