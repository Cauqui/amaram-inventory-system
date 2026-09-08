import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "../src/config/env.js";

class MissingSeedVariableError extends Error {
  constructor(readonly variableName: string) {
    super(variableName);
  }
}

class InvalidSeedPasswordError extends Error {
  constructor(readonly variableName: string) {
    super(variableName);
  }
}

function requiredEnvironmentVariable(variableName: string): string {
  const value = process.env[variableName]?.trim();

  if (!value) {
    throw new MissingSeedVariableError(variableName);
  }

  return value;
}

function normalizedEmail(variableName: string): string {
  return requiredEnvironmentVariable(variableName).toLowerCase();
}

function seedPassword(variableName: string): string {
  const value = requiredEnvironmentVariable(variableName);
  if (value.length < 12) throw new InvalidSeedPasswordError(variableName);
  return value;
}

const categories = [
  { name: "Canastas", code: "CAN", usesSizes: false },
  { name: "Carteras", code: "CAR", usesSizes: false },
  { name: "Crochet", code: "CRO", usesSizes: false },
  { name: "Prendas", code: "ROP", usesSizes: true },
  { name: "Peluches", code: "PEL", usesSizes: false },
] as const;

const programNames = ["Programa/Taller 01", "Programa/Taller 02", "Programa/Taller 03"] as const;

const initialUsers = [
  { prefix: "SEED_USER_1", role: UserRole.ADMIN },
  { prefix: "SEED_USER_2", role: UserRole.ADMIN },
  { prefix: "SEED_USER_3", role: UserRole.INVENTORY },
  { prefix: "SEED_USER_4", role: UserRole.INVENTORY },
] as const;

type InitialUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function seedCategories() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { code: category.code },
      create: { ...category, active: true },
      update: {},
    });
  }
}

async function seedPrograms() {
  for (const name of programNames) {
    const existingProgram = await prisma.program.findFirst({ where: { name } });

    if (!existingProgram) {
      await prisma.program.create({ data: { name, active: true } });
    }
  }
}

function getInitialUsers(): InitialUser[] {
  return initialUsers.map((user) => {
    const name = requiredEnvironmentVariable(`${user.prefix}_NAME`);
    const email = normalizedEmail(`${user.prefix}_EMAIL`);
    const password = seedPassword(`${user.prefix}_PASSWORD`);

    return { name, email, password, role: user.role };
  });
}

async function seedUsers(users: InitialUser[]) {
  for (const user of users) {
    const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (!existingUser) {
      const passwordHash = await argon2.hash(user.password, { type: argon2.argon2id });
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          active: true,
        },
      });
    }
  }
}

async function main() {
  const users = getInitialUsers();
  await seedCategories();
  await seedPrograms();
  await seedUsers(users);
  console.log("AMARAM seed completed.");
}

main()
  .catch((error: unknown) => {
    if (error instanceof MissingSeedVariableError) {
      console.error(`Seed failed: missing required environment variable ${error.variableName}.`);
    } else if (error instanceof InvalidSeedPasswordError) {
      console.error(`Seed failed: ${error.variableName} must contain at least 12 characters.`);
    } else {
      console.error("Seed failed.");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
