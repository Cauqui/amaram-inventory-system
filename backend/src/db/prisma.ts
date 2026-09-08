import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { getDatabaseUrl } from "../config/env.js";

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
