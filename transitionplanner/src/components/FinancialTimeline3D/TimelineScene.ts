import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { IncomeKey, MonthId, MonthModel } from "../../App";
import { STREAM_VISUALS, TIMELINE_STREAMS, type CameraPreset, type Timeline3DEvent } from "./types";

const VALUE_UNIT = 1500;
const BAR_WIDTH = 0.56;
const BAR_DEPTH = 0.68;
const MONTH_STEP = 1.18;
const MIN_HEIGHT = 0.015;
const NET_MARKER_HEIGHT = 0.032;
const SCENE_DEPTH = 3.2;
const TRANSITION_SECONDS = 0.68;
const TRANSITION_SETTLE_FRAMES = 54;
const INTERACTION_SETTLE_FRAMES = 18;
const RESIZE_SETTLE_FRAMES = 8;

type SegmentHandle = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>;
  stream: IncomeKey;
  monthId: MonthId;
  currentHeight: number;
  targetHeight: number;
  currentY: number;
  targetY: number;
  currentOpacity: number;
  targetOpacity: number;
};

type TuitionHandle = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>;
  currentHeight: number;
  targetHeight: number;
  currentY: number;
  targetY: number;
  currentOpacity: number;
  targetOpacity: number;
};

type NetMarkerHandle = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  currentY: number;
  targetY: number;
  currentOpacity: number;
  targetOpacity: number;
  currentScaleX: number;
  targetScaleX: number;
  targetColor: THREE.Color;
};

type MonthHandle = {
  id: MonthId;
  x: number;
  root: THREE.Group;
  base: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  hitbox: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  label: THREE.Sprite;
  segments: Map<IncomeKey, SegmentHandle>;
  tuition: TuitionHandle;
  depletion: TuitionHandle;
  netMarker: NetMarkerHandle;
};

type CameraMove = {
  start: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
};

export type TimelineSceneUpdate = {
  series: MonthModel[];
  thresholdLabel: string;
  thresholdValue: number;
  activeStream: IncomeKey | null;
  selectedMonth: MonthId | null;
  hoveredMonth: MonthId | null;
  events: Timeline3DEvent[];
  reducedMotion: boolean;
};

export type TimelineSceneInteractionUpdate = {
  activeStream: IncomeKey | null;
  selectedMonth: MonthId | null;
  hoveredMonth: MonthId | null;
};

export type FinancialTimelineSceneOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onHoverMonth: (monthId: MonthId | null) => void;
  onSelectMonth: (monthId: MonthId) => void;
};

export class FinancialTimelineScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private readonly monthGroup = new THREE.Group();
  private readonly gridGroup = new THREE.Group();
  private readonly eventGroup = new THREE.Group();
  private readonly floorGroup = new THREE.Group();
  private readonly months = new Map<MonthId, MonthHandle>();
  private readonly handleControlsStart = () => this.requestRender(TRANSITION_SETTLE_FRAMES);
  private readonly handleControlsChange = () => this.requestRender(INTERACTION_SETTLE_FRAMES);
  private readonly handleControlsEnd = () => this.requestRender(INTERACTION_SETTLE_FRAMES);
  private readonly onHoverMonth: (monthId: MonthId | null) => void;
  private readonly onSelectMonth: (monthId: MonthId) => void;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private frameId: number | null = null;
  private framesRemaining = 0;
  private hoveredMonth: MonthId | null = null;
  private selectedMonth: MonthId | null = null;
  private activeStream: IncomeKey | null = null;
  private series: MonthModel[] = [];
  private maxValue = 8000;
  private thresholdValue = 0;
  private thresholdLabel = "Essential";
  private reducedMotion = false;
  private floorPlane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private floorLine: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private floorLabel: THREE.Sprite;
  private cameraMove: CameraMove | null = null;
  private controlsEnabled = true;
  private isSceneVisible = true;
  private isPageVisible = document.visibilityState !== "hidden";
  private gridSignature = "";
  private floorSignature = "";
  private eventSignature = "";

  constructor({ canvas, container, onHoverMonth, onSelectMonth }: FinancialTimelineSceneOptions) {
    this.canvas = canvas;
    this.container = container;
    this.onHoverMonth = onHoverMonth;
    this.onSelectMonth = onSelectMonth;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "default",
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6.4;
    this.controls.maxDistance = 21;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.target.set(0, 2.4, 0);
    this.controls.addEventListener("start", this.handleControlsStart);
    this.controls.addEventListener("change", this.handleControlsChange);
    this.controls.addEventListener("end", this.handleControlsEnd);

    this.floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x4cefff,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.floorPlane.rotation.x = -Math.PI / 2;

    this.floorLine = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0x4cefff,
        transparent: true,
        opacity: 0.52,
      }),
    );

    this.floorLabel = createTextSprite("ESSENTIAL FLOOR", {
      color: "#dff9ff",
      accent: "#4cefff",
      fontSize: 32,
      width: 520,
      height: 120,
    });

    this.configureScene();
    this.setCameraPreset("perspective", true);
    this.resize();

    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.addEventListener("click", this.handleClick);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.requestRender(RESIZE_SETTLE_FRAMES);
    });
    this.resizeObserver.observe(this.container);

    if ("IntersectionObserver" in window) {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.isSceneVisible = entry?.isIntersecting ?? true;
          if (this.isSceneVisible) {
            this.requestRender(TRANSITION_SETTLE_FRAMES);
          }
        },
        { threshold: 0.08 },
      );
      this.intersectionObserver.observe(this.container);
    }

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  update(update: TimelineSceneUpdate) {
    this.setReducedMotion(update.reducedMotion);
    this.setFinancialData(update.series);
    this.setThreshold(update.thresholdLabel, update.thresholdValue);
    this.setEvents(update.events);
    this.setInteractionState({
      activeStream: update.activeStream,
      selectedMonth: update.selectedMonth,
      hoveredMonth: update.hoveredMonth,
    });
  }

  setFinancialData(series: MonthModel[]) {
    this.series = series;
    this.maxValue = Math.max(
      6500,
      this.thresholdValue,
      ...series.map((month) => Math.max(month.total, month.tuition)),
    ) * 1.12;

    this.ensureMonths(series);
    this.updateGrid();
    this.updateFloor();
    this.updateMonthTargets();
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  setThreshold(thresholdLabel: string, thresholdValue: number) {
    if (this.thresholdLabel === thresholdLabel && this.thresholdValue === thresholdValue) {
      return;
    }

    this.thresholdLabel = thresholdLabel;
    this.thresholdValue = thresholdValue;
    this.maxValue = Math.max(
      6500,
      this.thresholdValue,
      ...this.series.map((month) => Math.max(month.total, month.tuition)),
    ) * 1.12;
    this.updateGrid();
    this.updateFloor();
    this.updateMonthTargets();
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  setEvents(events: Timeline3DEvent[]) {
    const nextSignature = events
      .map((event) => `${event.id}:${event.monthId}:${event.label}:${event.kind}`)
      .join("|");
    if (nextSignature === this.eventSignature) {
      return;
    }

    this.eventSignature = nextSignature;
    this.updateEvents(events);
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  setInteractionState(update: TimelineSceneInteractionUpdate) {
    if (
      this.activeStream === update.activeStream &&
      this.selectedMonth === update.selectedMonth &&
      this.hoveredMonth === update.hoveredMonth
    ) {
      return;
    }

    this.activeStream = update.activeStream;
    this.selectedMonth = update.selectedMonth;
    this.hoveredMonth = update.hoveredMonth;
    this.updateMonthTargets();
    this.requestRender(INTERACTION_SETTLE_FRAMES);
  }

  setReducedMotion(reducedMotion: boolean) {
    if (this.reducedMotion === reducedMotion) {
      return;
    }

    this.reducedMotion = reducedMotion;
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  setControlsEnabled(enabled: boolean) {
    if (this.controlsEnabled === enabled) {
      return;
    }

    this.controlsEnabled = enabled;
    this.controls.enabled = enabled;
    this.canvas.style.cursor = enabled ? "grab" : "default";
    if (!enabled && this.hoveredMonth !== null) {
      this.hoveredMonth = null;
      this.onHoverMonth(null);
      this.updateMonthTargets();
    }
    this.requestRender(INTERACTION_SETTLE_FRAMES);
  }

  setCameraPreset(preset: CameraPreset, immediate = false) {
    const riskMonths = this.series
      .map((month, index) => ({ month, index }))
      .filter(({ month }) => month.status === "red" || month.id === "2027-01" || month.id === "2027-02");
    const centerIndex =
      preset === "risk" && riskMonths.length > 0
        ? riskMonths.reduce((sum, item) => sum + item.index, 0) / riskMonths.length
        : (Math.max(1, this.series.length) - 1) / 2;
    const centerX = getMonthX(centerIndex, Math.max(1, this.series.length));
    const target = new THREE.Vector3(centerX, preset === "top" ? 0.4 : 2.25, 0);
    let position = new THREE.Vector3(centerX + 6.8, 6.2, 9.4);

    if (preset === "front") {
      position = new THREE.Vector3(centerX, 4.2, 12.8);
    }

    if (preset === "top") {
      position = new THREE.Vector3(centerX, 14.4, 0.32);
    }

    if (preset === "risk") {
      position = new THREE.Vector3(centerX + 3.6, 5.3, 7.2);
    }

    this.moveCamera(position, target, immediate || this.reducedMotion);
  }

  dispose() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.removeEventListener("click", this.handleClick);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.controls.removeEventListener("start", this.handleControlsStart);
    this.controls.removeEventListener("change", this.handleControlsChange);
    this.controls.removeEventListener("end", this.handleControlsEnd);
    this.controls.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
  }

  private configureScene() {
    this.scene.fog = new THREE.FogExp2(0x06111f, 0.045);
    this.scene.add(this.gridGroup);
    this.scene.add(this.monthGroup);
    this.scene.add(this.floorGroup);
    this.scene.add(this.eventGroup);
    this.floorGroup.add(this.floorPlane, this.floorLine, this.floorLabel);

    const ambient = new THREE.AmbientLight(0x9ddcff, 0.52);
    const key = new THREE.DirectionalLight(0xdff8ff, 1.6);
    key.position.set(4, 9, 7);
    const rim = new THREE.PointLight(0x4cefff, 2.8, 28);
    rim.position.set(-5, 3.5, 4.5);
    const warning = new THREE.PointLight(0xff6572, 1.2, 16);
    warning.position.set(1.5, 1.4, -2.8);
    this.scene.add(ambient, key, rim, warning);
  }

  private ensureMonths(series: MonthModel[]) {
    if (this.months.size === series.length) {
      return;
    }

    disposeObject(this.monthGroup);
    this.monthGroup.clear();
    this.months.clear();

    series.forEach((month, index) => {
      const root = new THREE.Group();
      const x = getMonthX(index, series.length);
      root.position.x = x;

      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x12334b,
        emissive: 0x04111f,
        emissiveIntensity: 0.5,
        roughness: 0.42,
        metalness: 0.2,
      });
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 0.96), baseMaterial);
      base.position.set(0, -0.055, 0);

      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 9, 1.28),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hitbox.position.set(0, 4, 0);
      hitbox.userData.monthId = month.id;

      const label = createTextSprite(month.short.toUpperCase(), {
        color: "#dff9ff",
        accent: "#7ed6f6",
        fontSize: 38,
        width: 260,
        height: 110,
      });
      label.position.set(0, -0.08, 1.03);
      label.scale.set(0.78, 0.33, 1);

      const segments = new Map<IncomeKey, SegmentHandle>();
      let initialY = 0;
      TIMELINE_STREAMS.forEach((stream) => {
        const visual = STREAM_VISUALS[stream];
        const material = new THREE.MeshPhysicalMaterial({
          color: visual.color,
          emissive: visual.emissive,
          emissiveIntensity: stream === "vaBackpay" ? 0.55 : 0.34,
          transparent: true,
          opacity: 0.06,
          roughness: 0.16,
          metalness: 0.08,
          transmission: 0.08,
          thickness: 0.22,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        mesh.scale.set(BAR_WIDTH, MIN_HEIGHT, BAR_DEPTH);
        mesh.position.set(0, initialY + MIN_HEIGHT / 2, 0);
        mesh.userData.monthId = month.id;
        mesh.userData.stream = stream;
        root.add(mesh);
        segments.set(stream, {
          mesh,
          stream,
          monthId: month.id,
          currentHeight: MIN_HEIGHT,
          targetHeight: MIN_HEIGHT,
          currentY: mesh.position.y,
          targetY: mesh.position.y,
          currentOpacity: 0.06,
          targetOpacity: 0.06,
        });
        initialY += MIN_HEIGHT;
      });

      const tuitionMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff6572,
        emissive: 0x7a1020,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.08,
        roughness: 0.18,
        metalness: 0.05,
        depthWrite: false,
      });
      const tuitionMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), tuitionMaterial);
      tuitionMesh.scale.set(BAR_WIDTH * 0.68, MIN_HEIGHT, 0.16);
      tuitionMesh.position.set(0, -MIN_HEIGHT / 2, 0.58);
      const tuition: TuitionHandle = {
        mesh: tuitionMesh,
        currentHeight: MIN_HEIGHT,
        targetHeight: MIN_HEIGHT,
        currentY: tuitionMesh.position.y,
        targetY: tuitionMesh.position.y,
        currentOpacity: 0.08,
        targetOpacity: 0.08,
      };

      const depletionMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff6572,
        emissive: 0xff6572,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.03,
        roughness: 0.18,
        metalness: 0.04,
        depthWrite: false,
        depthTest: false,
      });
      const depletionMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), depletionMaterial);
      depletionMesh.renderOrder = 22;
      depletionMesh.scale.set(BAR_WIDTH * 1.08, MIN_HEIGHT, BAR_DEPTH * 1.12);
      depletionMesh.position.set(0, MIN_HEIGHT / 2, 0.02);
      const depletion: TuitionHandle = {
        mesh: depletionMesh,
        currentHeight: MIN_HEIGHT,
        targetHeight: MIN_HEIGHT,
        currentY: depletionMesh.position.y,
        targetY: depletionMesh.position.y,
        currentOpacity: 0.03,
        targetOpacity: 0.03,
      };

      const netMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0x4cefff,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        depthTest: false,
      });
      const netMarkerMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), netMarkerMaterial);
      netMarkerMesh.renderOrder = 30;
      netMarkerMesh.scale.set(BAR_WIDTH * 1.28, NET_MARKER_HEIGHT, BAR_DEPTH * 1.18);
      netMarkerMesh.position.set(0, NET_MARKER_HEIGHT / 2, 0.01);
      const netMarker: NetMarkerHandle = {
        mesh: netMarkerMesh,
        currentY: netMarkerMesh.position.y,
        targetY: netMarkerMesh.position.y,
        currentOpacity: 0.1,
        targetOpacity: 0.1,
        currentScaleX: BAR_WIDTH * 1.28,
        targetScaleX: BAR_WIDTH * 1.28,
        targetColor: new THREE.Color(0x4cefff),
      };

      root.add(base, hitbox, label, tuitionMesh, depletionMesh, netMarkerMesh);
      this.monthGroup.add(root);
      this.months.set(month.id, {
        id: month.id,
        x,
        root,
        base,
        hitbox,
        label,
        segments,
        tuition,
        depletion,
        netMarker,
      });
    });
  }

  private updateMonthTargets() {
    this.series.forEach((month) => {
      const handle = this.months.get(month.id);
      if (!handle) {
        return;
      }

      const isFocused = this.hoveredMonth === month.id || this.selectedMonth === month.id;
      const statusColor = getStatusColor(month.status);
      handle.base.material.color.lerp(statusColor.base, 0.42);
      handle.base.material.emissive.copy(statusColor.emissive);
      handle.base.material.emissiveIntensity = isFocused ? 1.35 : month.status === "red" ? 1.08 : 0.62;

      const labelMaterial = handle.label.material as THREE.SpriteMaterial;
      labelMaterial.opacity = isFocused ? 1 : 0.72;
      handle.label.scale.set(isFocused ? 0.88 : 0.78, isFocused ? 0.38 : 0.33, 1);

      let stackY = 0;
      TIMELINE_STREAMS.forEach((stream) => {
        const amount = month.streams[stream];
        const segment = handle.segments.get(stream);
        if (!segment) {
          return;
        }

        const targetHeight = Math.max(MIN_HEIGHT, scaleValue(amount));
        const streamIsActive = !this.activeStream || this.activeStream === stream;
        const hasValue = amount > 0;
        const focusBoost = isFocused ? 0.12 : 0;
        const streamOpacity = hasValue
          ? streamIsActive
            ? stream === "vaBackpay"
              ? 0.88
              : 0.68
            : 0.16
          : 0.025;
        segment.targetHeight = targetHeight;
        segment.targetY = stackY + targetHeight / 2;
        segment.targetOpacity = Math.min(0.95, streamOpacity + focusBoost);
        stackY += targetHeight;

        segment.mesh.material.emissiveIntensity =
          stream === this.activeStream || isFocused ? 0.72 : stream === "vaBackpay" ? 0.52 : 0.34;
      });

      const tuitionHeight = Math.max(MIN_HEIGHT, scaleValue(month.tuition));
      handle.tuition.targetHeight = tuitionHeight;
      handle.tuition.targetY = -tuitionHeight / 2;
      handle.tuition.targetOpacity = month.tuition > 0 ? (isFocused ? 0.72 : 0.48) : 0.03;

      const grossY = scaleValue(month.total);
      const netY = scaleSignedValue(month.effective);
      const visibleNetY = Number.isFinite(netY) ? netY : 0;
      const depletionBottom = Math.min(grossY, Math.max(0, visibleNetY));
      const depletionTop = Math.max(grossY, Math.max(0, visibleNetY));
      const depletionHeight = Math.max(MIN_HEIGHT, depletionTop - depletionBottom);
      handle.depletion.targetHeight = depletionHeight;
      handle.depletion.targetY = depletionBottom + depletionHeight / 2;
      handle.depletion.targetOpacity = month.tuition > 0 && month.total > 0 ? (isFocused ? 0.42 : 0.24) : 0.025;

      handle.netMarker.targetY = visibleNetY;
      handle.netMarker.targetScaleX = isFocused ? BAR_WIDTH * 1.58 : BAR_WIDTH * 1.28;
      handle.netMarker.targetOpacity = Math.abs(month.effective) > 1 || month.tuition > 0 ? (isFocused ? 0.96 : 0.76) : 0.18;
      handle.netMarker.targetColor.copy(getNetMarkerColor(month.effective, this.thresholdValue));

      const hitboxTop = Math.max(stackY, grossY, scaleValue(this.thresholdValue), 0.9);
      const hitboxBottom = Math.min(visibleNetY, -tuitionHeight, -0.12);
      handle.hitbox.scale.y = Math.max(1, (hitboxTop - hitboxBottom + 0.8) / 9);
      handle.hitbox.position.y = (hitboxTop + hitboxBottom) / 2;
    });
  }

  private updateGrid() {
    const markerStep = chooseValueStep(this.maxValue);
    const signature = `${this.series.length}:${Math.round(this.maxValue)}:${markerStep}`;
    if (signature === this.gridSignature) {
      return;
    }
    this.gridSignature = signature;

    disposeObject(this.gridGroup);
    this.gridGroup.clear();

    const width = getSceneWidth(Math.max(1, this.series.length));
    const baseGrid = new THREE.GridHelper(width + 1.6, 12, 0x2a9fbd, 0x174058);
    const gridMaterial = baseGrid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.22;
    baseGrid.position.y = -0.1;
    baseGrid.scale.z = SCENE_DEPTH / (width + 1.6);
    this.gridGroup.add(baseGrid);

    const axisMaterial = new THREE.LineBasicMaterial({
      color: 0x7ed6f6,
      transparent: true,
      opacity: 0.22,
    });
    const points: number[] = [];
    for (let value = 0; value <= this.maxValue + markerStep; value += markerStep) {
      const y = scaleValue(value);
      points.push(-width / 2, y, -1.72, width / 2, y, -1.72);
      const label = createTextSprite(formatAxisValue(value), {
        color: "#9bb8c7",
        accent: "#4cefff",
        fontSize: 28,
        width: 240,
        height: 90,
      });
      label.position.set(-width / 2 - 0.62, y, -1.72);
      label.scale.set(0.54, 0.22, 1);
      this.gridGroup.add(label);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    this.gridGroup.add(new THREE.LineSegments(geometry, axisMaterial));
  }

  private updateFloor() {
    const signature = `${this.series.length}:${Math.round(this.thresholdValue)}:${this.thresholdLabel}`;
    if (signature === this.floorSignature) {
      return;
    }
    this.floorSignature = signature;

    const width = getSceneWidth(Math.max(1, this.series.length)) + 1.2;
    const floorY = scaleValue(this.thresholdValue);
    this.floorPlane.position.y = floorY;
    this.floorPlane.scale.set(width, SCENE_DEPTH * 0.72, 1);

    const floorPoints = [
      -width / 2, floorY, -SCENE_DEPTH / 2,
      width / 2, floorY, -SCENE_DEPTH / 2,
      width / 2, floorY, SCENE_DEPTH / 2,
      -width / 2, floorY, SCENE_DEPTH / 2,
      -width / 2, floorY, -SCENE_DEPTH / 2,
      -width / 2, floorY, SCENE_DEPTH / 2,
      width / 2, floorY, -SCENE_DEPTH / 2,
      width / 2, floorY, SCENE_DEPTH / 2,
    ];
    this.floorLine.geometry.dispose();
    this.floorLine.geometry = new THREE.BufferGeometry();
    this.floorLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute(floorPoints, 3));
    this.floorLabel.position.set(-width / 2 + 1.2, floorY + 0.16, -SCENE_DEPTH / 2 - 0.16);
    this.floorLabel.scale.set(1.35, 0.32, 1);
    updateTextSprite(this.floorLabel, `${this.thresholdLabel.toUpperCase()} FLOOR`, {
      color: "#e9fbff",
      accent: "#4cefff",
      fontSize: 32,
      width: 560,
      height: 120,
    });
  }

  private updateEvents(events: Timeline3DEvent[]) {
    disposeObject(this.eventGroup);
    this.eventGroup.clear();

    const stacked = new Map<MonthId, number>();
    events.forEach((event) => {
      const monthHandle = this.months.get(event.monthId);
      if (!monthHandle) {
        return;
      }

      const stack = stacked.get(event.monthId) ?? 0;
      stacked.set(event.monthId, stack + 1);

      const color = getEventColor(event.kind);
      const lineMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.62,
      });
      const yTop = scaleValue(this.maxValue * 0.72) + stack * 0.3;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(monthHandle.x, 0, -1.08 - stack * 0.08),
        new THREE.Vector3(monthHandle.x, yTop, -1.08 - stack * 0.08),
      ]);
      this.eventGroup.add(new THREE.Line(geometry, lineMaterial));

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 16, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86 }),
      );
      node.position.set(monthHandle.x, yTop, -1.08 - stack * 0.08);
      this.eventGroup.add(node);

      const label = createTextSprite(event.label.toUpperCase(), {
        color: "#effbff",
        accent: colorToCss(color),
        fontSize: 26,
        width: 420,
        height: 100,
      });
      label.position.set(monthHandle.x, yTop + 0.24, -1.14 - stack * 0.08);
      label.scale.set(0.94, 0.26, 1);
      this.eventGroup.add(label);
    });
  }

  private requestRender(frames = 1) {
    this.framesRemaining = Math.max(this.framesRemaining, frames);

    if (this.frameId !== null || !this.isSceneVisible || !this.isPageVisible) {
      return;
    }

    this.clock.getDelta();
    this.frameId = requestAnimationFrame(this.renderFrame);
  }

  private renderFrame = () => {
    this.frameId = null;

    if (!this.isSceneVisible || !this.isPageVisible) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.08);
    const cameraIsMoving = this.updateCameraMove();
    const controlsChanged = this.controls.update();
    this.clampControls();
    const geometryIsAnimating = this.animateSegments(delta);
    this.renderer.render(this.scene, this.camera);

    this.framesRemaining = Math.max(0, this.framesRemaining - 1);
    if (cameraIsMoving || controlsChanged || geometryIsAnimating || this.framesRemaining > 0) {
      this.frameId = requestAnimationFrame(this.renderFrame);
    }
  };

  private animateSegments(delta: number) {
    const alpha = this.reducedMotion ? 1 : 1 - Math.exp(-(delta / TRANSITION_SECONDS) * 4.5);
    let isAnimating = false;
    this.months.forEach((month) => {
      month.segments.forEach((segment) => {
        isAnimating = this.animateBox(segment, alpha) || isAnimating;
      });

      isAnimating = this.animateBox(month.tuition, alpha) || isAnimating;
      isAnimating = this.animateBox(month.depletion, alpha) || isAnimating;
      isAnimating = this.animateNetMarker(month.netMarker, alpha) || isAnimating;
    });

    return isAnimating;
  }

  private animateBox(
    handle: {
      mesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material>;
      currentHeight: number;
      targetHeight: number;
      currentY: number;
      targetY: number;
      currentOpacity: number;
      targetOpacity: number;
    },
    alpha: number,
  ) {
    const wasAnimating =
      Math.abs(handle.currentHeight - handle.targetHeight) > 0.001 ||
      Math.abs(handle.currentY - handle.targetY) > 0.001 ||
      Math.abs(handle.currentOpacity - handle.targetOpacity) > 0.003;

    handle.currentHeight = THREE.MathUtils.lerp(handle.currentHeight, handle.targetHeight, alpha);
    handle.currentY = THREE.MathUtils.lerp(handle.currentY, handle.targetY, alpha);
    handle.currentOpacity = THREE.MathUtils.lerp(handle.currentOpacity, handle.targetOpacity, alpha);
    handle.mesh.scale.y = Math.max(MIN_HEIGHT, handle.currentHeight);
    handle.mesh.position.y = handle.currentY;
    handle.mesh.material.opacity = handle.currentOpacity;

    return wasAnimating;
  }

  private animateNetMarker(marker: NetMarkerHandle, alpha: number) {
    const wasAnimating =
      Math.abs(marker.currentY - marker.targetY) > 0.001 ||
      Math.abs(marker.currentOpacity - marker.targetOpacity) > 0.003 ||
      Math.abs(marker.currentScaleX - marker.targetScaleX) > 0.001 ||
      colorDelta(marker.mesh.material.color, marker.targetColor) > 0.003;

    marker.currentY = THREE.MathUtils.lerp(marker.currentY, marker.targetY, alpha);
    marker.currentOpacity = THREE.MathUtils.lerp(marker.currentOpacity, marker.targetOpacity, alpha);
    marker.currentScaleX = THREE.MathUtils.lerp(marker.currentScaleX, marker.targetScaleX, alpha);
    marker.mesh.position.y = marker.currentY;
    marker.mesh.scale.x = marker.currentScaleX;
    marker.mesh.material.opacity = marker.currentOpacity;
    marker.mesh.material.color.lerp(marker.targetColor, alpha);

    return wasAnimating;
  }

  private updateCameraMove() {
    if (!this.cameraMove) {
      return false;
    }

    const progress = Math.min(1, (performance.now() - this.cameraMove.start) / this.cameraMove.duration);
    const eased = progress * progress * (3 - 2 * progress);
    this.camera.position.lerpVectors(this.cameraMove.fromPosition, this.cameraMove.toPosition, eased);
    this.controls.target.lerpVectors(this.cameraMove.fromTarget, this.cameraMove.toTarget, eased);

    if (progress >= 1) {
      this.cameraMove = null;
    }

    return true;
  }

  private moveCamera(position: THREE.Vector3, target: THREE.Vector3, immediate: boolean) {
    if (immediate) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.camera.lookAt(target);
      this.controls.update();
      this.cameraMove = null;
      this.requestRender(RESIZE_SETTLE_FRAMES);
      return;
    }

    this.cameraMove = {
      start: performance.now(),
      duration: 520,
      fromPosition: this.camera.position.clone(),
      toPosition: position,
      fromTarget: this.controls.target.clone(),
      toTarget: target,
    };
    this.requestRender(TRANSITION_SETTLE_FRAMES);
  }

  private clampControls() {
    const width = getSceneWidth(Math.max(1, this.series.length));
    this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -width / 2, width / 2);
    this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, 0, 6.6);
    this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -2.6, 2.2);
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, rect.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.controlsEnabled) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hitboxes = [...this.months.values()].map((month) => month.hitbox);
    const [hit] = this.raycaster.intersectObjects(hitboxes, false);
    const nextMonth = (hit?.object.userData.monthId as MonthId | undefined) ?? null;

    if (nextMonth !== this.hoveredMonth) {
      this.hoveredMonth = nextMonth;
      this.onHoverMonth(nextMonth);
      this.canvas.style.cursor = nextMonth ? "pointer" : "grab";
      this.requestRender(INTERACTION_SETTLE_FRAMES);
    }
  };

  private handlePointerLeave = () => {
    if (!this.controlsEnabled && this.hoveredMonth === null) {
      return;
    }

    this.hoveredMonth = null;
    this.canvas.style.cursor = this.controlsEnabled ? "grab" : "default";
    this.onHoverMonth(null);
    this.requestRender(INTERACTION_SETTLE_FRAMES);
  };

  private handleClick = () => {
    if (this.controlsEnabled && this.hoveredMonth) {
      this.onSelectMonth(this.hoveredMonth);
    }
  };

  private handleVisibilityChange = () => {
    this.isPageVisible = document.visibilityState !== "hidden";
    if (this.isPageVisible) {
      this.requestRender(TRANSITION_SETTLE_FRAMES);
    } else if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  };
}

function getMonthX(index: number, total: number) {
  return (index - (total - 1) / 2) * MONTH_STEP;
}

function getSceneWidth(total: number) {
  return (Math.max(1, total) - 1) * MONTH_STEP + BAR_WIDTH;
}

function scaleValue(value: number) {
  return Math.max(0, value) / VALUE_UNIT;
}

function scaleSignedValue(value: number) {
  return THREE.MathUtils.clamp(value / VALUE_UNIT, -2.6, 16);
}

function getNetMarkerColor(effectiveValue: number, thresholdValue: number) {
  if (effectiveValue < 0) {
    return new THREE.Color(0xff6572);
  }

  if (effectiveValue < thresholdValue) {
    return new THREE.Color(0xffd782);
  }

  return new THREE.Color(0x4cefff);
}

function getStatusColor(status: string) {
  if (status === "red") {
    return {
      base: new THREE.Color(0x38131b),
      emissive: new THREE.Color(0xff6572),
    };
  }

  if (status === "yellow") {
    return {
      base: new THREE.Color(0x332812),
      emissive: new THREE.Color(0xffd782),
    };
  }

  return {
    base: new THREE.Color(0x123323),
    emissive: new THREE.Color(0x72e9a8),
  };
}

function getEventColor(kind: Timeline3DEvent["kind"]) {
  if (kind === "risk") {
    return 0xff6572;
  }

  if (kind === "school") {
    return 0xb9a1ff;
  }

  if (kind === "va") {
    return 0x72e9a8;
  }

  if (kind === "work") {
    return 0x51f3ff;
  }

  return 0x4cefff;
}

function chooseValueStep(maxValue: number) {
  if (maxValue > 12000) {
    return 4000;
  }

  if (maxValue > 8000) {
    return 3000;
  }

  return 2000;
}

function formatAxisValue(value: number) {
  if (value === 0) {
    return "$0";
  }

  return `$${Math.round(value / 1000)}K`;
}

function createTextSprite(
  text: string,
  options: { color: string; accent: string; fontSize: number; width: number; height: number },
) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
  updateTextSprite(sprite, text, options);
  return sprite;
}

function updateTextSprite(
  sprite: THREE.Sprite,
  text: string,
  options: { color: string; accent: string; fontSize: number; width: number; height: number },
) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `800 ${options.fontSize}px Inter, system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = options.accent;
  context.shadowBlur = 18;
  context.fillStyle = options.color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = sprite.material as THREE.SpriteMaterial;
  material.map?.dispose();
  material.map = texture;
  material.needsUpdate = true;
}

function colorToCss(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function colorDelta(current: THREE.Color, target: THREE.Color) {
  return Math.max(
    Math.abs(current.r - target.r),
    Math.abs(current.g - target.g),
    Math.abs(current.b - target.b),
  );
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite) {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry?.dispose();
      }

      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else if (material) {
        disposeMaterial(material);
      }
    }
  });
}

function disposeMaterial(material: THREE.Material) {
  const withMap = material as THREE.Material & { map?: THREE.Texture | null };
  withMap.map?.dispose();
  material.dispose();
}
