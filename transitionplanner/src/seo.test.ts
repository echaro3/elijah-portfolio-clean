import html from "../index.html?raw";
import { describe, expect, it } from "vitest";
import { render } from "./entry-static";

describe("public search content", () => {
  it("prerenders the shared introduction, sources, and creator without personal financial settings", () => {
    const html = render();
    expect(html).toContain("Veteran transition planner");
    expect(html).toContain("VA disability compensation");
    expect(html).toContain("Rates, sources &amp; review dates");
    expect(html).toContain('href="https://www.elijahcharo.com/" rel="author"');
    expect(html).toContain("Not affiliated with the VA or Department of Defense");
    expect(html).not.toContain("Page refreshed");
    expect(html).not.toContain("stack-column");
    expect(html).not.toContain("localStorage");
  });

  it("keeps structured app identity and share URLs on the canonical public domain", () => {
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(script).not.toBeNull();
    const graph = JSON.parse(script![1])["@graph"];
    const app = graph.find((entity: { "@type": string }) => entity["@type"] === "WebApplication");
    const webpage = graph.find((entity: { "@type": string }) => entity["@type"] === "WebPage");
    expect(app.url).toBe("https://www.elijahcharo.com/transitionplanner/");
    expect(webpage.mainEntity["@id"]).toBe(app["@id"]);
    expect(app.isAccessibleForFree).toBe(true);
    expect(app.offers.price).toBe("0");
    expect(app.aggregateRating).toBeUndefined();
    expect(html).toContain(`<link rel="canonical" href="${app.url}"`);
    expect(html).toContain("<!--app-html-->");
  });
});
