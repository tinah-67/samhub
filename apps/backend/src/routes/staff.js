const bcrypt = require("bcrypt");
const express = require("express");
const prisma = require("../lib/prisma");
const { publicUser, requireAdmin, requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");

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
    const { name, email, phone, password } = req.body;
    const role = req.body.role ? String(req.body.role).toUpperCase() : "STAFF";

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    if (!roles.has(role)) {
      return res.status(400).json({ message: "Invalid staff role" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        phone: phone ? String(phone).trim() : null,
        role,
        passwordHash,
      },
    });

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
      data.name = String(req.body.name).trim();
    }

    if (req.body.email !== undefined) {
      data.email = String(req.body.email).toLowerCase().trim();
    }

    if (req.body.phone !== undefined) {
      data.phone = req.body.phone ? String(req.body.phone).trim() : null;
    }

    if (req.body.role !== undefined) {
      const role = String(req.body.role).toUpperCase();

      if (!roles.has(role)) {
        return res.status(400).json({ message: "Invalid staff role" });
      }

      data.role = role;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    if (req.body.password) {
      data.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });

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
