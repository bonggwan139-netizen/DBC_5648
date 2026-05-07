import { booleanValid, cleanCoords } from "@turf/turf";
import { unzip } from "but-unzip";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import shp from "shpjs";
import type { ImportedGeometryMetadata, ZoneGeometry } from "./zoneSelectionTypes";

const SHP_IMPORT_MAX_BYTES = 20 * 1024 * 1024;

const SHP_IMPORT_ERROR_MESSAGES = {
  notZip: "ZIP 형식의 SHP 파일만 가져올 수 있습니다.",
  tooLarge: "SHP ZIP 파일은 20MB 이하만 가져올 수 있습니다.",
  noShp: "ZIP 안에서 SHP 파일을 찾을 수 없습니다.",
  crsMissing: "좌표계 정보를 확인할 수 없습니다. EPSG:4326 SHP만 가져올 수 있습니다.",
  crsUnsupported: "EPSG:4326 좌표계 SHP만 가져올 수 있습니다.",
  unsupportedGeometry: "Polygon 또는 MultiPolygon SHP만 가져올 수 있습니다.",
  parseFailed: "SHP ZIP 파일을 읽는 중 오류가 발생했습니다."
};

type ShpImportParseResult = {
  geometries: ZoneGeometry[];
  metadata: ImportedGeometryMetadata;
};

function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith(".zip");
}

function normalizeZipBaseName(filename: string, extensionLength: number) {
  return filename.replace(/\\/g, "/").slice(0, -extensionLength).toLowerCase();
}

function isConfirmedEpsg4326Prj(prjText: string) {
  const compact = prjText.toUpperCase().replace(/\s+/g, "");

  if (compact.includes("PROJCS[") || compact.includes("PROJCRS[")) {
    return false;
  }

  const hasEpsg4326Authority =
    /AUTHORITY\["EPSG","4326"\]/.test(compact) || /ID\["EPSG",4326/.test(compact);
  const looksLikeWgs84Geographic =
    (compact.includes("GEOGCS[") || compact.includes("GEOGCRS[")) &&
    (compact.includes("WGS_1984") || compact.includes("WGS84") || compact.includes("WGS84")) &&
    (compact.includes('UNIT["DEGREE"') || compact.includes('ANGLEUNIT["DEGREE"'));

  return hasEpsg4326Authority || looksLikeWgs84Geographic;
}

async function assertZipProjectionIsEpsg4326(buffer: ArrayBuffer) {
  const decoder = new TextDecoder("utf-8");
  const entries = unzip(new Uint8Array(buffer));
  const shpBaseNames = new Set<string>();
  const prjByBaseName = new Map<string, string>();

  for (const entry of entries) {
    const lowerName = entry.filename.toLowerCase();
    if (lowerName.includes("__macosx/")) {
      continue;
    }

    if (lowerName.endsWith(".shp")) {
      shpBaseNames.add(normalizeZipBaseName(entry.filename, 4));
    }

    if (lowerName.endsWith(".prj")) {
      const prjBytes = await entry.read();
      prjByBaseName.set(normalizeZipBaseName(entry.filename, 4), decoder.decode(prjBytes));
    }
  }

  if (shpBaseNames.size === 0) {
    throw new Error(SHP_IMPORT_ERROR_MESSAGES.noShp);
  }

  for (const shpBaseName of shpBaseNames) {
    const prjText = prjByBaseName.get(shpBaseName);
    if (!prjText?.trim()) {
      throw new Error(SHP_IMPORT_ERROR_MESSAGES.crsMissing);
    }

    if (!isConfirmedEpsg4326Prj(prjText)) {
      throw new Error(SHP_IMPORT_ERROR_MESSAGES.crsUnsupported);
    }
  }
}

function isGeoJsonFeature(value: unknown): value is Feature<Geometry> {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "Feature" &&
    "geometry" in value
  );
}

function isFeatureCollection(value: unknown): value is FeatureCollection<Geometry> {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

function flattenParsedFeatures(parsed: unknown): Feature<Geometry>[] {
  const features: Feature<Geometry>[] = [];

  const visit = (value: unknown) => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (isFeatureCollection(value)) {
      features.push(...value.features.filter(isGeoJsonFeature));
      return;
    }

    if (typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };

  visit(parsed);
  return features;
}

function hasCoordinatePair(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]);
  }

  return value.some((item) => hasCoordinatePair(item));
}

function normalizeImportedZoneGeometry(geometry: Geometry | null | undefined): ZoneGeometry | null {
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
    return null;
  }

  if (!hasCoordinatePair(geometry.coordinates)) {
    return null;
  }

  try {
    const cleaned = cleanCoords({
      type: "Feature",
      geometry,
      properties: {}
    } satisfies Feature<ZoneGeometry>).geometry;

    if (cleaned.type !== "Polygon" && cleaned.type !== "MultiPolygon") {
      return null;
    }

    if (!hasCoordinatePair(cleaned.coordinates)) {
      return null;
    }

    return booleanValid({
      type: "Feature",
      geometry: cleaned,
      properties: {}
    } satisfies Feature<ZoneGeometry>)
      ? cleaned
      : null;
  } catch {
    return null;
  }
}

function extractZoneGeometries(features: Feature<Geometry>[]) {
  const geometries: ZoneGeometry[] = [];

  for (const feature of features) {
    const geometry = normalizeImportedZoneGeometry(feature.geometry);
    if (geometry) {
      geometries.push(geometry);
    }
  }

  if (geometries.length === 0) {
    throw new Error(SHP_IMPORT_ERROR_MESSAGES.unsupportedGeometry);
  }

  return geometries;
}

export async function parseZoneShpZipFile(file: File): Promise<ShpImportParseResult> {
  if (!isZipFile(file)) {
    throw new Error(SHP_IMPORT_ERROR_MESSAGES.notZip);
  }

  if (file.size > SHP_IMPORT_MAX_BYTES) {
    throw new Error(SHP_IMPORT_ERROR_MESSAGES.tooLarge);
  }

  const buffer = await file.arrayBuffer();

  try {
    await assertZipProjectionIsEpsg4326(buffer);
    const parsed = await shp(buffer);
    const geometries = extractZoneGeometries(flattenParsedFeatures(parsed));

    return {
      geometries,
      metadata: {
        fileName: file.name,
        featureCount: geometries.length,
        importedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    if (error instanceof Error && Object.values(SHP_IMPORT_ERROR_MESSAGES).includes(error.message)) {
      throw error;
    }

    throw new Error(SHP_IMPORT_ERROR_MESSAGES.parseFailed);
  }
}
