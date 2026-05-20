const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { sendMail } = require("../src/utils/mailer");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const sampleImages = {
  vehicle:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  house:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  land:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
};

function createSetupCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendSetupCode(user) {
  const code = createSetupCode();
  const codeHash = await bcrypt.hash(code, 12);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.authCode.updateMany({
    where: {
      userId: user.id,
      purpose: "SETUP",
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await prisma.authCode.create({
    data: {
      userId: user.id,
      purpose: "SETUP",
      codeHash,
      expiresAt,
    },
  });

  await sendMail({
    to: user.email,
    subject: "Set up your SamHub admin account",
    text: [
      `Hello ${user.name},`,
      "",
      `Use this code to set your SamHub admin password: ${code}`,
      "",
      "This code expires in 10 minutes and can be used once.",
    ].join("\n"),
  });
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@samhubcreations.com")
    .toLowerCase()
    .trim();
  const adminName = process.env.SEED_ADMIN_NAME || "SamHub Admin";
  const temporaryPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "ADMIN",
      isActive: true,
      passwordHash,
      passwordMustChange: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: "ADMIN",
      passwordHash,
      passwordMustChange: true,
    },
  });

  await sendSetupCode(admin);

  const listings = [
    {
      title: "Executive Mercedes-Benz C-Class",
      slug: "executive-mercedes-benz-c-class",
      category: "VEHICLE",
      status: "PUBLISHED",
      description:
        "A clean, well-maintained executive sedan suitable for daily city driving and client-facing business use.",
      price: "4850000",
      location: "Nairobi, Kenya",
      featured: true,
      imageUrls: [sampleImages.vehicle],
      make: "Mercedes-Benz",
      model: "C-Class",
      year: 2019,
      mileage: 42000,
      transmission: "Automatic",
      fuelType: "Petrol",
      condition: "Foreign used",
      createdById: admin.id,
    },
    {
      title: "Modern Four Bedroom Family House",
      slug: "modern-four-bedroom-family-house",
      category: "HOUSE",
      status: "PUBLISHED",
      description:
        "A bright family residence with generous living areas, secure parking, and quick access to key amenities.",
      price: "28500000",
      location: "Kiambu Road, Kenya",
      featured: true,
      imageUrls: [sampleImages.house],
      bedrooms: 4,
      bathrooms: 3,
      areaSize: "320 sqm",
      condition: "Ready to move in",
      createdById: admin.id,
    },
    {
      title: "Prime Residential Land Parcel",
      slug: "prime-residential-land-parcel",
      category: "LAND",
      status: "PUBLISHED",
      description:
        "A strategically positioned residential land parcel with access roads, utilities nearby, and strong growth potential.",
      price: "6200000",
      location: "Athi River, Kenya",
      featured: false,
      imageUrls: [sampleImages.land],
      lotSize: "1/8 acre",
      condition: "Ready title",
      createdById: admin.id,
    },
  ];

  for (const listing of listings) {
    await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: listing,
      create: listing,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed data created");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
