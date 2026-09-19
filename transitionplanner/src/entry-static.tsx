import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlannerIntroduction, SourcePanel } from "./App";

// Public copy and cited sources only: no saved settings or illustrative financial balances.
export function render() {
  return renderToStaticMarkup(<main className="planner-shell">
    <header className="planner-header static-header"><PlannerIntroduction /></header>
    <noscript><p>JavaScript is required for the interactive calculator. The published rate sources remain available below.</p></noscript>
    <SourcePanel showRefreshTimestamp={false} />
  </main>);
}
