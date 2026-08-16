import type { IncomeKey, MonthId } from "../../App";

export type Timeline3DThreshold = "essential" | "normal" | "ideal";
export type CameraPreset = "perspective" | "front" | "top" | "risk";

export type Timeline3DEvent = {
  id: string;
  monthId: MonthId;
  label: string;
  kind: "transition" | "work" | "school" | "va" | "risk";
};

export type StreamVisual = {
  label: string;
  color: number;
  cssColor: string;
  emissive: number;
};

export const TIMELINE_STREAMS: IncomeKey[] = [
  "military",
  "civilian",
  "ucx",
  "vaBackpay",
  "va",
  "mgib",
  "pell",
];

export const STREAM_VISUALS: Record<IncomeKey, StreamVisual> = {
  military: {
    label: "Military",
    color: 0x7eb2ff,
    cssColor: "#7eb2ff",
    emissive: 0x1f5cb8,
  },
  civilian: {
    label: "Civilian",
    color: 0x51f3ff,
    cssColor: "#51f3ff",
    emissive: 0x1399a8,
  },
  ucx: {
    label: "UCX",
    color: 0xffd782,
    cssColor: "#ffd782",
    emissive: 0x9b6b18,
  },
  vaBackpay: {
    label: "VA catch-up",
    color: 0xff96a0,
    cssColor: "#ff96a0",
    emissive: 0xba2538,
  },
  va: {
    label: "VA",
    color: 0x72e9a8,
    cssColor: "#72e9a8",
    emissive: 0x1b8d4b,
  },
  mgib: {
    label: "MGIB",
    color: 0xb9a1ff,
    cssColor: "#b9a1ff",
    emissive: 0x6848c9,
  },
  pell: {
    label: "Pell",
    color: 0x8df7ff,
    cssColor: "#8df7ff",
    emissive: 0x22aeb8,
  },
};
