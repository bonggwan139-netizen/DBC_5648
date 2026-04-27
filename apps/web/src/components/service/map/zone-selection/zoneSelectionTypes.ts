import type {
  BBox,
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from "geojson";

export type ZoneSelectionStatus = "idle" | "editing" | "confirmed";
export type ZoneSelectionTool = "parcel" | "draw";
export type FinalizedZoneMode = ZoneSelectionTool | "mixed";
export type ZoneGeometry = Polygon | MultiPolygon;

export type ParcelProps = Record<string, unknown>;

export type CadastralDecorations = {
  _parcel_id?: string | null;
  _info_selected?: boolean;
  _zone_selected?: boolean;
};

export type CadastralFeature = Feature<ZoneGeometry, ParcelProps & CadastralDecorations>;
export type CadastralFeatureCollection = FeatureCollection<ZoneGeometry, ParcelProps & CadastralDecorations>;

export type ParcelFeatureRecord = {
  parcelId: string;
  sourceParcelId: string | null;
  geometry: ZoneGeometry;
  properties: ParcelProps;
};

export type DrawVertex = {
  id: string;
  coordinate: Position;
  sourceParcelId: string | null;
};

export type DrawGeometryRecord = {
  id: string;
  geometry: ZoneGeometry;
};

export type FinalizedZone = {
  id: string;
  mode: FinalizedZoneMode;
  status: "confirmed";
  geometry: ZoneGeometry;
  bbox: BBox;
  createdAt: string;
  sourceParcelIds?: string[];
};

export type ZoneDraftSnapshot = {
  selectedParcelIds: string[];
  parcelsById: Record<string, ParcelFeatureRecord>;
  drawnGeometries: DrawGeometryRecord[];
  drawVertices: DrawVertex[];
};

export type ZoneDraftState = ZoneDraftSnapshot & {
  history: ZoneDraftSnapshot[];
};

export type ZoneSelectionState = {
  status: ZoneSelectionStatus;
  activeTool: ZoneSelectionTool | null;
  draft: ZoneDraftState;
  confirmedZone: FinalizedZone | null;
  feedback: string | null;
};

export type ZoneDraftGeometryFeatureCollection = FeatureCollection<
  Geometry,
  {
    kind: "draft-union" | "line" | "preview";
  }
>;

export type ZoneDraftVertexFeatureCollection = FeatureCollection<
  Point,
  {
    index: number;
  }
>;

export type ZoneConfirmedFeatureCollection = FeatureCollection<
  ZoneGeometry,
  {
    zoneId: string;
    mode: FinalizedZoneMode;
    status: "confirmed";
  }
>;

export type MapPoint = {
  x: number;
  y: number;
};
