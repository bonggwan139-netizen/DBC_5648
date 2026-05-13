export type PlanningSpecialPurposeAreaPattern =
  | "none"
  | "black-horizontal"
  | "black-diagonal"
  | "red-diagonal"
  | "red-horizontal"
  | "green-diagonal"
  | "green-horizontal"
  | "purple-horizontal"
  | "black-dot"
  | "red-dot"
  | "green-dot"
  | "purple-dot";

export type PlanningSpecialPurposeAreaStyle = {
  fillColor: string;
  outlineColor: string;
  pattern: PlanningSpecialPurposeAreaPattern;
};

export const planningSpecialPurposeAreaFallbackStyle: PlanningSpecialPurposeAreaStyle = {
  fillColor: "#CBD5E1",
  outlineColor: "#64748B",
  pattern: "none"
};

export const PLANNING_SPECIAL_PURPOSE_AREA_PATTERNS: Exclude<PlanningSpecialPurposeAreaPattern, "none">[] = [
  "black-horizontal",
  "black-diagonal",
  "red-diagonal",
  "red-horizontal",
  "green-diagonal",
  "green-horizontal",
  "purple-horizontal",
  "black-dot",
  "red-dot",
  "green-dot",
  "purple-dot"
];

export function getPlanningSpecialPurposeAreaPatternImageId(pattern: Exclude<PlanningSpecialPurposeAreaPattern, "none">) {
  return `planning-special-purpose-area-${pattern}`;
}

export function getPlanningSpecialPurposeAreaPatternLayerId(pattern: Exclude<PlanningSpecialPurposeAreaPattern, "none">) {
  return `planning-vworld-special-purpose-area-pattern-${pattern}`;
}

export function normalizePlanningSpecialPurposeAreaName(name: unknown) {
  if (name === null || name === undefined) {
    return "";
  }

  return String(name)
    .trim()
    .replace(/[()（）]/g, "")
    .replace(/\s+/g, "");
}

const baseOutlineColor = "#6E6E6E";

export const planningSpecialPurposeAreaStyleByName: Record<string, PlanningSpecialPurposeAreaStyle> = {
  [normalizePlanningSpecialPurposeAreaName("제1종전용주거지역")]: {
    fillColor: "#FFFFBE",
    outlineColor: baseOutlineColor,
    pattern: "red-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("제2종전용주거지역")]: {
    fillColor: "#FFFF73",
    outlineColor: baseOutlineColor,
    pattern: "red-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("제1종일반주거지역")]: {
    fillColor: "#FFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("제2종일반주거지역")]: {
    fillColor: "#FFFF00",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("제3종일반주거지역")]: {
    fillColor: "#FFBF00",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("준주거지역")]: {
    fillColor: "#FFFF00",
    outlineColor: baseOutlineColor,
    pattern: "red-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("중심상업지역")]: {
    fillColor: "#FF7FBF",
    outlineColor: baseOutlineColor,
    pattern: "red-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("일반상업지역")]: {
    fillColor: "#FF7FBF",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("근린상업지역")]: {
    fillColor: "#FF7FBF",
    outlineColor: baseOutlineColor,
    pattern: "red-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("유통상업지역")]: {
    fillColor: "#FF3E9F",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("전용공업지역")]: {
    fillColor: "#BF7FFF",
    outlineColor: baseOutlineColor,
    pattern: "purple-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("일반공업지역")]: {
    fillColor: "#BF7FFF",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("준공업지역")]: {
    fillColor: "#BF7FFF",
    outlineColor: baseOutlineColor,
    pattern: "red-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("보전녹지지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "green-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("자연녹지지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("생산녹지지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "green-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("도시지역")]: {
    fillColor: "#FF7F7F",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("계획관리지역")]: {
    fillColor: "#FFFFFF",
    outlineColor: baseOutlineColor,
    pattern: "red-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("생산관리지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "red-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("보전관리지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "red-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("관리지역")]: {
    fillColor: "#FFFFFF",
    outlineColor: baseOutlineColor,
    pattern: "none"
  },
  [normalizePlanningSpecialPurposeAreaName("농림지역")]: {
    fillColor: "#BFFF7F",
    outlineColor: baseOutlineColor,
    pattern: "green-diagonal"
  },
  [normalizePlanningSpecialPurposeAreaName("자연환경보전지역")]: {
    fillColor: "#7FFFFF",
    outlineColor: baseOutlineColor,
    pattern: "green-dot"
  },
  [normalizePlanningSpecialPurposeAreaName("정보없음")]: {
    fillColor: "#E5E7EB",
    outlineColor: baseOutlineColor,
    pattern: "none"
  }
};

export function getPlanningSpecialPurposeAreaStyle(name: unknown): PlanningSpecialPurposeAreaStyle {
  const normalized = normalizePlanningSpecialPurposeAreaName(name);
  return planningSpecialPurposeAreaStyleByName[normalized] ?? planningSpecialPurposeAreaFallbackStyle;
}
