const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-development-secret";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function getUserFromRequest(req) {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  const payload = jwt.verify(token, JWT_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return publicUser(user);
}

async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await getUserFromRequest(req);
  } catch (error) {
    req.user = null;
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
}

module.exports = {
  optionalAuth,
  publicUser,
  requireAdmin,
  requireAuth,
  signToken,
};
