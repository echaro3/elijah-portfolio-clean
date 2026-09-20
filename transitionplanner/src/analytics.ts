const MEASUREMENT_ID = "G-Y6T74H4PC5";
const CONSENT_KEY = "site-analytics-consent-v1";
const EVENTS = new Set([
  "contact_click", "resume_download", "linkedin_click", "planner_open",
  "planner_started", "scenario_selected", "plan_print",
]);
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
let initialized = false;
let enabled = false;
let started = false;

export function isProductionLocation(location: Pick<Location, "hostname" | "protocol" | "pathname">) {
  return location.protocol === "https:" &&
    ["elijahcharo.com", "www.elijahcharo.com"].includes(location.hostname) &&
    ["/", "/transitionplanner", "/transitionplanner/"].includes(location.pathname);
}

export function safePage(location: Pick<Location, "pathname">) {
  return location.pathname.startsWith("/transitionplanner")
    ? "https://www.elijahcharo.com/transitionplanner/"
    : "https://www.elijahcharo.com/";
}

export function safeReferrer(referrer: string) {
  try { return new URL(referrer).origin + "/"; } catch { return ""; }
}

function privacySignal() {
  return navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function readConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; }
}

// No arbitrary event parameters: planner values, dates and scenario names never enter this API.
export function trackAction(name: string) {
  if (!enabled || !EVENTS.has(name)) return;
  (window as AnalyticsWindow).gtag?.("event", name, { send_to: MEASUREMENT_ID });
}

export function trackPlannerStarted() {
  if (!enabled || started) return;
  started = true;
  trackAction("planner_started");
}

function enable() {
  if (enabled || !isProductionLocation(window.location) || privacySignal()) return;
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = function () { analyticsWindow.dataLayer!.push(arguments); };
  const gtag = analyticsWindow.gtag;
  gtag("consent", "default", {
    analytics_storage: "granted", ad_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    send_page_view: true,
    page_location: safePage(window.location),
    page_referrer: safeReferrer(document.referrer),
    page_title: window.location.pathname === "/" ? "Elijah Charo | Portfolio" : "Veteran transition planner",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.append(script);
  enabled = true;
}

export function initializeAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  if (readConsent()) enable();

  const section = document.createElement("section");
  section.className = "site-analytics-choice";
  section.setAttribute("aria-label", "Analytics privacy preferences");
  const description = document.createElement("p");
  const button = document.createElement("button");
  button.type = "button";
  const render = () => {
    description.textContent = privacySignal()
      ? "Optional analytics are off to respect your browser privacy preference."
      : "Optional Google Analytics measures page visits and button actions using cookies. Planner inputs stay in your browser and are not included in our analytics events.";
    button.textContent = readConsent() ? "Turn analytics off" : "Allow analytics";
    button.disabled = privacySignal() && !readConsent();
  };
  button.addEventListener("click", () => {
    const grant = !readConsent();
    try { localStorage.setItem(CONSENT_KEY, grant ? "granted" : "denied"); }
    catch { description.textContent = "Your browser could not save this preference. Analytics remains off."; return; }
    if (grant) { enable(); render(); }
    else {
      enabled = false;
      (window as AnalyticsWindow).gtag?.("consent", "update", { analytics_storage: "denied" });
      // Reload stops the loaded tag and its automatic listeners before further interactions.
      window.location.reload();
    }
  });
  section.append(description, button);
  document.body.append(section);
  render();
  document.addEventListener("click", (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a") : null;
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (href.startsWith("mailto:")) trackAction("contact_click");
    else if (href === "/ElijahCharo_Resume_PowerPlatform.pdf") trackAction("resume_download");
    else if (href.startsWith("https://www.linkedin.com/in/")) trackAction("linkedin_click");
    else if (href === "https://www.elijahcharo.com/transitionplanner/") trackAction("planner_open");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === CONSENT_KEY || event.key === null) window.location.reload();
  });
}
