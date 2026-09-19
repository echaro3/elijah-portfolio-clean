import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { IncomeKey, MonthId, MonthModel } from "../../App";
import { STREAM_VISUALS, TIMELINE_STREAMS, type CameraPreset, type Timeline3DEvent } from "./types";
import { MAX_PROJECTION_MONTHS } from "../../planningDates";

const STEP = 1.12;
const WIDTH = .58;
const DEPTH = .72;
const MAX_MONTHS = MAX_PROJECTION_MONTHS;
type Segment = { month: number; stream: IncomeKey; height: number; target: number; color: THREE.Color };
type Interaction = { activeStream: IncomeKey | null; selectedMonth: MonthId | null; hoveredMonth: MonthId | null };
type Options = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onHoverMonth: (month: MonthId | null) => void;
  onSelectMonth: (month: MonthId) => void;
  onUnavailable?: () => void;
};

// All income segments share one geometry and shader: one draw call, no transmission passes.
const COLUMN_VERTEX = `
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vColor;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vColor = instanceColor;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const COLUMN_FRAGMENT = `
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vColor;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - abs(dot(n, viewDirection)), 2.0);
    vec3 face = abs(vLocal);
    float edge = min(min(max(face.x, face.y), max(face.y, face.z)), max(face.x, face.z));
    float outline = smoothstep(.475, .499, edge);
    float light = .3 + .4 * max(dot(n, normalize(vec3(-.5, 1., .8))), 0.);
    float bands = .97 + .03 * cos(vWorld.y * 65.);
    vec3 color = vColor * (light + fresnel * .24) * bands;
    color = mix(color, vColor * 1.15 + vec3(.1), outline * .8);
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class FinancialTimelineScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, .1, 1000);
  private controls: OrbitControls;
  private columns: THREE.InstancedMesh;
  private nodes: THREE.InstancedMesh;
  private bases: THREE.InstancedMesh;
  private deductions: THREE.InstancedMesh;
  private labels = new THREE.Group();
  private grid = new THREE.Group();
  private eventsGroup = new THREE.Group();
  private reference = new THREE.Group();
  private trace: Line2;
  private focus: THREE.LineSegments;
  private frame: number | null = null;
  private disposed = false;
  private visible = true;
  private pageVisible = document.visibilityState !== "hidden";
  private reduced = false;
  private autoRotate = false;
  private enabled = true;
  private lastFrame = 0;
  private scale = 1500;
  private series: MonthModel[] = [];
  private segments: Segment[] = [];
  private events: Timeline3DEvent[] = [];
  private state: Interaction = { activeStream: null, selectedMonth: null, hoveredMonth: null };
  private threshold = 3200;
  private thresholdLabel = "Essential";
  private preset: CameraPreset = "perspective";
  private cameraMove: { start: number; from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null = null;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private down: { x: number; y: number } | null = null;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private netHeights: number[] = [];

  constructor(private options: Options) {
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: false, powerPreference: "low-power" });
    this.renderer.setClearColor(0x0c100e);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.columns = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.ShaderMaterial({ vertexShader: COLUMN_VERTEX, fragmentShader: COLUMN_FRAGMENT }), MAX_MONTHS * TIMELINE_STREAMS.length);
    this.columns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.columns.frustumCulled = false;
    this.columns.count = 0;
    this.nodes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045, 1), new THREE.MeshBasicMaterial({ color: 0xd2ffe7 }), MAX_MONTHS);
    this.bases = new THREE.InstancedMesh(new THREE.BoxGeometry(.84, .028, 1.04), new THREE.MeshBasicMaterial(), MAX_MONTHS);
    this.deductions = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, 1, .18), new THREE.MeshBasicMaterial({ color: 0xbe707c }), MAX_MONTHS);
    for (const mesh of [this.nodes, this.bases, this.deductions]) { mesh.frustumCulled = false; mesh.count = 0; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    this.trace = new Line2(new LineGeometry(), new LineMaterial({ color: 0xc5f5df, linewidth: 2, transparent: true, opacity: .9, depthTest: true }));
    this.trace.frustumCulled = false;
    this.focus = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xe3fff0, transparent: true, opacity: .8 }));
    this.focus.visible = false;
    this.scene.add(this.columns, this.nodes, this.bases, this.deductions, this.labels, this.grid, this.eventsGroup, this.reference, this.trace, this.focus);
    this.controls = new OrbitControls(this.camera, options.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .1;
    this.controls.minPolarAngle = .08;
    this.controls.maxPolarAngle = Math.PI * .48;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 320;
    this.controls.enablePan = false;
    // Wheel scrolling belongs to the page. Dedicated zoom buttons work on every device.
    this.controls.enableZoom = false;
    this.controls.autoRotateSpeed = .55;
    this.controls.addEventListener("change", this.requestRender);
    this.controls.addEventListener("start", this.cancelCameraMove);
    options.canvas.addEventListener("pointermove", this.handleMove);
    options.canvas.addEventListener("pointerleave", this.handleLeave);
    options.canvas.addEventListener("pointerdown", this.handleDown);
    options.canvas.addEventListener("pointerup", this.handleUp);
    options.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(options.container);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.requestRender();
    }, { threshold: .01 });
    this.intersectionObserver.observe(options.container);
    this.resize();
  }

  setFinancialData(series: MonthModel[]) {
    const datesChanged = this.series.map(m => m.id).join() !== series.map(m => m.id).join();
    this.series = series.slice(0, MAX_MONTHS);
    this.scale = Math.max(1000, this.threshold, ...series.map(m => Math.max(m.total, m.tuition))) / 5;
    const previous = this.segments;
    this.segments = this.series.flatMap((month, index) => TIMELINE_STREAMS.map((stream, j) => ({
      month: index, stream, target: Math.max(0, month.streams[stream]) / this.scale,
      height: datesChanged ? 0 : previous[index * TIMELINE_STREAMS.length + j]?.height ?? 0,
      color: new THREE.Color(STREAM_VISUALS[stream].color),
    })));
    this.columns.count = this.segments.length;
    this.nodes.count = this.bases.count = this.deductions.count = series.length;
    this.netHeights = this.series.map((m, i) => datesChanged ? 0 : this.netHeights[i] ?? 0);
    this.rebuildGrid();
    this.rebuildReference();
    this.rebuildEvents();
    if (datesChanged) {
      clearGroup(this.labels);
      this.series.forEach((month, i) => {
        const label = textSprite(month.short, "#b8c8be", .56);
        label.position.set(this.x(i), -.2, .87);
        this.labels.add(label);
      });
    }
    this.setCameraPreset(this.preset, true);
    this.requestRender();
  }

  setThreshold(label: string, value: number) {
    if (this.threshold === value && this.thresholdLabel === label) return;
    this.threshold = value;
    this.thresholdLabel = label;
    this.setFinancialData(this.series);
  }
  setEvents(events: Timeline3DEvent[]) { this.events = events; this.rebuildEvents(); this.requestRender(); }
  setInteractionState(state: Interaction) { this.state = state; this.requestRender(); }
  setReducedMotion(value: boolean) { this.reduced = value; this.controls.enableDamping = !value; this.controls.autoRotate = this.autoRotate && !value; this.requestRender(); }
  setControlsEnabled(value: boolean) {
    this.enabled = value;
    this.controls.enabled = value;
    this.options.canvas.style.cursor = value ? "grab" : "auto";
    this.options.canvas.style.touchAction = value ? "none" : "pan-y";
  }
  setAutoRotate(value: boolean) { this.autoRotate = value; this.controls.autoRotate = value && !this.reduced; this.requestRender(); }
  zoom(direction: number) {
    this.cameraMove = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * (direction > 0 ? .82 : 1.22), 4, 320));
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.requestRender();
  }

  setCameraPreset(preset: CameraPreset, immediate = false) {
    this.preset = preset;
    const mobile = this.camera.aspect < 1.5;
    const risk = this.series.map((m, i) => m.status === "red" ? i : -1).filter(i => i >= 0);
    const riskX = preset === "risk" && risk.length ? this.x(risk.reduce((a, b) => a + b) / risk.length) : 0;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const minY = -Math.max(.25, ...this.series.map(m => m.tuition / this.scale));
    const maxY = Math.max(1, ...this.series.map(m => m.total / this.scale + .6), this.threshold / this.scale + .4);
    const target = new THREE.Vector3(riskX, (minY + maxY) / 2, -.1);
    let direction = new THREE.Vector3(mobile ? .13 : .32, .32, 1).normalize();
    if (preset === "front") direction.set(0, .06, 1).normalize();
    if (preset === "top") { direction.set(0, 1, .08).normalize(); target.y = 0; }
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    let distance = 4;
    const half = Math.max(2, this.series.length * STEP / 2 + .5);
    const bounds: THREE.Vector3[] = [];
    this.series.forEach((month, index) => {
      for (const x of [this.x(index) - .5, this.x(index) + .5]) {
        bounds.push(new THREE.Vector3(x, month.total / this.scale + .7, -.6));
        bounds.push(new THREE.Vector3(x, -month.tuition / this.scale - .28, 1));
      }
    });
    for (const x of [-half, half]) for (const y of [0, this.threshold / this.scale]) {
      bounds.push(new THREE.Vector3(x, y, -1.8), new THREE.Vector3(x, y, 1.15));
    }
    // Fit the actual data silhouette, rather than empty corners of a giant bounding box.
    for (const bound of bounds) {
      const offset = bound.sub(target);
      distance = Math.max(distance,
        Math.abs(offset.dot(right)) / Math.tan(horizontalFov / 2) + offset.dot(direction),
        Math.abs(offset.dot(up)) / Math.tan(verticalFov / 2) + offset.dot(direction));
    }
    distance *= preset === "risk" && !mobile ? .9 : 1.05;
    const position = target.clone().addScaledVector(direction, distance);
    if (immediate || this.reduced) {
      this.cameraMove = null;
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
    } else {
      this.cameraMove = { start: performance.now(), from: this.camera.position.clone(), to: position, fromTarget: this.controls.target.clone(), toTarget: target };
    }
    this.requestRender();
  }

  private x(index: number) { return (index - (this.series.length - 1) / 2) * STEP; }
  private rebuildGrid() {
    clearGroup(this.grid);
    const half = Math.max(2, this.series.length * STEP / 2);
    const vertices: number[] = [];
    for (let i = 0; i <= this.series.length; i++) {
      const x = -half + i * STEP;
      vertices.push(x, -.065, -1.7, x, -.065, 1.3);
    }
    for (const z of [-1.7, -.7, .3, 1.3]) vertices.push(-half, -.065, z, half, -.065, z);
    const tick = Math.ceil(this.scale * 5 / 4 / 500) * 500;
    for (let value = 0; value <= this.scale * 5.4; value += tick) {
      const y = value / this.scale;
      vertices.push(-half, y, -1.7, half, y, -1.7);
      const label = textSprite(value ? `$${Number((value / 1000).toFixed(1))}k` : "$0", "#809188", .62);
      label.position.set(-half - .4, y, -1.7);
      this.grid.add(label);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    this.grid.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x34453b, transparent: true, opacity: .5 })));
  }

  private rebuildReference() {
    clearGroup(this.reference);
    const half = this.series.length * STEP / 2;
    const y = this.threshold / this.scale;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 2.25), new THREE.MeshBasicMaterial({ color: 0xdfc38b, transparent: true, opacity: .055, side: THREE.DoubleSide, depthWrite: false }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, y, 0);
    const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, y, 1.12), new THREE.Vector3(half, y, 1.12),
      new THREE.Vector3(half, y, -1.12), new THREE.Vector3(-half, y, -1.12), new THREE.Vector3(-half, y, 1.12),
    ]), new THREE.LineDashedMaterial({ color: 0xdfc38b, dashSize: .1, gapSize: .08, transparent: true, opacity: .6 }));
    outline.computeLineDistances();
    const label = textSprite(`${this.thresholdLabel} / $${Math.round(this.threshold).toLocaleString("en-US")}`, "#dfc38b", 2.1);
    label.position.set(-half + 1, y + .18, -1.18);
    this.reference.add(plane, outline, label);
  }

  private rebuildEvents() {
    clearGroup(this.eventsGroup);
    // Combine same-month events into one marker so short labels remain legible.
    const byMonth = new Map<string, string[]>();
    this.events.forEach(event => byMonth.set(event.monthId, [...(byMonth.get(event.monthId) ?? []), event.label]));
    byMonth.forEach((names, monthId) => {
      const index = this.series.findIndex(m => m.id === monthId);
      if (index < 0) return;
      const x = this.x(index);
      const y = this.series[index].total / this.scale + .38;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y - .23, -.52), new THREE.Vector3(x, y + .12, -.52)]), new THREE.LineBasicMaterial({ color: 0x91aca0 }));
      const label = textSprite(names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0], "#abc4b7", 1.15);
      label.position.set(x, y + .24, -.52);
      this.eventsGroup.add(line, label);
    });
  }

  private resize = () => {
    if (this.disposed) return;
    const { width, height } = this.options.container.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.5 : 1.75));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.trace.material.resolution.set(width, height);
    this.setCameraPreset(this.preset, true);
  };

  private requestRender = () => {
    if (this.disposed || this.frame !== null || !this.visible || !this.pageVisible) return;
    this.frame = requestAnimationFrame(this.render);
  };

  private render = (now: number) => {
    this.frame = null;
    if (this.disposed || !this.visible || !this.pageVisible) return;
    const dt = Math.min((now - this.lastFrame) / 1000 || .016, .05);
    this.lastFrame = now;
    const alpha = this.reduced ? 1 : 1 - Math.exp(-dt * 11);
    let moving = false;
    const stack = this.series.map(() => 0);
    const focused = this.state.hoveredMonth ?? this.state.selectedMonth;
    this.segments.forEach((segment, index) => {
      if (Math.abs(segment.height - segment.target) > .0008) moving = true;
      segment.height = THREE.MathUtils.lerp(segment.height, segment.target, alpha);
      const height = Math.max(.00001, segment.height);
      this.dummy.position.set(this.x(segment.month), stack[segment.month] + height / 2, 0);
      const present = segment.target > 0 || segment.height > .001;
      this.dummy.scale.set(present ? WIDTH : 0, height, present ? DEPTH : 0);
      this.dummy.updateMatrix();
      this.columns.setMatrixAt(index, this.dummy.matrix);
      stack[segment.month] += height;
      const isFocused = this.series[segment.month].id === focused;
      this.color.copy(segment.color).multiplyScalar(this.state.activeStream && this.state.activeStream !== segment.stream ? .18 : isFocused ? 1.3 : 1);
      this.columns.setColorAt(index, this.color);
    });
    this.columns.instanceMatrix.needsUpdate = true;
    this.columns.boundingSphere = null;
    if (this.columns.instanceColor) this.columns.instanceColor.needsUpdate = true;
    const points: number[] = [];
    this.series.forEach((month, index) => {
      const target = month.effective / this.scale;
      if (Math.abs(this.netHeights[index] - target) > .001) moving = true;
      const y = this.netHeights[index] = THREE.MathUtils.lerp(this.netHeights[index], target, alpha);
      points.push(this.x(index), y + .012, .51);
      this.dummy.position.set(this.x(index), y + .012, .51);
      this.dummy.scale.setScalar(month.id === focused ? 1.55 : 1);
      this.dummy.updateMatrix(); this.nodes.setMatrixAt(index, this.dummy.matrix);
      this.dummy.position.set(this.x(index), -.07, 0);
      this.dummy.scale.set(1, 1, 1); this.dummy.updateMatrix(); this.bases.setMatrixAt(index, this.dummy.matrix);
      this.bases.setColorAt(index, this.color.set(month.status === "red" ? 0x9d535f : month.status === "yellow" ? 0x8e7744 : 0x4b8266).multiplyScalar(month.id === focused ? 1.3 : .55));
      this.dummy.position.set(this.x(index), -month.tuition / this.scale / 2, .85);
      this.dummy.scale.set(month.tuition > 0 ? 1 : 0, Math.max(.00001, month.tuition / this.scale), month.tuition > 0 ? 1 : 0); this.dummy.updateMatrix(); this.deductions.setMatrixAt(index, this.dummy.matrix);
    });
    for (const mesh of [this.nodes, this.bases, this.deductions]) mesh.instanceMatrix.needsUpdate = true;
    if (this.bases.instanceColor) this.bases.instanceColor.needsUpdate = true;
    if (points.length >= 6) {
      const starts = this.trace.geometry.getAttribute("instanceStart");
      const ends = this.trace.geometry.getAttribute("instanceEnd");
      if (!starts || starts.count !== this.series.length - 1) this.trace.geometry.setPositions(points);
      else {
        for (let i = 0; i < starts.count; i++) {
          starts.setXYZ(i, points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
          ends.setXYZ(i, points[i * 3 + 3], points[i * 3 + 4], points[i * 3 + 5]);
        }
        starts.needsUpdate = true; ends.needsUpdate = true;
        this.trace.geometry.computeBoundingSphere();
      }
    }
    this.trace.visible = points.length >= 6;
    const focusIndex = this.series.findIndex(m => m.id === focused);
    this.focus.visible = focusIndex >= 0;
    if (focusIndex >= 0) { this.focus.scale.set(WIDTH + .12, Math.max(.05, stack[focusIndex]) + .08, DEPTH + .12); this.focus.position.set(this.x(focusIndex), stack[focusIndex] / 2, 0); }
    if (this.cameraMove) {
      const progress = this.reduced ? 1 : Math.min(1, (now - this.cameraMove.start) / 550);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(this.cameraMove.from, this.cameraMove.to, ease);
      this.controls.target.lerpVectors(this.cameraMove.fromTarget, this.cameraMove.toTarget, ease);
      if (progress === 1) this.cameraMove = null;
      else moving = true;
    }
    const changed = this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
    // Useful for local performance checks without retaining a renderer on window.
    this.options.canvas.dataset.drawCalls = String(this.renderer.info.render.calls);
    this.options.canvas.dataset.renderFrames = String(this.renderer.info.render.frame);
    if (moving || changed || (this.autoRotate && !this.reduced)) this.requestRender();
  };

  private hit(event: PointerEvent) {
    const rect = this.options.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const [hit] = this.raycaster.intersectObject(this.columns);
    const index = hit?.instanceId !== undefined ? Math.floor(hit.instanceId / TIMELINE_STREAMS.length) : -1;
    return this.series[index]?.id ?? null;
  }
  private handleMove = (event: PointerEvent) => {
    if (!this.enabled || this.down || event.pointerType === "touch") return;
    const month = this.hit(event);
    if (month !== this.state.hoveredMonth) this.options.onHoverMonth(month);
    this.options.canvas.style.cursor = month ? "pointer" : "grab";
  };
  private handleLeave = () => { this.down = null; this.options.onHoverMonth(null); };
  private handleDown = (event: PointerEvent) => { this.down = { x: event.clientX, y: event.clientY }; };
  private handleUp = (event: PointerEvent) => {
    if (this.enabled && this.down && Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) < 6) {
      const month = this.hit(event);
      if (month) this.options.onSelectMonth(month);
    }
    this.down = null;
  };
  private cancelCameraMove = () => { this.cameraMove = null; };
  private handleVisibility = () => { this.pageVisible = document.visibilityState !== "hidden"; if (this.pageVisible) this.requestRender(); };
  private handleContextLost = (event: Event) => { event.preventDefault(); this.options.onUnavailable?.(); };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect(); this.intersectionObserver.disconnect();
    this.controls.removeEventListener("change", this.requestRender);
    this.controls.removeEventListener("start", this.cancelCameraMove);
    this.controls.dispose();
    const canvas = this.options.canvas;
    canvas.removeEventListener("pointermove", this.handleMove);
    canvas.removeEventListener("pointerleave", this.handleLeave);
    canvas.removeEventListener("pointerdown", this.handleDown);
    canvas.removeEventListener("pointerup", this.handleUp);
    canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    clearGroup(this.scene);
    this.renderer.dispose();
  }
}

function textSprite(text: string, color: string, width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "500 30px -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 40, 500);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }));
  // Crop transparent margins so short labels do not shrink to unreadable text.
  const measured = Math.min(500, ctx.measureText(text).width + 16);
  texture.repeat.x = measured / 512; texture.offset.x = (512 - measured) / 1024;
  const fittedWidth = Math.min(width, measured / 80 * .5);
  sprite.scale.set(fittedWidth, fittedWidth * 80 / measured, 1);
  return sprite;
}

function clearGroup(group: THREE.Object3D) {
  group.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
      if ("geometry" in object) object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => { (material as THREE.MeshBasicMaterial).map?.dispose(); material.dispose(); });
      if (object instanceof THREE.InstancedMesh) object.dispose();
    }
  });
  group.clear();
}
