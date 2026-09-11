const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();
const uploadRoot = path.join(__dirname, "..", "..", "uploads");
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

fs.mkdirSync(uploadRoot, { recursive: true });

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function cloudinarySignature(params) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

async function uploadToCloudinary(dataUrl, safeBase) {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${safeBase || "listing"}-${crypto.randomUUID()}`;
  const paramsToSign = {
    folder: process.env.CLOUDINARY_FOLDER || "samhub/listings",
    public_id: publicId,
    timestamp,
  };
  const formData = new FormData();

  formData.set("file", dataUrl);
  formData.set("api_key", process.env.CLOUDINARY_API_KEY);
  formData.set("timestamp", String(timestamp));
  formData.set("folder", paramsToSign.folder);
  formData.set("public_id", publicId);
  formData.set("signature", cloudinarySignature(paramsToSign));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data && data.error?.message
        ? data.error.message
        : "Cloudinary upload failed";
    const error = new Error(message);
    error.status = 502;
    throw error;
  }

  return {
    url: data.secure_url || data.url,
    path: data.public_id,
  };
}

function localUpload(dataUrl, buffer, safeBase, extension, req) {
  const storedName = `${safeBase || "listing"}-${crypto.randomUUID()}.${extension}`;
  const storedPath = path.join(uploadRoot, storedName);

  fs.writeFileSync(storedPath, buffer);

  const origin = process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get("host")}`;

  return {
    url: `${origin}/uploads/${storedName}`,
    path: `/uploads/${storedName}`,
  };
}

router.post(
  "/base64",
  requireAuth,
  requireAdmin,
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

    if (hasCloudinaryConfig()) {
      const uploaded = await uploadToCloudinary(dataUrl, safeBase);
      return res.status(201).json(uploaded);
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({ message: "Cloudinary storage is not configured" });
    }

    return res.status(201).json(localUpload(dataUrl, buffer, safeBase, extension, req));
  })
);

module.exports = {
  router,
  uploadRoot,
};
