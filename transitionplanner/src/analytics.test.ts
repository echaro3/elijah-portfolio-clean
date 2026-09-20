import { afterEach, describe, expect, it, vi } from "vitest";

function environment(hostname = "www.elijahcharo.com", consent: string | null = "granted") {
  const values = new Map<string, string>();
  if (consent) values.set("site-analytics-consent-v1", consent);
  const elements: Array<Record<string, any>> = [];
  const listeners: Record<string, (event: any) => void> = {};
  const createElement = (tag: string) => {
    const element: Record<string, any> = { tag, append: vi.fn(), setAttribute: vi.fn(), addEventListener: vi.fn() };
    elements.push(element);
    return element;
  };
  const windowMock = {
    location: { hostname, protocol: "https:", pathname: "/transitionplanner/", search: "?income=9999", hash: "#private", reload: vi.fn() },
    addEventListener: vi.fn(), dataLayer: [] as any[],
  };
  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("navigator", { doNotTrack: "0" });
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  vi.stubGlobal("document", {
    referrer: "https://www.google.com/search?q=private",
    createElement, head: { append: vi.fn() }, body: { append: vi.fn() },
    addEventListener: (name: string, listener: (event: any) => void) => { listeners[name] = listener; },
  });
  return { windowMock, elements, listeners, commands: () => windowMock.dataLayer.map(args => Array.from(args)) };
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("privacy-safe analytics", () => {
  it.each(["localhost", "127.0.0.1", "financial-transition-planner.vercel.app", "preview.vercel.app", "www.elijahcharo.com.evil.test"])("never loads Google on %s", async hostname => {
    const env = environment(hostname);
    const analytics = await import("./analytics");
    analytics.initializeAnalytics();
    analytics.trackAction("contact_click");
    expect(env.commands()).toEqual([]);
    expect(env.elements.some(element => element.tag === "script")).toBe(false);
  });

  it("does not load or queue events without opt-in", async () => {
    const env = environment("www.elijahcharo.com", null);
    const analytics = await import("./analytics");
    analytics.initializeAnalytics();
    analytics.trackPlannerStarted();
    expect(env.commands()).toEqual([]);
    expect(env.elements.some(element => element.tag === "script")).toBe(false);
  });

  it("honors browser privacy signals even with prior consent", async () => {
    const env = environment();
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    (await import("./analytics")).initializeAnalytics();
    expect(env.commands()).toEqual([]);
  });

  it("initializes once and strips private URLs from configuration", async () => {
    const env = environment();
    const analytics = await import("./analytics");
    analytics.initializeAnalytics();
    analytics.initializeAnalytics();
    const configs = env.commands().filter(args => args[0] === "config");
    expect(configs).toHaveLength(1);
    expect(configs[0][2]).toMatchObject({
      page_location: "https://www.elijahcharo.com/transitionplanner/",
      page_referrer: "https://www.google.com/",
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    expect(JSON.stringify(env.commands())).not.toContain("private");
  });

  it("only sends fixed event names and records one start per page", async () => {
    const env = environment();
    const analytics = await import("./analytics");
    analytics.initializeAnalytics();
    analytics.trackPlannerStarted();
    analytics.trackPlannerStarted();
    analytics.trackAction("income_9999");
    analytics.trackAction("scenario_selected");
    const events = env.commands().filter(args => args[0] === "event");
    expect(events).toEqual([
      ["event", "planner_started", { send_to: "G-Y6T74H4PC5" }],
      ["event", "scenario_selected", { send_to: "G-Y6T74H4PC5" }],
    ]);
  });

  it("turns collection off immediately when consent is withdrawn", async () => {
    const env = environment();
    const analytics = await import("./analytics");
    analytics.initializeAnalytics();
    const button = env.elements.find(element => element.tag === "button")!;
    button.addEventListener.mock.calls[0][1]();
    analytics.trackAction("contact_click");
    expect(env.commands().filter(args => args[0] === "event")).toEqual([]);
    expect(env.windowMock.location.reload).toHaveBeenCalledOnce();
  });
});
