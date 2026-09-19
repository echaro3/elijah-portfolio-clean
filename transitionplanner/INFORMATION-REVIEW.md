# Information review: September 19, 2026

The review date is fixed in `src/data/review.ts`. The page refresh timestamp is a separate browser-local timestamp. Reloading never marks source information as newly verified.

## Verified sources

- [VA disability compensation](https://www.va.gov/disability/compensation-rates/veteran-rates/): the 2026 veteran-only table remains effective December 1, 2025. No dependent additions are calculated.
- [SMC](https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/): one SMC-K add-on remains $139.87. Other SMC awards are outside this model.
- [MGIB through September 2026](https://www.va.gov/education/benefit-rates/montgomery-active-duty-rates/): college full-time rates are $2,518 (3-year rate) and $2,043 (2-year rate).
- [MGIB October 2026-September 2027](https://www.va.gov/education/benefit-rates/montgomery-gi-bill-active-duty-rates/future-rates/): published August 27, 2026; college full-time rates are $2,601 and $2,110. Half and three-quarter enrollment use published proportions. These apply to the earned month, before the cash-timing lag. Existing saved custom amounts are preserved.
- [Post-9/11](https://www.va.gov/education/benefit-rates/post-9-11-gi-bill-rates/): August 2026-July 2027 rules reviewed; housing depends on location, attendance and eligibility. The entered amount must reflect the user's actual expected payment.
- [VR&E](https://www.benefits.va.gov/vocrehab/subsistence_allowance_rates.asp): retains a manual monthly allowance because training, dependents and payment election vary.
- [Federal Pell Grant](https://fsapartners.ed.gov/knowledge-center/library/dear-colleague-letters/2026-01-30/2026-27-federal-pell-grant-maximum-and-minimum-award-amounts): 2026-27 scheduled annual maximum remains $7,395; source confirmed February 18, 2026. Presets are illustrative, not an eligibility calculation. Year-round Pell can exceed the scheduled annual award and is not modeled.
- [IRS 2026 tables](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf) and [SSA wage base](https://www.ssa.gov/oact/cola/cbb.html): checked federal brackets, standard deductions and the $184,500 Social Security cap. The projection carries 2026 tax assumptions into later years, explicitly labeled as estimates.
- [DOL UCX](https://oui.doleta.gov/unemploy/ucx.asp): benefit eligibility and amounts depend on the state. Removed the inherited $605 cap; new plans start at $0 until a weekly estimate is entered. Existing amounts are preserved.
- [VA effective dates](https://www.va.gov/disability/effective-date/) and [38 CFR 3.31](https://www.govinfo.gov/content/pkg/CFR-2025-title38-vol1/pdf/CFR-2025-title38-vol1-sec3-31.pdf): the modeled day-after-separation effective date is an assumption, not a claim decision. Corrected month-end separation to begin accrual after the effective-date month.
- [VA first payment](https://www.va.gov/disability/about-disability-ratings/after-you-get-a-rating/): the first payment is generally within 15 days of a decision for a rating of at least 10%. Exact deposit dates and bank holidays are not predicted.

## Model boundaries

### Date and employment review

Reviewed September 19, 2026: [DoD outside-employment guidance](https://dodsoco.ogc.osd.mil/DoD-Personnel/Ethics-Topics-for-DoD-Personnel/Outside-Activities/) and [Joint Ethics Regulation, section 9-801](https://www.esd.whs.mil/portals/54/documents/dd/issuances/dodm/550007r.pdf). Terminal-leave employment can overlap military pay. Terminal leave remains active duty, and command approval, conflicts, and restrictions on particular jobs still matter. The planner conservatively models transition work from the terminal-leave start onward, not separately approved off-duty employment before that date; it does not present this assumption as a universal legal ban.

Work start and contract end are inclusive calendar dates. Partial months use calendar days, including leap years. Month-only saved starts migrate to the 16th and contract ends to month end. School and work periods, terminal leave, VA decision timing, final pay, and the projection range receive chronological checks. Out-of-view dates remain intact. Projection length is 1-60 months to keep both chart renderers bounded. Existing VA accrual uses the entered separation date even when the projection is moved.

No claim eligibility, dependent VA awards, state tax tables, active-duty tuition caps, or non-college training schedules are inferred. MGIB uses a 30-day enrollment convention, with a full February treated as a full month. Other manual education payments use calendar-day prorating. UCX retains an illustrative 10% federal withholding reserve; this is not total tax liability. Future rates outside the reviewed windows remain estimates.

## Rendering

The 3D renderer is loaded on demand. All income segments use one instanced mesh and shared shader. The net-income trace reuses its GPU buffers. Rendering sleeps when idle or out of view; orbit is opt-in and disabled for reduced motion. Mobile pixel ratio is capped at 1.5. Touch scrolling remains enabled until the user activates scene controls. WebGL failure offers the standard chart.
