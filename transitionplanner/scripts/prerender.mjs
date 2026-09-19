import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({ root, appType: "custom", server: { middlewareMode: true, hmr: false }, logLevel: "error" });
try {
  const { render } = await server.ssrLoadModule("/src/entry-static.tsx");
  const htmlPath = new URL("../dist/index.html", import.meta.url);
  const template = await readFile(htmlPath, "utf8");
  if (!template.includes("<!--app-html-->")) throw new Error("Missing prerender placeholder");
  await writeFile(htmlPath, template.replace("<!--app-html-->", render()));
  console.log("Prerendered public planner introduction, source references, and creator credit.");
} finally {
  await server.close();
}
