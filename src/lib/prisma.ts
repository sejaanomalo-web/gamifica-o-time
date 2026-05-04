import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  // Falls back to a placeholder when DATABASE_URL is missing so the client
  // constructs cleanly during build / static generation. Real queries will
  // fail at request time with a clear connection error, which is correct.
  const url =
    process.env.DATABASE_URL ??
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
