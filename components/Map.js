"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { sitesData, getPlaceHolder } from "../app/data/sites";
import { translations } from "../app/data/translations";

// ---------------------------------------------------------------------------
// Category -> {icon, color} — same visual language as the previous Leaflet map
// ---------------------------------------------------------------------------
const CATEGORY_STYLE = {
    "Сүм хийд": { icon: "fa-place-of-worship", color: "#8b5cf6" },
    "Хот суурин": { icon: "fa-archway", color: "#3b82f6" },
    "Хадны зураг": { icon: "fa-palette", color: "#10b981" },
    "Булш хиргисүүр": { icon: "fa-monument", color: "#64748b" },
    "Тахилгат газар": { icon: "fa-mountain", color: "#f59e0b" },
};
const DEFAULT_STYLE = { icon: "fa-location-dot", color: "#1e3a8a" };
const getCategoryStyle = (category) => CATEGORY_STYLE[category] || DEFAULT_STYLE;

// ---------------------------------------------------------------------------
// Base layer definitions — raster sources, no API key required (same
// providers as the previous Leaflet TileLayers, so no visual regression).
// ---------------------------------------------------------------------------
const BASE_LAYERS = {
    standard: {
        label: { mn: "Стандарт", en: "Standard" },
        tiles: [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: 19,
    },
    satellite: {
        label: { mn: "Хиймэл дагуул", en: "Satellite" },
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        attribution: "Tiles &copy; Esri",
        maxzoom: 19,
    },
    terrain: {
        label: { mn: "Гадаргын хэлбэр", en: "Terrain" },
        tiles: [
            "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
        ],
        attribution: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)",
        maxzoom: 17,
    },
};

function buildStyle(baseKey) {
    const base = BASE_LAYERS[baseKey];
    return {
        version: 8,
        sources: {
            "base-tiles": {
                type: "raster",
                tiles: base.tiles,
                tileSize: 256,
                attribution: base.attribution,
                maxzoom: base.maxzoom,
            },
        },
        layers: [{ id: "base-tiles-layer", type: "raster", source: "base-tiles" }],
    };
}

export default function Map({ language = "mn" }) {
    const t = translations[language];
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("id");

    const [mapReady, setMapReady] = useState(false);
    const [baseKey, setBaseKey] = useState("standard");
    const [filterCategory, setFilterCategory] = useState("All");

    const sitesWithLocation = sitesData.filter((s) => s.location);
    const categories = ["All", ...new Set(sitesWithLocation.map((s) => s.category))];
    const displayedSites =
        filterCategory === "All" ? sitesWithLocation : sitesWithLocation.filter((s) => s.category === filterCategory);

    // --- Initialize the map once ---------------------------------------
    useEffect(() => {
        if (mapRef.current) return; // guard against StrictMode double-invoke

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: buildStyle("standard"),
            center: [102.8256, 47.1975], // maplibre uses [lng, lat]
            zoom: 9,
            attributionControl: true,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => setMapReady(true));
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Swap base layer style without tearing down markers -------------
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        map.setStyle(buildStyle(baseKey));
        // markers are DOM-based (maplibregl.Marker), so they survive a
        // setStyle call automatically — no need to re-add them here.
    }, [baseKey, mapReady]);

    // --- Render / refresh markers whenever the filtered site list changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        // Clear previous markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        displayedSites.forEach((site) => {
            const style = getCategoryStyle(site.category);
            const isSelected = selectedId === site.id.toString();

            const el = document.createElement("div");
            el.className = "orkhon-marker-pin";
            el.style.setProperty("--marker-color", style.color);
            el.innerHTML = `<i class="fa-solid ${style.icon}"></i>`;
            if (isSelected) el.classList.add("orkhon-marker-selected");

            const popupHtml = `
                <div class="orkhon-popup">
                    <div class="orkhon-popup-image">
                        <img src="${site.images && site.images.length > 0 ? site.images[0] : getPlaceHolder(site.id)}" alt="${site.name}" />
                    </div>
                    <b class="orkhon-popup-title">${language === "en" && site.nameEn ? site.nameEn : site.name}</b>
                    <span class="orkhon-popup-category">${t[site.category] || site.category}</span>
                    <a class="orkhon-popup-link" href="/sites/${site.id}">${language === "mn" ? "Дэлгэрэнгүй" : "Details"}</a>
                </div>
            `;

            const popup = new maplibregl.Popup({ offset: 30, maxWidth: "280px", closeButton: true }).setHTML(popupHtml);

            const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([site.location.lng, site.location.lat])
                .setPopup(popup)
                .addTo(map);

            markersRef.current.push(marker);
        });

        // --- AutoZoom equivalent -----------------------------------------
        if (selectedId) {
            const site = displayedSites.find((s) => s.id.toString() === selectedId);
            if (site && site.location) {
                map.flyTo({ center: [site.location.lng, site.location.lat], zoom: 15, duration: 1500 });
                return;
            }
        }

        if (displayedSites.length > 0) {
            const bounds = displayedSites.reduce(
                (b, s) => b.extend([s.location.lng, s.location.lat]),
                new maplibregl.LngLatBounds(
                    [displayedSites[0].location.lng, displayedSites[0].location.lat],
                    [displayedSites[0].location.lng, displayedSites[0].location.lat]
                )
            );
            map.fitBounds(bounds, { padding: 50, duration: 1500, maxZoom: 13 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, filterCategory, selectedId, language]);

    // -----------------------------------------------------------------
    // Extension point for future GIS layers (Living Protection Map).
    // Once mapReady, addSource/addLayer calls for protection-zone
    // GeoJSON, buffer boundaries, etc. can be added in a dedicated
    // useEffect here without touching the marker logic above.
    // -----------------------------------------------------------------

    return (
        <div style={{ height: "100%", width: "100%", background: "#0f172a", position: "relative" }}>
            {/* Category filter */}
            <div className="filter-control">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`filter-btn ${filterCategory === cat ? "active" : ""}`}
                    >
                        {cat === "All" ? (language === "mn" ? "Бүгд" : "All") : t[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Base layer switcher */}
            <div className="baselayer-control">
                {Object.entries(BASE_LAYERS).map(([key, layer]) => (
                    <button
                        key={key}
                        onClick={() => setBaseKey(key)}
                        className={`baselayer-btn ${baseKey === key ? "active" : ""}`}
                    >
                        {layer.label[language] || layer.label.en}
                    </button>
                ))}
            </div>

            <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

            <style jsx global>{`
                .filter-control {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    z-index: 10;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    max-width: 70%;
                }
                .baselayer-control {
                    position: absolute;
                    top: 10px;
                    right: 50px;
                    z-index: 10;
                    display: flex;
                    gap: 4px;
                }
                .filter-btn,
                .baselayer-btn {
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    backdrop-filter: blur(4px);
                }
                .filter-btn:hover,
                .baselayer-btn:hover {
                    background: white;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .filter-btn.active,
                .baselayer-btn.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }

                .orkhon-marker-pin {
                    width: 40px;
                    height: 40px;
                    border-radius: 50% 50% 50% 0;
                    background: var(--marker-color, #3b82f6);
                    transform: rotate(-45deg);
                    box-shadow: -3px 3px 6px 2px rgba(0, 0, 0, 0.3);
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .orkhon-marker-pin i {
                    transform: rotate(45deg);
                    color: white;
                    font-size: 18px;
                }
                .orkhon-marker-pin:hover {
                    transform: rotate(-45deg) scale(1.1);
                }
                .orkhon-marker-selected {
                    z-index: 999 !important;
                    transform: rotate(-45deg) scale(1.15);
                }

                .maplibregl-popup-content {
                    padding: 0 !important;
                    border-radius: 16px !important;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .orkhon-popup {
                    text-align: left;
                    min-width: 220px;
                    padding: 4px 16px 16px 16px;
                }
                .orkhon-popup-image {
                    width: calc(100% + 32px);
                    margin: -4px -16px 12px -16px;
                    height: 140px;
                    overflow: hidden;
                }
                .orkhon-popup-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .orkhon-popup-title {
                    font-size: 1rem;
                    color: #0f172a;
                    display: block;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
                .orkhon-popup-category {
                    display: inline-block;
                    padding: 4px 8px;
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.75rem;
                    border-radius: 6px;
                    margin-bottom: 12px;
                    font-weight: 500;
                }
                .orkhon-popup-link {
                    display: block;
                    width: 100%;
                    background: #3b82f6;
                    color: white;
                    padding: 8px 0;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    text-decoration: none;
                    font-weight: 600;
                    text-align: center;
                    transition: background 0.2s;
                }
                .orkhon-popup-link:hover {
                    background: #2563eb;
                }
            `}</style>
        </div>
    );
}
