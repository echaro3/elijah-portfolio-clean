import { BENEFIT_RATE_DATASETS } from "./benefitRates";

export const RATE_SOURCE_LINKS = BENEFIT_RATE_DATASETS.map((dataset) => ({
  label: dataset.sourceLabel,
  href: dataset.sourceUrl,
}));

export const PLANNING_SOURCE_LINKS = [
  {
    label: "VA disability effective dates",
    href: "https://www.va.gov/disability/effective-date/",
  },
  {
    label: "VA first payment after rating",
    href: "https://www.va.gov/disability/about-disability-ratings/after-you-get-a-rating/",
  },
  {
    label: "VA MGIB-AD future-rate page",
    href: "https://www.va.gov/education/benefit-rates/montgomery-gi-bill-active-duty-rates/future-rates/",
  },
  {
    label: "Federal Student Aid professional judgment",
    href: "https://studentaid.gov/help-center/answers/article/professional-judgment",
  },
  {
    label: "Department of Labor unemployment resources",
    href: "https://www.dol.gov/general/topic/unemployment-insurance",
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
    label: "Federation of Tax Administrators state tax agencies",
    href: "https://taxadmin.org/state-tax-agencies/",
  },
];

export const SOURCE_LINKS = [
  ...RATE_SOURCE_LINKS,
  ...PLANNING_SOURCE_LINKS,
].filter((source, index, sources) => sources.findIndex((candidate) => candidate.href === source.href) === index);
