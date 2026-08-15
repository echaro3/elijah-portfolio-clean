import * as React from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  GraduationCap,
  Landmark,
  Layers3,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

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

const MONTHS = [
  { id: "2026-08", short: "Aug", label: "August 2026" },
  { id: "2026-09", short: "Sep", label: "September 2026" },
  { id: "2026-10", short: "Oct", label: "October 2026" },
  { id: "2026-11", short: "Nov", label: "November 2026" },
  { id: "2026-12", short: "Dec", label: "December 2026" },
  { id: "2027-01", short: "Jan", label: "January 2027" },
  { id: "2027-02", short: "Feb", label: "February 2027" },
  { id: "2027-03", short: "Mar", label: "March 2027" },
  { id: "2027-04", short: "Apr", label: "April 2027" },
  { id: "2027-05", short: "May", label: "May 2027" },
  { id: "2027-06", short: "Jun", label: "June 2027" },
  { id: "2027-07", short: "Jul", label: "July 2027" },
] as const;

type MonthId = (typeof MONTHS)[number]["id"];
type Rating = 80 | 90 | 100;
type ScenarioId = "schoolFirst" | "bridge" | "partTime" | "fullTime" | "delayedVa";
type WorkType = "none" | "contract" | "partTime" | "permanent";
type UcxMode = "off" | "ifEligible";
type PellCaseId = "typical" | "adjusted" | "maximum";
type ContractEnd = "2026-12" | "2027-01" | "2027-02" | "2027-03";
type VaStart = "2027-01" | "2027-02" | "2027-03" | "2027-04" | "2027-05" | "2027-06" | "none";
type PayMode = "hourly" | "annual";
type PayrollType = "w2" | "selfEmployed";
type FilingStatus = "single" | "marriedJoint" | "headOfHousehold";
type IncomeKey = "military" | "civilian" | "ucx" | "vaBackpay" | "va" | "mgib" | "pell";
type Status = "green" | "yellow" | "red";

type ModelSettings = {
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
  pretaxMonthlyDeductions: number;
  posttaxMonthlyDeductions: number;
  extraTaxReservePercent: number;
  includeVaBackpay: boolean;
  ucxMode: UcxMode;
  pellCase: PellCaseId;
  schoolCUs: number;
  dfasDeductionTotal: number;
};

type PlannerState = {
  scenarioId: ScenarioId;
  settings: ModelSettings;
};

type MonthModel = {
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

const ACTIVE_DUTY_MONTHLY = 4600;
const TARGET_FLOOR = 4300;
const COMFORT_TARGET = 4600;
const STRONG_TARGET = 5000;
const WGU_TERM_TUITION = 4030;
const WGU_TUITION_MONTHLY = WGU_TERM_TUITION / 6;
const MGIB_CURRENT_FULL_TIME = 2518;
const UCX_WEEKLY_MAX = 605;
const UCX_TAX_HOLD_BACK = 0.9;
const SMC_K_RATE = 139.87;
const PLANNER_STORAGE_KEY = "elijah-transition-planner:v1";
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

const VA_RATES: Record<Rating, number> = {
  80: 2102.15,
  90: 2362.3,
  100: 3938.58,
};

const INCOME_ORDER: IncomeKey[] = ["military", "civilian", "ucx", "vaBackpay", "va", "mgib", "pell"];

const INCOME_LABELS: Record<IncomeKey, string> = {
  military: "Military pay",
  civilian: "Civilian work",
  ucx: "UCX",
  vaBackpay: "VA catch-up",
  va: "VA monthly",
  mgib: "MGIB",
  pell: "Pell",
};

const PELL_CASES: Record<
  PellCaseId,
  { label: string; termAmount: number; confidence: string; note: string }
> = {
  typical: {
    label: "Typical",
    termAmount: 1700,
    confidence: "Historical working amount",
    note: "Modeled from your prior Pell pattern, not a guarantee.",
  },
  adjusted: {
    label: "Adjusted",
    termAmount: 3000,
    confidence: "Professional judgment target",
    note: "Middle of the $2,500-$3,500 special-circumstances range.",
  },
  maximum: {
    label: "Maximum",
    termAmount: 7395 / 2,
    confidence: "Verified 2026-27 annual ceiling",
    note: "Modeled as half of the $7,395 annual max; 2027-28 still needs verification.",
  },
};

const BASE_SETTINGS: ModelSettings = {
  rating: 90,
  smcK: true,
  vaStart: "2027-03",
  workType: "contract",
  contractEnd: "2027-01",
  payMode: "hourly",
  hourlyRate: 40,
  annualSalary: 85000,
  weeklyHours: 40,
  partTimeHours: 20,
  payrollType: "w2",
  filingStatus: "single",
  pretaxMonthlyDeductions: 0,
  posttaxMonthlyDeductions: 0,
  extraTaxReservePercent: 2,
  includeVaBackpay: true,
  ucxMode: "off",
  pellCase: "typical",
  schoolCUs: 18,
  dfasDeductionTotal: 0,
};

const SCENARIOS: Record<ScenarioId, ScenarioPreset> = {
  schoolFirst: {
    id: "schoolFirst",
    label: "Scenario A - School-first",
    shortLabel: "School-first",
    description: "No civilian job after separation; WGU begins February at the full-time planning load.",
    recommendation: "Only comfortable if UCX is approved or you carry a serious reserve into January.",
    stress: "High until VA and MGIB are flowing",
    schoolTime: "Best",
    risk: "High",
    pellImplication: "Cleanest reduced-income story for professional judgment, but not automatic.",
    ucxImplication: "Possible after separation if eligible; full-time school availability rules need TWC verification.",
    settings: {
      ...BASE_SETTINGS,
      workType: "none",
      vaStart: "2027-03",
      ucxMode: "ifEligible",
      hourlyRate: 40,
    },
  },
  bridge: {
    id: "bridge",
    label: "Scenario B - Temporary bridge",
    shortLabel: "Contract bridge",
    description: "Temporary technical contract starts in late October and ends before WGU becomes the main focus.",
    recommendation: "Best balance: use the Oct-Jan overlap to build reserve, clean up urgent debt, and keep school optionality.",
    stress: "Medium, then lower if reserve is saved",
    schoolTime: "Strong after contract ends",
    risk: "Medium",
    pellImplication: "Some income may weaken the special-circumstances case, but a natural contract end is easier to explain.",
    ucxImplication: "Potentially better fact pattern if the contract ends naturally; still verify with TWC.",
    settings: {
      ...BASE_SETTINGS,
      workType: "contract",
      contractEnd: "2027-01",
      vaStart: "2027-03",
      ucxMode: "off",
      hourlyRate: 40,
    },
  },
  partTime: {
    id: "partTime",
    label: "Scenario C - Part-time tech role",
    shortLabel: "Part-time + school",
    description: "Part-time technical work continues while you carry a full-time WGU load.",
    recommendation: "Strong if you can cap hours and protect study pace; best practical fallback if VA is late.",
    stress: "Medium",
    schoolTime: "Good if hours stay capped",
    risk: "Medium-low",
    pellImplication: "Income may reduce the strength of a reduced-income aid appeal, but the monthly floor is steadier.",
    ucxImplication: "Part-time wages may reduce or eliminate UCX; partial-benefit math is highly fact-specific.",
    settings: {
      ...BASE_SETTINGS,
      workType: "partTime",
      hourlyRate: 50,
      partTimeHours: 20,
      vaStart: "2027-03",
      ucxMode: "off",
    },
  },
  fullTime: {
    id: "fullTime",
    label: "Scenario D - Full-time job + school",
    shortLabel: "Full-time job",
    description: "Permanent full-time technical work continues alongside WGU.",
    recommendation: "Financially strongest, but it risks turning WGU into the second job instead of the main transition plan.",
    stress: "High workload, low cash stress",
    schoolTime: "Weakest",
    risk: "Low cash risk, high time risk",
    pellImplication: "Likely weakest special-circumstances case because replacement income is steady.",
    ucxImplication: "UCX generally not part of this path while employed full-time.",
    settings: {
      ...BASE_SETTINGS,
      workType: "permanent",
      hourlyRate: 35,
      vaStart: "2027-03",
      ucxMode: "off",
    },
  },
  delayedVa: {
    id: "delayedVa",
    label: "Scenario E - Delayed VA stress case",
    shortLabel: "Delayed VA",
    description: "VA cash does not arrive until May, with no civilian work and no UCX relied on.",
    recommendation: "Use this as the no-surprises reserve test; do not let this be the unplanned default.",
    stress: "Very high in January-April",
    schoolTime: "Best, if affordable",
    risk: "Very high",
    pellImplication: "Strong reduced-income argument, but timing and award are still school decisions.",
    ucxImplication: "Models UCX at zero to show the reserve needed without it.",
    settings: {
      ...BASE_SETTINGS,
      workType: "none",
      vaStart: "2027-05",
      ucxMode: "off",
      hourlyRate: 40,
    },
  },
};

const CONTRACT_END_OPTIONS: { value: ContractEnd; label: string }[] = [
  { value: "2026-12", label: "Dec 2026" },
  { value: "2027-01", label: "Jan 2027" },
  { value: "2027-02", label: "Feb 2027" },
  { value: "2027-03", label: "Mar 2027" },
];

const VA_START_OPTIONS: { value: VaStart; label: string }[] = [
  { value: "2027-01", label: "Jan 2027" },
  { value: "2027-02", label: "Feb 2027" },
  { value: "2027-03", label: "Mar 2027" },
  { value: "2027-04", label: "Apr 2027" },
  { value: "2027-05", label: "May 2027" },
  { value: "2027-06", label: "Jun 2027" },
  { value: "none", label: "No VA by July" },
];

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
  { value: "partTime", label: "Part-time tech" },
  { value: "permanent", label: "Full-time civilian" },
];

const ACTION_PLAN = [
  {
    month: "August 2026",
    title: "Lock the ground truth",
    actions: [
      "Enter exact DFAS deductions as soon as the next two LES/pay amounts are visible.",
      "Build a one-page expense floor: rent, utilities, phone, food, gas, debt minimums, medical, subscriptions.",
      "Save the WGU SCO email showing 18 CUs for full-time and ask whether this applies to MGIB certification for your exact program.",
      "Confirm BDD exam status, missing evidence, direct deposit, and VA.gov claim notifications.",
    ],
  },
  {
    month: "September 2026",
    title: "Create the bridge pipeline",
    actions: [
      "Target Power Platform, SharePoint/M365, Power BI, reporting, and short-term IT contract roles.",
      "Ask recruiters for contracts that can start during terminal leave and end naturally around late January or February.",
      "Set a transition reserve target before separation, then treat overlap income as reserve/debt cleanup first.",
      "Confirm terminal leave start date and any unit restrictions in writing.",
    ],
  },
  {
    month: "October 2026",
    title: "Start the overlap deliberately",
    actions: [
      "If a contract starts, keep it temporary and written so the end date supports flexibility and possible UCX review.",
      "Freeze lifestyle creep from double income; route surplus to reserve, urgent debt, and school transition costs.",
      "Schedule WGU financial aid and military/veterans-benefits calls before October gets crowded.",
      "Track all job applications and recruiter conversations in case unemployment work-search evidence matters later.",
    ],
  },
  {
    month: "November 2026",
    title: "Prepare the benefit handoff",
    actions: [
      "Confirm WGU term, 18+ CU plan, MGIB certification path, and any required VA enrollment steps.",
      "Prepare FAFSA professional-judgment documentation: orders, projected income, final LES plan, debt context, and separation docs.",
      "Make a January cash plan that works without VA backpay.",
      "Decide whether the contract should end in January, February, or continue part time.",
    ],
  },
  {
    month: "December 2026",
    title: "Cross the DOS line cleanly",
    actions: [
      "After December 7, secure DD-214 copies, final LES records, and any separation/pay documents.",
      "If no work or a contract ends, contact TWC about UCX timing, availability rules, and WGU compatibility.",
      "Do not budget VA backpay before it is deposited.",
      "Update the planner with actual December military pay and final-pay timing.",
    ],
  },
  {
    month: "January 2027",
    title: "Finish the February launch checklist",
    actions: [
      "Confirm WGU registration at 18+ CUs and VA education certification before February 1.",
      "Submit or finalize professional-judgment materials if WGU says your case is ready.",
      "If the contract ends naturally, collect end-of-contract documentation.",
      "Make a February bill calendar around MGIB, Pell disbursement timing, and any VA uncertainty.",
    ],
  },
  {
    month: "February 2027",
    title: "Stabilize and reassess",
    actions: [
      "Start the WGU term and verify benefit payments against actual deposits, not award promises.",
      "If VA is not flowing, decide whether to add part-time technical work before reserves get thin.",
      "Re-run this model using the official 2026-27 MGIB rate if VA has published it by then.",
      "Use the first reliable month to choose school-first, part-time, or full-time work for March-July.",
    ],
  },
];

const SOURCE_LINKS = [
  {
    label: "VA 2026 disability compensation rates",
    href: "https://www.va.gov/disability/compensation-rates/veteran-rates/",
  },
  {
    label: "VA 2026 SMC-K rate",
    href: "https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/",
  },
  {
    label: "VA MGIB-AD current rates",
    href: "https://www.va.gov/education/benefit-rates/montgomery-active-duty-rates/",
  },
  {
    label: "VA MGIB-AD future-rate page",
    href: "https://www.va.gov/education/benefit-rates/montgomery-gi-bill-active-duty-rates/future-rates/",
  },
  {
    label: "VA disability effective dates",
    href: "https://www.va.gov/disability/effective-date/",
  },
  {
    label: "VA first payment after rating",
    href: "https://www.va.gov/disability/about-disability-ratings/after-you-get-a-rating/",
  },
  {
    label: "Federal Student Aid Pell Grant",
    href: "https://studentaid.gov/understand-aid/types/grants/pell",
  },
  {
    label: "WGU financial aid and professional judgment",
    href: "https://www.wgu.edu/financial-aid-tuition/financial-aid/apply.html",
  },
  {
    label: "Texas unemployment benefit amounts",
    href: "https://www.twc.texas.gov/programs/unemployment-benefits/eligibility-benefit-amounts",
  },
  {
    label: "DOL UCX overview",
    href: "https://oui.doleta.gov/unemploy/ucx.asp",
  },
  {
    label: "IRS 2026 federal tax tables",
    href: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
  },
  {
    label: "IRS 2026 withholding methods",
    href: "https://www.irs.gov/publications/p15t",
  },
  {
    label: "SSA 2026 Social Security wage base",
    href: "https://www.ssa.gov/oact/cola/cbb.html",
  },
  {
    label: "Texas Comptroller tax overview",
    href: "https://comptroller.texas.gov/taxes/",
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
        version: 1,
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
      pellCase: isPellCaseId(savedSettings.pellCase)
        ? savedSettings.pellCase
        : baseSettings.pellCase,
      schoolCUs: clampNumber(savedSettings.schoolCUs, baseSettings.schoolCUs, 0, 40),
      dfasDeductionTotal: clampNumber(
        savedSettings.dfasDeductionTotal,
        baseSettings.dfasDeductionTotal,
        0,
        20000,
      ),
    },
  };
}

function App() {
  const [{ scenarioId, settings }, setPlannerState] =
    React.useState<PlannerState>(loadPlannerState);

  const series = React.useMemo(() => calculateSeries(settings), [settings]);
  const summary = React.useMemo(() => summarizeSeries(series, settings), [series, settings]);
  const scenarioRows = React.useMemo(() => buildScenarioRows(settings), [settings]);
  const workPreview = React.useMemo(() => getWorkPreview(settings), [settings]);

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
        rating: current.settings.rating,
        smcK: current.settings.smcK,
        payMode: current.settings.payMode,
        hourlyRate: current.settings.hourlyRate,
        annualSalary: current.settings.annualSalary,
        weeklyHours: current.settings.weeklyHours,
        partTimeHours: current.settings.partTimeHours,
        payrollType: current.settings.payrollType,
        filingStatus: current.settings.filingStatus,
        pretaxMonthlyDeductions: current.settings.pretaxMonthlyDeductions,
        posttaxMonthlyDeductions: current.settings.posttaxMonthlyDeductions,
        extraTaxReservePercent: current.settings.extraTaxReservePercent,
        includeVaBackpay: current.settings.includeVaBackpay,
        pellCase: current.settings.pellCase,
        dfasDeductionTotal: current.settings.dfasDeductionTotal,
        schoolCUs: current.settings.schoolCUs,
      },
    }));
  };

  return (
    <main className="planner-shell">
      <Header summary={summary} />

      <section className="metric-grid" aria-label="Planner summary">
        <MetricCard
          icon={<ShieldCheck aria-hidden="true" />}
          label="Likely safest path"
          value="Temporary bridge"
          detail="Contract income through January, WGU at 18+ CUs in February, VA delay planned as normal."
        />
        <MetricCard
          icon={<AlertTriangle aria-hidden="true" />}
          label="Lowest month in view"
          value={`${summary.lowestMonth.short}: ${formatMoney(summary.lowestMonth.effective)}`}
          detail={`${formatMoney(summary.lowestMonth.gapToFloor)} vs the $4,300 floor after tuition reserve.`}
        />
        <MetricCard
          icon={<PiggyBank aria-hidden="true" />}
          label="Reserve needed after DOS"
          value={formatMoney(summary.reserveNeeded)}
          detail="Maximum cumulative shortfall from December-July after tuition reserve."
        />
        <MetricCard
          icon={<WalletCards aria-hidden="true" />}
          label="VA catch-up modeled"
          value={formatMoney(summary.potentialBackpay)}
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
            Rate check: Aug. 13, 2026
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
        <IncomeLayerChart series={series} />
        <MonthlyStressGrid series={series} />
      </section>

      <MasterTimeline settings={settings} series={series} />
      <ScenarioComparison rows={scenarioRows} selectedScenario={scenarioId} />
      <AssumptionsPanel settings={settings} />
      <ActionPlan />
      <SourcePanel />
    </main>
  );
}

type HeaderProps = {
  summary: ReturnType<typeof summarizeSeries>;
};

function Header({ summary }: HeaderProps) {
  return (
    <header className="planner-header">
      <div className="header-copy">
        <p className="eyebrow">Financial transition planner | San Antonio, TX</p>
        <h1>Elijah Charo Air Force transition model</h1>
        <p>
          A conservative month-by-month planner for August 2026 through July 2027, centered on
          the October-February cash-flow danger zone.
        </p>
      </div>
      <div className="header-facts" aria-label="Critical facts">
        <div>
          <span>Separation date</span>
          <strong>Dec. 7, 2026</strong>
        </div>
        <div>
          <span>WGU start</span>
          <strong>Feb. 1, 2027</strong>
        </div>
        <div>
          <span>Full-time planning rule</span>
          <strong>18 CUs</strong>
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
  value: string;
  detail: string;
};

function MetricCard({ icon, label, value, detail }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
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
  const vaMonthly = getVaMonthly(settings);
  const vaCatchUp = getPotentialBackpay(settings);
  const recurringVaMonth = getRecurringVaStartLabel(settings.vaStart);
  const pellMonthly = getPellMonthly(settings.pellCase);
  const schoolIsFullTime = settings.schoolCUs >= 18;

  return (
    <section className="control-board" aria-labelledby="controls-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Model inputs</p>
          <h2 id="controls-heading">Stress-test the assumptions</h2>
        </div>
      </div>

      <div className="control-grid">
        <fieldset>
          <legend>
            <Landmark aria-hidden="true" />
            Benefits
          </legend>
          <label>
            <span>VA rating</span>
            <select
              value={settings.rating}
              onChange={(event) => onSettingChange("rating", Number(event.target.value) as Rating)}
            >
              <option value={80}>80%</option>
              <option value={90}>90%</option>
              <option value={100}>100%</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.smcK}
              onChange={(event) => onSettingChange("smcK", event.target.checked)}
            />
            <span>Include SMC-K ({DETAILED_MONEY_FORMATTER.format(SMC_K_RATE)}/mo)</span>
          </label>
          <label>
            <span>VA decision / catch-up month</span>
            <select
              value={settings.vaStart}
              onChange={(event) => onSettingChange("vaStart", event.target.value as VaStart)}
            >
              {VA_START_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
            <strong>{formatDetailedMoney(vaMonthly)}/mo</strong>
            <small>
              {settings.includeVaBackpay && vaCatchUp > 0
                ? `${formatDetailedMoney(vaCatchUp)} catch-up in ${getVaDecisionMonthLabel(settings.vaStart)}.`
                : "No catch-up cash modeled."}{" "}
              {recurringVaMonth ? `Regular VA cash starts ${recurringVaMonth}.` : "No VA cash by July."}
            </small>
          </div>
          <p className="field-note">
            Catch-up assumes January is the first payable month after the December 7 separation.
          </p>
        </fieldset>

        <fieldset>
          <legend>
            <GraduationCap aria-hidden="true" />
            WGU and aid
          </legend>
          <div className="segmented-label">School load</div>
          <div className="segmented-control" role="group" aria-label="School load">
            {[12, 18, 24].map((units) => (
              <button
                type="button"
                key={units}
                aria-pressed={settings.schoolCUs === units}
                onClick={() => onSettingChange("schoolCUs", units)}
              >
                {units} CUs
              </button>
            ))}
          </div>
          <label>
            <span>Pell case</span>
            <select
              value={settings.pellCase}
              onChange={(event) => onSettingChange("pellCase", event.target.value as PellCaseId)}
            >
              {Object.entries(PELL_CASES).map(([key, pellCase]) => (
                <option key={key} value={key}>
                  {pellCase.label} - {formatMoney(pellCase.termAmount)}/term
                </option>
              ))}
            </select>
          </label>
          <div className="inline-result">
            <span>{schoolIsFullTime ? "MGIB + Pell equivalent" : "Benefit warning"}</span>
            <strong>
              {schoolIsFullTime
                ? `${formatMoney(MGIB_CURRENT_FULL_TIME + pellMonthly)}/mo`
                : "MGIB full-time not modeled"}
            </strong>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <BriefcaseBusiness aria-hidden="true" />
            Work bridge
          </legend>
          <label>
            <span>Civilian work</span>
            <select
              value={settings.workType}
              onChange={(event) => onSettingChange("workType", event.target.value as WorkType)}
            >
              {WORK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
            <>
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
            </>
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
            <label>
              <span>Contract ends</span>
              <select
                value={settings.contractEnd}
                onChange={(event) =>
                  onSettingChange("contractEnd", event.target.value as ContractEnd)
                }
              >
                {CONTRACT_END_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span>Tax treatment</span>
            <select
              value={settings.payrollType}
              onChange={(event) => onSettingChange("payrollType", event.target.value as PayrollType)}
            >
              {PAYROLL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Filing status</span>
            <select
              value={settings.filingStatus}
              onChange={(event) => onSettingChange("filingStatus", event.target.value as FilingStatus)}
            >
              {FILING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
            <span>Texas / San Antonio preview</span>
            <strong>
              {workPreview.monthlyGross > 0
                ? `${formatMoney(workPreview.monthlyNet)}/mo estimated take-home`
                : "No work income"}
            </strong>
            {workPreview.monthlyGross > 0 ? (
              <small>
                {formatMoney(workPreview.monthlyGross)}/mo gross.{" "}
                {formatMoney(workPreview.taxAndDeductionMonthly)}/mo tax and deductions.{" "}
                {Math.round(workPreview.netRate * 100)}% net.
              </small>
            ) : null}
          </div>
          <p className="field-note">
            Uses 2026 federal brackets plus FICA or self-employment tax. Texas/San Antonio is modeled
            with no state or local wage income tax.
          </p>
        </fieldset>

        <fieldset>
          <legend>
            <SlidersHorizontal aria-hidden="true" />
            Risk switches
          </legend>
          <label>
            <span>UCX model</span>
            <select
              value={settings.ucxMode}
              onChange={(event) => onSettingChange("ucxMode", event.target.value as UcxMode)}
            >
              <option value="off">Do not rely on UCX</option>
              <option value="ifEligible">Model UCX if eligible</option>
            </select>
          </label>
          <label>
            <span>Temporary DFAS deductions across next 2 checks</span>
            <input
              type="number"
              min={0}
              step={50}
              value={settings.dfasDeductionTotal}
              onChange={(event) =>
                onSettingChange("dfasDeductionTotal", Number(event.target.value))
              }
            />
          </label>
          <div className="inline-result">
            <span>UCX ceiling modeled</span>
            <strong>{formatMoney((UCX_WEEKLY_MAX * 52) / 12 * UCX_TAX_HOLD_BACK)}/mo</strong>
          </div>
          <p className="field-note">
            UCX uses the Texas maximum weekly amount with a 10% federal tax holdback. Eligibility
            is not assumed.
          </p>
        </fieldset>
      </div>
    </section>
  );
}

function IncomeLayerChart({ series }: { series: MonthModel[] }) {
  const maxTotal = Math.max(STRONG_TARGET, ...series.map((month) => month.total)) * 1.08;

  return (
    <section className="visual-panel income-panel" aria-labelledby="income-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Income layer visual</p>
          <h2 id="income-heading">Monthly planning resources</h2>
        </div>
        <div className="legend" aria-label="Income legend">
          {INCOME_ORDER.map((key) => (
            <span key={key}>
              <i className={`legend-dot stream-${key}`} aria-hidden="true" />
              {INCOME_LABELS[key]}
            </span>
          ))}
        </div>
      </div>

      <div className="income-chart" role="img" aria-label="Stacked monthly income chart">
        {series.map((month) => (
          <div className="stack-column" key={month.id}>
            <div
              className="stack-track"
              aria-label={`${month.label}: ${formatMoney(month.total)} total planning resources`}
            >
              <span
                className="target-line"
                style={{ bottom: `${Math.min(100, (TARGET_FLOOR / maxTotal) * 100)}%` }}
              />
              {INCOME_ORDER.map((key) => {
                const amount = month.streams[key];
                if (amount <= 0) {
                  return null;
                }

                return (
                  <span
                    key={key}
                    className={`stack-segment stream-${key}`}
                    style={{ height: `${Math.max(1.6, (amount / maxTotal) * 100)}%` }}
                    title={`${INCOME_LABELS[key]}: ${formatMoney(amount)}`}
                  />
                );
              })}
            </div>
            <span className="stack-month">{month.short}</span>
            <strong>{formatMoney(month.total)}</strong>
          </div>
        ))}
      </div>

      <div className="chart-foot">
        <span>Target floor: {formatMoney(TARGET_FLOOR)}/mo</span>
        <span>Comfort target: {formatMoney(COMFORT_TARGET)}/mo</span>
        <span>WGU tuition reserve: {formatMoney(WGU_TUITION_MONTHLY)}/mo during term</span>
        <span>VA catch-up is one-time cash, not recurring monthly income.</span>
      </div>
    </section>
  );
}

function MonthlyStressGrid({ series }: { series: MonthModel[] }) {
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
          <article className={`stress-tile status-${month.status}`} key={month.id}>
            <span>{month.short}</span>
            <strong>{formatMoney(month.effective)}</strong>
            <small>
              {month.gapToFloor >= 0 ? "+" : ""}
              {formatMoney(month.gapToFloor)} vs floor
            </small>
          </article>
        ))}
      </div>
      <div className="status-key">
        <span>
          <i className="key-dot green" />
          Green: {formatMoney(COMFORT_TARGET)}+
        </span>
        <span>
          <i className="key-dot yellow" />
          Yellow: {formatMoney(3500)}-{formatMoney(COMFORT_TARGET - 1)}
        </span>
        <span>
          <i className="key-dot red" />
          Red: below {formatMoney(3500)}
        </span>
      </div>
    </section>
  );
}

function MasterTimeline({
  settings,
  series,
}: {
  settings: ModelSettings;
  series: MonthModel[];
}) {
  const rows = buildTimelineRows(settings, series);

  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Master timeline</p>
          <h2 id="timeline-heading">August 2026 through July 2027</h2>
        </div>
      </div>
      <div className="timeline-wrap">
        <div className="timeline-grid" role="table" aria-label="Transition timeline">
          <div className="timeline-header" role="row">
            <span role="columnheader">Layer</span>
            {MONTHS.map((month) => (
              <span role="columnheader" key={month.id}>
                {month.short}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <div className="timeline-row" role="row" key={row.label}>
              <span role="rowheader">{row.label}</span>
              {row.cells.map((cell) => (
                <span className={`timeline-cell ${cell.kind}`} role="cell" key={cell.monthId}>
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
              <th>Avg Dec-Jul</th>
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
                <td>{formatMoney(row.average)}</td>
                <td>{formatMoney(row.minimum)}</td>
                <td>{formatMoney(row.reserveNeeded)}</td>
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
  const fullTimeStatus =
    settings.schoolCUs >= 18 ? "18+ CUs selected; MGIB full-time amount is modeled." : "Under 18 CUs; MGIB full-time amount is not modeled.";

  return (
    <section className="assumptions-section" aria-labelledby="assumptions-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Risk and assumption panel</p>
          <h2 id="assumptions-heading">Do not blur facts into assumptions</h2>
        </div>
      </div>
      <div className="assumption-grid">
        <article>
          <h3>
            <CheckCircle2 aria-hidden="true" />
            Confirmed / strong facts
          </h3>
          <ul>
            <li>DOS is December 7, 2026.</li>
            <li>WGU term is planned for February 1, 2027 through late July 2027.</li>
            <li>Normal active-duty take-home benchmark is about {formatMoney(ACTIVE_DUTY_MONTHLY)}/mo.</li>
            <li>WGU SCO email says 18 CUs for full-time planning status.</li>
            <li>Terminal-leave civilian work is permitted in your situation.</li>
          </ul>
        </article>
        <article>
          <h3>
            <FileCheck2 aria-hidden="true" />
            Working assumptions
          </h3>
          <ul>
            <li>MGIB uses {formatMoney(MGIB_CURRENT_FULL_TIME)}/mo until the future 2026-27 rate is verified.</li>
            <li>{fullTimeStatus}</li>
            <li>Pell is modeled as a monthly budgeting equivalent, not as monthly deposit timing.</li>
            <li>Civilian work uses a Texas/San Antonio payroll estimate: federal tax plus FICA or self-employment tax, with no Texas state or local wage income tax modeled.</li>
            <li>VA catch-up is modeled as a one-time decision-month deposit; regular VA cash starts the following month because compensation is paid in arrears.</li>
            <li>December military pay is conservatively prorated through December 7.</li>
          </ul>
        </article>
        <article>
          <h3>
            <Clock3 aria-hidden="true" />
            High uncertainty
          </h3>
          <ul>
            <li>Final VA rating, SMC-K award, and first cash month.</li>
            <li>BDD processing speed and any delayed evidence/exam issues.</li>
            <li>Actual UCX approval, weekly amount, and WGU compatibility.</li>
            <li>Professional-judgment approval and final Pell amount.</li>
            <li>Exact debt minimums, DFAS deductions, and final-pay timing.</li>
          </ul>
        </article>
        <article>
          <h3>
            <BadgeCheck aria-hidden="true" />
            Verify before relying
          </h3>
          <ul>
            <li>VA MGIB rate for October 1, 2026 to September 30, 2027.</li>
            <li>WGU MGIB certification rules for your exact program and 18 CU load.</li>
            <li>2027-28 Pell maximum if any term/payment period crosses that award year.</li>
            <li>TWC treatment of school enrollment, part-time work, and contract end facts.</li>
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
          <h2 id="action-heading">Concrete moves through February 2027</h2>
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

function SourcePanel() {
  return (
    <footer className="source-panel">
      <div>
        <p className="eyebrow">Source posture</p>
        <h2>Planning model, not an official eligibility decision</h2>
        <p>
          Official rates are separated from working assumptions. VA, WGU, TWC, and Federal Student
          Aid decisions can change the real outcome.
        </p>
      </div>
      <div className="source-links">
        {SOURCE_LINKS.map((source) => (
          <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
            {source.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && Object.hasOwn(SCENARIOS, value);
}

function isRating(value: unknown): value is Rating {
  return value === 80 || value === 90 || value === 100;
}

function isVaStart(value: unknown): value is VaStart {
  return (
    value === "2027-01" ||
    value === "2027-02" ||
    value === "2027-03" ||
    value === "2027-04" ||
    value === "2027-05" ||
    value === "2027-06" ||
    value === "none"
  );
}

function isWorkType(value: unknown): value is WorkType {
  return value === "none" || value === "contract" || value === "partTime" || value === "permanent";
}

function isContractEnd(value: unknown): value is ContractEnd {
  return value === "2026-12" || value === "2027-01" || value === "2027-02" || value === "2027-03";
}

function isPayMode(value: unknown): value is PayMode {
  return value === "hourly" || value === "annual";
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

function isPellCaseId(value: unknown): value is PellCaseId {
  return value === "typical" || value === "adjusted" || value === "maximum";
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function calculateSeries(settings: ModelSettings): MonthModel[] {
  return MONTHS.map((month) => {
    const streams: Record<IncomeKey, number> = {
      military: getMilitaryPay(month.id, settings.dfasDeductionTotal),
      civilian: getCivilianPay(month.id, settings),
      ucx: getUcxPay(month.id, settings),
      vaBackpay: getVaBackpay(month.id, settings),
      va: getVaPay(month.id, settings),
      mgib: getMgibPay(month.id, settings),
      pell: getPellPay(month.id, settings),
    };

    const total = INCOME_ORDER.reduce((sum, key) => sum + streams[key], 0);
    const tuition = isSchoolMonth(month.id) && settings.schoolCUs > 0 ? WGU_TUITION_MONTHLY : 0;
    const effective = total - tuition;
    const gapToFloor = effective - TARGET_FLOOR;
    const status = getStatus(effective);

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
  const focusMonths = series.filter((month) => getMonthIndex(month.id) >= getMonthIndex("2026-10"));
  const postDosMonths = series.filter((month) => getMonthIndex(month.id) >= getMonthIndex("2026-12"));
  const criticalMonths = series.filter((month) => {
    const index = getMonthIndex(month.id);
    return index >= getMonthIndex("2026-10") && index <= getMonthIndex("2027-02");
  });
  const lowestMonth = focusMonths.reduce((lowest, month) =>
    month.effective < lowest.effective ? month : lowest,
  );
  const reserveNeeded = getReserveNeeded(postDosMonths);
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
  };
}

function buildScenarioRows(baseSettings: ModelSettings): ScenarioRow[] {
  return Object.values(SCENARIOS).map((scenario) => {
    const settings: ModelSettings = {
      ...scenario.settings,
      rating: baseSettings.rating,
      smcK: baseSettings.smcK,
      payMode: baseSettings.payMode,
      hourlyRate: baseSettings.hourlyRate,
      annualSalary: baseSettings.annualSalary,
      weeklyHours: baseSettings.weeklyHours,
      partTimeHours: baseSettings.partTimeHours,
      payrollType: baseSettings.payrollType,
      filingStatus: baseSettings.filingStatus,
      pretaxMonthlyDeductions: baseSettings.pretaxMonthlyDeductions,
      posttaxMonthlyDeductions: baseSettings.posttaxMonthlyDeductions,
      extraTaxReservePercent: baseSettings.extraTaxReservePercent,
      includeVaBackpay: baseSettings.includeVaBackpay,
      pellCase: baseSettings.pellCase,
      schoolCUs: baseSettings.schoolCUs,
      dfasDeductionTotal: baseSettings.dfasDeductionTotal,
    };
    const series = calculateSeries(settings);
    const postDosMonths = series.filter((month) => getMonthIndex(month.id) >= getMonthIndex("2026-12"));
    const average = postDosMonths.reduce((sum, month) => sum + month.effective, 0) / postDosMonths.length;
    const minimum = Math.min(...postDosMonths.map((month) => month.effective));
    const reserveNeeded = getReserveNeeded(postDosMonths);
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
  return [
    {
      label: "Military pay",
      cells: series.map((month) => ({
        monthId: month.id,
        kind: month.streams.military > 0 ? (month.id === "2026-12" ? "event" : "active") : "empty",
        label: month.streams.military > 0 ? (month.id === "2026-12" ? "DOS" : "Pay") : "",
      })),
    },
    {
      label: "Terminal leave",
      cells: series.map((month) => {
        const index = getMonthIndex(month.id);
        const inLeave = index >= getMonthIndex("2026-10") && index <= getMonthIndex("2026-12");
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
      label: "WGU / MGIB / Pell",
      cells: series.map((month) => {
        if (!isSchoolMonth(month.id)) {
          return { monthId: month.id, kind: "empty", label: "" };
        }

        return {
          monthId: month.id,
          kind: settings.schoolCUs >= 18 ? "active" : "risk",
          label: settings.schoolCUs >= 18 ? "18+ CU" : "Verify",
        };
      }),
    },
    {
      label: "VA cash",
      cells: series.map((month) => {
        const afterJan = getMonthIndex(month.id) >= getMonthIndex("2027-01");
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
          kind: afterJan && beforeDecision ? "risk" : "empty",
          label: afterJan && beforeDecision ? "Accrue" : "",
        };
      }),
    },
  ];
}

function getMilitaryPay(monthId: MonthId, dfasDeductionTotal: number) {
  const deductionPerMonth = Math.max(0, dfasDeductionTotal) / 2;

  if (monthId === "2026-08" || monthId === "2026-09") {
    return Math.max(0, ACTIVE_DUTY_MONTHLY - deductionPerMonth);
  }

  if (monthId === "2026-10" || monthId === "2026-11") {
    return ACTIVE_DUTY_MONTHLY;
  }

  if (monthId === "2026-12") {
    return (ACTIVE_DUTY_MONTHLY / 31) * 7;
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
  const startIndex = getMonthIndex("2026-10");

  if (monthIndex < startIndex) {
    return 0;
  }

  if (settings.workType === "contract" && monthIndex > getMonthIndex(settings.contractEnd)) {
    return 0;
  }

  return monthId === "2026-10" ? 0.25 : 1;
}

function getUcxPay(monthId: MonthId, settings: ModelSettings) {
  if (settings.ucxMode === "off") {
    return 0;
  }

  const monthIndex = getMonthIndex(monthId);
  const earliestIndex = getMonthIndex("2027-01");

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
    const weeklyPartial = Math.max(0, Math.min(UCX_WEEKLY_MAX, UCX_WEEKLY_MAX * 1.25 - weeklyEarnings));
    return weeklyPartial * (52 / 12) * UCX_TAX_HOLD_BACK;
  }

  return UCX_WEEKLY_MAX * (52 / 12) * UCX_TAX_HOLD_BACK;
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

  return getAccruedVaMonths(settings.vaStart) * getVaMonthly(settings);
}

function getVaMonthly(settings: Pick<ModelSettings, "rating" | "smcK">) {
  return VA_RATES[settings.rating] + (settings.smcK ? SMC_K_RATE : 0);
}

function getMgibPay(monthId: MonthId, settings: ModelSettings) {
  return isSchoolMonth(monthId) && settings.schoolCUs >= 18 ? MGIB_CURRENT_FULL_TIME : 0;
}

function getPellPay(monthId: MonthId, settings: ModelSettings) {
  return isSchoolMonth(monthId) && settings.schoolCUs >= 18 ? getPellMonthly(settings.pellCase) : 0;
}

function getPellMonthly(pellCaseId: PellCaseId) {
  return PELL_CASES[pellCaseId].termAmount / 6;
}

function getPotentialBackpay(settings: ModelSettings) {
  if (!settings.includeVaBackpay || settings.vaStart === "none") {
    return 0;
  }

  return getAccruedVaMonths(settings.vaStart) * getVaMonthly(settings);
}

function getReserveNeeded(months: MonthModel[]) {
  let balance = 0;
  let lowestBalance = 0;

  months.forEach((month) => {
    balance += month.effective - TARGET_FLOOR;
    lowestBalance = Math.min(lowestBalance, balance);
  });

  return Math.abs(lowestBalance);
}

function getAccruedVaMonths(vaStart: Exclude<VaStart, "none">) {
  return Math.max(0, getMonthIndex(vaStart) - getMonthIndex("2027-01"));
}

function getVaDecisionMonthLabel(vaStart: VaStart) {
  if (vaStart === "none") {
    return "no selected month";
  }

  return MONTHS.find((month) => month.id === vaStart)?.label ?? vaStart;
}

function getRecurringVaStartLabel(vaStart: VaStart) {
  if (vaStart === "none") {
    return null;
  }

  const recurringMonth = MONTHS[getMonthIndex(vaStart) + 1];
  return recurringMonth?.label ?? null;
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
    | "pretaxMonthlyDeductions"
    | "posttaxMonthlyDeductions"
    | "extraTaxReservePercent"
  >,
) {
  const annualGross = getAnnualGross(settings);
  const monthlyGross = annualGross / 12;
  const weeklyGross = annualGross / 52;
  const payrollEstimate = estimateTexasTakeHome(annualGross, settings);

  return {
    weeklyGross,
    monthlyGross,
    annualGross,
    ...payrollEstimate,
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

function estimateTexasTakeHome(
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

function getStatus(value: number): Status {
  if (value >= COMFORT_TARGET) {
    return "green";
  }

  if (value >= 3500) {
    return "yellow";
  }

  return "red";
}

function isSchoolMonth(monthId: MonthId) {
  const index = getMonthIndex(monthId);
  return index >= getMonthIndex("2027-02") && index <= getMonthIndex("2027-07");
}

function getMonthIndex(monthId: MonthId) {
  return MONTHS.findIndex((month) => month.id === monthId);
}

function formatMoney(value: number) {
  return MONEY_FORMATTER.format(Math.round(value));
}

function formatDetailedMoney(value: number) {
  return DETAILED_MONEY_FORMATTER.format(value);
}

export default App;
