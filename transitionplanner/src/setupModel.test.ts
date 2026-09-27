import { describe, expect, it, vi, afterEach } from "vitest";
import { BASE_SETTINGS, calculateSeries, normalizePlannerState } from "./App";
import { buildSetup, emptyAnswers, loadSetup, setupError, type Answers } from "./setupModel";

const today = new Date(2026, 8, 27);
const answers = (patch: Partial<Answers> = {}) => ({ ...emptyAnswers(), ...patch });
afterEach(() => vi.unstubAllGlobals());

describe("guided setup", () => {
  it("excludes all unknown income instead of inheriting example values", () => {
    const result = buildSetup(emptyAnswers(), BASE_SETTINGS, today);
    expect(result.settings.timelineStartMonth).toBe("2026-09");
    expect(result.pending).toEqual(expect.arrayContaining(["separationDate", "essentialExpenseTarget"]));
    expect(calculateSeries(result.settings).every(month => month.total === 0)).toBe(true);
    expect(result.settings.includeVaBackpay).toBe(false);
  });
  it("distinguishes an explicit zero budget from a blank", () => {
    expect(buildSetup(answers({ separation: "2027-01-15", expenses: "0" }), BASE_SETTINGS, today).pending).not.toContain("essentialExpenseTarget");
    expect(buildSetup(answers({ separation: "2027-01-15" }), BASE_SETTINGS, today).pending).toContain("essentialExpenseTarget");
  });
  it("does not invent civilian income with incomplete answers", () => {
    const result = buildSetup(answers({ work: "yes", pay: "30", separation: "2026-12-15" }), BASE_SETTINGS, today);
    expect(result.settings.workType).toBe("none");
  });
  it("validates terminal leave overlap", () => {
    const a = answers({ separation: "2026-12-15", leave: "2026-11-01", work: "yes", workStart: "2026-10-15", pay: "30", hours: "40" });
    expect(setupError(a, 1)).toContain("terminal leave");
    a.workStart = "2026-11-02";
    expect(setupError(a, 1)).toBeNull();
    expect(buildSetup(a, BASE_SETTINGS, today).settings.workType).toBe("permanent");
  });
  it("rejects reversed school dates and invalid ratings", () => {
    expect(setupError(answers({ school: "yes", schoolStart: "2027-08-01", schoolEnd: "2027-01-01" }), 3)).not.toBeNull();
    expect(setupError(answers({ va: "yes", rating: "95" }), 2)).not.toBeNull();
    expect(setupError(answers({ expenses: "-1" }), 4)).not.toBeNull();
  });
  it("only enables education payments with sufficient details", () => {
    const a = answers({ school: "yes", schoolStart: "2027-01-01", schoolEnd: "2027-06-30", education: "1200" });
    expect(buildSetup(a, BASE_SETTINGS, today).settings.educationBenefit).toBe("none");
    a.benefit = "vre"; a.load = "full";
    expect(buildSetup(a, BASE_SETTINGS, today).settings.educationBenefit).toBe("vre");
  });
  it("keeps valid answers stable across the existing persistence normalizer", () => {
    const a = answers({ start: "2026-10", separation: "2026-12-15", military: "4000", work: "yes", workStart: "2027-01-01", payMode: "annual", pay: "75000", expenses: "3000", va: "yes", rating: "70", vaMonth: "2027-03", school: "yes", schoolStart: "2027-01-01", schoolEnd: "2027-06-30", benefit: "mgib", load: "full", education: "2000" });
    const result = buildSetup(a, BASE_SETTINGS, today);
    const restored = normalizePlannerState({ scenarioId: "fullTime", settings: result.settings })!;
    expect(calculateSeries(restored.settings)).toEqual(calculateSeries(result.settings));
  });
  it("handles corrupt or unavailable draft storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => "not json" });
    expect(loadSetup()).toBeNull();
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
    expect(loadSetup()).toBeNull();
  });
  it("restores the draft and clamps an invalid step", () => {
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify({ answers: { separation: "2027-05-01" }, step: 99, complete: false }) });
    expect(loadSetup()?.step).toBe(5);
    expect(loadSetup()?.answers.separation).toBe("2027-05-01");
  });
});
