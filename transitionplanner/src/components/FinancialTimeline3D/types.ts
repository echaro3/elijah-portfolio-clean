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
  "education",
  "pell",
];

export const STREAM_VISUALS: Record<IncomeKey, StreamVisual> = {
  military: {
    label: "Military",
    color: 0x82a9d7,
    cssColor: "#82a9d7",
    emissive: 0x1f5cb8,
  },
  civilian: {
    label: "Civilian",
    color: 0x96d8e0,
    cssColor: "#96d8e0",
    emissive: 0x1399a8,
  },
  ucx: {
    label: "UCX",
    color: 0xdfc38b,
    cssColor: "#dfc38b",
    emissive: 0x9b6b18,
  },
  vaBackpay: {
    label: "VA catch-up",
    color: 0xe49a9e,
    cssColor: "#e49a9e",
    emissive: 0xba2538,
  },
  va: {
    label: "VA",
    color: 0x89c8a7,
    cssColor: "#89c8a7",
    emissive: 0x1b8d4b,
  },
  education: {
    label: "Education",
    color: 0xb7add8,
    cssColor: "#b7add8",
    emissive: 0x6848c9,
  },
  pell: {
    label: "Pell",
    color: 0xd6b69a,
    cssColor: "#d6b69a",
    emissive: 0x22aeb8,
  },
};
