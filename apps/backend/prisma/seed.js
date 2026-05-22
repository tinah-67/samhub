const bcrypt = require("bcrypt");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const prisma = require("../src/lib/prisma");

const DEFAULT_ADMIN_EMAIL = "c12515124@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Tina1234";

const sampleImages = {
  vehicle: "/listings/benz-kdg-008.jpeg",
  house:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  land:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
};

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
    .toLowerCase()
    .trim();
  const adminName = process.env.SEED_ADMIN_NAME || "SamHub Admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "ADMIN",
      isActive: true,
      passwordHash,
      passwordMustChange: false,
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: "ADMIN",
      passwordHash,
      passwordMustChange: false,
    },
  });

  const listings = [
    {
      title: "Executive Mercedes-Benz C-Class",
      slug: "executive-mercedes-benz-c-class",
      category: "VEHICLE",
      status: "PUBLISHED",
      description:
        "A clean, well-maintained executive sedan suitable for daily city driving and client-facing business use.",
      price: "2800000",
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
      price: "12500000",
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
      price: "2500000",
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
