import React, { useEffect, useRef } from "react";

// A small, demand-aware canvas: no WebGL, external assets, or render loop offscreen.
export default function DataRoutes({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const styles = getComputedStyle(canvas);
    const palette = Object.fromEntries(["grid", "line", "highlight", "packet", "secondary", "node", "border"].map((key) => [key, styles.getPropertyValue(`--route-${key}`).trim()]));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let resizeFrame = 0;
    let visible = false;
    let lastFrame = 0;
    let progress = 0;
    let previousTime = 0;
    let routes = [];
    const pointer = { x: -1000, y: -1000 };

    function draw() {
      context.clearRect(0, 0, width, height);
      const mobile = width < 760;
      const start = mobile ? width * 0.42 : width * 0.48;

      context.fillStyle = palette.grid;
      for (let x = start; x < width; x += 28) {
        for (let y = 28; y < height; y += 28) context.fillRect(x, y, 1, 1);
      }

      for (const [index, route] of routes.entries()) {
        const nearPointer = route.some(([x, y]) => Math.hypot(x - pointer.x, y - pointer.y) < 140);
        context.strokeStyle = nearPointer ? palette.highlight : palette.line;
        context.lineWidth = 1;
        context.beginPath();
        route.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
        context.stroke();

        const lengths = route.slice(1).map((point, i) => Math.hypot(point[0] - route[i][0], point[1] - route[i][1]));
        const total = lengths.reduce((sum, length) => sum + length, 0);
        let distance = ((progress * 0.045 + index * 0.143) % 1) * total;
        for (let i = 0; i < lengths.length; i++) {
          if (distance <= lengths[i]) {
            const t = distance / lengths[i];
            const x = route[i][0] + (route[i + 1][0] - route[i][0]) * t;
            const y = route[i][1] + (route[i + 1][1] - route[i][1]) * t;
            context.fillStyle = index % 3 === 0 ? palette.secondary : palette.packet;
            context.globalAlpha = mobile ? 0.34 : 0.7;
            context.fillRect(x - 3, y - 3, 6, 6);
            context.globalAlpha = 1;
            break;
          }
          distance -= lengths[i];
        }

        const [endX, endY] = route[route.length - 1];
        context.fillStyle = palette.node;
        context.fillRect(endX - 5, endY - 5, 10, 10);
        context.strokeStyle = palette.border;
        context.strokeRect(endX - 5, endY - 5, 10, 10);
      }
    }

    function tick(time) {
      if (!lastFrame || time - lastFrame > 32) {
        if (previousTime) progress += Math.min(time - previousTime, 100) / 1000;
        previousTime = time;
        lastFrame = time;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      previousTime = 0;
      if (!reducedMotion.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
      else draw();
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.5 : 2);
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const x = width < 760 ? width * 0.72 : width * 0.65;
      const spread = width < 760 ? 0.55 : 1;
      const middle = height * 0.52;
      routes = Array.from({ length: 7 }, (_, i) => {
        const y = middle + (i - 3) * 57;
        const turn = x + (i % 3) * 31 * spread;
        return [[width + 10, y - 74], [turn + 100 * spread, y - 74], [turn + 26 * spread, y], [turn - 46 * spread, y]];
      });
      draw();
    }

    // Defer canvas size writes outside observer delivery to avoid Safari resize loops.
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const move = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    };
    const leave = () => { pointer.x = -1000; pointer.y = -1000; };
    const hero = canvas.parentElement;
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [theme]);

  return <canvas className="portfolio-routes" ref={canvasRef} aria-hidden="true" />;
}
