const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function resolveDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return databaseUrl;
  }

  const normalizedDatabaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, "");

  try {
    const url = new URL(normalizedDatabaseUrl);

    if (url.protocol !== "prisma+postgres:") {
      return {
        connectionString: normalizedDatabaseUrl,
        usesPrismaPostgres: false,
      };
    }

    const apiKey = url.searchParams.get("api_key");

    if (!apiKey) {
      return {
        connectionString: normalizedDatabaseUrl,
        usesPrismaPostgres: true,
      };
    }

    const payload = JSON.parse(Buffer.from(apiKey, "base64url").toString("utf8"));

    return {
      connectionString: payload.databaseUrl || normalizedDatabaseUrl,
      usesPrismaPostgres: !payload.databaseUrl,
    };
  } catch {
    return {
      connectionString: normalizedDatabaseUrl,
      usesPrismaPostgres: false,
    };
  }
}

const database = resolveDatabaseUrl(process.env.DATABASE_URL);
const prismaOptions = {
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
};

if (database?.usesPrismaPostgres) {
  prismaOptions.accelerateUrl = database.connectionString;
} else {
  prismaOptions.adapter = new PrismaPg({
    connectionString: database?.connectionString,
  });
}

const prisma = new PrismaClient(prismaOptions);

module.exports = prisma;
