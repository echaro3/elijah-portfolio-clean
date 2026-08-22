import { describe, expect, it } from "vitest";
import {
  BASE_SETTINGS,
  calculateSeries,
  getEducationBenefitPay,
  getPellPay,
  getPotentialBackpay,
  getReserveNeeded,
  getVaMonthly,
  getWorkPreview,
  type ModelSettings,
  type MonthModel,
} from "./App";

function makeSettings(overrides: Partial<ModelSettings>): ModelSettings {
  return {
    ...BASE_SETTINGS,
    timelineStartMonth: "2028-04",
    separationDate: "2028-04-15",
    terminalLeaveStartDate: "2028-02-01",
    schoolStartDate: "2028-05-01",
    schoolEndDate: "2028-10-31",
    workStartMonth: "2028-05",
    contractEnd: "2028-05",
    pellDisbursementMonth: "2028-05",
    finalMilitaryPayMonth: "2028-05",
    ...overrides,
  };
}

describe("public transition planner calculations", () => {
  it("looks up VA veteran-only rates with optional SMC-K", () => {
    expect(getVaMonthly({ rating: 90, smcK: true })).toBeCloseTo(2502.17, 2);
    expect(getVaMonthly({ rating: 0, smcK: false })).toBe(0);
  });

  it("keeps VA catch-up separate from recurring VA cash", () => {
    const settings = makeSettings({
      rating: 90,
      smcK: true,
      includeVaBackpay: true,
      vaStart: "2028-07",
      workType: "none",
      educationBenefit: "none",
      pellEnrollment: "none",
    });

    const series = calculateSeries(settings);
    const decisionMonth = series.find((month) => month.id === "2028-07");
    const firstRecurringMonth = series.find((month) => month.id === "2028-08");

    expect(getPotentialBackpay(settings)).toBeCloseTo(5004.34, 2);
    expect(decisionMonth?.streams.vaBackpay).toBeCloseTo(5004.34, 2);
    expect(decisionMonth?.streams.va).toBe(0);
    expect(firstRecurringMonth?.streams.va).toBeCloseTo(2502.17, 2);
  });

  it("models education benefit cash timing without stacking programs", () => {
    const settings = makeSettings({
      planningMode: "cashTiming",
      schoolStartDate: "2028-05-15",
      schoolEndDate: "2028-07-31",
      educationBenefit: "mgib",
      schoolLoad: "full",
      educationMonthlyRate: 1000,
    });

    expect(getEducationBenefitPay("2028-05", settings)).toBe(0);
    expect(getEducationBenefitPay("2028-06", settings)).toBeCloseTo(548.39, 2);
    expect(getEducationBenefitPay("2028-07", settings)).toBe(1000);

    const noBenefit = makeSettings({
      ...settings,
      educationBenefit: "none",
      educationMonthlyRate: 1000,
    });
    expect(getEducationBenefitPay("2028-07", noBenefit)).toBe(0);
  });

  it("switches Pell between cash timing and budget equivalent", () => {
    const cashSettings = makeSettings({
      planningMode: "cashTiming",
      pellCase: "typical",
      pellEnrollment: "full",
      pellDisbursementMonth: "2028-06",
    });
    const budgetSettings = makeSettings({
      ...cashSettings,
      planningMode: "budgetEquivalent",
    });

    expect(getPellPay("2028-05", cashSettings)).toBe(0);
    expect(getPellPay("2028-06", cashSettings)).toBe(1700);
    expect(getPellPay("2028-05", budgetSettings)).toBeCloseTo(283.33, 2);
  });

  it("calculates reserve need from cumulative months below essential expenses", () => {
    const months = [
      { effective: 1000 },
      { effective: 5000 },
      { effective: 2500 },
    ] as MonthModel[];

    expect(getReserveNeeded(months, { essentialExpenseTarget: 3000 })).toBe(2000);
  });

  it("calculates civilian gross from hourly pay assumptions", () => {
    const preview = getWorkPreview(
      makeSettings({
        workType: "permanent",
        payMode: "hourly",
        hourlyRate: 30,
        weeklyHours: 40,
        useManualTakeHome: false,
      }),
    );

    expect(preview.annualGross).toBe(62400);
    expect(preview.monthlyGross).toBe(5200);
    expect(preview.monthlyNet).toBeGreaterThan(0);
    expect(preview.monthlyNet).toBeLessThan(preview.monthlyGross);
  });
});
