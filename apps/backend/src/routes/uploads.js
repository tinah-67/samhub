const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();
const uploadRoot = path.join(__dirname, "..", "..", "uploads");
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

fs.mkdirSync(uploadRoot, { recursive: true });

router.post(
  "/base64",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { dataUrl, fileName } = req.body;

    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ message: "A base64 image dataUrl is required" });
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({ message: "Invalid image dataUrl" });
    }

    const [, mimeType, encoded] = match;
    const extension = allowedTypes.get(mimeType);

    if (!extension) {
      return res.status(400).json({ message: "Only JPG, PNG, and WEBP images are supported" });
    }

    const buffer = Buffer.from(encoded, "base64");

    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ message: "Image must be smaller than 8MB" });
    }

    const safeBase = String(fileName || "listing")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    const storedName = `${safeBase || "listing"}-${crypto.randomUUID()}.${extension}`;
    const storedPath = path.join(uploadRoot, storedName);

    fs.writeFileSync(storedPath, buffer);

    const origin = process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get("host")}`;

    return res.status(201).json({
      url: `${origin}/uploads/${storedName}`,
      path: `/uploads/${storedName}`,
    });
  })
);

module.exports = {
  router,
  uploadRoot,
};
