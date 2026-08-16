import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { IncomeKey, MonthId, MonthModel } from "../../App";
import { STREAM_VISUALS, TIMELINE_STREAMS, type CameraPreset, type Timeline3DEvent } from "./types";

const VALUE_UNIT = 1500;
const BAR_WIDTH = 0.56;
const BAR_DEPTH = 0.68;
const MONTH_STEP = 1.18;
const MIN_HEIGHT = 0.015;
const SCENE_DEPTH = 3.2;
const TRANSITION_SECONDS = 0.68;

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

type MonthHandle = {
  id: MonthId;
  x: number;
  root: THREE.Group;
  base: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  hitbox: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  label: THREE.Sprite;
  segments: Map<IncomeKey, SegmentHandle>;
  tuition: TuitionHandle;
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
  private readonly onHoverMonth: (monthId: MonthId | null) => void;
  private readonly onSelectMonth: (monthId: MonthId) => void;
  private resizeObserver: ResizeObserver | null = null;
  private frameId = 0;
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

  constructor({ canvas, container, onHoverMonth, onSelectMonth }: FinancialTimelineSceneOptions) {
    this.canvas = canvas;
    this.container = container;
    this.onHoverMonth = onHoverMonth;
    this.onSelectMonth = onSelectMonth;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
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

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);

    this.animate();
  }

  update(update: TimelineSceneUpdate) {
    this.series = update.series;
    this.thresholdValue = update.thresholdValue;
    this.thresholdLabel = update.thresholdLabel;
    this.activeStream = update.activeStream;
    this.selectedMonth = update.selectedMonth;
    this.hoveredMonth = update.hoveredMonth;
    this.reducedMotion = update.reducedMotion;
    this.maxValue = Math.max(
      6500,
      this.thresholdValue,
      ...update.series.map((month) => Math.max(month.total, month.tuition)),
    ) * 1.12;

    this.ensureMonths(update.series);
    this.updateGrid();
    this.updateFloor();
    this.updateMonthTargets();
    this.updateEvents(update.events);
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
    cancelAnimationFrame(this.frameId);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.removeEventListener("click", this.handleClick);
    this.resizeObserver?.disconnect();
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

      root.add(base, hitbox, label, tuitionMesh);
      this.monthGroup.add(root);
      this.months.set(month.id, { id: month.id, x, root, base, hitbox, label, segments, tuition });
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
      handle.hitbox.scale.y = Math.max(1, (stackY + 0.8) / 9);
      handle.hitbox.position.y = Math.max(0.8, stackY / 2);
    });
  }

  private updateGrid() {
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
    const markerStep = chooseValueStep(this.maxValue);
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

  private animate = () => {
    const delta = this.clock.getDelta();
    this.frameId = requestAnimationFrame(this.animate);
    this.updateCameraMove();
    this.controls.update();
    this.clampControls();
    this.animateSegments(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private animateSegments(delta: number) {
    const alpha = this.reducedMotion ? 1 : 1 - Math.exp(-(delta / TRANSITION_SECONDS) * 4.5);
    this.months.forEach((month) => {
      month.segments.forEach((segment) => {
        segment.currentHeight = THREE.MathUtils.lerp(segment.currentHeight, segment.targetHeight, alpha);
        segment.currentY = THREE.MathUtils.lerp(segment.currentY, segment.targetY, alpha);
        segment.currentOpacity = THREE.MathUtils.lerp(segment.currentOpacity, segment.targetOpacity, alpha);
        segment.mesh.scale.y = Math.max(MIN_HEIGHT, segment.currentHeight);
        segment.mesh.position.y = segment.currentY;
        segment.mesh.material.opacity = segment.currentOpacity;
      });

      month.tuition.currentHeight = THREE.MathUtils.lerp(
        month.tuition.currentHeight,
        month.tuition.targetHeight,
        alpha,
      );
      month.tuition.currentY = THREE.MathUtils.lerp(month.tuition.currentY, month.tuition.targetY, alpha);
      month.tuition.currentOpacity = THREE.MathUtils.lerp(
        month.tuition.currentOpacity,
        month.tuition.targetOpacity,
        alpha,
      );
      month.tuition.mesh.scale.y = Math.max(MIN_HEIGHT, month.tuition.currentHeight);
      month.tuition.mesh.position.y = month.tuition.currentY;
      month.tuition.mesh.material.opacity = month.tuition.currentOpacity;
    });
  }

  private updateCameraMove() {
    if (!this.cameraMove) {
      return;
    }

    const progress = Math.min(1, (performance.now() - this.cameraMove.start) / this.cameraMove.duration);
    const eased = progress * progress * (3 - 2 * progress);
    this.camera.position.lerpVectors(this.cameraMove.fromPosition, this.cameraMove.toPosition, eased);
    this.controls.target.lerpVectors(this.cameraMove.fromTarget, this.cameraMove.toTarget, eased);

    if (progress >= 1) {
      this.cameraMove = null;
    }
  }

  private moveCamera(position: THREE.Vector3, target: THREE.Vector3, immediate: boolean) {
    if (immediate) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.camera.lookAt(target);
      this.controls.update();
      this.cameraMove = null;
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
    }
  };

  private handlePointerLeave = () => {
    this.hoveredMonth = null;
    this.canvas.style.cursor = "grab";
    this.onHoverMonth(null);
  };

  private handleClick = () => {
    if (this.hoveredMonth) {
      this.onSelectMonth(this.hoveredMonth);
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
