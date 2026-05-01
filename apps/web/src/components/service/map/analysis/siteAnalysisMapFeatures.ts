import type { Geometry } from "geojson";

export type SiteAnalysisMapFeatureProperties = {
  pnu?: string;
  key: string;
  label: string;
  color: string;
  area_m2?: number;
  analysis_area_m2?: number;
  included_area_m2?: number;
  inclusion_type?: string | null;
  jimok_cd?: string | null;
  jimok_nm?: string | null;
  owner_type_cd?: string | null;
  owner_type_nm?: string | null;
  official_price?: number | null;
  terrain_shape_cd?: string | null;
  terrain_shape_nm?: string | null;
  road_side_cd?: string | null;
  road_side_nm?: string | null;
  feature_type?: string;
  analysis_type?: string;
  building_uid?: string;
};

export type SiteAnalysisMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: SiteAnalysisMapFeatureProperties;
    geometry: Geometry;
  }>;
};

export function createEmptySiteAnalysisMapFeatureCollection(): SiteAnalysisMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  };
}
