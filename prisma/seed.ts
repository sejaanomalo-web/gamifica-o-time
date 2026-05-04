// Seed: delivery weights + initial collaborators (Vinicius, Emanuel) with commission tiers.
// Emails and base salaries are PLACEHOLDERS — confirm with Bruno before running in prod.

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.deliveryWeight.createMany({
    data: [
      { category: "Aulas",           group: "HIGH",   weight: 2.0 },
      { category: "YouTube",         group: "HIGH",   weight: 2.0 },
      { category: "VSL",             group: "HIGH",   weight: 2.0 },
      { category: "Reel",            group: "MEDIUM", weight: 1.5 },
      { category: "Criativo",        group: "MEDIUM", weight: 1.5 },
      { category: "Carrossel",       group: "MEDIUM", weight: 1.5 },
      { category: "Estáticos",       group: "LOW",    weight: 1.0 },
      { category: "Carrossel fácil", group: "LOW",    weight: 1.0 },
      { category: "Story",           group: "LOW",    weight: 1.0 },
    ],
    skipDuplicates: true,
  });

  const vinicius = await prisma.user.upsert({
    where: { email: "vinicius@anomalo.com.br" },
    update: {},
    create: {
      email: "vinicius@anomalo.com.br",
      name: "Vinicius",
      area: "Edição/Produção",
      role: "COLABORADOR",
    },
  });
  await prisma.commissionTier.upsert({
    where: { userId: vinicius.id },
    update: {},
    create: {
      userId: vinicius.id,
      baseSalary: 0,
      baseMin: 0,  baseMax: 79,
      m1Min: 80,   m1Max: 159,
      m2Min: 160,  m2Max: 240,
      excellenceMin: 260,
      m1BonusPer20: 3000,
      m2BonusPer20: 5000,
      excellenceFixedBonus: 20000,
      excellenceBonusPer10: 5000,
      excellenceBonusStep: 10,
      notes: "Foco em volume. Performance histórica alta.",
    },
  });

  const emanuel = await prisma.user.upsert({
    where: { email: "emanuel@anomalo.com.br" },
    update: {},
    create: {
      email: "emanuel@anomalo.com.br",
      name: "Emanuel",
      area: "Edição/Produção",
      role: "COLABORADOR",
    },
  });
  await prisma.commissionTier.upsert({
    where: { userId: emanuel.id },
    update: {},
    create: {
      userId: emanuel.id,
      baseSalary: 0,
      baseMin: 0,  baseMax: 39,
      m1Min: 40,   m1Max: 79,
      m2Min: 80,   m2Max: 119,
      excellenceMin: 120,
      m1BonusPer20: 3000,
      m2BonusPer20: 5000,
      excellenceFixedBonus: 10000,
      excellenceBonusPer10: 2000,
      excellenceBonusStep: 10,
      notes: "Foco em complexidade. Plano de crescimento gradativo.",
    },
  });

  console.log("Seed ok. Weights + Vinicius + Emanuel.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
