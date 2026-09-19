import * as React from "react";
import { Box, PanelTop, Layers, Focus, Play, Pause, RotateCcw, ZoomIn, ZoomOut, MousePointer2 } from "lucide-react";
import type { IncomeKey, MonthId, MonthModel, ModelSettings } from "../../App";
import { getExpenseTargets } from "../../plannerModel";
import { FinancialTimelineScene } from "./TimelineScene";
import {
  STREAM_VISUALS,
  TIMELINE_STREAMS,
  type CameraPreset,
  type Timeline3DEvent,
  type Timeline3DThreshold,
} from "./types";

const MONEY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type FinancialTimeline3DProps = {
  series: MonthModel[];
  settings: ModelSettings;
  hoveredMonth: MonthId | null;
  onMonthFocus: (monthId: MonthId | null) => void;
  reducedMotion: boolean;
  onStandardView: () => void;
};

export default function FinancialTimeline3D({
  series,
  settings,
  hoveredMonth,
  onMonthFocus,
  reducedMotion,
  onStandardView,
}: FinancialTimeline3DProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<FinancialTimelineScene | null>(null);
  const [rendererStatus, setRendererStatus] = React.useState<"pending" | "ready" | "unavailable">(
    "pending",
  );
  const [threshold, setThreshold] = React.useState<Timeline3DThreshold>("essential");
  const [activeStream, setActiveStream] = React.useState<IncomeKey | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<MonthId | null>(null);
  const [requiresTouchActivation, setRequiresTouchActivation] = React.useState(false);
  const [touchControlsActive, setTouchControlsActive] = React.useState(false);
  const [cameraPreset, setCamera] = React.useState<CameraPreset>("perspective");
  const [autoRotate, setAutoRotate] = React.useState(false);

  const targets = React.useMemo(() => getExpenseTargets(settings), [settings]);
  const thresholdValue = targets[threshold];
  const events = React.useMemo(() => buildTimelineEvents(series, settings), [series, settings]);
  const activeMonth =
    series.find((month) => month.id === hoveredMonth) ??
    series.find((month) => month.id === selectedMonth) ??
    series.find((month) => month.status === "red") ??
    series[0];
  const controlsEnabled = !requiresTouchActivation || touchControlsActive;
  const shellClassName = [
    "timeline-3d-shell",
    requiresTouchActivation ? "requires-touch-activation" : "",
    touchControlsActive ? "is-touch-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const updateTouchRequirement = () => {
      setRequiresTouchActivation(query.matches || navigator.maxTouchPoints > 0);
    };

    updateTouchRequirement();
    query.addEventListener("change", updateTouchRequirement);
    return () => query.removeEventListener("change", updateTouchRequirement);
  }, []);

  React.useEffect(() => {
    if (!canvasRef.current || !stageRef.current) {
      return undefined;
    }

    try {
      const scene = new FinancialTimelineScene({
        canvas: canvasRef.current,
        container: stageRef.current,
        onHoverMonth: onMonthFocus,
        onSelectMonth: setSelectedMonth,
        onUnavailable: () => setRendererStatus("unavailable"),
      });
      sceneRef.current = scene;
      setRendererStatus("ready");

      return () => {
        scene.dispose();
        sceneRef.current = null;
      };
    } catch {
      setRendererStatus("unavailable");
      return undefined;
    }
  }, [onMonthFocus]);

  React.useEffect(() => {
    sceneRef.current?.setFinancialData(series);
  }, [series]);

  React.useEffect(() => {
    sceneRef.current?.setThreshold(getThresholdLabel(threshold), thresholdValue);
  }, [threshold, thresholdValue]);

  React.useEffect(() => {
    sceneRef.current?.setEvents(events);
  }, [events]);

  React.useEffect(() => {
    sceneRef.current?.setInteractionState({ activeStream, selectedMonth, hoveredMonth });
  }, [activeStream, hoveredMonth, selectedMonth]);

  React.useEffect(() => {
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  React.useEffect(() => {
    sceneRef.current?.setControlsEnabled(controlsEnabled);
  }, [controlsEnabled]);

  React.useEffect(() => {
    sceneRef.current?.setAutoRotate(autoRotate && !reducedMotion);
  }, [autoRotate, reducedMotion]);

  React.useEffect(() => {
    if (rendererStatus === "unavailable") {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    }
  }, [rendererStatus]);

  const chooseMonth = (monthId: MonthId) => {
    setSelectedMonth(monthId);
    onMonthFocus(monthId);
  };

  const setCameraPreset = (preset: CameraPreset) => {
    setCamera(preset);
    setAutoRotate(false);
    sceneRef.current?.setCameraPreset(preset);
  };

  if (rendererStatus === "unavailable") {
    return (
      <div className="timeline-3d-fallback" role="status">
        3D rendering is unavailable on this device.
        <button type="button" className="section-toggle" onClick={onStandardView}>Open standard chart</button>
      </div>
    );
  }

  return (
    <div className={shellClassName}>
      <div className="timeline-3d-toolbar" aria-label="Holographic analysis controls">
        <div>
          <span>Reference plane</span>
          <div className="segmented-control three-up" role="group" aria-label="Reference plane">
            {(["essential", "normal", "ideal"] as Timeline3DThreshold[]).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={threshold === option}
                onClick={() => setThreshold(option)}
              >
                {getThresholdLabel(option)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span>Camera</span>
          <div className="timeline-3d-camera-controls" role="group" aria-label="Camera presets">
            {([
              ["perspective", "Perspective", Box], ["front", "Front", PanelTop],
              ["top", "Top", Layers], ["risk", "Risk window", Focus],
            ] as const).map(([preset, label, Icon]) => <button key={preset} type="button" title={label} aria-label={label} aria-pressed={cameraPreset === preset} onClick={() => setCameraPreset(preset)}><Icon aria-hidden="true" /></button>)}
          </div>
        </div>
        <div>
          <span>Explore</span>
          <div className="timeline-3d-camera-controls" role="group" aria-label="Scene navigation">
            <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => sceneRef.current?.zoom(1)}><ZoomIn /></button>
            <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => sceneRef.current?.zoom(-1)}><ZoomOut /></button>
            <button type="button" title={autoRotate ? "Pause orbit" : "Orbit scene"} aria-label={autoRotate ? "Pause orbit" : "Orbit scene"} aria-pressed={autoRotate} disabled={reducedMotion} onClick={() => setAutoRotate(current => !current)}>{autoRotate ? <Pause /> : <Play />}</button>
            <button type="button" title="Reset camera" aria-label="Reset camera" onClick={() => setCameraPreset("perspective")}><RotateCcw /></button>
          </div>
        </div>
      </div>

      <div className="timeline-3d-legend" aria-label="3D financial timeline legend">
        <span>
          <i className="is-gross" aria-hidden="true" />
          Gross resources
        </span>
        <span>
          <i className="is-net" aria-hidden="true" />
          After tuition
        </span>
        <span>
          <i className="is-plane" aria-hidden="true" />
          {getThresholdLabel(threshold)} target
        </span>
      </div>

      <div className="timeline-3d-stage-wrap">
        <div className="timeline-3d-stage" ref={stageRef}>
          <canvas
            ref={canvasRef}
            className="timeline-3d-canvas"
            role="img"
            aria-label={`Interactive 3D financial timeline from ${series[0]?.label ?? "the first month"} through ${
              series[series.length - 1]?.label ?? "the final month"
            }`}
          />
          {rendererStatus === "pending" ? (
            <div className="timeline-3d-canvas-status" role="status">
              Projecting model...
            </div>
          ) : null}
          {requiresTouchActivation ? (
            <div className="timeline-3d-touch-gate">
              <button
                type="button"
                onClick={() => setTouchControlsActive((current) => !current)}
                aria-pressed={touchControlsActive}
              >
                <MousePointer2 aria-hidden="true" /> {touchControlsActive ? "Done exploring" : "Explore 3D"}
              </button>
            </div>
          ) : null}
        </div>
        {activeMonth ? (
          <MonthAnalysisPanel
            month={activeMonth}
            thresholdLabel={getThresholdLabel(threshold)}
            thresholdValue={thresholdValue}
          />
        ) : null}
      </div>

      <div className="timeline-3d-lower">
        <div className="timeline-3d-streams" aria-label="Income stream filters">
          <button
            type="button"
            className={activeStream === null ? "is-active" : ""}
            aria-pressed={activeStream === null}
            onClick={() => setActiveStream(null)}
          >
            All streams
          </button>
          {TIMELINE_STREAMS.map((stream) => (
            <button
              type="button"
              key={stream}
              className={activeStream === stream ? "is-active" : ""}
              aria-pressed={activeStream === stream}
              onClick={() => setActiveStream((current) => (current === stream ? null : stream))}
            >
              <i
                aria-hidden="true"
                style={{ "--stream-color": STREAM_VISUALS[stream].cssColor } as React.CSSProperties}
              />
              {STREAM_VISUALS[stream].label}
            </button>
          ))}
        </div>

        <div className="timeline-3d-month-picker" aria-label="Inspect month">
          {series.map((month) => (
            <button
              type="button"
              key={month.id}
              aria-pressed={activeMonth?.id === month.id}
              className={`status-${month.status}`}
              onClick={() => chooseMonth(month.id)}
              onFocus={() => onMonthFocus(month.id)}
              onBlur={() => onMonthFocus(null)}
            >
              {month.short}{series.length > 12 ? ` '${month.id.slice(2, 4)}` : ""}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthAnalysisPanel({
  month,
  thresholdLabel,
  thresholdValue,
}: {
  month: MonthModel;
  thresholdLabel: string;
  thresholdValue: number;
}) {
  const gap = month.effective - thresholdValue;

  return (
    <aside className="timeline-3d-detail" aria-live="polite" aria-label={`${month.label} 3D analysis`}>
      <span>{month.label}</span>
      <strong>{formatMoney(month.total)} resources</strong>
      <dl>
        <div>
          <dt>After tuition</dt>
          <dd>{formatMoney(month.effective)}</dd>
        </div>
        <div>
          <dt>{thresholdLabel} floor</dt>
          <dd>{formatMoney(thresholdValue)}</dd>
        </div>
        <div>
          <dt>Reference gap</dt>
          <dd className={gap >= 0 ? "is-positive" : "is-negative"}>
            {gap >= 0 ? "+" : ""}
            {formatMoney(gap)}
          </dd>
        </div>
        {month.tuition > 0 ? (
          <div>
            <dt>Tuition reserve</dt>
            <dd>-{formatMoney(month.tuition)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="timeline-3d-detail-streams">
        {TIMELINE_STREAMS.filter((stream) => month.streams[stream] > 0).map((stream) => (
          <span key={stream}>
            <i
              aria-hidden="true"
              style={{ "--stream-color": STREAM_VISUALS[stream].cssColor } as React.CSSProperties}
            />
            {STREAM_VISUALS[stream].label}: {formatMoney(month.streams[stream])}
          </span>
        ))}
      </div>
      <em className={`status-${month.status}`}>{getStatusLabel(month.status)}</em>
    </aside>
  );
}

function buildTimelineEvents(series: MonthModel[], settings: ModelSettings): Timeline3DEvent[] {
  const eventMonths = new Set(series.map((month) => month.id));
  const separationMonth = settings.separationDate.slice(0, 7);
  const terminalLeaveMonth = settings.terminalLeaveStartDate.slice(0, 7);
  const schoolStartMonth = settings.schoolStartDate.slice(0, 7);
  const events: Timeline3DEvent[] = [];

  if (!settings.alreadySeparated && eventMonths.has(terminalLeaveMonth)) {
    events.push({ id: "terminal-leave", monthId: terminalLeaveMonth, label: "Leave", kind: "transition" });
  }

  if (!settings.alreadySeparated && eventMonths.has(separationMonth)) {
    events.push({ id: "separation", monthId: separationMonth, label: "DOS", kind: "transition" });
  }

  if (eventMonths.has(schoolStartMonth)) {
    events.push({ id: "school-start", monthId: schoolStartMonth, label: "School", kind: "school" });
  }

  const firstWork = series.find((month) => month.streams.civilian > 0);
  if (firstWork) {
    events.push({ id: "work-start", monthId: firstWork.id, label: "Work", kind: "work" });
  }

  if (settings.workType === "contract") {
    if (eventMonths.has(settings.contractEndDate.slice(0, 7))) {
      events.push({ id: "contract-end", monthId: settings.contractEndDate.slice(0, 7), label: "Contract end", kind: "work" });
    }
  }

  if (settings.vaStart !== "none") {
    const decisionMonth = series.find((month) => month.id === settings.vaStart);
    if (decisionMonth) {
      events.push({
        id: "va-decision",
        monthId: decisionMonth.id,
        label: decisionMonth.streams.vaBackpay > 0 ? "VA catch-up" : "VA decision",
        kind: "va",
      });
    }

    const decisionIndex = series.findIndex((month) => month.id === settings.vaStart);
    const recurringMonth = series[decisionIndex + 1];
    if (recurringMonth?.streams.va) {
      events.push({ id: "va-recurring", monthId: recurringMonth.id, label: "VA starts", kind: "va" });
    }
  }

  const firstPell = series.find((month) => month.streams.pell > 0);
  if (firstPell) {
    events.push({ id: "pell", monthId: firstPell.id, label: "Pell", kind: "school" });
  }

  const firstEducation = series.find((month) => month.streams.education > 0);
  if (firstEducation) {
    const educationLabel = getEducationEventLabel(settings.educationBenefit);
    events.push({
      id: "education",
      monthId: firstEducation.id,
      label: educationLabel,
      kind: "school",
    });
  }

  const firstDanger = series.find((month) => month.status === "red");
  if (firstDanger) {
    events.push({ id: "risk", monthId: firstDanger.id, label: "Risk", kind: "risk" });
  }

  return dedupeEvents(events);
}

function getEducationEventLabel(educationBenefit: ModelSettings["educationBenefit"]) {
  switch (educationBenefit) {
    case "mgib":
      return "MGIB";
    case "post911":
      return "Post-9/11";
    case "vre":
      return "VR&E";
    case "none":
    default:
      return "Education";
  }
}

function dedupeEvents(events: Timeline3DEvent[]) {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = `${event.monthId}-${event.label}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getThresholdLabel(threshold: Timeline3DThreshold) {
  if (threshold === "normal") {
    return "Normal";
  }

  if (threshold === "ideal") {
    return "Ideal";
  }

  return "Essential";
}

function getStatusLabel(status: MonthModel["status"]) {
  if (status === "red") {
    return "Below essential expenses";
  }

  if (status === "yellow") {
    return "Essentials covered";
  }

  return "Within budget";
}

function formatMoney(value: number) {
  return MONEY_FORMATTER.format(Math.round(value));
}
