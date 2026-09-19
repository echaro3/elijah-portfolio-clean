import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/transitionplanner/",
  plugins: [react()],
  css: { postcss: { plugins: [] } },
  optimizeDeps: {
    include: [
      "three", "three/examples/jsm/controls/OrbitControls.js",
      "three/examples/jsm/lines/Line2.js", "three/examples/jsm/lines/LineGeometry.js",
      "three/examples/jsm/lines/LineMaterial.js",
    ],
  },
});
