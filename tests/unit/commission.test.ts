// Unit tests for commission calc — node:test runner via tsx.
// Cases mirror the documented examples in PROJECT_BRIEF.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { CommissionTier } from "../../src/generated/prisma/client";
import { calculateCommission, formatCents } from "../../src/lib/commission";

const VINICIUS: CommissionTier = {
  id: "v",
  userId: "u-vinicius",
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
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const EMANUEL: CommissionTier = {
  id: "e",
  userId: "u-emanuel",
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
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("Vinicius: 0 pts → Base, no bonus", () => {
  const r = calculateCommission(0, VINICIUS);
  assert.equal(r.tierReached, "BASE");
  assert.equal(r.bonusValueCents, 0);
});

test("Vinicius: 79 pts → Base, no bonus", () => {
  const r = calculateCommission(79, VINICIUS);
  assert.equal(r.tierReached, "BASE");
  assert.equal(r.bonusValueCents, 0);
});

test("Vinicius: 80 pts → Meta 1 reached, but 0 marcos completed (just entered)", () => {
  const r = calculateCommission(80, VINICIUS);
  assert.equal(r.tierReached, "META_1");
  assert.equal(r.bonusValueCents, 0);
});

test("Vinicius: 100 pts → Meta 1, 1 marco completed (80..99) = R$ 30", () => {
  const r = calculateCommission(100, VINICIUS);
  assert.equal(r.tierReached, "META_1");
  assert.equal(r.bonusValueCents, 3000);
});

test("Vinicius: 159 pts (top of Meta 1) → 4 marcos × R$ 30 = R$ 120", () => {
  const r = calculateCommission(159, VINICIUS);
  assert.equal(r.tierReached, "META_1");
  assert.equal(r.bonusValueCents, 4 * 3000);
});

test("Vinicius: 118.27 pts (rounded down to 118) → Meta 1, 1 marco completed in 80..99 = R$ 30", () => {
  const r = calculateCommission(118, VINICIUS);
  assert.equal(r.tierReached, "META_1");
  assert.equal(r.bonusValueCents, 3000);
});

test("Vinicius: 160 pts → Meta 2 reached, full Meta 1 (4 × R$ 30) + 0 marcos M2", () => {
  const r = calculateCommission(160, VINICIUS);
  assert.equal(r.tierReached, "META_2");
  assert.equal(r.bonusValueCents, 4 * 3000);
});

test("Vinicius: 179 pts → Meta 2, full M1 + 1 marco M2 (160..179) = R$ 120 + R$ 50", () => {
  const r = calculateCommission(179, VINICIUS);
  assert.equal(r.tierReached, "META_2");
  assert.equal(r.bonusValueCents, 4 * 3000 + 1 * 5000);
});

test("Vinicius: 260 pts → Excelência, fixo R$ 200 + full M1 + full M2 + 0 exc marcos", () => {
  const r = calculateCommission(260, VINICIUS);
  assert.equal(r.tierReached, "EXCELENCIA");
  // M1: 4 × 3000 = 12000, M2: 4 × 5000 = 20000 (cap=240, 81 inclusive / 20 = 4), fixo: 20000, exc steps: floor(1/10)=0
  assert.equal(r.bonusValueCents, 12000 + 20000 + 20000);
});

test("Vinicius: 270 pts → Excelência, full M1 + full M2 + fixo + 1 exc marco × R$ 50", () => {
  const r = calculateCommission(270, VINICIUS);
  assert.equal(r.tierReached, "EXCELENCIA");
  // exc steps: floor((270-260+1)/10) = floor(11/10) = 1
  assert.equal(r.bonusValueCents, 12000 + 20000 + 20000 + 1 * 5000);
});

test("Emanuel: 79 pts → Meta 1, 2 marcos × R$ 30 = R$ 60", () => {
  const r = calculateCommission(79, EMANUEL);
  assert.equal(r.tierReached, "META_1");
  assert.equal(r.bonusValueCents, 2 * 3000);
});

test("Emanuel: 119 pts → Meta 2, full Meta 1 (2 marcos × R$ 30) + 2 marcos Meta 2 × R$ 50", () => {
  const r = calculateCommission(119, EMANUEL);
  assert.equal(r.tierReached, "META_2");
  assert.equal(r.bonusValueCents, 2 * 3000 + 2 * 5000);
});

test("Emanuel: 140 pts → Excelência, fixo R$ 100 + 2 marcos × R$ 20", () => {
  const r = calculateCommission(140, EMANUEL);
  assert.equal(r.tierReached, "EXCELENCIA");
  // M1: 2 × 3000 = 6000, M2: 2 × 5000 = 10000, fixo: 10000, exc steps: floor((140-120+1)/10) = 2 → 2 × 2000 = 4000
  assert.equal(r.bonusValueCents, 6000 + 10000 + 10000 + 4000);
});

test("formatCents: 30000 → 'R$ 300,00'", () => {
  assert.equal(formatCents(30000), "R$ 300,00");
});
