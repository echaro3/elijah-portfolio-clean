import { describe, expect, it } from "vitest";
import { vaCompensation, NO_VA_DEPENDENTS, normalizeVaDependents } from "./data/vaDependents";
import { type VaRating } from "./data/benefitRates";
import { BASE_SETTINGS, getVaMonthly, normalizePlannerState, getPotentialBackpay } from "./App";
import { buildSetup, emptyAnswers } from "./setupModel";

describe("official 2026 VA compensation", () => {
  it.each([
    [0, 0], [10, 180.42], [20, 356.66], [30, 552.47], [40, 795.84],
    [50, 1132.90], [60, 1435.02], [70, 1808.45], [80, 2102.15], [90, 2362.30], [100, 3938.58],
  ])("matches the veteran-only table at %i percent", (rating, expected) => {
    expect(vaCompensation(rating as VaRating)).toBe(expected);
  });
  it.each([0, 10, 20])("does not add dependent pay below 30 percent: %i", rating => {
    expect(vaCompensation(rating as VaRating, { spouse: true, parents: 2, children: 3, students: 2, spouseAid: true })).toBe(vaCompensation(rating as VaRating));
  });
  it.each([
    [30, 770.47], [40, 1087.84], [50, 1498.90], [60, 1873.02],
    [70, 2320.45], [80, 2686.15], [90, 3020.30], [100, 4671.47],
  ])("matches spouse, child, two parents table at %i percent", (rating, expected) => {
    expect(vaCompensation(rating as VaRating, { ...NO_VA_DEPENDENTS, spouse: true, children: 1, parents: 2 })).toBe(expected);
  });
  it("matches the VA worked example with three children and spouse A&A", () => {
    expect(vaCompensation(70, { ...NO_VA_DEPENDENTS, spouse: true, children: 3, spouseAid: true })).toBe(2367.45);
  });
  it("adds qualifying students without counting them again as minor children", () => {
    expect(vaCompensation(100, { ...NO_VA_DEPENDENTS, students: 1 })).toBe(4291.03);
    expect(vaCompensation(100, { spouse: true, parents: 2, children: 2, students: 1, spouseAid: true })).toBe(5334.44);
  });
  it("normalizes legacy and malformed household data", () => {
    expect(normalizeVaDependents(undefined)).toEqual(NO_VA_DEPENDENTS);
    expect(normalizeVaDependents({ parents: 10, children: -1, students: 1.9, spouseAid: true })).toEqual({ ...NO_VA_DEPENDENTS, parents: 2, students: 1 });
    const legacy = { ...BASE_SETTINGS, vaDependents: undefined };
    expect(normalizePlannerState({ scenarioId: "schoolFirst", settings: legacy })!.settings.vaDependents).toEqual(NO_VA_DEPENDENTS);
  });
  it("carries questionnaire household data into saved rates and catch-up pay", () => {
    const result = buildSetup({ ...emptyAnswers(), separation: "2026-12-07", va: "yes", rating: "90", vaMonth: "2027-03", vaSpouse: "yes", vaParents: "2", vaChildren: "1" }, BASE_SETTINGS);
    const saved = normalizePlannerState({ scenarioId: "schoolFirst", settings: result.settings })!.settings;
    expect(saved.vaDependents).toEqual(result.settings.vaDependents);
    expect(getVaMonthly(saved)).toBe(3020.30);
    expect(getVaMonthly({ ...saved, smcK: true })).toBe(3160.17);
    expect(getPotentialBackpay({ ...saved, includeVaBackpay: true })).toBe(6040.60);
  });
});
