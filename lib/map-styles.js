// Газрын зургийн суурь давхаргууд — components/Map.js болон lib/offline.js (офлайн татах) хоёулаа ашиглана.
// Суурь давхаргууд — бүгд нээлттэй, API түлхүүргүй:
//   OpenFreeMap (OpenStreetMap вектор), EOX Sentinel-2 cloudless 2024 (хиймэл дагуул), AWS Terrain Tiles (өндөршил)
const OFM_GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const MAP_STYLES = {
    streets: "https://tiles.openfreemap.org/styles/liberty",
    dark: "https://tiles.openfreemap.org/styles/dark",
    satellite: {
        version: 8,
        glyphs: OFM_GLYPHS,
        sources: {
            s2: {
                type: "raster",
                tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg"],
                tileSize: 256,
                maxzoom: 14,
                attribution:
                    '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless 2024</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024)',
            },
            ofm: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
        },
        layers: [
            { id: "satellite", type: "raster", source: "s2" },
            {
                id: "rivers",
                type: "line",
                source: "ofm",
                "source-layer": "waterway",
                paint: { "line-color": "rgba(120,190,255,0.55)", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 14, 2.5] },
            },
            {
                id: "place-labels",
                type: "symbol",
                source: "ofm",
                "source-layer": "place",
                filter: ["in", ["get", "class"], ["literal", ["city", "town", "village", "hamlet"]]],
                layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 12 },
                paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.75)", "text-halo-width": 1.4 },
            },
        ],
    },
};

export const DEM_SOURCE = {
    type: "raster-dem",
    tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
    encoding: "terrarium",
    tileSize: 256,
    maxzoom: 13,
    attribution: '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles</a>',
};
