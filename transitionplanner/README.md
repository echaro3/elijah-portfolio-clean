# Financial Transition Planner

A privacy-first Veteran transition and income planner for modeling a user-configurable 1-60 month transition window, civilian employment, VA disability timing, education benefits, Pell assumptions, optional UCX planning, expenses, and reserve needs.

The app is designed to run at `/transitionplanner/` behind the main website.

## What It Models

- Active-duty pay through a user-entered separation date
- Civilian income as hourly or yearly pay
- Calendar work start/end dates in past or future years, with inclusive calendar-day proration
- Terminal-leave overlap, chronological date checks, and unrestricted benefit-month pickers
- Estimated take-home using federal tax, FICA, or self-employment tax, with manual take-home override
- VA disability monthly compensation plus optional SMC-K
- VA catch-up deposit timing for delayed rating decisions
- MGIB, Pell, tuition reserve, UCX, and military-pay timing scenarios
- Local browser persistence through `localStorage`

## Tech Stack

- React
- TypeScript
- Vite
- lucide-react icons
- Three.js with instanced income layers and demand-driven rendering

## Information Review

Benefit and tax information was reviewed on September 19, 2026. See [the review record](INFORMATION-REVIEW.md) for official sources, rate windows, calculation changes, and limitations. The page displays both this fixed information-review date and an independent page-refresh timestamp.

MGIB can use the published 2-year or 3-year college rates, including the October 2026 update, or a custom amount. Existing saved plans retain their custom amounts. All planner settings continue to use the existing localStorage key.

Legacy month-only work starts migrate to the 16th (the prior model assumed half a first month); contract ends migrate to the month's last day. Exact dates persist thereafter. Invalid work or school periods are flagged and excluded, not silently shifted. A work start before terminal leave is excluded under the transition-work assumption; separately approved off-duty employment is outside this model. DoD approval and ethics restrictions still apply during terminal leave.

Projection dates do not change source-rate coverage. Dates outside verified benefit windows use labeled planning estimates; taxes remain based on the published 2026 assumptions.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Search And Sharing

`index.html` contains the canonical URL, veteran-focused search and social metadata, and truthful WebApplication/creator structured data. `npm run build` also prerenders the shared introduction, cited sources, and creator credit into the initial HTML. It deliberately excludes saved settings, example financial balances, and the browser refresh timestamp. The interactive app mounts normally and reads only the visitor's own local storage.

The primary sitemap is maintained at the portfolio's `public/sitemap.xml`. The app's public share image is an actual screenshot using clean example settings; `/transitionplanner/social-preview.png` is explicitly routed in `vercel.json`. No third-party analytics or submission of planner inputs is added. Search indexing and ranking remain search-engine decisions; verified Search Console ownership is required for manual indexing requests.

## Deployment

This app is currently linked to the Vercel project:

```text
financial-transition-planner
```

The Vite base path is configured as `/transitionplanner/` so it can be served behind the main portfolio path.
