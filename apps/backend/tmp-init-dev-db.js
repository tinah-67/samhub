const { Client } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const statements = [
  `CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF')`,
  `CREATE TYPE "ListingCategory" AS ENUM ('VEHICLE', 'HOUSE', 'LAND')`,
  `CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
  `CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED')`,
  `CREATE TYPE "AuthCodePurpose" AS ENUM ('LOGIN', 'SETUP')`,
  `CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "passwordMustChange" BOOLEAN NOT NULL DEFAULT false,
  "role" "UserRole" NOT NULL DEFAULT 'STAFF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email")
)`,
  `CREATE TABLE IF NOT EXISTS "AuthCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" "AuthCodePurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Listing" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" "ListingCategory" NOT NULL,
  "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  "description" TEXT NOT NULL,
  "price" DECIMAL(14, 2),
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "location" TEXT NOT NULL,
  "address" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "imageUrls" TEXT[] NOT NULL,
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "areaSize" TEXT,
  "lotSize" TEXT,
  "make" TEXT,
  "model" TEXT,
  "year" INTEGER,
  "mileage" INTEGER,
  "transmission" TEXT,
  "fuelType" TEXT,
  "condition" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Listing_slug_key" UNIQUE ("slug"),
  CONSTRAINT "Listing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL,
  "listingId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT NOT NULL,
  "preferredContact" TEXT NOT NULL DEFAULT 'phone',
  "message" TEXT NOT NULL,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE
)`,
  `CREATE INDEX IF NOT EXISTS "AuthCode_userId_purpose_expiresAt_idx" ON "AuthCode"("userId", "purpose", "expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "Listing_category_status_idx" ON "Listing"("category", "status")`,
  `CREATE INDEX IF NOT EXISTS "Listing_featured_status_idx" ON "Listing"("featured", "status")`,
  `CREATE INDEX IF NOT EXISTS "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Inquiry_listingId_idx" ON "Inquiry"("listingId")`,
];

async function main() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 15000,
  });

  await client.connect();

  for (const [index, statement] of statements.entries()) {
    const label = statement.match(/^(CREATE\s+\w+)/)?.[1] || "SQL";
    console.log(`Running ${index + 1}/${statements.length}: ${label}`);

    try {
      await client.query(statement);
    } catch (error) {
      if (error.code === "42710" && statement.startsWith("CREATE TYPE")) {
        console.log("Already exists; continuing");
        continue;
      }

      throw error;
    }
  }

  await client.end();
  console.log("Dev database tables are ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
