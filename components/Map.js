"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_CENTER = { lng: 102.55, lat: 47.15 };
const DEFAULT_ZOOM = 8.5;

export default function Map({
    sites = [],
    selectedSite = null,
    onSelectSite = () => {},
    categoryMeta = {},
    language = "mn",
    onMapReady = null,
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Маркеруудыг зурах функц
    const renderMarkers = useCallback((mapInstance) => {
        const map = mapInstance || mapRef.current;
        if (!map) return;

        // Хуучин маркеруудыг цэвэрлэх
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        sites.forEach((site) => {
            if (!site.location || typeof site.location.lat !== "number" || typeof site.location.lng !== "number") return;

            const meta = categoryMeta[site.category] || {
                color: "#64748b",
                icon: "fa-solid fa-location-dot",
            };
            const isSelected = selectedSite?.id === site.id;

            const el = document.createElement("div");
            el.className = `orkhon-marker ${isSelected ? "selected" : ""}`;
            el.style.width = "40px";
            el.style.height = "40px";
            el.style.cursor = "pointer";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.zIndex = isSelected ? "60" : "10";

            el.innerHTML = `
                <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
                    ${isSelected ? '<div class="marker-pulse-ring" style="position:absolute; inset:-5px; border-radius:50%; border:2px solid #fbbf24; pointer-events:none;"></div>' : ""}
                    <div class="marker-bubble" style="
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        background: ${meta.color};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: ${isSelected ? "2.5px solid #fbbf24" : "2px solid rgba(255,255,255,0.9)"};
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
            style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
            zoom: DEFAULT_ZOOM,
            maxZoom: 16,
            minZoom: 6,
            attributionControl: true,
        });

        map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "bottom-right"
        );

        // Хоосон талбай дээр дарахад сонголтыг цуцлах
        map.on("click", (e) => {
            if (e.originalEvent && !e.originalEvent.defaultPrevented) {
                onSelectSite(null);
            }
        });

        const onLoaded = () => {
            mapRef.current = map;
            setMapLoaded(true);
            renderMarkers(map);
            if (onMapReady) onMapReady(map);
            setTimeout(() => {
                map.resize();
            }, 100);
        };

        if (map.loaded()) {
            onLoaded();
        } else {
            map.on("load", onLoaded);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) mapRef.current.resize();
        });
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

    // Sites болон сонгогдсон дурсгал өөрчлөгдөх үед маркеруудыг дахин зурах
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        renderMarkers(mapRef.current);
    }, [renderMarkers, mapLoaded]);

    // Сонгогдсон дурсгал руу зөөлөн шилжих (FlyTo)
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
            <div
                ref={mapContainer}
                className="w-full h-full"
                style={{ width: "100%", height: "100%", background: "#070b14" }}
            />

            <style>{`
                .orkhon-marker {
                    transform-origin: center center;
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .orkhon-marker:hover .marker-bubble {
                    transform: scale(1.18);
                }
                .orkhon-marker.selected .marker-bubble {
                    transform: scale(1.22);
                }
                .marker-pulse-ring {
                    animation: marker-pulse-anim 1.8s infinite ease-out;
                }
                @keyframes marker-pulse-anim {
                    0% { transform: scale(0.9); opacity: 1; }
                    100% { transform: scale(1.65); opacity: 0; }
                }
                .maplibregl-ctrl-bottom-right {
                    bottom: 110px !important;
                    right: 14px !important;
                    z-index: 25 !important;
                }
                .maplibregl-ctrl-group {
                    background: rgba(10, 14, 26, 0.92) !important;
                    border: 1px solid rgba(255, 255, 255, 0.12) !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                    backdrop-filter: blur(16px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .maplibregl-ctrl-group button {
                    width: 36px !important;
                    height: 36px !important;
                    border: none !important;
                    background: transparent !important;
                }
                .maplibregl-ctrl-group button + button {
                    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
                    filter: invert(1) brightness(0.9);
                }
                .maplibregl-ctrl-attrib {
                    font-size: 9px !important;
                    background: rgba(7, 11, 20, 0.75) !important;
                    color: #64748b !important;
                    border-radius: 6px !important;
                    padding: 2px 6px !important;
                    bottom: 85px !important;
                    right: 60px !important;
                }
                .maplibregl-ctrl-attrib a {
                    color: #94a3b8 !important;
                }
                .maplibregl-canvas {
                    filter: saturate(0.95) brightness(0.85) contrast(1.05);
                }
            `}</style>
        </div>
    );
}