import type { ModelSettings } from "./App";

export const MAX_PROJECTION_MONTHS = 60;
export const OUTSIDE_EMPLOYMENT_SOURCE = "https://dodsoco.ogc.osd.mil/DoD-Personnel/Ethics-Topics-for-DoD-Personnel/Outside-Activities/";

export function isCalendarMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 100;
}

export function daysInCalendarMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !isCalendarMonth(value.slice(0, 7))) return false;
  const day = Number(value.slice(8));
  return day >= 1 && day <= daysInCalendarMonth(value.slice(0, 7));
}

export function monthIndex(month: string) {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
}

export function projectionLength(value: number) {
  return Math.max(1, Math.min(MAX_PROJECTION_MONTHS, Math.round(value) || 12));
}

export function workDateIsValid(settings: ModelSettings) {
  const { workStartDate, contractEndDate, separationDate, terminalLeaveStartDate } = settings;
  if (!isCalendarDate(workStartDate)) return false;
  if (settings.workType === "contract" && (!isCalendarDate(contractEndDate) || contractEndDate < workStartDate)) return false;
  if (!settings.alreadySeparated) {
    if (!isCalendarDate(separationDate)) return false;
    if (workStartDate <= separationDate && (!isCalendarDate(terminalLeaveStartDate) || terminalLeaveStartDate > separationDate || workStartDate < terminalLeaveStartDate)) return false;
  }
  return true;
}

export function civilianMonthFraction(month: string, settings: ModelSettings) {
  if (settings.workType === "none" || !isCalendarMonth(month) || !workDateIsValid(settings)) return 0;
  const days = daysInCalendarMonth(month);
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${days}`;
  const start = settings.workStartDate > monthStart ? settings.workStartDate : monthStart;
  const end = settings.workType === "contract" && settings.contractEndDate < monthEnd ? settings.contractEndDate : monthEnd;
  if (start > end) return 0;
  return (Number(end.slice(8)) - Number(start.slice(8)) + 1) / days;
}

export type DateIssue = { field: keyof ModelSettings; message: string; severity: "error" | "notice" };

export function getDateIssues(settings: ModelSettings): DateIssue[] {
  const issues: DateIssue[] = [];
  const error = (field: keyof ModelSettings, message: string) => issues.push({ field, message, severity: "error" });
  const notice = (field: keyof ModelSettings, message: string) => issues.push({ field, message, severity: "notice" });
  if (!isCalendarMonth(settings.timelineStartMonth)) error("timelineStartMonth", "Choose a valid projection start month.");
  if (!Number.isInteger(settings.projectionMonths) || settings.projectionMonths < 1 || settings.projectionMonths > MAX_PROJECTION_MONTHS) error("projectionMonths", "Choose 1 to 60 months in view.");
  if (!isCalendarDate(settings.separationDate)) error("separationDate", "Choose a valid separation date.");
  if (!settings.alreadySeparated && (!isCalendarDate(settings.terminalLeaveStartDate) || settings.terminalLeaveStartDate > settings.separationDate)) error("terminalLeaveStartDate", "Terminal leave must start on or before separation. Use the separation date if no terminal leave is planned.");
  if (!isCalendarDate(settings.schoolStartDate)) error("schoolStartDate", "Choose a valid school or training start date.");
  if (!isCalendarDate(settings.schoolEndDate) || settings.schoolEndDate < settings.schoolStartDate) error("schoolEndDate", "School or training must end on or after it starts. Education income and tuition are excluded until corrected.");
  if (settings.workType !== "none") {
    if (!isCalendarDate(settings.workStartDate)) error("workStartDate", "Choose a valid work start date.");
    else if (!settings.alreadySeparated && settings.workStartDate <= settings.separationDate && settings.workStartDate < settings.terminalLeaveStartDate) error("workStartDate", "Work starts before terminal leave. Choose the terminal-leave start date or later; civilian income is excluded until corrected under this planner's transition-work assumption.");
    if (settings.workType === "contract" && (!isCalendarDate(settings.contractEndDate) || settings.contractEndDate < settings.workStartDate)) error("contractEndDate", "Contract end must be on or after work starts. Civilian income and UCX are excluded until corrected.");
  }
  if (settings.vaStart !== "none" && (!isCalendarMonth(settings.vaStart) || settings.vaStart < settings.separationDate.slice(0, 7))) error("vaStart", "VA cash cannot precede separation in this model. VA income is excluded until the decision / catch-up month is corrected.");
  if (settings.finalMilitaryPayMonth !== "none" && (!isCalendarMonth(settings.finalMilitaryPayMonth) || settings.finalMilitaryPayMonth < settings.separationDate.slice(0, 7))) error("finalMilitaryPayMonth", "Final military pay cannot be deposited before the separation month. This deposit is excluded until corrected.");
  if (!isCalendarMonth(settings.pellDisbursementMonth)) error("pellDisbursementMonth", "Choose a valid Pell disbursement month.");
  else if (settings.pellEnrollment !== "none" && (settings.pellDisbursementMonth < settings.schoolStartDate.slice(0, 7) || settings.pellDisbursementMonth > settings.schoolEndDate.slice(0, 7))) notice("pellDisbursementMonth", "Pell is outside the school / training period. Confirm the actual disbursement with your school; early or delayed payments can occur.");
  if (isCalendarMonth(settings.timelineStartMonth)) {
    const start = monthIndex(settings.timelineStartMonth);
    const end = start + projectionLength(settings.projectionMonths) - 1;
    const events: [keyof ModelSettings, string, string][] = [
      ["separationDate", "Separation", settings.separationDate],
      ["schoolStartDate", "School / training start", settings.schoolStartDate],
      ...(settings.workType !== "none" ? [["workStartDate", "Work start", settings.workStartDate] as [keyof ModelSettings, string, string]] : []),
      ...(settings.vaStart !== "none" ? [["vaStart", "VA decision / catch-up", settings.vaStart] as [keyof ModelSettings, string, string]] : []),
    ];
    for (const [field, label, date] of events) {
      if (!isCalendarMonth(date.slice(0, 7))) continue;
      const index = monthIndex(date.slice(0, 7));
      if (index < start || index > end) notice(field, `${label} is outside the displayed projection. Its date is preserved; adjust Projection starts or Months in view to include it.`);
    }
    if (settings.timelineStartMonth.slice(0, 4) !== "2026" || end > monthIndex("2026-12")) notice("timelineStartMonth", "Dates are flexible; published rate windows are not. Federal tax estimates use 2026 rules and unverified benefit years use the nearest available planning rate, not a historical or future-rate forecast.");
  }
  return issues;
}
