"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSearchParams } from "next/navigation";
import { sitesData, getPlaceHolder } from "../app/data/sites";
import { translations } from "../app/data/translations";

// Категори бүрийн өнгө, Font Awesome icon — Leaflet хувилбартай яг адилхан
const CATEGORY_STYLE = {
    "Сүм хийд": { color: "#8b5cf6", icon: "fa-place-of-worship" },
    "Хот суурин": { color: "#3b82f6", icon: "fa-archway" },
    "Хадны зураг": { color: "#10b981", icon: "fa-palette" },
    "Булш хиргисүүр": { color: "#64748b", icon: "fa-monument" },
    "Тахилгат газар": { color: "#f59e0b", icon: "fa-mountain" },
};
const DEFAULT_STYLE = { color: "#1e3a8a", icon: "fa-location-dot" };
const getCategoryStyle = (category) => CATEGORY_STYLE[category] || DEFAULT_STYLE;

// ---------- Base layer тодорхойлолтууд (raster — key шаардахгүй) ----------
const RASTER_STYLES = {
    standard: {
        version: 8,
        sources: {
            osm: {
                type: "raster",
                tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors',
            },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
    },
    satellite: {
        version: 8,
        sources: {
            esri: {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                attribution: "Tiles &copy; Esri",
            },
        },
        layers: [{ id: "esri", type: "raster", source: "esri" }],
    },
    terrain2d: {
        version: 8,
        sources: {
            otm: {
                type: "raster",
                tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png", "https://b.tile.opentopomap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "&copy; OpenTopoMap (CC-BY-SA)",
            },
        },
        layers: [{ id: "otm", type: "raster", source: "otm" }],
    },
    // 3D terrain-ийн суурь давхарга — OpenTopoMap дээр terrain-rgb (Terrarium) нэмнэ
    terrain3d: {
        version: 8,
        sources: {
            otm: {
                type: "raster",
                tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png", "https://b.tile.opentopomap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "&copy; OpenTopoMap (CC-BY-SA)",
            },
            terrainSource: {
                type: "raster-dem",
                tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
                tileSize: 256,
                encoding: "terrarium",
                maxzoom: 15,
            },
        },
        layers: [{ id: "otm", type: "raster", source: "otm" }],
        terrain: { source: "terrainSource", exaggeration: 1.4 },
    },
};

const LAYER_LABELS = {
    standard: { mn: "Энгийн", en: "Standard" },
    satellite: { mn: "Хиймэл дагуул", en: "Satellite" },
    terrain2d: { mn: "Гадаргуу", en: "Terrain" },
    terrain3d: { mn: "3D Гадаргуу", en: "3D Terrain" },
};

export default function MapView({ language = "mn" }) {
    const t = translations[language];
    const mapRef = useRef(null);
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("id");

    const [activeLayer, setActiveLayer] = useState("standard");
    const [filterCategory, setFilterCategory] = useState("All");
    const [popupSite, setPopupSite] = useState(null);
    const [viewState, setViewState] = useState({ longitude: 102.8256, latitude: 47.1975, zoom: 8, pitch: 0 });

    const sitesWithLocation = useMemo(() => sitesData.filter((s) => s.location), []);
    const categories = useMemo(() => ["All", ...new Set(sitesWithLocation.map((s) => s.category))], [sitesWithLocation]);
    const displayedSites = useMemo(
        () => (filterCategory === "All" ? sitesWithLocation : sitesWithLocation.filter((s) => s.category === filterCategory)),
        [sitesWithLocation, filterCategory]
    );

    // ---------- AutoZoom: selectedId эсвэл filter өөрчлөгдөхөд camera шилжинэ ----------
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        if (selectedId) {
            const site = displayedSites.find((s) => s.id.toString() === selectedId);
            if (site) {
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
            map.fitBounds(bounds, { padding: 60, duration: 1500 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedSites, selectedId]);

    // ---------- 3D Terrain: зөвхөн "terrain3d" сонгогдоход идэвхжинэ ----------
    const handleMapLoad = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        if (activeLayer === "terrain3d" && map.getSource("terrainSource")) {
            map.setTerrain({ source: "terrainSource", exaggeration: 1.4 });
        }
    }, [activeLayer]);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        // style солигдоход л ажиллана (onLoad эсвэл style дата бэлэн болмогц)
        const applyTerrain = () => {
            if (activeLayer === "terrain3d" && map.getSource("terrainSource")) {
                map.setTerrain({ source: "terrainSource", exaggeration: 1.4 });
            } else {
                map.setTerrain(null);
            }
        };
        if (map.isStyleLoaded()) applyTerrain();
        else map.once("styledata", applyTerrain);
    }, [activeLayer]);

    return (
        <div style={{ height: "100%", width: "100%", background: "#0f172a", position: "relative" }}>
            {/* ------------------------------------------------------------------
                НЭГДСЭН TOOLBAR — layer switcher (мөр 1) ба category filter (мөр 2)
                хоёуланг НЭГ баганад, тус бүрийг ХЭВТЭЭ SCROLL мөр болгосон
                (overflow-x: auto, wrap ХИЙХГҮЙ). Ингэснээр хэдий чинээ олон
                category/layer нэмэгдсэн ч (жишээ нь 3D Гадаргуу) хэзээ ч
                нөгөө мөрөө дайрч давхцахгүй.
               ------------------------------------------------------------------ */}
            <div className="map-toolbar">
                <div className="toolbar-row">
                    {Object.keys(RASTER_STYLES).map((key) => (
                        <button
                            key={key}
                            onClick={() => setActiveLayer(key)}
                            className={`layer-btn ${activeLayer === key ? "active" : ""}`}
                        >
                            {LAYER_LABELS[key][language] || LAYER_LABELS[key].en}
                        </button>
                    ))}
                </div>
                <div className="toolbar-row">
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
            </div>

            <Map
                ref={mapRef}
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                onLoad={handleMapLoad}
                mapStyle={RASTER_STYLES[activeLayer]}
                style={{ width: "100%", height: "100%" }}
                maxPitch={activeLayer === "terrain3d" ? 70 : 0}
            >
                <NavigationControl position="top-right" />

                {displayedSites.map((site) => {
                    const style = getCategoryStyle(site.category);
                    const isSelected = selectedId === site.id.toString();
                    return (
                        <Marker
                            key={site.id}
                            longitude={site.location.lng}
                            latitude={site.location.lat}
                            anchor="bottom"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setPopupSite(site);
                            }}
                        >
                            <div
                                className="marker-pin"
                                style={{
                                    backgroundColor: style.color,
                                    zIndex: isSelected ? 1000 : "auto",
                                    transform: `rotate(-45deg) scale(${isSelected ? 1.15 : 1})`,
                                }}
                            >
                                <i className={`fa-solid ${style.icon}`}></i>
                            </div>
                        </Marker>
                    );
                })}

                {popupSite && (
                    <Popup
                        longitude={popupSite.location.lng}
                        latitude={popupSite.location.lat}
                        anchor="top"
                        maxWidth="280px"
                        className="custom-popup"
                        onClose={() => setPopupSite(null)}
                        closeButton={true}
                    >
                        <div style={{ textAlign: "left", minWidth: "220px", padding: "4px" }}>
                            <div style={{ width: "100%", height: "140px", borderRadius: "12px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                                <img
                                    src={popupSite.images && popupSite.images.length > 0 ? popupSite.images[0] : getPlaceHolder(popupSite.id)}
                                    alt={popupSite.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <b style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px", lineHeight: "1.4" }}>
                                {language === "en" && popupSite.nameEn ? popupSite.nameEn : popupSite.name}
                            </b>
                            <span style={{ display: "inline-block", padding: "4px 8px", background: "#f1f5f9", color: "#64748b", fontSize: "0.75rem", borderRadius: "6px", marginBottom: "12px", fontWeight: "500" }}>
                                {t[popupSite.category] || popupSite.category}
                            </span>
                            <a
                                href={`/sites/${popupSite.id}`}
                                style={{ display: "block", width: "100%", background: "#3b82f6", color: "white", padding: "8px 0", borderRadius: "8px", fontSize: "0.875rem", textDecoration: "none", fontWeight: "600", textAlign: "center" }}
                            >
                                {language === "mn" ? "Дэлгэрэнгүй" : "Details"}
                            </a>
                        </div>
                    </Popup>
                )}
            </Map>

            <style jsx global>{`
                .map-toolbar {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 60px; /* NavigationControl (+/-, compass)-той давхцахгүйн тулд зай үлдээв */
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    pointer-events: none; /* toolbar өөрөө биш, дотор нь товч л дарагдана */
                }
                .toolbar-row {
                    display: flex;
                    gap: 6px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding-bottom: 2px;
                    pointer-events: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .toolbar-row::-webkit-scrollbar {
                    display: none;
                }
                .filter-btn, .layer-btn {
                    flex: 0 0 auto;
                    white-space: nowrap;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0,0,0,0.05);
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    backdrop-filter: blur(4px);
                }
                .filter-btn:hover, .layer-btn:hover {
                    background: white;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .filter-btn.active, .layer-btn.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
                .marker-pin {
                    width: 40px;
                    height: 40px;
                    border-radius: 50% 50% 50% 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: -3px 3px 6px 2px rgba(0, 0, 0, 0.3);
                    border: 2px solid white;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .marker-pin i {
                    transform: rotate(45deg);
                    color: white;
                    font-size: 18px;
                }
                .marker-pin:hover {
                    transform: rotate(-45deg) scale(1.1) !important;
                }
                .custom-popup .maplibregl-popup-content {
                    padding: 0;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .custom-popup .maplibregl-popup-content > div {
                    margin: 16px;
                }
            `}</style>
        </div>
    );
}