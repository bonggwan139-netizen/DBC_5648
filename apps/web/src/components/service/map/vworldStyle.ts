export const ROAD_LAYER_ID = "vworld-road-layer";
export const SATELLITE_LAYER_ID = "vworld-satellite-layer";

export function createVworldStyle(vworldApiKey: string) {
  return {
    version: 8,
    sources: {
      vworldRoad: {
        type: "raster",
        tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Base/{z}/{y}/{x}.png`],
        tileSize: 256,
        attribution: "&copy; VWorld"
      },
      vworldSatellite: {
        type: "raster",
        tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Satellite/{z}/{y}/{x}.jpeg`],
        tileSize: 256,
        attribution: "&copy; VWorld"
      }
    },
    layers: [
      {
        id: ROAD_LAYER_ID,
        type: "raster",
        source: "vworldRoad",
        layout: {
          visibility: "visible"
        }
      },
      {
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: "vworldSatellite",
        layout: {
          visibility: "none"
        }
      }
    ]
  };
}
