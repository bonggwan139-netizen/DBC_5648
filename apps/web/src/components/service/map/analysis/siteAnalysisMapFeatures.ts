import type { Geometry } from "geojson";

export type SiteAnalysisMapFeatureProperties = {
  pnu?: string;
  key: string;
  label: string;
  color: string | null;
  fill_opacity?: number | null;
  area_m2?: number;
  analysis_area_m2?: number;
  display_area_m2?: number | null;
  included_area_m2?: number;
  inclusion_type?: string | null;
  analysis_kind?: string;
  jimok_cd?: string | null;
  jimok_nm?: string | null;
  owner_type_cd?: string | null;
  owner_type_nm?: string | null;
  official_price?: number | null;
  terrain_shape_cd?: string | null;
  terrain_shape_nm?: string | null;
  road_side_cd?: string | null;
  road_side_nm?: string | null;
  eczm_gr?: string | number | null;
  eczm_gr_name?: string | null;
  feature_type?: string;
  analysis_type?: string;
  building_uid?: string;
  code?: string | null;
  group_code?: string | null;
  structure_cd?: string | null;
  structure_nm?: string | null;
  floor_count?: number | null;
  age_years?: number | null;
  approval_year?: number | null;
  gross_floor_area_m2?: number | null;
  building_coverage_ratio?: number | null;
  floor_area_ratio?: number | null;
  is_non_forest?: boolean;
};

export type SiteAnalysisMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: SiteAnalysisMapFeatureProperties;
    geometry: Geometry;
  }>;
};

export type SiteAnalysisMapFeature = SiteAnalysisMapFeatureCollection["features"][number];

export function createEmptySiteAnalysisMapFeatureCollection(): SiteAnalysisMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function isFeatureCollection(value: unknown): value is SiteAnalysisMapFeatureCollection {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

function isFeatureArray(value: unknown): value is SiteAnalysisMapFeature[] {
  return (
    Array.isArray(value) &&
    value.every(
      (feature) =>
        feature !== null &&
        typeof feature === "object" &&
        (feature as { type?: unknown }).type === "Feature" &&
        "geometry" in feature
    )
  );
}

export function normalizeSiteAnalysisMapFeatureCollection(value: unknown): SiteAnalysisMapFeatureCollection {
  if (isFeatureCollection(value)) {
    return {
      type: "FeatureCollection",
      features: value.features
    };
  }

  if (isFeatureArray(value)) {
    return {
      type: "FeatureCollection",
      features: value
    };
  }

  return createEmptySiteAnalysisMapFeatureCollection();
}
