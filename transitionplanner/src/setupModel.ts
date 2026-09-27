import type { ModelSettings } from "./App";
import { isCalendarDate, isCalendarMonth } from "./planningDates";

export const SETUP_KEY = "veteran-transition-planner:setup:v1";
export const answerKeys = ["start", "separation", "leave", "military", "work", "workStart", "payMode", "pay", "hours", "filing", "va", "rating", "vaMonth", "school", "schoolStart", "schoolEnd", "benefit", "load", "education", "tuition", "expenses"] as const;
export type AnswerKey = typeof answerKeys[number];
export type Answers = Record<AnswerKey, string>;
export type SetupState = { answers: Answers; step: number; complete: boolean; pending: Array<keyof ModelSettings> };
const pendingFields = ["separationDate", "essentialExpenseTarget", "terminalLeaveStartDate", "schoolStartDate", "schoolEndDate", "workStartDate"];
export const emptyAnswers = (): Answers => Object.fromEntries(answerKeys.map(key => [key, ""])) as Answers;
export const amount = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

export function loadSetup(): SetupState | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || !value.answers) return null;
    const answers = emptyAnswers();
    for (const key of answerKeys) answers[key] = typeof value.answers[key] === "string" ? value.answers[key].slice(0, 100) : "";
    return { answers, step: Number.isInteger(value.step) ? Math.max(0, Math.min(5, value.step)) : 0,
      complete: value.complete === true,
      pending: Array.isArray(value.pending) ? value.pending.filter((key: string) => pendingFields.includes(key)) : [] };
  } catch { return null; }
}

export function setupError(a: Answers, step: number): string | null {
  if (step === 0) {
    if (a.start && !isCalendarMonth(a.start)) return "Choose a valid projection month.";
    if (a.separation && !isCalendarDate(a.separation)) return "Choose a valid separation date.";
    if (a.leave && (!isCalendarDate(a.leave) || !a.separation || a.leave > a.separation)) return "Terminal leave must start on or before your separation date.";
    if (a.military && (!amount(a.military) || Number(a.military) > 20000)) return "Enter monthly take-home between $0 and $20,000, or leave it blank.";
  }
  if (step === 1 && a.work === "yes") {
    if (a.workStart && !isCalendarDate(a.workStart)) return "Choose a valid work start date.";
    if (a.workStart && a.separation && a.workStart <= a.separation && (!a.leave || a.workStart < a.leave)) return "For work before separation, enter terminal leave in the previous step. Work must start on or after terminal leave begins.";
    if (a.pay && (!amount(a.pay) || Number(a.pay) > (a.payMode === "annual" ? 500000 : 250))) return "This planner supports up to $250/hour or $500,000/year. Leave it blank if unsure.";
    if (a.payMode !== "annual" && a.hours && (!amount(a.hours) || Number(a.hours) < 1 || Number(a.hours) > 80)) return "Hours per week must be between 1 and 80.";
  }
  if (step === 2 && a.va === "yes") {
    if (a.rating && (!amount(a.rating) || Number(a.rating) > 100 || Number(a.rating) % 10 !== 0)) return "VA ratings run from 0 to 100 in steps of 10.";
    if (a.vaMonth && (!isCalendarMonth(a.vaMonth) || (a.separation && a.vaMonth <= a.separation.slice(0, 7)))) return "Expected VA cash must begin after the separation month.";
  }
  if (step === 3 && a.school === "yes") {
    if ((a.schoolStart && !isCalendarDate(a.schoolStart)) || (a.schoolEnd && !isCalendarDate(a.schoolEnd))) return "Choose valid school dates.";
    if (a.schoolStart && a.schoolEnd && a.schoolEnd < a.schoolStart) return "School must end on or after it starts.";
    if (a.education && (!amount(a.education) || Number(a.education) > 10000)) return "Enter education payments from $0 to $10,000/month, or leave them blank.";
    if (a.tuition && (!amount(a.tuition) || Number(a.tuition) > 50000)) return "Enter tuition from $0 to $50,000/term, or leave it blank.";
  }
  if (step === 4 && a.expenses && (!amount(a.expenses) || Number(a.expenses) > 20000)) return "Enter expenses between $0 and $20,000, or leave them blank.";
  return null;
}

export function buildSetup(a: Answers, base: ModelSettings, today = new Date()) {
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const start = isCalendarMonth(a.start) ? a.start : month;
  const separationKnown = isCalendarDate(a.separation);
  const separation = separationKnown ? a.separation : `${start}-01`;
  const workReady = a.work === "yes" && !!a.workStart && separationKnown && amount(a.pay) &&
    (a.payMode === "annual" || amount(a.hours)) && !setupError(a, 1);
  const vaReady = a.va === "yes" && separationKnown && amount(a.rating) && !!a.vaMonth && !setupError(a, 2);
  const schoolReady = a.school === "yes" && !!a.schoolStart && !!a.schoolEnd && !setupError(a, 3);
  const benefit = ["mgib", "post911", "vre"].includes(a.benefit) ? a.benefit as ModelSettings["educationBenefit"] : "none";
  const load = ["half", "threeQuarter", "full"].includes(a.load) ? a.load as ModelSettings["schoolLoad"] : "none";
  const expenseKnown = amount(a.expenses);
  const pending: Array<keyof ModelSettings> = [];
  if (!separationKnown) pending.push("separationDate");
  if (!expenseKnown) pending.push("essentialExpenseTarget");
  if (!a.leave) pending.push("terminalLeaveStartDate");
  if (!a.workStart) pending.push("workStartDate");
  if (!schoolReady) pending.push("schoolStartDate", "schoolEndDate");
  const settings: ModelSettings = {
    ...base, timelineStartMonth: start, projectionMonths: 12, planningMode: "cashTiming",
    separationDate: separation, alreadySeparated: separationKnown && separation < `${month}-${String(today.getDate()).padStart(2, "0")}`,
    terminalLeaveStartDate: a.leave || separation,
    activeDutyMonthly: separationKnown && amount(a.military) ? Number(a.military) : 0,
    separationMonthMilitaryPay: 0, militaryPayDeductionTotal: 0, finalMilitaryPay: 0, finalMilitaryPayMonth: "none",
    workType: workReady ? "permanent" : "none", workStartDate: a.workStart || separation, contractEndDate: "",
    payMode: a.payMode === "annual" ? "annual" : "hourly", hourlyRate: workReady && a.payMode !== "annual" ? Number(a.pay) : 0,
    annualSalary: workReady && a.payMode === "annual" ? Number(a.pay) : 0, weeklyHours: a.payMode === "annual" ? 40 : amount(a.hours) ? Number(a.hours) : 1,
    partTimeHours: amount(a.hours) ? Math.min(40, Number(a.hours)) : 0, payrollType: "w2",
    filingStatus: a.filing === "marriedJoint" || a.filing === "headOfHousehold" ? a.filing : "single",
    useManualTakeHome: false, manualMonthlyTakeHome: 0, pretaxMonthlyDeductions: 0, posttaxMonthlyDeductions: 0, extraTaxReservePercent: 0,
    rating: (vaReady ? Number(a.rating) : 0) as ModelSettings["rating"], vaStart: vaReady ? a.vaMonth : "none",
    smcK: false, includeVaBackpay: false, ucxMode: "off", ucxWeeklyBenefit: 0,
    schoolStartDate: schoolReady ? a.schoolStart : `${start}-01`, schoolEndDate: schoolReady ? a.schoolEnd : `${start}-01`,
    educationBenefit: schoolReady && load !== "none" && amount(a.education) ? benefit : "none", educationRateBasis: "manual",
    educationMonthlyRate: schoolReady && amount(a.education) ? Number(a.education) : 0,
    schoolLoad: schoolReady ? load : "none", schoolTuition: schoolReady && amount(a.tuition) ? Number(a.tuition) : 0,
    pellCase: base.pellCase, pellEnrollment: "none", pellDisbursementMonth: schoolReady ? a.schoolStart.slice(0, 7) : start,
    essentialExpenseTarget: expenseKnown ? Number(a.expenses) : 0,
    normalLifestyleTarget: expenseKnown ? Number(a.expenses) : 0, idealSavingsTarget: expenseKnown ? Number(a.expenses) : 0,
  };
  return { settings, pending };
}

export function setupInsights(settings: ModelSettings, pending: Array<keyof ModelSettings>) {
  const notes: string[] = [];
  if (pending.includes("separationDate")) notes.push("Add a separation date to anchor the transition. No date-specific forecast is shown yet.");
  if (pending.includes("essentialExpenseTarget")) notes.push("Add housing, food, transport, insurance and minimum debt payments before relying on a cash-gap or reserve estimate.");
  else notes.push(`Your essential spending target is $${settings.essentialExpenseTarget.toLocaleString()} per month. The reserve estimate compares modeled income against that target, not your current savings balance.`);
  if (!settings.activeDutyMonthly) notes.push("Military take-home is not included. Use a recent pay statement if it will continue during this projection.");
  if (settings.workType === "none") notes.push("Civilian income is not included. Add a start date and expected pay when the job plan is clearer.");
  else {
    notes.push("Civilian pay is an estimate for W-2 employment using the selected filing status. State taxes and personal deductions still need review.");
    if (!pending.includes("separationDate")) notes.push(settings.workStartDate <= settings.separationDate
      ? "Your job starts during the military-pay period. Treat any overlap as temporary when deciding what you can afford after separation."
      : "Your job begins after separation. Check the months between your final military pay and the first civilian paycheck; a work start date is not necessarily a deposit date.");
  }
  if (settings.vaStart === "none") notes.push("VA income is not included. Confirm the award and likely first deposit before relying on it.");
  if (settings.educationBenefit === "none") notes.push("Education payments are not included. Your school can confirm enrollment dates, the benefit and expected payment.");
  if (settings.ucxMode === "off" && settings.pellEnrollment === "none" && !settings.includeVaBackpay && !settings.finalMilitaryPay) notes.push("UCX, Pell, VA catch-up and final military pay are excluded. Add confirmed amounts in the inputs.");
  return notes;
}
