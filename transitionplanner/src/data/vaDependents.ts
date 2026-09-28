import { VA_DISABILITY_RATE_DATASET, type VaRating } from "./benefitRates";

export type VaDependents = { spouse: boolean; parents: number; children: number; students: number; spouseAid: boolean };
export const NO_VA_DEPENDENTS: VaDependents = { spouse: false, parents: 0, children: 0, students: 0, spouseAid: false };
export const VA_DEPENDENTS_VERIFIED = "2026-09-28";

// VA.gov 2026 table, effective December 1, 2025. Dollar values are converted
// to cents before arithmetic so household combinations retain exact cents.
// Columns: spouse, child only, spouse + child, each parent, extra child, student, spouse A&A.
const rates: Record<number, readonly number[]> = {
  30: [617.47, 596.47, 666.47, 52, 32, 105, 61],
  40: [882.84, 853.84, 947.84, 70, 43, 140, 81],
  50: [1241.90, 1205.90, 1322.90, 88, 54, 176, 101],
  60: [1566.02, 1523.02, 1663.02, 105, 65, 211, 121],
  70: [1961.45, 1910.45, 2074.45, 123, 76, 246, 141],
  80: [2277.15, 2219.15, 2406.15, 140, 87, 281, 161],
  90: [2559.30, 2494.30, 2704.30, 158, 98, 317, 181],
  100: [4158.17, 4085.43, 4318.99, 176.24, 109.11, 352.45, 201.41],
};

export function normalizeVaDependents(value: unknown): VaDependents {
  const v = value && typeof value === "object" ? value as Partial<VaDependents> : {};
  const count = (n: unknown, max: number) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  return { spouse: v.spouse === true, parents: count(v.parents, 2), children: count(v.children, 99), students: count(v.students, 99), spouseAid: v.spouse === true && v.spouseAid === true };
}

export function vaCompensation(rating: VaRating, household: VaDependents = NO_VA_DEPENDENTS) {
  const base = VA_DISABILITY_RATE_DATASET.rates[rating];
  if (rating < 30) return base;
  const d = normalizeVaDependents(household);
  const [spouse, child, both, parent, extraChild, student, aid] = rates[rating];
  const cents = (n: number) => Math.round(n * 100);
  const basic = d.children > 0 ? (d.spouse ? both : child) : (d.spouse ? spouse : base);
  return (cents(basic) + d.parents * cents(parent) + Math.max(0, d.children - 1) * cents(extraChild)
    + d.students * cents(student) + (d.spouseAid ? cents(aid) : 0)) / 100;
}
