const bcrypt = require("bcrypt");
const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const { publicUser, requireAdmin, requireAuth } = require("../middleware/auth");
const { issueAuthCode } = require("../utils/auth-codes");
const asyncHandler = require("../utils/async-handler");
const { isValidEmail, isValidUserName } = require("../utils/validation");

const router = express.Router();
const roles = new Set(["ADMIN", "STAFF"]);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const staff = await prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    return res.json({ staff: staff.map(publicUser) });
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const role = req.body.role ? String(req.body.role).toUpperCase() : "STAFF";

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: "Name and email are required" });
    }

    if (!isValidUserName(name)) {
      return res.status(400).json({ message: "Name can only contain letters and spaces" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (!roles.has(role)) {
      return res.status(400).json({ message: "Invalid account role" });
    }

    const temporaryPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        phone: phone ? String(phone).trim() : null,
        role,
        passwordHash,
        passwordMustChange: true,
      },
    });

    await issueAuthCode(user, "SETUP");

    return res.status(201).json({ staff: publicUser(user) });
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = {};

    if (req.body.name !== undefined) {
      if (!isValidUserName(req.body.name)) {
        return res.status(400).json({ message: "Name can only contain letters and spaces" });
      }

      data.name = String(req.body.name).trim();
    }

    if (req.body.email !== undefined) {
      if (!isValidEmail(req.body.email)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }

      data.email = String(req.body.email).toLowerCase().trim();
    }

    if (req.body.phone !== undefined) {
      data.phone = req.body.phone ? String(req.body.phone).trim() : null;
    }

    if (req.body.role !== undefined) {
      const role = String(req.body.role).toUpperCase();

      if (!roles.has(role)) {
        return res.status(400).json({ message: "Invalid account role" });
      }

      data.role = role;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });

    return res.json({ staff: publicUser(user) });
  })
);

router.post(
  "/:id/setup-code",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordMustChange: true },
    });

    await issueAuthCode(user, "SETUP");

    return res.json({ staff: publicUser(user) });
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return res.json({ staff: publicUser(user) });
  })
);

module.exports = router;
