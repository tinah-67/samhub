const bcrypt = require("bcrypt");
const express = require("express");
const prisma = require("../lib/prisma");
const { publicUser, requireAuth, signToken } = require("../middleware/auth");
const { CODE_TTL_MINUTES, issueAuthCode, verifyAuthCode } = require("../utils/auth-codes");
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

    const { expiresAt, devCode } = await issueAuthCode(user, "LOGIN");

    return res.json({
      verificationRequired: true,
      email: user.email,
      expiresAt,
      expiresInMinutes: CODE_TTL_MINUTES,
      devCode,
    });
  })
);

router.post(
  "/login/verify",
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid or expired code" });
    }

    const codeMatches = await verifyAuthCode(user.id, "LOGIN", code);

    if (!codeMatches) {
      return res.status(401).json({ message: "Invalid or expired code" });
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  })
);

router.post(
  "/password/setup",
  asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid or expired setup code" });
    }

    const codeMatches = await verifyAuthCode(user.id, "SETUP", code);

    if (!codeMatches) {
      return res.status(401).json({ message: "Invalid or expired setup code" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordMustChange: false,
      },
    });

    return res.json({
      token: signToken(updatedUser),
      user: publicUser(updatedUser),
    });
  })
);

router.post(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const passwordMatches = await bcrypt.compare(String(currentPassword), user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordMustChange: false,
      },
    });

    return res.json({ user: publicUser(updatedUser) });
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
