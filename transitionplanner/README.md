# Financial Transition Planner

A private planning dashboard for modeling the August 2026 to July 2027 Air Force separation window, civilian bridge income, WGU education benefits, VA disability timing, UCX fallback assumptions, Pell cases, and reserve needs.

The live planner is published at:

```text
https://elijahcharo.com/transitionplanner
```

## What It Models

- Active-duty pay through the December 7, 2026 separation date
- Civilian income as hourly or yearly pay
- Texas/San Antonio take-home estimates using federal tax, FICA, or self-employment tax
- VA disability monthly compensation plus optional SMC-K
- VA catch-up deposit timing for delayed rating decisions
- MGIB, Pell, WGU tuition reserve, UCX, and DFAS deduction scenarios
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
