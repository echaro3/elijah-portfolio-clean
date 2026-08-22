# Financial Transition Planner

A privacy-first Veteran transition and income planner for modeling a user-configurable 12-month transition window, civilian employment, VA disability timing, education benefits, Pell assumptions, optional UCX planning, expenses, and reserve needs.

The app is designed to run at `/transitionplanner/` behind the main website.

## What It Models

- Active-duty pay through a user-entered separation date
- Civilian income as hourly or yearly pay
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

## Deployment

This app is currently linked to the Vercel project:

```text
financial-transition-planner
```

The Vite base path is configured as `/transitionplanner/` so it can be served behind the main portfolio path.
