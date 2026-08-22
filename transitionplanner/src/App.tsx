import * as React from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  GraduationCap,
  Landmark,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import {
  BENEFIT_RATE_DATASETS,
  MGIB_ACTIVE_DUTY_RATE_DATASET,
  PELL_GRANT_RATE_DATASET,
  SMC_K_RATE_DATASET,
  VA_DISABILITY_RATE_DATASET,
  type PellCaseId,
  type VaRating,
} from "./data/benefitRates";
import { SOURCE_LINKS } from "./data/sources";
import { getExpenseTargets } from "./plannerModel";

const FinancialTimeline3D = React.lazy(
  () => import("./components/FinancialTimeline3D/FinancialTimeline3D"),
);

const MONEY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DETAILED_MONEY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const PROJECTION_MONTH_COUNT = 12;
const DEFAULT_TIMELINE_START_MONTH = getCurrentMonthId();
const DEFAULT_SEPARATION_DATE = `${addMonths(DEFAULT_TIMELINE_START_MONTH, 4)}-15`;
const DEFAULT_SCHOOL_START_DATE = `${addMonths(toMonthId(DEFAULT_SEPARATION_DATE), 1)}-01`;
const DEFAULT_SCHOOL_END_MONTH = addMonths(toMonthId(DEFAULT_SCHOOL_START_DATE), 5);
const DEFAULT_SCHOOL_END_DATE = `${DEFAULT_SCHOOL_END_MONTH}-${getDaysInMonth(DEFAULT_SCHOOL_END_MONTH)}`;
const MONTHS = buildTimelineMonths(DEFAULT_TIMELINE_START_MONTH, PROJECTION_MONTH_COUNT);

export type MonthId = string;
type Rating = VaRating;
type ScenarioId = "schoolFirst" | "bridge" | "partTime" | "fullTime" | "delayedVa";
type WorkType = "none" | "contract" | "partTime" | "permanent";
type UcxMode = "off" | "ifEligible";
type ContractEnd = MonthId;
type VaStart = MonthId | "none";
type PayMode = "hourly" | "annual";
type PlanningMode = "cashTiming" | "budgetEquivalent";
type PayrollType = "w2" | "selfEmployed";
type FilingStatus = "single" | "marriedJoint" | "headOfHousehold";
type FinalPayMonth = MonthId | "none";
type PellEnrollment = "none" | "half" | "threeQuarter" | "full";
type SchoolLoad = "none" | "half" | "threeQuarter" | "full";
type EducationBenefit = "none" | "mgib" | "post911" | "vre";
export type IncomeKey = "military" | "civilian" | "ucx" | "vaBackpay" | "va" | "education" | "pell";
export type Status = "green" | "yellow" | "red";

export type ModelSettings = {
  planningMode: PlanningMode;
  timelineStartMonth: MonthId;
  alreadySeparated: boolean;
  separationDate: string;
  terminalLeaveStartDate: string;
  schoolStartDate: string;
  schoolEndDate: string;
  workStartMonth: MonthId;
  pellDisbursementMonth: MonthId;
  activeDutyMonthly: number;
  rating: Rating;
  smcK: boolean;
  vaStart: VaStart;
  workType: WorkType;
  contractEnd: ContractEnd;
  payMode: PayMode;
  hourlyRate: number;
  annualSalary: number;
  weeklyHours: number;
  partTimeHours: number;
  payrollType: PayrollType;
  filingStatus: FilingStatus;
  useManualTakeHome: boolean;
  manualMonthlyTakeHome: number;
  pretaxMonthlyDeductions: number;
  posttaxMonthlyDeductions: number;
  extraTaxReservePercent: number;
  includeVaBackpay: boolean;
  ucxMode: UcxMode;
  ucxWeeklyBenefit: number;
  educationBenefit: EducationBenefit;
  schoolLoad: SchoolLoad;
  educationMonthlyRate: number;
  pellCase: PellCaseId;
  pellEnrollment: PellEnrollment;
  schoolTuition: number;
  militaryPayDeductionTotal: number;
  separationMonthMilitaryPay: number;
  finalMilitaryPay: number;
  finalMilitaryPayMonth: FinalPayMonth;
  essentialExpenseTarget: number;
  normalLifestyleTarget: number;
  idealSavingsTarget: number;
};

type PlannerState = {
  scenarioId: ScenarioId;
  settings: ModelSettings;
};

export type MonthModel = {
  id: MonthId;
  short: string;
  label: string;
  streams: Record<IncomeKey, number>;
  total: number;
  tuition: number;
  effective: number;
  gapToFloor: number;
  status: Status;
};

type ScenarioPreset = {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  description: string;
  recommendation: string;
  settings: ModelSettings;
  stress: string;
  schoolTime: string;
  risk: string;
  pellImplication: string;
  ucxImplication: string;
};

const DEFAULT_ACTIVE_DUTY_MONTHLY = 4200;
const DEFAULT_ESSENTIAL_EXPENSE_TARGET = 3200;
const DEFAULT_NORMAL_LIFESTYLE_TARGET = 4000;
const DEFAULT_IDEAL_SAVINGS_TARGET = 4800;
const DEFAULT_SCHOOL_TUITION = 0;
const DEFAULT_EDUCATION_MONTHLY_RATE = MGIB_ACTIVE_DUTY_RATE_DATASET.fullTimeMonthlyRate;
const SEPARATION_MONTH_MILITARY_PAY_DEFAULT = 0;
const FINAL_MILITARY_PAY_DEFAULT = 0;
const UCX_WEEKLY_MAX = 605;
const DEFAULT_UCX_WEEKLY_BENEFIT = UCX_WEEKLY_MAX;
const UCX_TAX_HOLD_BACK = 0.9;
const SMC_K_RATE = SMC_K_RATE_DATASET.monthlyRate;
const VA_RATES = VA_DISABILITY_RATE_DATASET.rates;
const PELL_CASES = PELL_GRANT_RATE_DATASET.cases;
const PLANNER_STORAGE_KEY = "veteran-transition-planner:v1";
const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const SELF_EMPLOYMENT_TAXABLE_RATIO = 0.9235;

const STANDARD_DEDUCTIONS_2026: Record<FilingStatus, number> = {
  single: 16100,
  marriedJoint: 32200,
  headOfHousehold: 24150,
};

const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  marriedJoint: 250000,
  headOfHousehold: 200000,
};

const TAX_BRACKETS_2026: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 12400, rate: 0.1 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  marriedJoint: [
    { upTo: 24800, rate: 0.1 },
    { upTo: 100800, rate: 0.12 },
    { upTo: 211400, rate: 0.22 },
    { upTo: 403550, rate: 0.24 },
    { upTo: 512450, rate: 0.32 },
    { upTo: 768700, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  headOfHousehold: [
    { upTo: 17700, rate: 0.1 },
    { upTo: 67450, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201750, rate: 0.24 },
    { upTo: 256200, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
};

const INCOME_ORDER: IncomeKey[] = ["military", "civilian", "ucx", "vaBackpay", "va", "education", "pell"];

const INCOME_LABELS: Record<IncomeKey, string> = {
  military: "Military pay",
  civilian: "Civilian work",
  ucx: "UCX",
  vaBackpay: "VA catch-up",
  va: "VA monthly",
  education: "Education benefit",
  pell: "Pell",
};

const BASE_SETTINGS: ModelSettings = {
  planningMode: "cashTiming",
  timelineStartMonth: DEFAULT_TIMELINE_START_MONTH,
  alreadySeparated: false,
  separationDate: DEFAULT_SEPARATION_DATE,
  terminalLeaveStartDate: `${addMonths(toMonthId(DEFAULT_SEPARATION_DATE), -2)}-01`,
  schoolStartDate: DEFAULT_SCHOOL_START_DATE,
  schoolEndDate: DEFAULT_SCHOOL_END_DATE,
  workStartMonth: addMonths(toMonthId(DEFAULT_SEPARATION_DATE), -1),
  pellDisbursementMonth: toMonthId(DEFAULT_SCHOOL_START_DATE),
  activeDutyMonthly: DEFAULT_ACTIVE_DUTY_MONTHLY,
  rating: 70,
  smcK: false,
  vaStart: addMonths(toMonthId(DEFAULT_SEPARATION_DATE), 3),
  workType: "contract",
  contractEnd: addMonths(toMonthId(DEFAULT_SEPARATION_DATE), 1),
  payMode: "hourly",
  hourlyRate: 30,
  annualSalary: 65000,
  weeklyHours: 40,
  partTimeHours: 20,
  payrollType: "w2",
  filingStatus: "single",
  useManualTakeHome: false,
  manualMonthlyTakeHome: 3500,
  pretaxMonthlyDeductions: 0,
  posttaxMonthlyDeductions: 0,
  extraTaxReservePercent: 2,
  includeVaBackpay: true,
  ucxMode: "off",
  ucxWeeklyBenefit: DEFAULT_UCX_WEEKLY_BENEFIT,
  educationBenefit: "mgib",
  schoolLoad: "full",
  educationMonthlyRate: DEFAULT_EDUCATION_MONTHLY_RATE,
  pellCase: "typical",
  pellEnrollment: "full",
  schoolTuition: DEFAULT_SCHOOL_TUITION,
  militaryPayDeductionTotal: 0,
  separationMonthMilitaryPay: SEPARATION_MONTH_MILITARY_PAY_DEFAULT,
  finalMilitaryPay: FINAL_MILITARY_PAY_DEFAULT,
  finalMilitaryPayMonth: addMonths(toMonthId(DEFAULT_SEPARATION_DATE), 1),
  essentialExpenseTarget: DEFAULT_ESSENTIAL_EXPENSE_TARGET,
  normalLifestyleTarget: DEFAULT_NORMAL_LIFESTYLE_TARGET,
  idealSavingsTarget: DEFAULT_IDEAL_SAVINGS_TARGET,
};

const SCENARIOS: Record<ScenarioId, ScenarioPreset> = {
  schoolFirst: {
    id: "schoolFirst",
    label: "Scenario A - School-first",
    shortLabel: "School-first",
    description: "No civilian job after separation; school benefits and reserves carry the transition.",
    recommendation: "Only comfortable if benefits are confirmed or the reserve target covers delayed cash.",
    stress: "High until VA and education benefits are flowing",
    schoolTime: "Best",
    risk: "High",
    pellImplication: "Cleanest reduced-income story for professional judgment, but not automatic.",
    ucxImplication: "Possible after separation if eligible; school availability rules need state verification.",
    settings: {
      ...BASE_SETTINGS,
      workType: "none",
      vaStart: addMonths(toMonthId(BASE_SETTINGS.separationDate), 3),
      ucxMode: "ifEligible",
      hourlyRate: 30,
    },
  },
  bridge: {
    id: "bridge",
    label: "Scenario B - Temporary bridge",
    shortLabel: "Contract bridge",
    description: "Temporary civilian work bridges the final military-pay period and early school/benefit timing.",
    recommendation: "Best balance: use any work overlap to build reserve, clean up urgent debt, and keep school optionality.",
    stress: "Medium, then lower if reserve is saved",
    schoolTime: "Strong after contract ends",
    risk: "Medium",
    pellImplication: "Some income may weaken the special-circumstances case, but a natural contract end is easier to explain.",
    ucxImplication: "Potentially better fact pattern if the contract ends naturally; still verify with the state workforce agency.",
    settings: {
      ...BASE_SETTINGS,
      workType: "contract",
      contractEnd: addMonths(toMonthId(BASE_SETTINGS.separationDate), 1),
      vaStart: addMonths(toMonthId(BASE_SETTINGS.separationDate), 3),
      ucxMode: "off",
      hourlyRate: 30,
    },
  },
  partTime: {
    id: "partTime",
    label: "Scenario C - Part-time work",
    shortLabel: "Part-time + school",
    description: "Part-time civilian work continues while school or training remains the primary transition plan.",
    recommendation: "Strong if you can cap hours and protect study pace; best practical fallback if VA is late.",
    stress: "Medium",
    schoolTime: "Good if hours stay capped",
    risk: "Medium-low",
    pellImplication: "Income may reduce the strength of a reduced-income aid appeal, but the monthly floor is steadier.",
    ucxImplication: "Part-time wages may reduce or eliminate UCX; partial-benefit math is highly fact-specific.",
    settings: {
      ...BASE_SETTINGS,
      workType: "partTime",
      hourlyRate: 30,
      partTimeHours: 20,
      vaStart: addMonths(toMonthId(BASE_SETTINGS.separationDate), 3),
      ucxMode: "off",
    },
  },
  fullTime: {
    id: "fullTime",
    label: "Scenario D - Full-time job + school",
    shortLabel: "Full-time job",
    description: "Permanent full-time civilian work continues alongside school, training, or benefit planning.",
    recommendation: "Financially strongest, but it can turn school into a second job instead of the main transition plan.",
    stress: "High workload, low cash stress",
    schoolTime: "Weakest",
    risk: "Low cash risk, high time risk",
    pellImplication: "Likely weakest special-circumstances case because replacement income is steady.",
    ucxImplication: "UCX generally not part of this path while employed full-time.",
    settings: {
      ...BASE_SETTINGS,
      workType: "permanent",
      hourlyRate: 30,
      vaStart: addMonths(toMonthId(BASE_SETTINGS.separationDate), 3),
      ucxMode: "off",
    },
  },
  delayedVa: {
    id: "delayedVa",
    label: "Scenario E - Delayed VA stress case",
    shortLabel: "Delayed VA",
    description: "VA cash is delayed several months, with no civilian work and no UCX relied on.",
    recommendation: "Use this as the no-surprises reserve test; do not let this be the unplanned default.",
    stress: "Very high before VA begins",
    schoolTime: "Best, if affordable",
    risk: "Very high",
    pellImplication: "Strong reduced-income argument, but timing and award are still school decisions.",
    ucxImplication: "Models UCX at zero to show the reserve needed without it.",
    settings: {
      ...BASE_SETTINGS,
      workType: "none",
      vaStart: addMonths(toMonthId(BASE_SETTINGS.separationDate), 5),
      ucxMode: "off",
      hourlyRate: 30,
    },
  },
};

const PAYROLL_TYPE_OPTIONS: { value: PayrollType; label: string }[] = [
  { value: "w2", label: "W-2 employee" },
  { value: "selfEmployed", label: "1099 / self-employed" },
];

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "headOfHousehold", label: "Head of household" },
];

const WORK_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "none", label: "No civilian work" },
  { value: "contract", label: "Temporary contract" },
  { value: "partTime", label: "Part-time work" },
  { value: "permanent", label: "Full-time civilian" },
];

const EDUCATION_BENEFIT_OPTIONS: { value: EducationBenefit; label: string }[] = [
  { value: "none", label: "No education benefit" },
  { value: "mgib", label: "MGIB-AD" },
  { value: "post911", label: "Post-9/11 GI Bill" },
  { value: "vre", label: "VR&E" },
];

const SCHOOL_LOAD_OPTIONS: { value: SchoolLoad; label: string; factor: number }[] = [
  { value: "none", label: "Not enrolled", factor: 0 },
  { value: "half", label: "Half-time", factor: 0.5 },
  { value: "threeQuarter", label: "3/4-time", factor: 0.75 },
  { value: "full", label: "Full-time", factor: 1 },
];

const PELL_ENROLLMENT_OPTIONS: {
  value: PellEnrollment;
  label: string;
  factor: number;
}[] = [
  { value: "none", label: "No Pell", factor: 0 },
  { value: "half", label: "Half-time", factor: 0.5 },
  { value: "threeQuarter", label: "3/4-time", factor: 0.75 },
  { value: "full", label: "Full Pell", factor: 1 },
];

const RATING_OPTIONS: { value: Rating; label: string }[] = [
  { value: 0, label: "0%" },
  { value: 10, label: "10%" },
  { value: 20, label: "20%" },
  { value: 30, label: "30%" },
  { value: 40, label: "40%" },
  { value: 50, label: "50%" },
  { value: 60, label: "60%" },
  { value: 70, label: "70%" },
  { value: 80, label: "80%" },
  { value: 90, label: "90%" },
  { value: 100, label: "100%" },
];

const PELL_CASE_OPTIONS: { value: PellCaseId; label: string }[] = Object.entries(PELL_CASES).map(
  ([value, pellCase]) => ({
    value: value as PellCaseId,
    label: `${pellCase.label} - ${formatMoney(pellCase.termAmount)}/term`,
  }),
);

const UCX_MODE_OPTIONS: { value: UcxMode; label: string }[] = [
  { value: "off", label: "Do not rely on UCX" },
  { value: "ifEligible", label: "Model UCX if eligible" },
];

const ACTION_PLAN = [
  {
    month: "Step 1",
    title: "Lock the ground truth",
    actions: [
      "Enter your actual separation date, school dates, expected job timing, and current cash reserve.",
      "Build an expense floor with housing, utilities, transportation, food, debt minimums, healthcare, phone, and insurance.",
      "Keep official benefit letters, school certification emails, and final military-pay documents in one place.",
      "Use actual deposits to replace estimates as soon as payments begin.",
    ],
  },
  {
    month: "Step 2",
    title: "Compare work and school paths",
    actions: [
      "Model no job, temporary work, part-time work, and full-time work against the same expense floor.",
      "Use the manual take-home override if you already know an actual paycheck amount.",
      "Compare cash timing and budget-equivalent views before committing a lump-sum benefit to monthly bills.",
      "Set a reserve target before relying on any delayed VA, Pell, or unemployment payment.",
    ],
  },
  {
    month: "Step 3",
    title: "Verify benefits before relying",
    actions: [
      "Confirm GI Bill, VR&E, Pell, and school certification details with the official program or school office.",
      "Treat VA catch-up as one-time money, not recurring income.",
      "Check state unemployment or UCX rules directly before counting those payments.",
      "Flag future benefit rates as planning placeholders until the official rate period is published.",
    ],
  },
  {
    month: "Step 4",
    title: "Plan the danger months",
    actions: [
      "Look for months below essential expenses and decide how each shortfall would be covered.",
      "Separate recurring income from one-time deposits in the results.",
      "Stress test a delayed VA decision and a lower-than-expected Pell award.",
      "Avoid using backpay or disbursements in the budget before the money is deposited.",
    ],
  },
  {
    month: "Step 5",
    title: "Refresh with actuals",
    actions: [
      "Update the model after final military pay, first civilian paycheck, school aid, or VA cash arrives.",
      "Clear saved data before using the calculator on a shared computer.",
      "Print or save a PDF for your own records without sending financial inputs to a server.",
      "Re-run scenarios whenever a major assumption changes.",
    ],
  },
];

function getDefaultPlannerState(): PlannerState {
  return {
    scenarioId: "bridge",
    settings: { ...SCENARIOS.bridge.settings },
  };
}

function loadPlannerState(): PlannerState {
  if (typeof window === "undefined") {
    return getDefaultPlannerState();
  }

  try {
    const rawState = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!rawState) {
      return getDefaultPlannerState();
    }

    return normalizePlannerState(JSON.parse(rawState)) ?? getDefaultPlannerState();
  } catch {
    return getDefaultPlannerState();
  }
}

function savePlannerState(state: PlannerState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        scenarioId: state.scenarioId,
        settings: state.settings,
      }),
    );
  } catch {
    // Storage can fail in private browsing or locked-down environments.
  }
}

function normalizePlannerState(value: unknown): PlannerState | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const scenarioId = isScenarioId(value.scenarioId) ? value.scenarioId : "bridge";
  const savedSettings = isPlainObject(value.settings) ? value.settings : {};
  const baseSettings = SCENARIOS[scenarioId].settings;

  return {
    scenarioId,
    settings: {
      planningMode: isPlanningMode(savedSettings.planningMode)
        ? savedSettings.planningMode
        : baseSettings.planningMode,
      timelineStartMonth: isMonthId(savedSettings.timelineStartMonth)
        ? savedSettings.timelineStartMonth
        : baseSettings.timelineStartMonth,
      alreadySeparated:
        typeof savedSettings.alreadySeparated === "boolean"
          ? savedSettings.alreadySeparated
          : baseSettings.alreadySeparated,
      separationDate: isDateInput(savedSettings.separationDate)
        ? savedSettings.separationDate
        : baseSettings.separationDate,
      terminalLeaveStartDate: isDateInput(savedSettings.terminalLeaveStartDate)
        ? savedSettings.terminalLeaveStartDate
        : baseSettings.terminalLeaveStartDate,
      schoolStartDate: isDateInput(savedSettings.schoolStartDate)
        ? savedSettings.schoolStartDate
        : baseSettings.schoolStartDate,
      schoolEndDate: isDateInput(savedSettings.schoolEndDate)
        ? savedSettings.schoolEndDate
        : baseSettings.schoolEndDate,
      workStartMonth: isMonthId(savedSettings.workStartMonth)
        ? savedSettings.workStartMonth
        : baseSettings.workStartMonth,
      pellDisbursementMonth: isMonthId(savedSettings.pellDisbursementMonth)
        ? savedSettings.pellDisbursementMonth
        : baseSettings.pellDisbursementMonth,
      activeDutyMonthly: clampNumber(
        savedSettings.activeDutyMonthly,
        baseSettings.activeDutyMonthly,
        0,
        20000,
      ),
      rating: isRating(savedSettings.rating) ? savedSettings.rating : baseSettings.rating,
      smcK: typeof savedSettings.smcK === "boolean" ? savedSettings.smcK : baseSettings.smcK,
      vaStart: isVaStart(savedSettings.vaStart) ? savedSettings.vaStart : baseSettings.vaStart,
      workType: isWorkType(savedSettings.workType) ? savedSettings.workType : baseSettings.workType,
      contractEnd: isContractEnd(savedSettings.contractEnd)
        ? savedSettings.contractEnd
        : baseSettings.contractEnd,
      payMode: isPayMode(savedSettings.payMode) ? savedSettings.payMode : baseSettings.payMode,
      hourlyRate: clampNumber(savedSettings.hourlyRate, baseSettings.hourlyRate, 0, 250),
      annualSalary: clampNumber(savedSettings.annualSalary, baseSettings.annualSalary, 0, 500000),
      weeklyHours: clampNumber(savedSettings.weeklyHours, baseSettings.weeklyHours, 1, 80),
      partTimeHours: clampNumber(savedSettings.partTimeHours, baseSettings.partTimeHours, 0, 40),
      payrollType: isPayrollType(savedSettings.payrollType)
        ? savedSettings.payrollType
        : baseSettings.payrollType,
      filingStatus: isFilingStatus(savedSettings.filingStatus)
        ? savedSettings.filingStatus
        : baseSettings.filingStatus,
      useManualTakeHome:
        typeof savedSettings.useManualTakeHome === "boolean"
          ? savedSettings.useManualTakeHome
          : baseSettings.useManualTakeHome,
      manualMonthlyTakeHome: clampNumber(
        savedSettings.manualMonthlyTakeHome,
        baseSettings.manualMonthlyTakeHome,
        0,
        50000,
      ),
      pretaxMonthlyDeductions: clampNumber(
        savedSettings.pretaxMonthlyDeductions,
        baseSettings.pretaxMonthlyDeductions,
        0,
        10000,
      ),
      posttaxMonthlyDeductions: clampNumber(
        savedSettings.posttaxMonthlyDeductions,
        baseSettings.posttaxMonthlyDeductions,
        0,
        10000,
      ),
      extraTaxReservePercent: clampNumber(
        savedSettings.extraTaxReservePercent,
        baseSettings.extraTaxReservePercent,
        0,
        40,
      ),
      includeVaBackpay:
        typeof savedSettings.includeVaBackpay === "boolean"
          ? savedSettings.includeVaBackpay
          : baseSettings.includeVaBackpay,
      ucxMode: isUcxMode(savedSettings.ucxMode) ? savedSettings.ucxMode : baseSettings.ucxMode,
      ucxWeeklyBenefit: clampNumber(
        savedSettings.ucxWeeklyBenefit,
        baseSettings.ucxWeeklyBenefit,
        0,
        UCX_WEEKLY_MAX,
      ),
      educationBenefit: isEducationBenefit(savedSettings.educationBenefit)
        ? savedSettings.educationBenefit
        : baseSettings.educationBenefit,
      schoolLoad: isSchoolLoad(savedSettings.schoolLoad)
        ? savedSettings.schoolLoad
        : baseSettings.schoolLoad,
      educationMonthlyRate: clampNumber(
        savedSettings.educationMonthlyRate,
        baseSettings.educationMonthlyRate,
        0,
        10000,
      ),
      pellCase: isPellCaseId(savedSettings.pellCase)
        ? savedSettings.pellCase
        : baseSettings.pellCase,
      pellEnrollment: isPellEnrollment(savedSettings.pellEnrollment)
        ? savedSettings.pellEnrollment
        : baseSettings.pellEnrollment,
      schoolTuition: clampNumber(savedSettings.schoolTuition, baseSettings.schoolTuition, 0, 50000),
      militaryPayDeductionTotal: clampNumber(
        savedSettings.militaryPayDeductionTotal,
        baseSettings.militaryPayDeductionTotal,
        0,
        20000,
      ),
      separationMonthMilitaryPay: clampNumber(
        savedSettings.separationMonthMilitaryPay,
        baseSettings.separationMonthMilitaryPay,
        0,
        10000,
      ),
      finalMilitaryPay: clampNumber(
        savedSettings.finalMilitaryPay,
        baseSettings.finalMilitaryPay,
        0,
        10000,
      ),
      finalMilitaryPayMonth: isFinalPayMonth(savedSettings.finalMilitaryPayMonth)
        ? savedSettings.finalMilitaryPayMonth
        : baseSettings.finalMilitaryPayMonth,
      essentialExpenseTarget: clampNumber(
        savedSettings.essentialExpenseTarget,
        baseSettings.essentialExpenseTarget,
        0,
        20000,
      ),
      normalLifestyleTarget: clampNumber(
        savedSettings.normalLifestyleTarget,
        baseSettings.normalLifestyleTarget,
        0,
        25000,
      ),
      idealSavingsTarget: clampNumber(
        savedSettings.idealSavingsTarget,
        baseSettings.idealSavingsTarget,
        0,
        30000,
      ),
    },
  };
}

const ReducedMotionContext = React.createContext(false);

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function usePrefersReducedMotion() {
  return React.useContext(ReducedMotionContext);
}

function useSectionReveal(
  shellRef: React.RefObject<HTMLElement | null>,
  prefersReducedMotion: boolean,
) {
  const [motionReady, setMotionReady] = React.useState(false);

  React.useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return undefined;
    }

    const sections = Array.from(
      shell.querySelectorAll<HTMLElement>(
        [
          ":scope > .metric-grid",
          ":scope > .scenario-section",
          ":scope > .control-board",
          ":scope > .dashboard-grid",
          ":scope > .timeline-section",
          ":scope > .comparison-section",
          ":scope > .assumptions-section",
          ":scope > .action-section",
          ":scope > .source-panel",
        ].join(", "),
      ),
    );

    sections.forEach((section, index) => {
      section.classList.add("motion-reveal");
      section.style.setProperty("--reveal-index", String(index));
    });

    setMotionReady(true);

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("is-visible"));

      return () => {
        sections.forEach((section) => {
          section.classList.remove("motion-reveal", "is-visible");
          section.style.removeProperty("--reveal-index");
        });
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.14,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      sections.forEach((section) => {
        section.classList.remove("motion-reveal", "is-visible");
        section.style.removeProperty("--reveal-index");
      });
    };
  }, [prefersReducedMotion, shellRef]);

  return motionReady;
}

function useModelCue(scenarioId: ScenarioId, settings: ModelSettings) {
  const [modelCue, setModelCue] = React.useState("");
  const hasMounted = React.useRef(false);

  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    setModelCue("Recalculating model");

    const updatedTimer = window.setTimeout(() => setModelCue("Model updated"), 140);
    const clearTimer = window.setTimeout(() => setModelCue(""), 620);

    return () => {
      window.clearTimeout(updatedTimer);
      window.clearTimeout(clearTimer);
    };
  }, [scenarioId, settings]);

  return modelCue;
}

type AnimatedNumberProps = {
  value: number;
  formatter?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
};

function AnimatedNumber({
  value,
  formatter = formatMoney,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isChanging, setIsChanging] = React.useState(false);
  const displayValueRef = React.useRef(value);

  React.useEffect(() => {
    const startValue = displayValueRef.current;

    if (Object.is(startValue, value)) {
      return undefined;
    }

    if (prefersReducedMotion) {
      displayValueRef.current = value;
      setDisplayValue(value);
      setIsChanging(false);
      return undefined;
    }

    let animationFrame = 0;
    let settleTimer = 0;
    const duration = 440;
    const startedAt = performance.now();

    setIsChanging(true);

    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextValue = startValue + (value - startValue) * easedProgress;

      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      displayValueRef.current = value;
      setDisplayValue(value);
      settleTimer = window.setTimeout(() => setIsChanging(false), 160);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
    };
  }, [prefersReducedMotion, value]);

  return (
    <span className={`animated-number${isChanging ? " is-changing" : ""}${className ? ` ${className}` : ""}`}>
      {prefix}
      {formatter(displayValue)}
      {suffix}
    </span>
  );
}

type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectControlProps<T extends string | number> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

function SelectControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectControlProps<T>) {
  const fieldId = React.useId();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => Object.is(option.value, value)),
  );
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);
  const selectedOption = options[selectedIndex] ?? options[0];

  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  const chooseOption = (nextIndex: number) => {
    const nextOption = options[nextIndex];

    if (!nextOption) {
      return;
    }

    onChange(nextOption.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActiveOption = (direction: number) => {
    setActiveIndex((current) => (current + direction + options.length) % options.length);
  };

  return (
    <div className={`select-field${isOpen ? " is-open" : ""}`} ref={rootRef}>
      <span className="select-field-label" id={`${fieldId}-label`}>
        {label}
      </span>
      <button
        aria-controls={`${fieldId}-listbox`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${fieldId}-label ${fieldId}-value`}
        className="themed-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex);
              return;
            }
            moveActiveOption(1);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex);
              return;
            }
            moveActiveOption(-1);
          }

          if (event.key === "Home" && isOpen) {
            event.preventDefault();
            setActiveIndex(0);
          }

          if (event.key === "End" && isOpen) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isOpen) {
              chooseOption(activeIndex);
              return;
            }
            setIsOpen(true);
          }

          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            setIsOpen(false);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        <span id={`${fieldId}-value`}>{selectedOption?.label}</span>
        <span className="themed-select-arrow" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="themed-select-list" id={`${fieldId}-listbox`} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={Object.is(option.value, value)}
              className={index === activeIndex ? "is-active" : ""}
              id={`${fieldId}-option-${index}`}
              key={String(option.value)}
              onClick={() => chooseOption(index)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const shellRef = React.useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotionPreference();
  const [{ scenarioId, settings }, setPlannerState] =
    React.useState<PlannerState>(loadPlannerState);
  const [hoveredMonth, setHoveredMonth] = React.useState<MonthId | null>(null);

  const series = React.useMemo(() => calculateSeries(settings), [settings]);
  const summary = React.useMemo(() => summarizeSeries(series, settings), [series, settings]);
  const scenarioRows = React.useMemo(() => buildScenarioRows(settings), [settings]);
  const workPreview = React.useMemo(() => getWorkPreview(settings), [settings]);
  const modelCue = useModelCue(scenarioId, settings);
  const motionReady = useSectionReveal(shellRef, prefersReducedMotion);

  React.useEffect(() => {
    savePlannerState({ scenarioId, settings });
  }, [scenarioId, settings]);

  const updateSetting = <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => {
    setPlannerState((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
  };

  const selectScenario = (nextScenarioId: ScenarioId) => {
    const next = SCENARIOS[nextScenarioId].settings;
    setPlannerState((current) => ({
      scenarioId: nextScenarioId,
      settings: {
        ...next,
        planningMode: current.settings.planningMode,
        timelineStartMonth: current.settings.timelineStartMonth,
        alreadySeparated: current.settings.alreadySeparated,
        separationDate: current.settings.separationDate,
        terminalLeaveStartDate: current.settings.terminalLeaveStartDate,
        schoolStartDate: current.settings.schoolStartDate,
        schoolEndDate: current.settings.schoolEndDate,
        workStartMonth: current.settings.workStartMonth,
        pellDisbursementMonth: current.settings.pellDisbursementMonth,
        activeDutyMonthly: current.settings.activeDutyMonthly,
        rating: current.settings.rating,
        smcK: current.settings.smcK,
        payMode: current.settings.payMode,
        hourlyRate: current.settings.hourlyRate,
        annualSalary: current.settings.annualSalary,
        weeklyHours: current.settings.weeklyHours,
        partTimeHours: current.settings.partTimeHours,
        payrollType: current.settings.payrollType,
        filingStatus: current.settings.filingStatus,
        useManualTakeHome: current.settings.useManualTakeHome,
        manualMonthlyTakeHome: current.settings.manualMonthlyTakeHome,
        pretaxMonthlyDeductions: current.settings.pretaxMonthlyDeductions,
        posttaxMonthlyDeductions: current.settings.posttaxMonthlyDeductions,
        extraTaxReservePercent: current.settings.extraTaxReservePercent,
        includeVaBackpay: current.settings.includeVaBackpay,
        ucxWeeklyBenefit: current.settings.ucxWeeklyBenefit,
        educationBenefit: current.settings.educationBenefit,
        schoolLoad: current.settings.schoolLoad,
        educationMonthlyRate: current.settings.educationMonthlyRate,
        pellCase: current.settings.pellCase,
        pellEnrollment: current.settings.pellEnrollment,
        schoolTuition: current.settings.schoolTuition,
        militaryPayDeductionTotal: current.settings.militaryPayDeductionTotal,
        separationMonthMilitaryPay: current.settings.separationMonthMilitaryPay,
        finalMilitaryPay: current.settings.finalMilitaryPay,
        finalMilitaryPayMonth: current.settings.finalMilitaryPayMonth,
        essentialExpenseTarget: current.settings.essentialExpenseTarget,
        normalLifestyleTarget: current.settings.normalLifestyleTarget,
        idealSavingsTarget: current.settings.idealSavingsTarget,
      },
    }));
  };

  const resetPlanner = () => {
    setPlannerState(getDefaultPlannerState());
  };

  const clearSavedData = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PLANNER_STORAGE_KEY);
    }

    setPlannerState(getDefaultPlannerState());
  };

  const printPlan = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ReducedMotionContext.Provider value={prefersReducedMotion}>
    <main className={`planner-shell${motionReady ? " motion-ready" : ""}`} ref={shellRef}>
      <div className={`model-cue${modelCue ? " is-visible" : ""}`} aria-hidden="true">
        {modelCue}
      </div>

      <Header summary={summary} settings={settings} />

      <section className="metric-grid" aria-label="Planner summary">
        <MetricCard
          icon={<ShieldCheck aria-hidden="true" />}
          label="Likely safest path"
          value={SCENARIOS[scenarioId].shortLabel}
          detail={SCENARIOS[scenarioId].recommendation}
        />
        <MetricCard
          icon={<AlertTriangle aria-hidden="true" />}
          label="Lowest month in view"
          value={
            <AnimatedNumber
              value={summary.lowestMonth.effective}
              prefix={`${summary.lowestMonth.short}: `}
            />
          }
          detail={
            <>
              <AnimatedNumber
                value={summary.lowestMonth.gapToFloor}
                prefix={summary.lowestMonth.gapToFloor >= 0 ? "+" : ""}
              />{" "}
              vs essential expenses after tuition reserve.
            </>
          }
        />
        <MetricCard
          icon={<PiggyBank aria-hidden="true" />}
          label="Reserve needed after DOS"
          value={<AnimatedNumber value={summary.reserveNeeded} />}
          detail="Maximum cumulative shortfall against essential expenses after the separation month."
        />
        <MetricCard
          icon={<WalletCards aria-hidden="true" />}
          label="VA catch-up modeled"
          value={<AnimatedNumber value={summary.potentialBackpay} />}
          detail="One-time accrued cash in the selected decision month; regular VA starts the next month."
        />
      </section>

      <section className="scenario-section" aria-labelledby="scenario-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Scenario controls</p>
            <h2 id="scenario-heading">Choose the transition shape</h2>
          </div>
          <span className="model-stamp">
            Rate check: VA 2026 table
          </span>
        </div>
        <div className="scenario-buttons" role="group" aria-label="Scenario presets">
          {Object.values(SCENARIOS).map((scenario) => (
            <button
              className="scenario-button"
              type="button"
              key={scenario.id}
              aria-pressed={scenarioId === scenario.id}
              onClick={() => selectScenario(scenario.id)}
            >
              <BriefcaseBusiness aria-hidden="true" />
              <span>
                <strong>{scenario.shortLabel}</strong>
                <small>{scenario.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <ControlPanel
        settings={settings}
        workPreview={workPreview}
        onSettingChange={updateSetting}
      />

      <section className="dashboard-grid" aria-label="Income and risk visuals">
        <HolographicTimelineSection
          series={series}
          settings={settings}
          hoveredMonth={hoveredMonth}
          onMonthFocus={setHoveredMonth}
          reducedMotion={prefersReducedMotion}
        />
        <MonthlyStressGrid
          series={series}
          settings={settings}
          hoveredMonth={hoveredMonth}
          onMonthFocus={setHoveredMonth}
        />
      </section>

      <MasterTimeline
        settings={settings}
        series={series}
        hoveredMonth={hoveredMonth}
        onMonthFocus={setHoveredMonth}
      />
      <ScenarioComparison rows={scenarioRows} selectedScenario={scenarioId} />
      <AssumptionsPanel settings={settings} />
      <ActionPlan />
      <PrintSavePanel onPrint={printPlan} />
      <PrivacyPanel onReset={resetPlanner} onClearSavedData={clearSavedData} />
      <SourcePanel />
      <PrintSummary settings={settings} series={series} summary={summary} workPreview={workPreview} />
    </main>
    </ReducedMotionContext.Provider>
  );
}

type HeaderProps = {
  summary: ReturnType<typeof summarizeSeries>;
  settings: ModelSettings;
};

function Header({ summary, settings }: HeaderProps) {
  return (
    <header className="planner-header">
      <div className="header-copy">
        <p className="eyebrow">Veteran transition planner | local-only calculator</p>
        <h1>Veteran transition income model</h1>
        <p>
          A month-by-month decision-support planner for comparing civilian work, VA compensation,
          education benefits, Pell, UCX, expenses, and cash reserve risk.
        </p>
      </div>
      <div className="header-facts" aria-label="Critical facts">
        <div>
          <span>Separation date</span>
          <strong>{settings.alreadySeparated ? "Already separated" : formatDateLabel(settings.separationDate)}</strong>
        </div>
        <div>
          <span>School / training starts</span>
          <strong>{formatDateLabel(settings.schoolStartDate)}</strong>
        </div>
        <div>
          <span>Education load</span>
          <strong>{getSchoolLoadLabel(settings.schoolLoad)}</strong>
        </div>
        <div>
          <span>Critical window</span>
          <strong>{summary.criticalRiskText}</strong>
        </div>
      </div>
    </header>
  );
}

type MetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
};

function MetricCard({ icon, label, value, detail }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong className="metric-value">{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

type ControlPanelProps = {
  settings: ModelSettings;
  workPreview: ReturnType<typeof getWorkPreview>;
  onSettingChange: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
};

function ControlPanel({ settings, workPreview, onSettingChange }: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const controlGridId = React.useId();
  const vaMonthly = getVaMonthly(settings);
  const vaCatchUp = getPotentialBackpay(settings);
  const recurringVaMonth = getRecurringVaStartLabel(settings);
  const pellMonthly = getPellMonthly(settings);
  const pellTermAmount = getPellTermAmount(settings);
  const schoolLoadLabel = getSchoolLoadLabel(settings.schoolLoad);
  const educationBenefitLabel = getEducationBenefitLabel(settings.educationBenefit);
  const educationMonthly = getEducationBenefitMonthly(settings);
  const firstEducationPayment = getFirstEducationBenefitPayment(settings);
  const educationIsModeled = educationMonthly > 0 && settings.educationBenefit !== "none" && settings.schoolLoad !== "none";
  const educationRateWarning = getEducationRateWarning(settings);
  const monthOptions = getTimelineMonthOptions(settings);
  const benefitMonthOptions = [
    { value: "none" as const, label: "No VA in projection" },
    ...monthOptions,
  ];
  const finalPayMonthOptions = [
    ...monthOptions,
    { value: "none" as const, label: "Hold out until confirmed" },
  ];
  const pellEnrollmentLabel =
    PELL_ENROLLMENT_OPTIONS.find((option) => option.value === settings.pellEnrollment)?.label ??
    "No Pell";
  const workSummary =
    workPreview.monthlyGross > 0 ? `${formatMoney(workPreview.monthlyNet)}/mo net` : "No work income";

  return (
    <section
      className={`control-board${isExpanded ? " is-expanded" : " is-collapsed"}`}
      aria-labelledby="controls-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Model inputs</p>
          <h2 id="controls-heading">Stress-test the assumptions</h2>
        </div>
        <button
          className="section-toggle"
          type="button"
          aria-controls={controlGridId}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
        >
          <span>{isExpanded ? "Hide inputs" : "Show inputs"}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>

      <div className="control-summary-strip" aria-label="Current model inputs">
        <span>
          <strong>VA</strong>
          {settings.rating}%{settings.smcK ? " + SMC-K" : ""}
        </span>
        <span>
          <strong>School</strong>
          {educationBenefitLabel} / {schoolLoadLabel} / {pellEnrollmentLabel}
        </span>
        <span>
          <strong>Work</strong>
          {workSummary}
        </span>
        <span>
          <strong>Floor</strong>
          {formatMoney(settings.essentialExpenseTarget)}/mo
        </span>
      </div>

      <div className="control-grid" id={controlGridId} hidden={!isExpanded}>
        <fieldset>
          <legend>
            <CalendarDays aria-hidden="true" />
            Transition
          </legend>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.alreadySeparated}
              onChange={(event) => onSettingChange("alreadySeparated", event.target.checked)}
            />
            <span>I am already separated</span>
          </label>
          <div className="field-pair">
            <label>
              <span>Projection starts</span>
              <input
                type="month"
                value={settings.timelineStartMonth}
                onChange={(event) => onSettingChange("timelineStartMonth", event.target.value)}
              />
            </label>
            <label>
              <span>Separation date</span>
              <input
                type="date"
                value={settings.separationDate}
                disabled={settings.alreadySeparated}
                onChange={(event) => onSettingChange("separationDate", event.target.value)}
              />
            </label>
          </div>
          <div className="field-pair">
            <label>
              <span>Terminal leave starts</span>
              <input
                type="date"
                value={settings.terminalLeaveStartDate}
                disabled={settings.alreadySeparated}
                onChange={(event) => onSettingChange("terminalLeaveStartDate", event.target.value)}
              />
            </label>
            <label>
              <span>Active-duty take-home/mo</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.activeDutyMonthly}
                onChange={(event) => onSettingChange("activeDutyMonthly", Number(event.target.value))}
              />
            </label>
          </div>
          <p className="field-note">
            Inputs stay in this browser's local storage. This calculator does not need SSNs,
            claim numbers, medical details, bank credentials, or account creation.
          </p>
        </fieldset>

        <fieldset>
          <legend>
            <Landmark aria-hidden="true" />
            Benefits
          </legend>
          <SelectControl
            label="VA rating"
            value={settings.rating}
            options={RATING_OPTIONS}
            onChange={(value) => onSettingChange("rating", value)}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.smcK}
              onChange={(event) => onSettingChange("smcK", event.target.checked)}
            />
            <span>Include SMC-K ({DETAILED_MONEY_FORMATTER.format(SMC_K_RATE)}/mo)</span>
          </label>
          <SelectControl
            label="VA decision / catch-up month"
            value={settings.vaStart}
            options={benefitMonthOptions}
            onChange={(value) => onSettingChange("vaStart", value)}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.includeVaBackpay}
              onChange={(event) => onSettingChange("includeVaBackpay", event.target.checked)}
            />
            <span>Model VA catch-up deposit</span>
          </label>
          <div className="inline-result">
            <span>VA planning amount</span>
            <strong>
              <AnimatedNumber value={vaMonthly} formatter={formatDetailedMoney} suffix="/mo" />
            </strong>
            <small>
              {settings.includeVaBackpay && vaCatchUp > 0
                ? (
                    <>
                      <AnimatedNumber value={vaCatchUp} formatter={formatDetailedMoney} /> catch-up in{" "}
                      {getVaDecisionMonthLabel(settings)}.
                    </>
                  )
                : "No catch-up cash modeled."}{" "}
              {recurringVaMonth ? `Regular VA cash starts ${recurringVaMonth}.` : "No VA cash in this projection."}
            </small>
          </div>
          <p className="field-note">
            Uses 2026 VA veteran-only rates as a planning table. Catch-up uses the first full
            month after separation as the first modeled payable month.
          </p>
        </fieldset>

        <fieldset>
          <legend>
            <GraduationCap aria-hidden="true" />
            School and aid
          </legend>
          <div className="field-pair">
            <label>
              <span>School / training starts</span>
              <input
                type="date"
                value={settings.schoolStartDate}
                onChange={(event) => onSettingChange("schoolStartDate", event.target.value)}
              />
            </label>
            <label>
              <span>School / training ends</span>
              <input
                type="date"
                value={settings.schoolEndDate}
                onChange={(event) => onSettingChange("schoolEndDate", event.target.value)}
              />
            </label>
          </div>
          <SelectControl
            label="Primary education benefit"
            value={settings.educationBenefit}
            options={EDUCATION_BENEFIT_OPTIONS}
            onChange={(value) => onSettingChange("educationBenefit", value)}
          />
          <div className="segmented-label">School load</div>
          <div className="segmented-control" role="group" aria-label="School load">
            {SCHOOL_LOAD_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={settings.schoolLoad === option.value}
                onClick={() => onSettingChange("schoolLoad", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label>
            <span>Term tuition / out-of-pocket reserve</span>
            <input
              type="number"
              min={0}
              step={50}
              value={settings.schoolTuition}
              onChange={(event) => onSettingChange("schoolTuition", Number(event.target.value))}
            />
          </label>
          <label>
            <span>{getEducationRateInputLabel(settings.educationBenefit)}</span>
            <input
              type="number"
              min={0}
              step={25}
              disabled={settings.educationBenefit === "none"}
              value={settings.educationMonthlyRate}
              onChange={(event) => onSettingChange("educationMonthlyRate", Number(event.target.value))}
            />
          </label>
          <SelectControl
            label="Pell case"
            value={settings.pellCase}
            options={PELL_CASE_OPTIONS}
            onChange={(value) => onSettingChange("pellCase", value)}
          />
          <SelectControl
            label="Pell enrollment status"
            value={settings.pellEnrollment}
            options={PELL_ENROLLMENT_OPTIONS}
            onChange={(value) => onSettingChange("pellEnrollment", value)}
          />
          <SelectControl
            label="Pell disbursement month"
            value={settings.pellDisbursementMonth}
            options={monthOptions}
            onChange={(value) => onSettingChange("pellDisbursementMonth", value)}
          />
          <div className="inline-result">
            <span>Education and Pell posture</span>
            <strong>
              {educationIsModeled ? (
                <>
                  <AnimatedNumber value={educationMonthly} suffix="/mo" /> {educationBenefitLabel}
                </>
              ) : (
                "No monthly education benefit modeled"
              )}
            </strong>
            <small>
              {educationIsModeled ? (
                <>
                  First modeled {educationBenefitLabel} deposit is{" "}
                  <AnimatedNumber value={firstEducationPayment} /> based on the selected start date and cash timing.
                </>
              ) : settings.educationBenefit === "none" ? (
                "Select one primary education benefit if you want to model monthly school-related cash."
              ) : (
                "Set an enrollment load and monthly planning amount before this benefit is modeled."
              )}{" "}
              Pell is separate: <AnimatedNumber value={pellTermAmount} suffix="/term" />{" "}
              {settings.planningMode === "cashTiming"
                ? "as a term-start cash event."
                : (
                    <>
                      or <AnimatedNumber value={pellMonthly} suffix="/mo" /> as a budget equivalent.
                    </>
                  )}
            </small>
          </div>
          <p className="field-note">
            Model one primary education benefit at a time. MGIB uses the current full-time
            VA rate as an editable planning value; Post-9/11 and VR&E use manual monthly
            planning amounts until their fact-specific calculations are added. Pell remains
            separate from GI Bill assumptions and can be viewed as cash timing or budget equivalent.
            {educationRateWarning ? ` ${educationRateWarning}` : ""}
          </p>
        </fieldset>

        <fieldset className="compact-fieldset work-bridge-fieldset">
          <legend>
            <BriefcaseBusiness aria-hidden="true" />
            Work bridge
          </legend>
          <SelectControl
            label="Civilian work"
            value={settings.workType}
            options={WORK_OPTIONS}
            onChange={(value) => onSettingChange("workType", value)}
          />
          <SelectControl
            label="Work starts"
            value={settings.workStartMonth}
            options={monthOptions}
            onChange={(value) => onSettingChange("workStartMonth", value)}
          />
          <div className="segmented-label">Civilian pay basis</div>
          <div className="segmented-control two-up" role="group" aria-label="Civilian pay basis">
            <button
              type="button"
              aria-pressed={settings.payMode === "hourly"}
              onClick={() => onSettingChange("payMode", "hourly")}
            >
              Hourly
            </button>
            <button
              type="button"
              aria-pressed={settings.payMode === "annual"}
              onClick={() => onSettingChange("payMode", "annual")}
            >
              Yearly
            </button>
          </div>
          {settings.payMode === "hourly" ? (
            <div className="field-pair compact-number-pair">
              <label>
                <span>Hourly wage</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.hourlyRate}
                  onChange={(event) => onSettingChange("hourlyRate", Number(event.target.value))}
                />
              </label>
              <label>
                <span>{settings.workType === "partTime" ? "Part-time hours/week" : "Hours per week"}</span>
                <input
                  type="number"
                  min={1}
                  max={settings.workType === "partTime" ? 35 : 80}
                  step={1}
                  value={settings.workType === "partTime" ? settings.partTimeHours : settings.weeklyHours}
                  onChange={(event) =>
                    onSettingChange(
                      settings.workType === "partTime" ? "partTimeHours" : "weeklyHours",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            </div>
          ) : (
            <label>
              <span>Yearly wage / salary</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={settings.annualSalary}
                onChange={(event) => onSettingChange("annualSalary", Number(event.target.value))}
              />
            </label>
          )}
          {settings.workType === "contract" ? (
            <SelectControl
              label="Contract ends"
              value={settings.contractEnd}
              options={monthOptions}
              onChange={(value) => onSettingChange("contractEnd", value)}
            />
          ) : null}
          <div className="field-pair">
            <SelectControl
              label="Tax treatment"
              value={settings.payrollType}
              options={PAYROLL_TYPE_OPTIONS}
              onChange={(value) => onSettingChange("payrollType", value)}
            />
            <SelectControl
              label="Filing status"
              value={settings.filingStatus}
              options={FILING_STATUS_OPTIONS}
              onChange={(value) => onSettingChange("filingStatus", value)}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.useManualTakeHome}
              onChange={(event) => onSettingChange("useManualTakeHome", event.target.checked)}
            />
            <span>Use expected monthly take-home override</span>
          </label>
          {settings.useManualTakeHome ? (
            <label>
              <span>Expected monthly take-home</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.manualMonthlyTakeHome}
                onChange={(event) => onSettingChange("manualMonthlyTakeHome", Number(event.target.value))}
              />
            </label>
          ) : null}
          <div className="field-pair">
            <label>
              <span>Pre-tax deductions/mo</span>
              <input
                type="number"
                min={0}
                step={25}
                value={settings.pretaxMonthlyDeductions}
                onChange={(event) =>
                  onSettingChange("pretaxMonthlyDeductions", Number(event.target.value))
                }
              />
            </label>
            <label>
              <span>After-tax deductions/mo</span>
              <input
                type="number"
                min={0}
                step={25}
                value={settings.posttaxMonthlyDeductions}
                onChange={(event) =>
                  onSettingChange("posttaxMonthlyDeductions", Number(event.target.value))
                }
              />
            </label>
          </div>
          <label>
            <span>Extra tax reserve %</span>
            <input
              type="number"
              min={0}
              max={40}
              step={0.5}
              value={settings.extraTaxReservePercent}
              onChange={(event) =>
                onSettingChange("extraTaxReservePercent", Number(event.target.value))
              }
            />
          </label>
          <div className="inline-result">
            <span>Estimated take-home preview</span>
            <strong>
              {workPreview.monthlyGross > 0
                ? (
                    <>
                      <AnimatedNumber value={workPreview.monthlyNet} suffix="/mo" /> estimated take-home
                    </>
                  )
                : "No work income"}
            </strong>
            {workPreview.monthlyGross > 0 ? (
              <small>
                <AnimatedNumber value={workPreview.monthlyGross} suffix="/mo" /> gross.{" "}
                <AnimatedNumber value={workPreview.taxAndDeductionMonthly} suffix="/mo" /> tax and deductions.{" "}
                {Math.round(workPreview.netRate * 100)}% net.
              </small>
            ) : null}
          </div>
          <p className="field-note">
            Uses 2026 federal brackets plus FICA or self-employment tax. State income tax is not
            modeled in this first local pass; use the take-home override once available if you know the actual paycheck.
          </p>
        </fieldset>

        <fieldset className="compact-fieldset risk-switches-fieldset">
          <legend>
            <SlidersHorizontal aria-hidden="true" />
            Risk switches
          </legend>
          <div className="segmented-label">Planning view</div>
          <div className="segmented-control two-up" role="group" aria-label="Planning view">
            <button
              type="button"
              aria-pressed={settings.planningMode === "cashTiming"}
              onClick={() => onSettingChange("planningMode", "cashTiming")}
            >
              Cash timing
            </button>
            <button
              type="button"
              aria-pressed={settings.planningMode === "budgetEquivalent"}
              onClick={() => onSettingChange("planningMode", "budgetEquivalent")}
            >
              Budget equiv.
            </button>
          </div>
          <SelectControl
            label="UCX model"
            value={settings.ucxMode}
            options={UCX_MODE_OPTIONS}
            onChange={(value) => onSettingChange("ucxMode", value)}
          />
          <div className="field-pair">
            <label>
              <span>UCX weekly amount</span>
              <input
                type="number"
                min={0}
                max={UCX_WEEKLY_MAX}
                step={5}
                value={settings.ucxWeeklyBenefit}
                onChange={(event) => onSettingChange("ucxWeeklyBenefit", Number(event.target.value))}
              />
            </label>
            <label>
              <span>Essential expenses/mo</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.essentialExpenseTarget}
                onChange={(event) =>
                  onSettingChange("essentialExpenseTarget", Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="field-pair">
            <label>
              <span>Normal lifestyle/mo</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.normalLifestyleTarget}
                onChange={(event) =>
                  onSettingChange("normalLifestyleTarget", Number(event.target.value))
                }
              />
            </label>
            <label>
              <span>Ideal / savings target</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.idealSavingsTarget}
                onChange={(event) =>
                  onSettingChange("idealSavingsTarget", Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="field-pair">
            <label>
              <span>Separation-month military pay</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.separationMonthMilitaryPay}
                onChange={(event) =>
                  onSettingChange("separationMonthMilitaryPay", Number(event.target.value))
                }
              />
            </label>
            <label>
              <span>Final military pay</span>
              <input
                type="number"
                min={0}
                step={50}
                value={Math.round(settings.finalMilitaryPay)}
                onChange={(event) => onSettingChange("finalMilitaryPay", Number(event.target.value))}
              />
            </label>
          </div>
          <SelectControl
            label="Final pay timing"
            value={settings.finalMilitaryPayMonth}
            options={finalPayMonthOptions}
            onChange={(value) => onSettingChange("finalMilitaryPayMonth", value)}
          />
          <label>
            <span>Known military-pay deductions across next 2 checks</span>
            <input
              type="number"
              min={0}
              step={50}
              value={settings.militaryPayDeductionTotal}
              onChange={(event) =>
                onSettingChange("militaryPayDeductionTotal", Number(event.target.value))
              }
            />
          </label>
          <div className="inline-result">
            <span>UCX amount modeled</span>
            <strong>
              <AnimatedNumber
                value={(settings.ucxWeeklyBenefit * 52) / 12 * UCX_TAX_HOLD_BACK}
                suffix="/mo"
              />
            </strong>
            <small>
              Cash view keeps term Pell and tuition as deposit/start-month events; budget view smooths
              them across the term.
            </small>
          </div>
          <p className="field-note">
            UCX uses a manual weekly planning amount and a simple federal tax holdback. Eligibility
            and state-specific reductions are not determined by this calculator.
          </p>
        </fieldset>
      </div>
    </section>
  );
}

type HolographicTimelineSectionProps = {
  series: MonthModel[];
  settings: ModelSettings;
  hoveredMonth: MonthId | null;
  onMonthFocus: (monthId: MonthId | null) => void;
  reducedMotion: boolean;
};

function HolographicTimelineSection({
  series,
  settings,
  hoveredMonth,
  onMonthFocus,
  reducedMotion,
}: HolographicTimelineSectionProps) {
  const [mode, setMode] = React.useState<"standard" | "holographic">("standard");

  return (
    <section
      className={`hologram-section${mode === "holographic" ? " is-active" : ""}`}
      aria-labelledby="hologram-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Analysis mode</p>
          <h2 id="hologram-heading">Holographic financial timeline</h2>
        </div>
        <div className="segmented-control two-up analysis-mode-toggle" role="group" aria-label="Timeline analysis mode">
          <button
            type="button"
            aria-pressed={mode === "standard"}
            onClick={() => setMode("standard")}
          >
            Standard
          </button>
          <button
            type="button"
            aria-pressed={mode === "holographic"}
            onClick={() => setMode("holographic")}
          >
            Holographic
          </button>
        </div>
      </div>

      {mode === "holographic" ? (
        <React.Suspense
          fallback={
            <div className="hologram-loading" role="status">
              Initializing 3D analysis...
            </div>
          }
        >
          <FinancialTimeline3D
            series={series}
            settings={settings}
            hoveredMonth={hoveredMonth}
            onMonthFocus={onMonthFocus}
            reducedMotion={reducedMotion}
          />
        </React.Suspense>
      ) : (
        <IncomeLayerChart
          series={series}
          settings={settings}
          hoveredMonth={hoveredMonth}
          onMonthFocus={onMonthFocus}
          embedded
        />
      )}
    </section>
  );
}

function IncomeLayerChart({
  series,
  settings,
  hoveredMonth,
  onMonthFocus,
  embedded = false,
}: {
  series: MonthModel[];
  settings: ModelSettings;
  hoveredMonth: MonthId | null;
  onMonthFocus: (monthId: MonthId | null) => void;
  embedded?: boolean;
}) {
  const [hoveredStream, setHoveredStream] = React.useState<IncomeKey | null>(null);
  const targets = getExpenseTargets(settings);
  const maxTotal = Math.max(targets.ideal, ...series.map((month) => month.total)) * 1.08;

  return (
    <section
      className={`${embedded ? "income-panel income-panel-embedded" : "visual-panel income-panel"}${
        hoveredStream ? " has-stream-focus" : ""
      }`}
      aria-labelledby="income-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Income layer visual</p>
          <h2 id="income-heading">Monthly planning resources</h2>
        </div>
        <div className="legend" aria-label="Income legend">
          {INCOME_ORDER.map((key) => (
            <button
              className={`legend-item${hoveredStream === key ? " is-active" : ""}`}
              type="button"
              key={key}
              aria-pressed={hoveredStream === key}
              onPointerEnter={() => setHoveredStream(key)}
              onPointerLeave={() => setHoveredStream(null)}
              onFocus={() => setHoveredStream(key)}
              onBlur={() => setHoveredStream(null)}
              onClick={() => setHoveredStream((current) => (current === key ? null : key))}
            >
              <i className={`legend-dot stream-${key}`} aria-hidden="true" />
              {INCOME_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="income-chart" role="img" aria-label="Stacked monthly income chart">
        {series.map((month, index) => (
          <div
            className={`stack-column${index === 0 ? " is-chart-edge-start" : ""}${
              index === series.length - 1 ? " is-chart-edge-end" : ""
            }${hoveredMonth === month.id ? " is-month-focused" : ""}`}
            key={month.id}
            onPointerEnter={() => onMonthFocus(month.id)}
            onPointerLeave={() => onMonthFocus(null)}
          >
            <div
              className="stack-track"
              aria-label={`${month.label}: ${formatMoney(month.total)} total planning resources`}
            >
              <span
                className="target-line"
                style={{ bottom: `${Math.min(100, (targets.essential / maxTotal) * 100)}%` }}
              />
              {INCOME_ORDER.map((key) => {
                const amount = month.streams[key];
                if (amount <= 0) {
                  return null;
                }

                return (
                  <span
                    key={key}
                    className={`stack-segment stream-${key}${
                      hoveredStream === key ? " is-stream-focused" : ""
                    }${hoveredStream && hoveredStream !== key ? " is-stream-muted" : ""}`}
                    style={{ height: `${Math.max(1.6, (amount / maxTotal) * 100)}%` }}
                    title={`${INCOME_LABELS[key]}: ${formatMoney(amount)}`}
                  />
                );
              })}
            </div>
            <div className="chart-tooltip" aria-hidden="true">
              <strong>{month.label}</strong>
              {INCOME_ORDER.map((key) => {
                const amount = month.streams[key];

                if (amount <= 0) {
                  return null;
                }

                return (
                  <span key={key}>
                    <i className={`legend-dot stream-${key}`} aria-hidden="true" />
                    {INCOME_LABELS[key]}: {formatMoney(amount)}
                  </span>
                );
              })}
              <em>Total: {formatMoney(month.total)}</em>
            </div>
            <span className="stack-month">{month.short}</span>
            <strong>
              <AnimatedNumber value={month.total} />
            </strong>
          </div>
        ))}
      </div>

      <div className="chart-foot">
        <span>Mode: {settings.planningMode === "cashTiming" ? "Actual cash timing" : "Budget equivalent"}</span>
        <span>Essential expenses: {formatMoney(targets.essential)}/mo</span>
        <span>Normal lifestyle: {formatMoney(targets.normal)}/mo</span>
        <span>
          Tuition reserve:{" "}
          {settings.planningMode === "cashTiming"
            ? `${formatMoney(settings.schoolTuition)} start-month event`
            : `${formatMoney(settings.schoolTuition / getSchoolTermMonths(settings))}/mo reserve`}
        </span>
        <span>
          Education benefit: cash timing deposits the prior modeled school month; budget view spreads earned value.
        </span>
        <span>VA catch-up is one-time cash, not recurring monthly income.</span>
      </div>
    </section>
  );
}

function MonthlyStressGrid({
  series,
  settings,
  hoveredMonth,
  onMonthFocus,
}: {
  series: MonthModel[];
  settings: ModelSettings;
  hoveredMonth: MonthId | null;
  onMonthFocus: (monthId: MonthId | null) => void;
}) {
  const targets = getExpenseTargets(settings);

  return (
    <section className="visual-panel stress-panel" aria-labelledby="stress-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cash-flow stress test</p>
          <h2 id="stress-heading">Effective after tuition reserve</h2>
        </div>
      </div>
      <div className="stress-grid">
        {series.map((month) => (
          <article
            className={`stress-tile status-${month.status}${hoveredMonth === month.id ? " is-month-focused" : ""}`}
            key={month.id}
            onPointerEnter={() => onMonthFocus(month.id)}
            onPointerLeave={() => onMonthFocus(null)}
          >
            <span>{month.short}</span>
            <strong>
              <AnimatedNumber value={month.effective} />
            </strong>
            <small>
              <AnimatedNumber
                value={month.gapToFloor}
                prefix={month.gapToFloor >= 0 ? "+" : ""}
              />{" "}
              vs essential
            </small>
          </article>
        ))}
      </div>
      <div className="status-key">
        <span>
          <i className="key-dot green" />
          Green: {formatMoney(targets.normal)}+
        </span>
        <span>
          <i className="key-dot yellow" />
          Yellow: {formatMoney(targets.essential)}-{formatMoney(targets.normal - 1)}
        </span>
        <span>
          <i className="key-dot red" />
          Red: below {formatMoney(targets.essential)}
        </span>
      </div>
    </section>
  );
}

function MasterTimeline({
  settings,
  series,
  hoveredMonth,
  onMonthFocus,
}: {
  settings: ModelSettings;
  series: MonthModel[];
  hoveredMonth: MonthId | null;
  onMonthFocus: (monthId: MonthId | null) => void;
}) {
  const rows = buildTimelineRows(settings, series);

  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Master timeline</p>
          <h2 id="timeline-heading">{getTimelineLabel(series)}</h2>
        </div>
      </div>
      <div className="timeline-wrap">
        <div className="timeline-grid" role="table" aria-label="Transition timeline">
          <div className="timeline-header" role="row">
            <span role="columnheader">Layer</span>
            {series.map((month) => (
              <span
                className={hoveredMonth === month.id ? "is-month-focused" : ""}
                role="columnheader"
                key={month.id}
                onPointerEnter={() => onMonthFocus(month.id)}
                onPointerLeave={() => onMonthFocus(null)}
              >
                {month.short}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <div className="timeline-row" role="row" key={row.label}>
              <span role="rowheader">{row.label}</span>
              {row.cells.map((cell) => (
                <span
                  className={`timeline-cell ${cell.kind}${hoveredMonth === cell.monthId ? " is-month-focused" : ""}`}
                  role="cell"
                  key={cell.monthId}
                  onPointerEnter={() => onMonthFocus(cell.monthId)}
                  onPointerLeave={() => onMonthFocus(null)}
                >
                  {cell.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type ScenarioRow = {
  id: ScenarioId;
  label: string;
  average: number;
  minimum: number;
  reserveNeeded: number;
  dangerMonths: number;
  stress: string;
  schoolTime: string;
  risk: string;
  pellImplication: string;
  ucxImplication: string;
  recommendation: string;
};

function ScenarioComparison({
  rows,
  selectedScenario,
}: {
  rows: ScenarioRow[];
  selectedScenario: ScenarioId;
}) {
  return (
    <section className="comparison-section" aria-labelledby="comparison-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Scenario comparison</p>
          <h2 id="comparison-heading">Money, risk, school time, and benefits tradeoffs</h2>
        </div>
      </div>
      <div className="table-wrap">
        <table className="scenario-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Avg after separation</th>
              <th>Lowest month</th>
              <th>Reserve need</th>
              <th>Danger months</th>
              <th>Stress</th>
              <th>School time</th>
              <th>Risk</th>
              <th>Pell / UCX implication</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === selectedScenario ? "is-selected" : ""}>
                <td>
                  <strong>{row.label}</strong>
                </td>
                <td>
                  <AnimatedNumber value={row.average} />
                </td>
                <td>
                  <AnimatedNumber value={row.minimum} />
                </td>
                <td>
                  <AnimatedNumber value={row.reserveNeeded} />
                </td>
                <td>{row.dangerMonths}</td>
                <td>{row.stress}</td>
                <td>{row.schoolTime}</td>
                <td>{row.risk}</td>
                <td>
                  {row.pellImplication}
                  <span className="table-subcopy">{row.ucxImplication}</span>
                </td>
                <td>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssumptionsPanel({ settings }: { settings: ModelSettings }) {
  const educationBenefitLabel = getEducationBenefitLabel(settings.educationBenefit);
  const educationStatus =
    settings.educationBenefit === "none"
      ? "No monthly education benefit is modeled."
      : `${educationBenefitLabel} is modeled only as the selected primary education benefit for this period.`;
  const planningModeText =
    settings.planningMode === "cashTiming"
      ? "Cash timing mode uses selected deposit/start months for final pay, Pell, tuition, education benefits, and VA catch-up."
      : "Budget-equivalent mode smooths school aid and tuition across the term.";

  return (
    <section className="assumptions-section" aria-labelledby="assumptions-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Risk and assumption panel</p>
          <h2 id="assumptions-heading">Facts vs. Assumptions</h2>
        </div>
      </div>
      <div className="assumption-grid">
        <article>
          <h3>
            <CheckCircle2 aria-hidden="true" />
            Confirmed / strong facts
          </h3>
          <ul>
            <li>Projection starts {formatMonthLabel(settings.timelineStartMonth)} and spans 12 months.</li>
            <li>Separation status is user-entered: {settings.alreadySeparated ? "already separated" : formatDateLabel(settings.separationDate)}.</li>
            <li>School/training period is user-entered: {formatDateLabel(settings.schoolStartDate)} through {formatDateLabel(settings.schoolEndDate)}.</li>
            <li>Inputs are stored locally in this browser unless a future feature explicitly states otherwise.</li>
            <li>VA, education benefit, Pell, tax, and UCX figures are planning estimates, not eligibility decisions.</li>
          </ul>
        </article>
        <article>
          <h3>
            <FileCheck2 aria-hidden="true" />
            Working assumptions
          </h3>
          <ul>
            <li>
              {educationBenefitLabel} uses editable {formatMoney(settings.educationMonthlyRate)}/mo
              when a monthly education benefit is modeled.
            </li>
            <li>{educationStatus}</li>
            <li>Cash timing models the selected education benefit as paid after the modeled school month; budget mode models the earned monthly value.</li>
            <li>Pell is independent from GI Bill or VR&E assumptions and follows the selected Pell enrollment status.</li>
            <li>{planningModeText}</li>
            <li>Civilian work uses a federal tax plus FICA or self-employment estimate; state income tax is not modeled yet.</li>
            <li>VA disability and SMC-K amounts use the 2026 veteran-only table as a planning reference.</li>
            <li>VA catch-up is modeled as a one-time decision-month deposit; regular VA cash starts the following month because compensation is paid in arrears.</li>
            <li>Military cash separates active-duty monthly take-home, separation-month pay, and final-pay timing.</li>
          </ul>
        </article>
        <article>
          <h3>
            <Clock3 aria-hidden="true" />
            High uncertainty
          </h3>
          <ul>
            <li>Final VA rating, SMC-K award, and first cash month.</li>
            <li>Claim processing speed and any delayed evidence or exam issues.</li>
            <li>Actual UCX approval, weekly amount, and school compatibility.</li>
            <li>Professional-judgment approval, enrollment intensity, and final Pell amount.</li>
            <li>Exact debt minimums, military-pay deductions, and final-pay timing.</li>
          </ul>
        </article>
        <article>
          <h3>
            <BadgeCheck aria-hidden="true" />
            Verify before relying
          </h3>
          <ul>
            <li>Education-benefit rate, housing allowance, or subsistence estimate for the exact enrollment period being modeled.</li>
            <li>School certification rules for the user's exact program and course load.</li>
            <li>Pell maximum and school-calculated award for the applicable award year.</li>
            <li>State workforce-agency treatment of school enrollment, part-time work, and contract end facts.</li>
            <li>Whether VA backpay timing and effective date match your claim details.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function ActionPlan() {
  return (
    <section className="action-section" aria-labelledby="action-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Action plan</p>
          <h2 id="action-heading">Transition planning checklist</h2>
        </div>
      </div>
      <div className="action-list">
        {ACTION_PLAN.map((month) => (
          <article className="action-card" key={month.month}>
            <div>
              <span>{month.month}</span>
              <h3>{month.title}</h3>
            </div>
            <ul>
              {month.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function PrintSavePanel({ onPrint }: { onPrint: () => void }) {
  return (
    <section className="print-panel" aria-labelledby="print-heading">
      <div>
        <p className="eyebrow">Plan output</p>
        <h2 id="print-heading">Print / Save Plan</h2>
        <p>
          Create a printer-friendly estimate with selected assumptions, monthly projection,
          risk months, uncertainties, and official-source references.
        </p>
      </div>
      <div className="privacy-actions">
        <button type="button" onClick={onPrint}>
          <FileCheck2 aria-hidden="true" />
          Print / Save Plan
        </button>
      </div>
    </section>
  );
}

function PrintSummary({
  settings,
  series,
  summary,
  workPreview,
}: {
  settings: ModelSettings;
  series: MonthModel[];
  summary: ReturnType<typeof summarizeSeries>;
  workPreview: ReturnType<typeof getWorkPreview>;
}) {
  const targets = getExpenseTargets(settings);
  const generatedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const riskMonths = series.filter((month) => month.status === "red");

  return (
    <section className="print-summary" aria-label="Printable veteran transition estimate">
      <header>
        <p>Generated {generatedDate}</p>
        <h1>Veteran Transition Estimate</h1>
        <p>
          Modeled period: {summary.timelineLabel}. This is a planning estimate and does not determine
          eligibility or official benefit entitlement.
        </p>
      </header>

      <section>
        <h2>Selected Assumptions</h2>
        <dl>
          <div>
            <dt>Separation</dt>
            <dd>{settings.alreadySeparated ? "Already separated" : formatDateLabel(settings.separationDate)}</dd>
          </div>
          <div>
            <dt>VA</dt>
            <dd>
              {settings.rating}%{settings.smcK ? " + SMC-K" : ""}; decision/catch-up{" "}
              {getVaDecisionMonthLabel(settings)}
            </dd>
          </div>
          <div>
            <dt>Education</dt>
            <dd>
              {getEducationBenefitLabel(settings.educationBenefit)} at{" "}
              {formatMoney(getEducationBenefitMonthly(settings))}/mo; {getSchoolLoadLabel(settings.schoolLoad)}
            </dd>
          </div>
          <div>
            <dt>Pell</dt>
            <dd>
              {formatMoney(getPellTermAmount(settings))}/term;{" "}
              {settings.planningMode === "cashTiming" ? "cash timing" : "budget equivalent"}
            </dd>
          </div>
          <div>
            <dt>Civilian work</dt>
            <dd>
              {WORK_OPTIONS.find((option) => option.value === settings.workType)?.label ?? "Not modeled"};{" "}
              {formatMoney(workPreview.monthlyNet)}/mo estimated take-home
            </dd>
          </div>
          <div>
            <dt>Expense floor</dt>
            <dd>
              Essential {formatMoney(targets.essential)}/mo; normal {formatMoney(targets.normal)}/mo
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Monthly Projection</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Military</th>
              <th>Civilian</th>
              <th>VA</th>
              <th>VA catch-up</th>
              <th>Education</th>
              <th>Pell</th>
              <th>UCX</th>
              <th>After tuition</th>
              <th>Vs floor</th>
            </tr>
          </thead>
          <tbody>
            {series.map((month) => (
              <tr key={month.id}>
                <td>{month.label}</td>
                <td>{formatMoney(month.streams.military)}</td>
                <td>{formatMoney(month.streams.civilian)}</td>
                <td>{formatMoney(month.streams.va)}</td>
                <td>{formatMoney(month.streams.vaBackpay)}</td>
                <td>{formatMoney(month.streams.education)}</td>
                <td>{formatMoney(month.streams.pell)}</td>
                <td>{formatMoney(month.streams.ucx)}</td>
                <td>{formatMoney(month.effective)}</td>
                <td>{formatMoney(month.gapToFloor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Risk Notes</h2>
        <ul>
          <li>Lowest projected month: {summary.lowestMonth.label} at {formatMoney(summary.lowestMonth.effective)} after tuition reserve.</li>
          <li>Reserve recommended after separation: {formatMoney(summary.reserveNeeded)}.</li>
          <li>
            Months below essential expenses:{" "}
            {riskMonths.length > 0 ? riskMonths.map((month) => month.label).join(", ") : "None in this projection"}.
          </li>
          <li>VA catch-up, Pell disbursement, and final military pay should be treated as one-time cash where modeled.</li>
          <li>{getEducationRateWarning(settings) ?? "Current selected education-benefit rate is a user-controlled planning input."}</li>
        </ul>
      </section>

      <section>
        <h2>Official Source References</h2>
        <ul>
          {SOURCE_LINKS.map((source) => (
            <li key={source.href}>{source.label}: {source.href}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function PrivacyPanel({
  onReset,
  onClearSavedData,
}: {
  onReset: () => void;
  onClearSavedData: () => void;
}) {
  return (
    <section className="privacy-panel" aria-labelledby="privacy-heading">
      <div>
        <p className="eyebrow">Privacy</p>
        <h2 id="privacy-heading">Local-only calculator state</h2>
        <p>
          Calculator inputs are stored locally in your browser unless a future feature explicitly
          states otherwise. This version does not require an account or send financial inputs to a backend.
        </p>
      </div>
      <div className="privacy-actions">
        <button type="button" onClick={onReset}>
          Reset calculator
        </button>
        <button type="button" onClick={onClearSavedData}>
          Clear saved data
        </button>
      </div>
    </section>
  );
}

function SourcePanel() {
  return (
    <footer className="source-panel">
      <div>
        <p className="eyebrow">Rates & sources</p>
        <h2>Planning model, not an official eligibility decision</h2>
        <p>
          Official rates are separated from working assumptions. VA, Federal Student Aid, schools,
          state workforce agencies, and tax authorities can change the real outcome.
        </p>
      </div>
      <div className="source-stack">
        <div className="rate-source-grid">
          {BENEFIT_RATE_DATASETS.map((dataset) => (
            <article key={dataset.program}>
              <span>{dataset.program}</span>
              <strong>{dataset.label}</strong>
              <dl>
                <div>
                  <dt>Applies</dt>
                  <dd>{formatRatePeriod(dataset.effectiveFrom, dataset.effectiveThrough)}</dd>
                </div>
                <div>
                  <dt>Verified</dt>
                  <dd>{formatSourceDate(dataset.verifiedAt)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatRateStatus(dataset.status)}</dd>
                </div>
              </dl>
              <p>{dataset.note}</p>
              <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">
                {dataset.sourceLabel}
              </a>
            </article>
          ))}
        </div>
        <div className="source-links" aria-label="Additional planning sources">
          {SOURCE_LINKS.map((source) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function formatRatePeriod(effectiveFrom: string, effectiveThrough?: string) {
  if (effectiveFrom === "manual") {
    return "Manual input";
  }

  return effectiveThrough
    ? `${formatSourceDate(effectiveFrom)} - ${formatSourceDate(effectiveThrough)}`
    : `${formatSourceDate(effectiveFrom)} onward`;
}

function formatSourceDate(dateInput: string) {
  const parsed = parseDateInput(dateInput);
  if (!parsed) {
    return dateInput;
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)),
  );
}

function formatRateStatus(status: (typeof BENEFIT_RATE_DATASETS)[number]["status"]) {
  switch (status) {
    case "verified":
      return "Verified";
    case "manual-required":
      return "Manual input";
    case "planning-placeholder":
    default:
      return "Planning placeholder";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && Object.hasOwn(SCENARIOS, value);
}

function isRating(value: unknown): value is Rating {
  return (
    value === 0 ||
    value === 10 ||
    value === 20 ||
    value === 30 ||
    value === 40 ||
    value === 50 ||
    value === 60 ||
    value === 70 ||
    value === 80 ||
    value === 90 ||
    value === 100
  );
}

function isVaStart(value: unknown): value is VaStart {
  return value === "none" || isMonthId(value);
}

function isWorkType(value: unknown): value is WorkType {
  return value === "none" || value === "contract" || value === "partTime" || value === "permanent";
}

function isContractEnd(value: unknown): value is ContractEnd {
  return isMonthId(value);
}

function isPayMode(value: unknown): value is PayMode {
  return value === "hourly" || value === "annual";
}

function isPlanningMode(value: unknown): value is PlanningMode {
  return value === "cashTiming" || value === "budgetEquivalent";
}

function isPayrollType(value: unknown): value is PayrollType {
  return value === "w2" || value === "selfEmployed";
}

function isFilingStatus(value: unknown): value is FilingStatus {
  return value === "single" || value === "marriedJoint" || value === "headOfHousehold";
}

function isUcxMode(value: unknown): value is UcxMode {
  return value === "off" || value === "ifEligible";
}

function isFinalPayMonth(value: unknown): value is FinalPayMonth {
  return value === "none" || isMonthId(value);
}

function isPellCaseId(value: unknown): value is PellCaseId {
  return value === "typical" || value === "adjusted" || value === "maximum";
}

function isPellEnrollment(value: unknown): value is PellEnrollment {
  return value === "none" || value === "half" || value === "threeQuarter" || value === "full";
}

function isSchoolLoad(value: unknown): value is SchoolLoad {
  return value === "none" || value === "half" || value === "threeQuarter" || value === "full";
}

function isEducationBenefit(value: unknown): value is EducationBenefit {
  return value === "none" || value === "mgib" || value === "post911" || value === "vre";
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function calculateSeries(settings: ModelSettings): MonthModel[] {
  return getTimelineMonths(settings).map((month) => {
    const streams: Record<IncomeKey, number> = {
      military: getMilitaryPay(month.id, settings),
      civilian: getCivilianPay(month.id, settings),
      ucx: getUcxPay(month.id, settings),
      vaBackpay: getVaBackpay(month.id, settings),
      va: getVaPay(month.id, settings),
      education: getEducationBenefitPay(month.id, settings),
      pell: getPellPay(month.id, settings),
    };

    const total = INCOME_ORDER.reduce((sum, key) => sum + streams[key], 0);
    const tuition = getTuitionForMonth(month.id, settings);
    const effective = total - tuition;
    const gapToFloor = effective - settings.essentialExpenseTarget;
    const status = getStatus(effective, settings);

    return {
      ...month,
      streams,
      total,
      tuition,
      effective,
      gapToFloor,
      status,
    };
  });
}

function summarizeSeries(series: MonthModel[], settings: ModelSettings) {
  const separationMonth = toMonthId(settings.separationDate);
  const focusMonths = series;
  const postDosMonths = getPostSeparationMonths(series, settings);
  const criticalMonths = series.filter((month) => {
    const index = getMonthIndex(month.id);
    return index >= getMonthIndex(addMonths(separationMonth, -2)) && index <= getMonthIndex(addMonths(separationMonth, 2));
  });
  const lowestMonth = focusMonths.reduce((lowest, month) =>
    month.effective < lowest.effective ? month : lowest,
  );
  const reserveNeeded = getReserveNeeded(postDosMonths, settings);
  const potentialBackpay = getPotentialBackpay(settings);
  const criticalDangerCount = criticalMonths.filter((month) => month.status === "red").length;
  const criticalRiskText =
    criticalDangerCount === 0
      ? "No red months"
      : `${criticalDangerCount} red month${criticalDangerCount === 1 ? "" : "s"}`;

  return {
    lowestMonth,
    reserveNeeded,
    potentialBackpay,
    criticalRiskText,
    timelineLabel: getTimelineLabel(series),
  };
}

function buildScenarioRows(baseSettings: ModelSettings): ScenarioRow[] {
  return Object.values(SCENARIOS).map((scenario) => {
    const settings: ModelSettings = {
      ...scenario.settings,
      planningMode: baseSettings.planningMode,
      timelineStartMonth: baseSettings.timelineStartMonth,
      alreadySeparated: baseSettings.alreadySeparated,
      separationDate: baseSettings.separationDate,
      terminalLeaveStartDate: baseSettings.terminalLeaveStartDate,
      schoolStartDate: baseSettings.schoolStartDate,
      schoolEndDate: baseSettings.schoolEndDate,
      workStartMonth: baseSettings.workStartMonth,
      pellDisbursementMonth: baseSettings.pellDisbursementMonth,
      activeDutyMonthly: baseSettings.activeDutyMonthly,
      rating: baseSettings.rating,
      smcK: baseSettings.smcK,
      payMode: baseSettings.payMode,
      hourlyRate: baseSettings.hourlyRate,
      annualSalary: baseSettings.annualSalary,
      weeklyHours: baseSettings.weeklyHours,
      partTimeHours: baseSettings.partTimeHours,
      payrollType: baseSettings.payrollType,
      filingStatus: baseSettings.filingStatus,
      useManualTakeHome: baseSettings.useManualTakeHome,
      manualMonthlyTakeHome: baseSettings.manualMonthlyTakeHome,
      pretaxMonthlyDeductions: baseSettings.pretaxMonthlyDeductions,
      posttaxMonthlyDeductions: baseSettings.posttaxMonthlyDeductions,
      extraTaxReservePercent: baseSettings.extraTaxReservePercent,
      includeVaBackpay: baseSettings.includeVaBackpay,
      ucxWeeklyBenefit: baseSettings.ucxWeeklyBenefit,
      educationBenefit: baseSettings.educationBenefit,
      schoolLoad: baseSettings.schoolLoad,
      educationMonthlyRate: baseSettings.educationMonthlyRate,
      pellCase: baseSettings.pellCase,
      pellEnrollment: baseSettings.pellEnrollment,
      schoolTuition: baseSettings.schoolTuition,
      militaryPayDeductionTotal: baseSettings.militaryPayDeductionTotal,
      separationMonthMilitaryPay: baseSettings.separationMonthMilitaryPay,
      finalMilitaryPay: baseSettings.finalMilitaryPay,
      finalMilitaryPayMonth: baseSettings.finalMilitaryPayMonth,
      essentialExpenseTarget: baseSettings.essentialExpenseTarget,
      normalLifestyleTarget: baseSettings.normalLifestyleTarget,
      idealSavingsTarget: baseSettings.idealSavingsTarget,
    };
    const series = calculateSeries(settings);
    const postDosMonths = getPostSeparationMonths(series, settings);
    const average = postDosMonths.reduce((sum, month) => sum + month.effective, 0) / postDosMonths.length;
    const minimum = Math.min(...postDosMonths.map((month) => month.effective));
    const reserveNeeded = getReserveNeeded(postDosMonths, settings);
    const dangerMonths = postDosMonths.filter((month) => month.status === "red").length;

    return {
      id: scenario.id,
      label: scenario.shortLabel,
      average,
      minimum,
      reserveNeeded,
      dangerMonths,
      stress: scenario.stress,
      schoolTime: scenario.schoolTime,
      risk: scenario.risk,
      pellImplication: scenario.pellImplication,
      ucxImplication: scenario.ucxImplication,
      recommendation: scenario.recommendation,
    };
  });
}

function buildTimelineRows(settings: ModelSettings, series: MonthModel[]) {
  const separationMonth = toMonthId(settings.separationDate);
  const terminalLeaveMonth = toMonthId(settings.terminalLeaveStartDate);
  const firstPayableVaMonth = getFirstVaPayableMonth(settings);

  return [
    {
      label: "Military pay",
      cells: series.map((month) => ({
        monthId: month.id,
        kind: month.streams.military > 0 ? (month.id === separationMonth ? "event" : "active") : "empty",
        label: month.streams.military > 0 ? (month.id === separationMonth ? "DOS" : "Pay") : "",
      })),
    },
    {
      label: "Terminal leave",
      cells: series.map((month) => {
        const index = getMonthIndex(month.id);
        const inLeave =
          !settings.alreadySeparated &&
          index >= getMonthIndex(terminalLeaveMonth) &&
          index <= getMonthIndex(separationMonth);
        return {
          monthId: month.id,
          kind: inLeave ? "active-soft" : "empty",
          label: inLeave ? "Leave" : "",
        };
      }),
    },
    {
      label: "Civilian work",
      cells: series.map((month) => ({
        monthId: month.id,
        kind: month.streams.civilian > 0 ? "active" : "empty",
        label: month.streams.civilian > 0 ? "Work" : "",
      })),
    },
    {
      label: "UCX",
      cells: series.map((month) => ({
        monthId: month.id,
        kind: month.streams.ucx > 0 ? "risk" : "empty",
        label: month.streams.ucx > 0 ? "UCX?" : "",
      })),
    },
    {
      label: "School / education aid / Pell",
      cells: series.map((month) => {
        if (!isSchoolMonth(month.id, settings) && month.streams.education <= 0 && month.streams.pell <= 0) {
          return { monthId: month.id, kind: "empty", label: "" };
        }

        if (month.id === toMonthId(settings.schoolStartDate)) {
          return { monthId: month.id, kind: "event", label: "Start" };
        }

        if (month.streams.pell > 0 || month.streams.education > 0) {
          return { monthId: month.id, kind: "active", label: "Aid" };
        }

        return {
          monthId: month.id,
          kind: settings.schoolLoad !== "none" ? "active-soft" : "risk",
          label: settings.schoolLoad !== "none" ? "School" : "Verify",
        };
      }),
    },
    {
      label: "VA cash",
      cells: series.map((month) => {
        const afterFirstPayable = getMonthIndex(month.id) >= getMonthIndex(firstPayableVaMonth);
        const beforeDecision =
          settings.vaStart !== "none" &&
          getMonthIndex(month.id) < getMonthIndex(settings.vaStart);

        if (month.streams.vaBackpay > 0) {
          return { monthId: month.id, kind: "event", label: "Catch-up" };
        }

        if (settings.vaStart !== "none" && month.id === settings.vaStart) {
          return { monthId: month.id, kind: "event", label: "Decision" };
        }

        if (month.streams.va > 0) {
          return { monthId: month.id, kind: "active", label: "VA" };
        }

        return {
          monthId: month.id,
          kind: afterFirstPayable && beforeDecision ? "risk" : "empty",
          label: afterFirstPayable && beforeDecision ? "Accrue" : "",
        };
      }),
    },
  ];
}

function getMilitaryPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.alreadySeparated) {
    return settings.planningMode === "cashTiming" && monthId === settings.finalMilitaryPayMonth
      ? Math.max(0, settings.finalMilitaryPay)
      : 0;
  }

  const deductionPerMonth = Math.max(0, settings.militaryPayDeductionTotal) / 2;
  const monthIndex = getMonthIndex(monthId);
  const separationMonth = toMonthId(settings.separationDate);
  const separationIndex = getMonthIndex(separationMonth);
  const projectionStartIndex = getMonthIndex(settings.timelineStartMonth);
  const shouldApplyShortTermDeduction =
    monthIndex >= projectionStartIndex && monthIndex <= projectionStartIndex + 1;
  const activeDutyMonthly = Math.max(0, settings.activeDutyMonthly);

  if (monthIndex < separationIndex) {
    return Math.max(0, activeDutyMonthly - (shouldApplyShortTermDeduction ? deductionPerMonth : 0));
  }

  if (monthId === separationMonth) {
    const estimatedSeparationMonthPay =
      settings.separationMonthMilitaryPay > 0
        ? Math.max(0, settings.separationMonthMilitaryPay)
        : activeDutyMonthly * getDateMonthFraction(settings.separationDate);

    if (settings.planningMode === "budgetEquivalent") {
      return estimatedSeparationMonthPay;
    }

    return (
      estimatedSeparationMonthPay +
      (settings.finalMilitaryPayMonth === separationMonth ? Math.max(0, settings.finalMilitaryPay) : 0)
    );
  }

  if (settings.planningMode === "cashTiming" && settings.finalMilitaryPayMonth === monthId) {
    return Math.max(0, settings.finalMilitaryPay);
  }

  return 0;
}

function getCivilianPay(monthId: MonthId, settings: ModelSettings) {
  const factor = getCivilianWorkFactor(monthId, settings);
  if (factor === 0) {
    return 0;
  }

  const preview = getWorkPreview(settings);
  return preview.monthlyNet * factor;
}

function getCivilianWorkFactor(monthId: MonthId, settings: ModelSettings) {
  if (settings.workType === "none") {
    return 0;
  }

  const monthIndex = getMonthIndex(monthId);
  const startIndex = getMonthIndex(settings.workStartMonth);

  if (monthIndex < startIndex) {
    return 0;
  }

  if (settings.workType === "contract" && monthIndex > getMonthIndex(settings.contractEnd)) {
    return 0;
  }

  return monthId === settings.workStartMonth ? 0.5 : 1;
}

function getUcxPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.ucxMode === "off") {
    return 0;
  }

  const weeklyBenefit = Math.max(0, Math.min(UCX_WEEKLY_MAX, settings.ucxWeeklyBenefit));
  const monthIndex = getMonthIndex(monthId);
  const earliestIndex = getMonthIndex(addMonths(toMonthId(settings.separationDate), 1));

  if (monthIndex < earliestIndex || settings.workType === "permanent") {
    return 0;
  }

  if (settings.workType === "contract") {
    const firstEligibleMonth = getMonthIndex(settings.contractEnd) + 1;
    if (monthIndex < firstEligibleMonth) {
      return 0;
    }
  }

  if (settings.workType === "partTime") {
    const weeklyEarnings = getWorkPreview(settings).weeklyGross;
    const weeklyPartial = Math.max(0, Math.min(weeklyBenefit, weeklyBenefit * 1.25 - weeklyEarnings));
    return weeklyPartial * (52 / 12) * UCX_TAX_HOLD_BACK;
  }

  return weeklyBenefit * (52 / 12) * UCX_TAX_HOLD_BACK;
}

function getVaPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.vaStart === "none") {
    return 0;
  }

  return getMonthIndex(monthId) > getMonthIndex(settings.vaStart) ? getVaMonthly(settings) : 0;
}

function getVaBackpay(monthId: MonthId, settings: ModelSettings) {
  if (!settings.includeVaBackpay || settings.vaStart === "none" || monthId !== settings.vaStart) {
    return 0;
  }

  return getAccruedVaMonths(settings) * getVaMonthly(settings);
}

function getVaMonthly(settings: Pick<ModelSettings, "rating" | "smcK">) {
  return VA_RATES[settings.rating] + (settings.smcK ? SMC_K_RATE : 0);
}

function getEducationBenefitPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.educationBenefit === "none" || settings.schoolLoad === "none") {
    return 0;
  }

  if (settings.planningMode === "budgetEquivalent") {
    return getEducationBenefitMonthly(settings) * getSchoolMonthFactor(monthId, settings);
  }

  return getEducationBenefitMonthly(settings) * getSchoolMonthFactor(addMonths(monthId, -1), settings);
}

function getPellPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.planningMode === "budgetEquivalent") {
    return isSchoolMonth(monthId, settings) ? getPellMonthly(settings) : 0;
  }

  return monthId === settings.pellDisbursementMonth ? getPellTermAmount(settings) : 0;
}

function getPellMonthly(settings: Pick<ModelSettings, "pellCase" | "pellEnrollment" | "schoolStartDate" | "schoolEndDate">) {
  return getPellTermAmount(settings) / getSchoolTermMonths(settings);
}

function getPellTermAmount(settings: Pick<ModelSettings, "pellCase" | "pellEnrollment">) {
  return PELL_CASES[settings.pellCase].termAmount * getPellEnrollmentFactor(settings.pellEnrollment);
}

function getPellEnrollmentFactor(pellEnrollment: PellEnrollment) {
  return PELL_ENROLLMENT_OPTIONS.find((option) => option.value === pellEnrollment)?.factor ?? 1;
}

function getSchoolLoadLabel(schoolLoad: SchoolLoad) {
  return SCHOOL_LOAD_OPTIONS.find((option) => option.value === schoolLoad)?.label ?? "Not enrolled";
}

function getEducationBenefitLabel(educationBenefit: EducationBenefit) {
  return EDUCATION_BENEFIT_OPTIONS.find((option) => option.value === educationBenefit)?.label ?? "No education benefit";
}

function getEducationRateInputLabel(educationBenefit: EducationBenefit) {
  switch (educationBenefit) {
    case "mgib":
      return "MGIB monthly planning rate";
    case "post911":
      return "Expected monthly housing allowance";
    case "vre":
      return "VR&E monthly planning estimate";
    case "none":
    default:
      return "Monthly education benefit estimate";
  }
}

function getEducationRateWarning(settings: Pick<ModelSettings, "educationBenefit" | "schoolStartDate">) {
  if (settings.educationBenefit === "mgib" && MGIB_ACTIVE_DUTY_RATE_DATASET.effectiveThrough) {
    const verifiedThrough = toMonthId(MGIB_ACTIVE_DUTY_RATE_DATASET.effectiveThrough);
    if (getMonthIndex(toMonthId(settings.schoolStartDate)) > getMonthIndex(verifiedThrough)) {
      return "Future MGIB rate is not yet verified for this school period; the current rate is used as an editable planning placeholder.";
    }
  }

  if (settings.educationBenefit === "post911") {
    return "Post-9/11 housing allowance is manual because location, modality, eligibility percentage, and enrollment affect the real payment.";
  }

  if (settings.educationBenefit === "vre") {
    return "VR&E subsistence is manual because eligibility and payment structure are fact-specific.";
  }

  return null;
}

function getEducationBenefitMonthly(
  settings: Pick<ModelSettings, "educationBenefit" | "schoolLoad" | "educationMonthlyRate">,
) {
  if (settings.educationBenefit === "none" || settings.schoolLoad === "none") {
    return 0;
  }

  return Math.max(0, settings.educationMonthlyRate);
}

function getFirstEducationBenefitPayment(settings: ModelSettings) {
  const firstPaymentMonth =
    settings.planningMode === "cashTiming"
      ? addMonths(toMonthId(settings.schoolStartDate), 1)
      : toMonthId(settings.schoolStartDate);
  return getEducationBenefitPay(firstPaymentMonth, settings);
}

function getTuitionForMonth(
  monthId: MonthId,
  settings: Pick<ModelSettings, "planningMode" | "schoolLoad" | "schoolStartDate" | "schoolEndDate" | "schoolTuition">,
) {
  if (settings.schoolLoad === "none") {
    return 0;
  }

  const tuition = Math.max(0, settings.schoolTuition);

  if (settings.planningMode === "budgetEquivalent") {
    return isSchoolMonth(monthId, settings) ? tuition / getSchoolTermMonths(settings) : 0;
  }

  return monthId === toMonthId(settings.schoolStartDate) ? tuition : 0;
}

function getPotentialBackpay(settings: ModelSettings) {
  if (!settings.includeVaBackpay || settings.vaStart === "none") {
    return 0;
  }

  return getAccruedVaMonths(settings) * getVaMonthly(settings);
}

function getReserveNeeded(
  months: MonthModel[],
  settings: Pick<ModelSettings, "essentialExpenseTarget">,
) {
  let balance = 0;
  let lowestBalance = 0;

  months.forEach((month) => {
    balance += month.effective - settings.essentialExpenseTarget;
    lowestBalance = Math.min(lowestBalance, balance);
  });

  return Math.abs(lowestBalance);
}

function getAccruedVaMonths(settings: ModelSettings) {
  if (settings.vaStart === "none") {
    return 0;
  }

  return Math.max(0, getMonthIndex(settings.vaStart) - getMonthIndex(getFirstVaPayableMonth(settings)));
}

function getVaDecisionMonthLabel(settings: ModelSettings) {
  if (settings.vaStart === "none") {
    return "no selected month";
  }

  return formatMonthLabel(settings.vaStart);
}

function getRecurringVaStartLabel(settings: ModelSettings) {
  if (settings.vaStart === "none") {
    return null;
  }

  return formatMonthLabel(addMonths(settings.vaStart, 1));
}

function getWorkPreview(
  settings: Pick<
    ModelSettings,
    | "workType"
    | "payMode"
    | "hourlyRate"
    | "annualSalary"
    | "weeklyHours"
    | "partTimeHours"
    | "payrollType"
    | "filingStatus"
    | "useManualTakeHome"
    | "manualMonthlyTakeHome"
    | "pretaxMonthlyDeductions"
    | "posttaxMonthlyDeductions"
    | "extraTaxReservePercent"
  >,
) {
  const annualGross = getAnnualGross(settings);
  const monthlyGross = annualGross / 12;
  const weeklyGross = annualGross / 52;
  const payrollEstimate = estimateTakeHome(annualGross, settings);

  return {
    weeklyGross,
    monthlyGross,
    annualGross,
    ...payrollEstimate,
    monthlyNet:
      settings.useManualTakeHome && annualGross > 0
        ? Math.max(0, settings.manualMonthlyTakeHome)
        : payrollEstimate.monthlyNet,
    netRate:
      settings.useManualTakeHome && annualGross > 0
        ? Math.max(0, settings.manualMonthlyTakeHome) / monthlyGross
        : payrollEstimate.netRate,
  };
}

function getAnnualGross(
  settings: Pick<ModelSettings, "workType" | "payMode" | "hourlyRate" | "annualSalary" | "weeklyHours" | "partTimeHours">,
) {
  if (settings.workType === "none") {
    return 0;
  }

  if (settings.payMode === "annual") {
    return Math.max(0, settings.annualSalary);
  }

  const weeklyHours =
    settings.workType === "partTime" ? settings.partTimeHours : settings.weeklyHours;

  return Math.max(0, settings.hourlyRate) * Math.max(0, weeklyHours) * 52;
}

function estimateTakeHome(
  annualGross: number,
  settings: Pick<
    ModelSettings,
    | "payrollType"
    | "filingStatus"
    | "pretaxMonthlyDeductions"
    | "posttaxMonthlyDeductions"
    | "extraTaxReservePercent"
  >,
) {
  if (annualGross <= 0) {
    return {
      estimatedFederalIncomeTax: 0,
      estimatedPayrollTax: 0,
      monthlyPreTax: 0,
      monthlyPostTax: 0,
      extraTaxReserveMonthly: 0,
      taxAndDeductionMonthly: 0,
      monthlyNet: 0,
      netRate: 0,
    };
  }

  const pretaxAnnual = Math.min(
    annualGross,
    Math.max(0, settings.pretaxMonthlyDeductions) * 12,
  );
  const posttaxAnnual = Math.max(0, settings.posttaxMonthlyDeductions) * 12;
  const extraTaxReserve = annualGross * (Math.max(0, settings.extraTaxReservePercent) / 100);

  const estimatedPayrollTax =
    settings.payrollType === "selfEmployed"
      ? calculateSelfEmploymentTax(annualGross - pretaxAnnual, settings.filingStatus)
      : calculateW2PayrollTax(annualGross, settings.filingStatus);

  const taxableIncome =
    settings.payrollType === "selfEmployed"
      ? Math.max(
          0,
          annualGross - pretaxAnnual - estimatedPayrollTax / 2 - STANDARD_DEDUCTIONS_2026[settings.filingStatus],
        )
      : Math.max(0, annualGross - pretaxAnnual - STANDARD_DEDUCTIONS_2026[settings.filingStatus]);
  const estimatedFederalIncomeTax = calculateFederalIncomeTax(taxableIncome, settings.filingStatus);
  const annualNet = Math.max(
    0,
    annualGross -
      pretaxAnnual -
      posttaxAnnual -
      estimatedFederalIncomeTax -
      estimatedPayrollTax -
      extraTaxReserve,
  );
  const taxAndDeductionAnnual =
    pretaxAnnual + posttaxAnnual + estimatedFederalIncomeTax + estimatedPayrollTax + extraTaxReserve;

  return {
    estimatedFederalIncomeTax,
    estimatedPayrollTax,
    monthlyPreTax: pretaxAnnual / 12,
    monthlyPostTax: posttaxAnnual / 12,
    extraTaxReserveMonthly: extraTaxReserve / 12,
    taxAndDeductionMonthly: taxAndDeductionAnnual / 12,
    monthlyNet: annualNet / 12,
    netRate: annualGross > 0 ? annualNet / annualGross : 0,
  };
}

function calculateFederalIncomeTax(taxableIncome: number, filingStatus: FilingStatus) {
  let tax = 0;
  let lowerBound = 0;

  for (const bracket of TAX_BRACKETS_2026[filingStatus]) {
    const amountInBracket = Math.max(0, Math.min(taxableIncome, bracket.upTo) - lowerBound);
    tax += amountInBracket * bracket.rate;

    if (taxableIncome <= bracket.upTo) {
      break;
    }

    lowerBound = bracket.upTo;
  }

  return tax;
}

function calculateW2PayrollTax(annualWages: number, filingStatus: FilingStatus) {
  const socialSecurity = Math.min(annualWages, SOCIAL_SECURITY_WAGE_BASE_2026) * SOCIAL_SECURITY_RATE;
  const medicare = annualWages * MEDICARE_RATE;
  const additionalMedicare =
    Math.max(0, annualWages - ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus]) *
    ADDITIONAL_MEDICARE_RATE;

  return socialSecurity + medicare + additionalMedicare;
}

function calculateSelfEmploymentTax(netBusinessIncome: number, filingStatus: FilingStatus) {
  const taxableSelfEmployment = Math.max(0, netBusinessIncome) * SELF_EMPLOYMENT_TAXABLE_RATIO;
  const socialSecurity =
    Math.min(taxableSelfEmployment, SOCIAL_SECURITY_WAGE_BASE_2026) * SOCIAL_SECURITY_RATE * 2;
  const medicare = taxableSelfEmployment * MEDICARE_RATE * 2;
  const additionalMedicare =
    Math.max(0, taxableSelfEmployment - ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus]) *
    ADDITIONAL_MEDICARE_RATE;

  return socialSecurity + medicare + additionalMedicare;
}

function getStatus(
  value: number,
  settings: Pick<
    ModelSettings,
    "essentialExpenseTarget" | "normalLifestyleTarget" | "idealSavingsTarget"
  >,
): Status {
  const targets = getExpenseTargets(settings);

  if (value >= targets.normal) {
    return "green";
  }

  if (value >= targets.essential) {
    return "yellow";
  }

  return "red";
}

function getTimelineMonths(settings: Pick<ModelSettings, "timelineStartMonth">) {
  const startMonth = isMonthId(settings.timelineStartMonth)
    ? settings.timelineStartMonth
    : DEFAULT_TIMELINE_START_MONTH;
  return buildTimelineMonths(startMonth, PROJECTION_MONTH_COUNT);
}

function getTimelineMonthOptions(settings: Pick<ModelSettings, "timelineStartMonth">) {
  return getTimelineMonths(settings).map((month) => ({
    value: month.id,
    label: month.label,
  }));
}

function getPostSeparationMonths(series: MonthModel[], settings: Pick<ModelSettings, "alreadySeparated" | "separationDate">) {
  if (settings.alreadySeparated) {
    return series;
  }

  const separationMonth = toMonthId(settings.separationDate);
  return series.filter((month) => getMonthIndex(month.id) >= getMonthIndex(separationMonth));
}

function getFirstVaPayableMonth(settings: Pick<ModelSettings, "alreadySeparated" | "separationDate" | "timelineStartMonth">) {
  if (settings.alreadySeparated) {
    return settings.timelineStartMonth;
  }

  return addMonths(toMonthId(settings.separationDate), 1);
}

function isSchoolMonth(
  monthId: MonthId,
  settings: Pick<ModelSettings, "schoolStartDate" | "schoolEndDate">,
) {
  return getSchoolMonthFactor(monthId, settings) > 0;
}

function getSchoolMonthFactor(
  monthId: MonthId,
  settings: Pick<ModelSettings, "schoolStartDate" | "schoolEndDate">,
) {
  const startDate = parseDateInput(settings.schoolStartDate);
  const endDate = parseDateInput(settings.schoolEndDate);
  const startMonth = toMonthId(settings.schoolStartDate);
  const endMonth = toMonthId(settings.schoolEndDate);
  const monthIndex = getMonthIndex(monthId);

  if (!startDate || !endDate || getMonthIndex(endMonth) < getMonthIndex(startMonth)) {
    return 0;
  }

  if (monthIndex < getMonthIndex(startMonth) || monthIndex > getMonthIndex(endMonth)) {
    return 0;
  }

  const daysInMonth = getDaysInMonth(monthId);
  let coveredDays = daysInMonth;

  if (monthId === startMonth) {
    coveredDays -= startDate.day - 1;
  }

  if (monthId === endMonth) {
    coveredDays = Math.min(coveredDays, endDate.day);
  }

  return Math.max(0, Math.min(1, coveredDays / daysInMonth));
}

function getSchoolTermMonths(settings: Pick<ModelSettings, "schoolStartDate" | "schoolEndDate">) {
  const startMonth = toMonthId(settings.schoolStartDate);
  const endMonth = toMonthId(settings.schoolEndDate);
  return Math.max(1, getMonthIndex(endMonth) - getMonthIndex(startMonth) + 1);
}

function getDateMonthFraction(dateInput: string) {
  const parsed = parseDateInput(dateInput);
  if (!parsed) {
    return 0;
  }

  return Math.max(0, Math.min(1, parsed.day / getDaysInMonth(parsed.monthId)));
}

function buildTimelineMonths(startMonth: MonthId, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const id = addMonths(startMonth, index);
    return {
      id,
      short: formatMonthShort(id),
      label: formatMonthLabel(id),
    };
  });
}

function getTimelineLabel(series: MonthModel[]) {
  const first = series[0];
  const last = series[series.length - 1];
  return first && last ? `${first.label} through ${last.label}` : "12-month projection";
}

function getCurrentMonthId() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthId: MonthId, offset: number) {
  const parsed = parseMonthId(monthId) ?? parseMonthId(DEFAULT_TIMELINE_START_MONTH);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthIndex(monthId: MonthId) {
  const parsed = parseMonthId(monthId) ?? parseMonthId(DEFAULT_TIMELINE_START_MONTH);
  return parsed.year * 12 + parsed.month - 1;
}

function toMonthId(dateInput: string) {
  if (/^\d{4}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput.slice(0, 7);
  }

  return DEFAULT_TIMELINE_START_MONTH;
}

function isMonthId(value: unknown): value is MonthId {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function isDateInput(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateInput(value: string) {
  if (!isDateInput(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day, monthId: `${year}-${String(month).padStart(2, "0")}` };
}

function parseMonthId(monthId: MonthId) {
  if (!isMonthId(monthId)) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  }

  const [year, month] = monthId.split("-").map(Number);
  return { year, month };
}

function getDaysInMonth(monthId: MonthId) {
  const parsed = parseMonthId(monthId);
  return new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
}

function formatMonthLabel(monthId: MonthId) {
  const parsed = parseMonthId(monthId);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(parsed.year, parsed.month - 1, 1)),
  );
}

function formatMonthShort(monthId: MonthId) {
  const parsed = parseMonthId(monthId);
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(parsed.year, parsed.month - 1, 1)),
  );
}

function formatDateLabel(dateInput: string) {
  const parsed = parseDateInput(dateInput);
  if (!parsed) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)),
  );
}

function formatMoney(value: number) {
  return MONEY_FORMATTER.format(Math.round(value));
}

function formatDetailedMoney(value: number) {
  return DETAILED_MONEY_FORMATTER.format(value);
}

export {
  BASE_SETTINGS,
  calculateSeries,
  getEducationBenefitPay,
  getPellPay,
  getPotentialBackpay,
  getReserveNeeded,
  getVaMonthly,
  getWorkPreview,
};

export default App;
