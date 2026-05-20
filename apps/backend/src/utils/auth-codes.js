const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { hasSmtpConfig, sendMail } = require("./mailer");

const CODE_TTL_MINUTES = 10;

function createCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function expiryDate() {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

function subjectForPurpose(purpose) {
  return purpose === "SETUP"
    ? "Set up your SamHub admin account"
    : "Your SamHub login code";
}

function messageForPurpose(user, code, purpose) {
  const action =
    purpose === "SETUP"
      ? "Use this code to set your password"
      : "Use this code to finish signing in";

  return [
    `Hello ${user.name},`,
    "",
    `${action} for SamHub Creations: ${code}`,
    "",
    `This code expires in ${CODE_TTL_MINUTES} minutes and can be used once.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

async function issueAuthCode(user, purpose) {
  const code = createCode();
  const codeHash = await bcrypt.hash(code, 12);
  const expiresAt = expiryDate();

  await prisma.authCode.updateMany({
    where: {
      userId: user.id,
      purpose,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await prisma.authCode.create({
    data: {
      userId: user.id,
      purpose,
      codeHash,
      expiresAt,
    },
  });

  await sendMail({
    to: user.email,
    subject: subjectForPurpose(purpose),
    text: messageForPurpose(user, code, purpose),
  });

  return {
    expiresAt,
    devCode: !hasSmtpConfig() && process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

async function verifyAuthCode(userId, purpose, code) {
  const authCodes = await prisma.authCode.findMany({
    where: {
      userId,
      purpose,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  for (const authCode of authCodes) {
    const matches = await bcrypt.compare(String(code), authCode.codeHash);

    if (matches) {
      await prisma.authCode.update({
        where: { id: authCode.id },
        data: { consumedAt: new Date() },
      });

      return true;
    }
  }

  return false;
}

module.exports = {
  CODE_TTL_MINUTES,
  issueAuthCode,
  verifyAuthCode,
};
