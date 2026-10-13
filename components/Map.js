"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLES, DEM_SOURCE } from "../lib/map-styles";

// Worker-ийг public/-аас ачаална (scripts/copy-maplibre-worker.mjs)
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const DEFAULT_CENTER = { lng: 102.55, lat: 47.15 };
const DEFAULT_ZOOM = 8.5;

/** Газрын нэрийг сонгосон хэлээр: name:ko, name:zh г.м., байхгүй бол англи → нутгийн нэр. */
function labelExpression(language) {
    if (language === "mn") return ["coalesce", ["get", "name:mn"], ["get", "name"]];
    return ["coalesce", ["get", `name:${language}`], ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
}

function localizeLabels(map, language) {
    for (const layer of map.getStyle()?.layers || []) {
        if (layer.type !== "symbol") continue;
        const field = map.getLayoutProperty(layer.id, "text-field");
        if (field && JSON.stringify(field).includes('"name')) {
            map.setLayoutProperty(layer.id, "text-field", labelExpression(language));
        }
    }
}

function applyTerrain(map, enabled) {
    if (enabled) {
        if (!map.getSource("dem")) map.addSource("dem", DEM_SOURCE);
        map.setTerrain({ source: "dem", exaggeration: 1.5 });
        if (!map.getLayer("hillshade")) {
            const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
            map.addLayer(
                { id: "hillshade", type: "hillshade", source: "dem", paint: { "hillshade-exaggeration": 0.35, "hillshade-shadow-color": "#1f2937" } },
                firstSymbol
            );
        }
        map.setSky?.({ "sky-color": "#7fb2e5", "horizon-color": "#dbe7f3", "fog-color": "#dbe7f3", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.3 });
    } else {
        map.setTerrain(null);
        if (map.getLayer("hillshade")) map.removeLayer("hillshade");
    }
}

export default function Map({
    sites = [],
    selectedSite = null,
    onSelectSite = () => {},
    categoryMeta = {},
    language = "mn",
    baseStyle = "streets",
    terrain = false,
    onMapReady = null,
    onUserLocation = null,
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const optionsRef = useRef({ language, terrain });
    const [mapLoaded, setMapLoaded] = useState(false);
    optionsRef.current = { language, terrain };

    // Маркеруудыг зурах функц
    const renderMarkers = useCallback((mapInstance) => {
        const map = mapInstance || mapRef.current;
        if (!map) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        sites.forEach((site) => {
            if (!site.location || typeof site.location.lat !== "number" || typeof site.location.lng !== "number") return;

            const meta = categoryMeta[site.category] || { color: "#64748b", icon: "fa-solid fa-location-dot" };
            const isSelected = selectedSite?.id === site.id;

            const el = document.createElement("div");
            el.className = `orkhon-marker ${isSelected ? "selected" : ""}`;
            el.style.cssText = `width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:${isSelected ? 60 : 10}`;
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", site.name);
            el.innerHTML = `
                <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
                    ${isSelected ? '<div class="marker-pulse-ring" style="position:absolute; inset:-5px; border-radius:50%; border:2px solid #fbbf24; pointer-events:none;"></div>' : ""}
                    <div class="marker-bubble" style="
                        width: 34px; height: 34px; border-radius: 50%;
                        background: ${meta.color};
                        display: flex; align-items: center; justify-content: center;
                        border: ${isSelected ? "2.5px solid #fbbf24" : "2px solid rgba(255,255,255,0.95)"};
                        box-shadow: 0 4px 14px ${meta.color}99 ${isSelected ? ", 0 0 16px rgba(251,191,36,0.9)" : ""};
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    ">
                        <i class="${meta.icon}" style="color: #ffffff; font-size: 13px;"></i>
                    </div>
                </div>
            `;

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                onSelectSite(site);
            });

            const marker = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([site.location.lng, site.location.lat])
                .addTo(map);
            markersRef.current.push(marker);
        });
    }, [sites, selectedSite?.id, categoryMeta, onSelectSite]);

    // Газрын зураг эхлүүлэх
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[baseStyle] || MAP_STYLES.streets,
            center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
            zoom: DEFAULT_ZOOM,
            maxZoom: 17,
            minZoom: 2,
            maxPitch: 75,
            attributionControl: { compact: true },
            // Солонгос/хятад үсгийг төхөөрөмжийн фонтоор (glyph сервер CJK дэмжихгүй үед)
            localIdeographFontFamily: "'Noto Sans KR', 'Noto Sans SC', 'Apple SD Gothic Neo', 'PingFang SC', 'Microsoft YaHei', 'Malgun Gothic', sans-serif",
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
        const geolocate = new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showAccuracyCircle: true,
        });
        map.addControl(geolocate, "top-right");
        geolocate.on("geolocate", (e) => onUserLocation?.({ lat: e.coords.latitude, lng: e.coords.longitude }));
        geolocate.on("error", () => onUserLocation?.(null));
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: "metric" }), "bottom-left");

        // Style солих бүрт (style.load) хэл, 3D гадарга, бөмбөрцөг проекцыг дахин тохируулна
        map.on("style.load", () => {
            try {
                map.setProjection?.({ type: "globe" });
            } catch {}
            localizeLabels(map, optionsRef.current.language);
            applyTerrain(map, optionsRef.current.terrain);
        });

        // Хоосон талбай дээр дарахад сонголтыг цуцлах
        map.on("click", (e) => {
            if (e.originalEvent && !e.originalEvent.defaultPrevented) onSelectSite(null);
        });

        const onLoaded = () => {
            mapRef.current = map;
            setMapLoaded(true);
            renderMarkers(map);
            onMapReady?.(map, { geolocate });
            setTimeout(() => map.resize(), 100);
        };
        if (map.loaded()) onLoaded();
        else map.on("load", onLoaded);

        const resizeObserver = new ResizeObserver(() => mapRef.current?.resize());
        resizeObserver.observe(mapContainer.current);

        return () => {
            resizeObserver.disconnect();
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Суурь давхарга солих
    const appliedStyle = useRef(baseStyle);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded || appliedStyle.current === baseStyle) return;
        appliedStyle.current = baseStyle;
        map.setStyle(MAP_STYLES[baseStyle] || MAP_STYLES.streets);
    }, [baseStyle, mapLoaded]);

    // Хэл солигдоход газрын нэрс
    useEffect(() => {
        const map = mapRef.current;
        if (map && mapLoaded && map.isStyleLoaded()) localizeLabels(map, language);
    }, [language, mapLoaded]);

    // 3D гадарга
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return;
        if (map.isStyleLoaded()) applyTerrain(map, terrain);
        map.easeTo({ pitch: terrain ? 62 : 0, bearing: terrain ? -20 : 0, duration: 900 });
    }, [terrain, mapLoaded]);

    // Sites болон сонгогдсон дурсгал өөрчлөгдөх үед маркеруудыг дахин зурах
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        renderMarkers(mapRef.current);
    }, [renderMarkers, mapLoaded]);

    // Сонгогдсон дурсгал руу зөөлөн шилжих
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !selectedSite?.location) return;
        mapRef.current.flyTo({
            center: [selectedSite.location.lng, selectedSite.location.lat],
            zoom: Math.max(mapRef.current.getZoom(), 12.2),
            offset: [0, -60],
            duration: 800,
        });
    }, [selectedSite, mapLoaded]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full bg-ink" />

            <style>{`
                .orkhon-marker { transform-origin: center center; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .orkhon-marker:hover .marker-bubble { transform: scale(1.18); }
                .orkhon-marker.selected .marker-bubble { transform: scale(1.22); }
                .marker-pulse-ring { animation: marker-pulse-anim 1.8s infinite ease-out; }
                @keyframes marker-pulse-anim {
                    0% { transform: scale(0.9); opacity: 1; }
                    100% { transform: scale(1.65); opacity: 0; }
                }
                .maplibregl-ctrl-top-right { top: 118px !important; right: 14px !important; z-index: 25 !important; }
                .maplibregl-ctrl-bottom-right { bottom: 85px !important; right: 10px !important; }
                .maplibregl-ctrl-bottom-left { bottom: 92px !important; left: 10px !important; }
                .maplibregl-ctrl-group {
                    background: rgba(10, 14, 26, 0.92) !important;
                    border: 1px solid rgba(255, 255, 255, 0.12) !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                    backdrop-filter: blur(16px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .maplibregl-ctrl-group button { width: 36px !important; height: 36px !important; border: none !important; background: transparent !important; }
                .maplibregl-ctrl-group button + button { border-top: 1px solid rgba(255, 255, 255, 0.08) !important; }
                .maplibregl-ctrl-group button .maplibregl-ctrl-icon { filter: invert(1) brightness(0.9); }
                .maplibregl-ctrl-scale { background: rgba(7, 11, 20, 0.7) !important; color: #cbd5e1 !important; border-color: #cbd5e1 !important; font-size: 10px !important; }
                .maplibregl-ctrl-attrib { font-size: 9px !important; background: rgba(7, 11, 20, 0.75) !important; color: #94a3b8 !important; }
                .maplibregl-ctrl-attrib a { color: #cbd5e1 !important; }
                .maplibregl-user-location-dot, .maplibregl-user-location-dot::before { background-color: #f59e0b !important; }
            `}</style>
        </div>
    );
}
