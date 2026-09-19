import { INFORMATION_REVIEWED_AT } from "./review";

export type VaRating = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
export type PellCaseId = "typical" | "adjusted" | "maximum";

export type RateStatus = "verified" | "planning-placeholder" | "manual-required";

export type BenefitRateDataset = {
  program: string;
  label: string;
  effectiveFrom: string;
  effectiveThrough?: string;
  verifiedAt: string;
  sourceUpdatedAt?: string;
  sourceLabel: string;
  sourceUrl: string;
  status: RateStatus;
  note: string;
};

export const VA_DISABILITY_RATE_DATASET: BenefitRateDataset & {
  rates: Record<VaRating, number>;
} = {
  program: "VA Disability",
  label: "Veteran-only disability compensation",
  effectiveFrom: "2025-12-01",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceUpdatedAt: "2025-12-02",
  sourceLabel: "VA.gov disability compensation rates",
  sourceUrl: "https://www.va.gov/disability/compensation-rates/veteran-rates/",
  status: "verified",
  note: "Veteran-only monthly planning rates before dependents or other SMC awards.",
  rates: {
    0: 0,
    10: 180.42,
    20: 356.66,
    30: 552.47,
    40: 795.84,
    50: 1132.9,
    60: 1435.02,
    70: 1808.45,
    80: 2102.15,
    90: 2362.3,
    100: 3938.58,
  },
};

export const SMC_K_RATE_DATASET: BenefitRateDataset & {
  monthlyRate: number;
} = {
  program: "VA SMC-K",
  label: "Special Monthly Compensation K",
  effectiveFrom: "2025-12-01",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceLabel: "VA.gov SMC rates",
  sourceUrl: "https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/",
  status: "verified",
  note: "Optional add-on planning amount when SMC-K is expected or awarded.",
  monthlyRate: 139.87,
};

export const MGIB_ACTIVE_DUTY_RATE_DATASET: BenefitRateDataset & {
  fullTimeMonthlyRate: number;
  twoYearMonthlyRate: number;
} = {
  program: "MGIB-AD",
  label: "Montgomery GI Bill Active Duty full-time rate",
  effectiveFrom: "2025-10-01",
  effectiveThrough: "2026-09-30",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceUpdatedAt: "2026-06-23",
  sourceLabel: "VA.gov MGIB-AD current rates",
  sourceUrl: "https://www.va.gov/education/benefit-rates/montgomery-active-duty-rates/",
  status: "verified",
  note: "College rates: $2,518 full-time with at least 3 continuous years; $2,043 for the 2-year rate. Partial enrollment reduces payment.",
  fullTimeMonthlyRate: 2518,
  twoYearMonthlyRate: 2043,
};

export const MGIB_NEXT_RATE_DATASET: typeof MGIB_ACTIVE_DUTY_RATE_DATASET = {
  ...MGIB_ACTIVE_DUTY_RATE_DATASET,
  program: "MGIB-AD 2026-27",
  label: "Published October 2026 education rates",
  effectiveFrom: "2026-10-01",
  effectiveThrough: "2027-09-30",
  sourceUpdatedAt: "2026-08-27",
  sourceUrl: "https://www.va.gov/education/benefit-rates/montgomery-gi-bill-active-duty-rates/future-rates/",
  note: "College rates: $2,601 full-time with at least 3 continuous years; $2,110 for the 2-year rate. Applied to the enrollment month, not the deposit month.",
  fullTimeMonthlyRate: 2601,
  twoYearMonthlyRate: 2110,
};

export function getMgibRate(month: string, basis: "threeYear" | "twoYear") {
  const dataset = month >= "2026-10" ? MGIB_NEXT_RATE_DATASET : MGIB_ACTIVE_DUTY_RATE_DATASET;
  return basis === "twoYear" ? dataset.twoYearMonthlyRate : dataset.fullTimeMonthlyRate;
}

export const POST_911_RATE_DATASET: BenefitRateDataset = {
  program: "Post-9/11 GI Bill",
  label: "Post-9/11 housing allowance",
  effectiveFrom: "2026-08-01",
  effectiveThrough: "2027-07-31",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceUpdatedAt: "2026-07-31",
  sourceLabel: "VA.gov Post-9/11 GI Bill rates",
  sourceUrl: "https://www.va.gov/education/benefit-rates/post-9-11-gi-bill-rates/",
  status: "manual-required",
  note: "Housing allowance depends on school location, modality, eligibility percentage, and enrollment. Enter an expected monthly amount instead of using a fake national rate.",
};

export const VRE_RATE_DATASET: BenefitRateDataset = {
  program: "VR&E",
  label: "VR&E subsistence allowance",
  effectiveFrom: "manual",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceLabel: "VA.gov VR&E subsistence rates",
  sourceUrl: "https://www.benefits.va.gov/vocrehab/subsistence_allowance_rates.asp",
  status: "manual-required",
  note: "VR&E payments are fact-specific. The planner accepts a manual subsistence estimate until a verified rule path is modeled.",
};

export const PELL_GRANT_RATE_DATASET: BenefitRateDataset & {
  annualMaximum: number;
  cases: Record<PellCaseId, { label: string; termAmount: number; confidence: string; note: string }>;
} = {
  program: "Federal Pell Grant",
  label: "Pell Grant planning amounts",
  effectiveFrom: "2026-07-01",
  effectiveThrough: "2027-06-30",
  verifiedAt: INFORMATION_REVIEWED_AT,
  sourceUpdatedAt: "2026-02-18",
  sourceLabel: "Federal Student Aid Pell Grant",
  sourceUrl: "https://fsapartners.ed.gov/knowledge-center/library/dear-colleague-letters/2026-01-30/2026-27-federal-pell-grant-maximum-and-minimum-award-amounts",
  status: "verified",
  note: "Pell eligibility and award amount are school-calculated; preset cases remain editable planning assumptions.",
  annualMaximum: 7395,
  cases: {
    typical: {
      label: "Example award",
      termAmount: 1700,
      confidence: "User planning input",
      note: "Illustrative term award; confirm your actual award with the school.",
    },
    adjusted: {
      label: "Higher estimate",
      termAmount: 3000,
      confidence: "Planning assumption",
      note: "Use only if the school has indicated a higher award is realistic.",
    },
    maximum: {
      label: "Half annual maximum",
      termAmount: 7395 / 2,
      confidence: "Verified 2026-27 annual ceiling",
      note: "Modeled as half of the annual max; actual eligibility is school-calculated.",
    },
  },
};

export const BENEFIT_RATE_DATASETS = [
  VA_DISABILITY_RATE_DATASET,
  SMC_K_RATE_DATASET,
  MGIB_ACTIVE_DUTY_RATE_DATASET,
  MGIB_NEXT_RATE_DATASET,
  POST_911_RATE_DATASET,
  VRE_RATE_DATASET,
  PELL_GRANT_RATE_DATASET,
];
