const bcrypt = require("bcrypt");
const express = require("express");
const prisma = require("../lib/prisma");
const { publicUser, requireAuth, signToken } = require("../middleware/auth");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.json({ user: req.user });
  })
);

module.exports = router;
