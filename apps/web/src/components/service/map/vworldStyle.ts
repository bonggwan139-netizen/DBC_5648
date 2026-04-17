export const ROAD_LAYER_ID = "vworld-road-layer";
export const SATELLITE_LAYER_ID = "vworld-satellite-layer";
export const CADASTRAL_LAYER_ID = "vworld-cadastral-layer";

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
      },
      vworldCadastral: {
        type: "raster",
        tiles: [
          `https://api.vworld.kr/req/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&KEY=${vworldApiKey}`
        ],
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
      },
      {
        id: CADASTRAL_LAYER_ID,
        type: "raster",
        source: "vworldCadastral",
        paint: {
          "raster-opacity": 0.92
        },
        minzoom: 14,
        layout: {
          visibility: "visible"
        }
      }
    ]
  };
}
