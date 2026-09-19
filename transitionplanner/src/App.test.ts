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
  normalizePlannerState,
  buildScenarioRows,
  type ModelSettings,
  type MonthModel,
} from "./App";
import { civilianMonthFraction, getDateIssues, isCalendarDate } from "./planningDates";

function makeSettings(overrides: Partial<ModelSettings>): ModelSettings {
  return {
    ...BASE_SETTINGS,
    timelineStartMonth: "2028-04",
    separationDate: "2028-04-15",
    terminalLeaveStartDate: "2028-02-01",
    schoolStartDate: "2028-05-01",
    schoolEndDate: "2028-10-31",
    workStartDate: "2028-05-01",
    contractEndDate: "2028-05-31",
    pellDisbursementMonth: "2028-05",
    finalMilitaryPayMonth: "2028-05",
    educationRateBasis: "manual",
    ...overrides,
  };
}

describe("public transition planner calculations", () => {
  it("accepts past and future work dates independently of the projection window", () => {
    for (const year of [2019, 2035]) {
      const settings = makeSettings({ timelineStartMonth: `${year}-01`, separationDate: `${year}-04-15`, terminalLeaveStartDate: `${year}-02-01`, workStartDate: `${year}-03-01`, contractEndDate: `${year}-06-30`, projectionMonths: 24 });
      expect(calculateSeries(settings)).toHaveLength(24);
      expect(calculateSeries(settings)[23].id).toBe(`${year + 1}-12`);
      expect(civilianMonthFraction(`${year}-02`, settings)).toBe(0);
      expect(civilianMonthFraction(`${year}-03`, settings)).toBe(1);
      expect(civilianMonthFraction(`${year}-07`, settings)).toBe(0);
    }
    const running = makeSettings({ alreadySeparated: true, workStartDate: "2020-01-01", workType: "permanent" });
    expect(civilianMonthFraction("2028-04", running)).toBe(1);
    expect(civilianMonthFraction("2019-12", running)).toBe(0);
  });

  it("prorates both work boundaries, including one-day and leap-year jobs", () => {
    const settings = makeSettings({ workStartDate: "2028-02-10", contractEndDate: "2028-02-20" });
    expect(civilianMonthFraction("2028-02", settings)).toBeCloseTo(11 / 29);
    expect(civilianMonthFraction("2028-02", { ...settings, contractEndDate: "2028-02-10" })).toBeCloseTo(1 / 29);
    expect(civilianMonthFraction("2028-02", { ...settings, workStartDate: "2028-02-01", contractEndDate: "2028-02-29" })).toBe(1);
    expect(isCalendarDate("2027-02-29")).toBe(false);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2028-13-01")).toBe(false);
  });

  it("allows military/civilian overlap during terminal leave but flags an earlier start", () => {
    const settings = makeSettings({ timelineStartMonth: "2028-02", workStartDate: "2028-02-01", contractEndDate: "2028-05-31", useManualTakeHome: true, manualMonthlyTakeHome: 3000 });
    const feb = calculateSeries(settings)[0];
    expect(feb.streams.military).toBeGreaterThan(0);
    expect(feb.streams.civilian).toBe(3000);
    const earlier = { ...settings, workStartDate: "2028-01-31" };
    expect(getDateIssues(earlier).some(issue => issue.field === "workStartDate" && issue.severity === "error")).toBe(true);
    expect(civilianMonthFraction("2028-02", earlier)).toBe(0);
    expect(civilianMonthFraction("2028-02", { ...earlier, alreadySeparated: true })).toBe(1);
    const invalidLeave = { ...settings, terminalLeaveStartDate: "2028-06-01" };
    expect(civilianMonthFraction("2028-02", invalidLeave)).toBe(0);
    expect(civilianMonthFraction("2028-05", { ...invalidLeave, workStartDate: "2028-05-01" })).toBe(1);
  });

  it("rejects reversed periods and early benefits without emitting impossible cash", () => {
    const settings = makeSettings({ workStartDate: "2028-06-01", contractEndDate: "2028-05-31", schoolStartDate: "2028-07-01", schoolEndDate: "2028-05-31", schoolTuition: 4000, vaStart: "2028-03", finalMilitaryPayMonth: "2028-03", finalMilitaryPay: 1000, ucxMode: "ifEligible", ucxWeeklyBenefit: 500 });
    expect(getDateIssues(settings).filter(issue => issue.severity === "error").map(issue => issue.field)).toEqual(expect.arrayContaining(["contractEndDate", "schoolEndDate", "vaStart", "finalMilitaryPayMonth"]));
    for (const month of calculateSeries(settings)) {
      expect(month.streams.civilian + month.streams.ucx + month.streams.education + month.streams.va + month.streams.vaBackpay + month.streams.pell + month.tuition).toBe(0);
      expect(Number.isFinite(month.total)).toBe(true);
    }
  });

  it("migrates legacy month-only jobs and keeps exact dates through subsequent saves", () => {
    const migrated = normalizePlannerState({ settings: { workStartMonth: "2021-11", contractEnd: "2022-02", timelineStartMonth: "2021-09", educationMonthlyRate: 2222 } })!.settings;
    expect(migrated.workStartDate).toBe("2021-11-16");
    expect(migrated.contractEndDate).toBe("2022-02-28");
    expect(migrated.educationMonthlyRate).toBe(2222);
    expect(migrated.projectionMonths).toBe(12);
    const exact = normalizePlannerState({ settings: { ...migrated, workStartDate: "2021-11-09", contractEndDate: "2022-02-17", projectionMonths: 24 } })!.settings;
    expect(exact.workStartDate).toBe("2021-11-09");
    expect(exact.contractEndDate).toBe("2022-02-17");
    expect(exact.projectionMonths).toBe(24);
  });

  it("keeps comparisons finite when the entire projection precedes separation", () => {
    const settings = makeSettings({ timelineStartMonth: "2015-01", projectionMonths: 1 });
    for (const row of buildScenarioRows(settings)) {
      expect(Number.isFinite(row.average)).toBe(true);
      expect(Number.isFinite(row.minimum)).toBe(true);
    }
    expect(calculateSeries({ ...settings, projectionMonths: 60 })).toHaveLength(60);
    expect(calculateSeries({ ...settings, projectionMonths: 100000 })).toHaveLength(60);
  });

  it("bases existing VA entitlement on separation, not the displayed start month", () => {
    const settings = makeSettings({ alreadySeparated: true, separationDate: "2026-12-07", timelineStartMonth: "2029-01", vaStart: "2027-03", rating: 90, smcK: false });
    expect(getPotentialBackpay(settings)).toBeCloseTo(4724.6, 2);
    expect(calculateSeries(settings)[0].streams.va).toBe(2362.3);
    const earlyDecision = makeSettings({ separationDate: "2028-04-15", vaStart: "2028-04", rating: 90 });
    expect(calculateSeries(earlyDecision).find(month => month.id === "2028-05")!.streams.va).toBe(0);
    expect(calculateSeries(earlyDecision).find(month => month.id === "2028-06")!.streams.va).toBe(2362.3);
  });
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
    expect(getEducationBenefitPay("2028-06", settings)).toBeCloseTo(533.33, 2);
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

  it("starts VA accrual after the effective-date month for a month-end separation", () => {
    const settings = makeSettings({ separationDate: "2026-12-31", timelineStartMonth: "2026-12", vaStart: "2027-03", rating: 90, smcK: false, includeVaBackpay: true });
    expect(getPotentialBackpay(settings)).toBeCloseTo(2362.3, 2);
    expect(getPotentialBackpay({ ...settings, separationDate: "2026-12-07" })).toBeCloseTo(4724.6, 2);
  });

  it("uses the MGIB enrollment month's published rate, with the deposit in arrears", () => {
    const settings = makeSettings({ educationRateBasis: "threeYear", schoolStartDate: "2026-09-01", schoolEndDate: "2027-06-30" });
    expect(getEducationBenefitPay("2026-10", settings)).toBe(2518);
    expect(getEducationBenefitPay("2026-11", settings)).toBe(2601);
    expect(getEducationBenefitPay("2026-11", { ...settings, schoolLoad: "half" })).toBe(1300.5);
    expect(getEducationBenefitPay("2026-11", { ...settings, educationRateBasis: "twoYear" })).toBe(2110);
    expect(getEducationBenefitPay("2026-11", { ...settings, educationRateBasis: "manual", educationMonthlyRate: 2800 })).toBe(2800);
  });

  it("prorates a same-month enrollment and handles full February and reversed dates", () => {
    const settings = makeSettings({ educationMonthlyRate: 3000, schoolStartDate: "2027-02-08", schoolEndDate: "2027-02-14" });
    expect(getEducationBenefitPay("2027-03", settings)).toBe(700);
    expect(getEducationBenefitPay("2027-03", { ...settings, schoolStartDate: "2027-02-01", schoolEndDate: "2027-02-28" })).toBe(3000);
    expect(getEducationBenefitPay("2027-03", { ...settings, schoolStartDate: "2027-02-20" })).toBe(0);
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
