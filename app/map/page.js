"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { sitesData } from "../data/sites";
import { translations } from "../data/translations";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import BottomNav from "../../components/BottomNav";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ── Category colours ── */
const categoryMeta = {
    'Чулуун зэвсэг': { color: '#f59e0b', icon: '🪨' },
    'Хөшөө дурсгал': { color: '#a855f7', icon: '🗿' },
    'Булш хиргисүүр': { color: '#06b6d4', icon: '⛏️' },
    'Хот суурин': { color: '#22c55e', icon: '🏛️' },
    'Эртний хот': { color: '#22c55e', icon: '🏰' },
    'Сүм хийд': { color: '#f97316', icon: '🛕' },
    'Хадны зураг': { color: '#ef4444', icon: '🎨' },
    'Тахилгат газар': { color: '#ec4899', icon: '⛩️' },
    'Түрэгийн үе': { color: '#6366f1', icon: '🏹' },
};

function meta(cat) {
    return categoryMeta[cat] || { color: '#64748b', icon: '📍' };
}

const DEFAULT_CENTER = { lng: 102.55, lat: 47.15 };
const DEFAULT_ZOOM = 8.2;

export default function MapPage() {
    const [language, setLanguage] = useState("mn");
    const [filter, setFilter] = useState("All");
    const [selected, setSelected] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang) setLanguage(savedLang);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "mn" ? "en" : "mn";
        setLanguage(newLang);
        localStorage.setItem("language", newLang);
    };

    const t = translations[language] || {};
    const categories = ["All", ...new Set(sitesData.map((s) => s.category))];

    const filteredSites =
        filter === "All" ? sitesData : sitesData.filter((s) => s.category === filter);

    /* ── WebGL initialization with DOM Ready Guard ── */
    useEffect(() => {
        let animationFrameId = null;
        let isMounted = true;

        const container = mapContainer.current;
        if (!container) return;

        // Контейнер DOM дээр бодитоор хэмжээтэй болохыг хүлээх функц
        const initMapWhenReady = () => {
            if (!isMounted || !mapContainer.current) return;

            const { clientWidth, clientHeight } = mapContainer.current;

            // Хэрэв DOM хэмжээ 0px байвал дараагийн frame хүртэл хүлээнэ
            if (clientWidth === 0 || clientHeight === 0) {
                animationFrameId = requestAnimationFrame(initMapWhenReady);
                return;
            }

            // Хуучин Map instance болон HTML үлдэгдлийг бүрэн цэвэрлэх
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) { }
                mapRef.current = null;
            }
            mapContainer.current.innerHTML = "";

            // Шинэ MapLibre үүсгэх
            const map = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        'carto-dark': {
                            type: 'raster',
                            tiles: [
                                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                                'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            ],
                            tileSize: 256,
                            attribution: '&copy; OpenStreetMap &copy; CARTO'
                        }
                    },
                    layers: [
                        {
                            id: 'carto-dark-layer',
                            type: 'raster',
                            source: 'carto-dark',
                            minzoom: 0,
                            maxzoom: 22
                        }
                    ]
                },
                center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
                zoom: DEFAULT_ZOOM,
                maxZoom: 16,
                minZoom: 6,
                fadeDuration: 0, // Зураг уусаж харагдах үеийн хар дэлгэцийг арилгана
                trackResize: true,
                preserveDrawingBuffer: true,
            });

            mapRef.current = map;

            map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

            map.on("load", () => {
                if (isMounted) {
                    setMapLoaded(true);
                    map.resize();
                }
            });
        };

        // Жижиг сааталтайгаар залан эхлүүлнэ
        animationFrameId = requestAnimationFrame(initMapWhenReady);

        return () => {
            isMounted = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) { }
                mapRef.current = null;
            }
            setMapLoaded(false);
        };
    }, []);

    /* ── Render Markers ── */
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        markersRef.current.forEach((m) => {
            try { m.remove(); } catch (e) { }
        });
        markersRef.current = [];

        filteredSites.forEach((site) => {
            if (!site.location) return;
            const { color, icon } = meta(site.category);

            const el = document.createElement("div");
            el.className = "orkhon-marker";
            el.style.cursor = "pointer";
            el.innerHTML = `
                <div style="
                    width:36px; height:36px;
                    background:${color};
                    border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    font-size:16px;
                    box-shadow: 0 2px 12px ${color}66, 0 0 0 3px rgba(255,255,255,0.25);
                    transition: transform 0.2s ease;
                    border: 2px solid rgba(255,255,255,0.4);
                ">${icon}</div>
            `;

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                setSelected(site);
                if (mapRef.current) {
                    mapRef.current.flyTo({
                        center: [site.location.lng, site.location.lat],
                        zoom: Math.max(mapRef.current.getZoom(), 11),
                        duration: 800,
                    });
                }
            });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([site.location.lng, site.location.lat])
                .addTo(mapRef.current);

            markersRef.current.push(marker);
        });
    }, [mapLoaded, filteredSites]);

    /* ── Close popup on map click ── */
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;
        const handler = () => setSelected(null);
        mapRef.current.on("click", handler);
        return () => {
            if (mapRef.current) mapRef.current.off("click", handler);
        };
    }, [mapLoaded]);

    return (
        <div className="min-h-screen relative" style={{ background: "#070b14" }}>
            {/* Header */}
            <header
                className="fixed top-0 left-1/2 -translate-x-1/2 z-50 px-5 py-3 flex justify-between items-center max-w-[480px] w-full border-b border-white/5"
                style={{
                    background: "rgba(7,11,20,0.92)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                }}
            >
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors border border-white/8"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <div>
                        <h1 className="font-heading font-bold text-base text-white leading-tight">
                            {t.navMap || "Газрын зураг"}
                        </h1>
                        <p className="text-slate-500 text-[10px] font-medium">
                            {filteredSites.length} {language === "mn" ? "дурсгал" : "sites"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/8"
                >
                    {language === "mn" ? "EN" : "MN"}
                </button>
            </header>

            {/* Category pills */}
            <div
                className="fixed top-[56px] left-1/2 -translate-x-1/2 z-40 max-w-[480px] w-full border-b border-white/5"
                style={{
                    background: "rgba(7,11,20,0.92)",
                    backdropFilter: "blur(20px)",
                }}
            >
                <div className="overflow-x-auto no-scrollbar py-2.5 px-5 flex gap-2">
                    {categories.map((cat) => {
                        const isActive = filter === cat;
                        const m = meta(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => {
                                    setFilter(cat);
                                    setSelected(null);
                                }}
                                className={clsx(
                                    "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                                    isActive
                                        ? "bg-amber-500 text-slate-900 border-amber-500 shadow-md shadow-amber-500/20"
                                        : "text-slate-400 border-white/6 hover:border-white/15 hover:text-slate-200"
                                )}
                                style={isActive ? {} : { background: "rgba(255,255,255,0.04)" }}
                            >
                                {cat !== "All" && (
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: isActive ? "#0f172a" : m.color }}
                                    ></span>
                                )}
                                {cat === "All" ? (t.all || "Бүгд") : (t[cat] || cat)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={mapContainer}
                className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px]"
                style={{
                    top: "96px",
                    bottom: "80px",
                    height: "calc(100vh - 176px)",
                    zIndex: 1,
                    backgroundColor: "#070b14", // Canvas ачаалж байх үед хар биш арын дэвсгэртэй адил өнгө харуулна
                }}
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {!mapLoaded && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-10 flex flex-col items-center justify-center"
                        style={{ top: "96px", bottom: "80px", background: "#070b14" }}
                    >
                        <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mb-4"></div>
                        <p className="text-slate-400 text-sm">{t.loading || "Ачаалж байна..."}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selected Site Card */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="fixed left-1/2 -translate-x-1/2 px-4 z-30 max-w-[480px] w-full"
                        style={{ bottom: "100px" }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden border border-white/10"
                            style={{
                                background: "rgba(10,14,26,0.95)",
                                backdropFilter: "blur(24px)",
                                boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
                            }}
                        >
                            <div className="flex">
                                <div className="relative w-[110px] min-h-[100px] flex-shrink-0 overflow-hidden">
                                    {selected.images && selected.images[0] ? (
                                        <img
                                            src={selected.images[0]}
                                            alt={selected.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl">
                                            {meta(selected.category).icon}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0e1a]/60"></div>
                                </div>

                                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold mb-1.5"
                                            style={{
                                                background: `${meta(selected.category).color}20`,
                                                color: meta(selected.category).color,
                                            }}
                                        >
                                            <span
                                                className="w-1 h-1 rounded-full"
                                                style={{ background: meta(selected.category).color }}
                                            ></span>
                                            {t[selected.category] || selected.category}
                                        </div>
                                        <h3 className="text-white font-semibold text-[14px] leading-snug line-clamp-2">
                                            {language === "en" && selected.nameEn
                                                ? selected.nameEn
                                                : selected.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Link
                                            href={`/sites/${selected.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-amber-500 text-slate-900 transition-all hover:bg-amber-400"
                                        >
                                            <i className="fa-solid fa-eye text-[10px]"></i>
                                            {language === "mn" ? "Дэлгэрэнгүй" : "Details"}
                                        </Link>
                                        <button
                                            onClick={() => setSelected(null)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors border border-white/8"
                                            style={{ background: "rgba(255,255,255,0.05)" }}
                                        >
                                            <i className="fa-solid fa-xmark text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav t={t} />

            <style jsx global>{`
                .orkhon-marker { cursor: pointer; }
                .maplibregl-canvas { outline: none; }
                .maplibregl-ctrl-attrib {
                    font-size: 9px !important;
                    background: rgba(7,11,20,0.7) !important;
                    color: #64748b !important;
                    border-radius: 6px !important;
                    padding: 2px 6px !important;
                }
                .maplibregl-ctrl-attrib a { color: #94a3b8 !important; }
                .maplibregl-ctrl-group {
                    background: rgba(10,14,26,0.9) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
                }
                .maplibregl-ctrl-group button {
                    width: 36px !important;
                    height: 36px !important;
                    border-color: rgba(255,255,255,0.06) !important;
                }
                .maplibregl-ctrl-group button + button {
                    border-top: 1px solid rgba(255,255,255,0.06) !important;
                }
                .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
                    filter: invert(0.7);
                }
            `}</style>
        </div>
    );
}