"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { sitesData } from "../data/sites";
import { translations } from "../data/translations";
import BottomNav from "../../components/BottomNav";

// Map component нь WebGL (browser) дээр ажилладаг тул SSR-г унтраана
const MapView = dynamic(() => import("../../components/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b14] gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"></div>
            <p className="text-xs text-slate-400 font-medium tracking-wider">Газрын зураг ачаалж байна...</p>
        </div>
    ),
});

const categoryMeta = {
    'Чулуун зэвсэг':  { color: '#f59e0b', icon: 'fa-solid fa-khanda',          bg: 'rgba(245, 158, 11, 0.16)', text: '#fbbf24' },
    'Хөшөө дурсгал':  { color: '#a855f7', icon: 'fa-solid fa-monument',        bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' },
    'Булш хиргисүүр': { color: '#06b6d4', icon: 'fa-solid fa-circle-dot',      bg: 'rgba(6, 182, 212, 0.16)',  text: '#22d3ee' },
    'Хот суурин':     { color: '#22c55e', icon: 'fa-solid fa-city',            bg: 'rgba(34, 197, 94, 0.16)',  text: '#4ade80' },
    'Эртний хот':     { color: '#22c55e', icon: 'fa-solid fa-archway',         bg: 'rgba(34, 197, 94, 0.16)',  text: '#4ade80' },
    'Сүм хийд':       { color: '#f97316', icon: 'fa-solid fa-place-of-worship',bg: 'rgba(249, 115, 22, 0.16)', text: '#fb923c' },
    'Хадны зураг':    { color: '#ef4444', icon: 'fa-solid fa-palette',         bg: 'rgba(239, 68, 68, 0.16)',   text: '#f87171' },
    'Тахилгат газар': { color: '#ec4899', icon: 'fa-solid fa-mountain',        bg: 'rgba(236, 72, 153, 0.16)', text: '#f472b6' },
    'Түрэгийн үе':    { color: '#6366f1', icon: 'fa-solid fa-shield-halved',  bg: 'rgba(99, 102, 241, 0.16)', text: '#818cf8' },
};

function getCategoryMeta(cat) {
    return categoryMeta[cat] || {
        color: '#64748b',
        icon: 'fa-solid fa-location-dot',
        bg: 'rgba(100, 116, 139, 0.16)',
        text: '#94a3b8',
    };
}

function MapContent() {
    const searchParams = useSearchParams();
    const [language, setLanguage] = useState("mn");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedSite, setSelectedSite] = useState(null);
    const mapInstanceRef = useRef(null);

    // Хэл тохируулах (URL params эсвэл localStorage-аас)
    useEffect(() => {
        const urlLang = searchParams.get("lang");
        const savedLang = localStorage.getItem("language");
        if (urlLang && (urlLang === "mn" || urlLang === "en")) {
            setLanguage(urlLang);
        } else if (savedLang && (savedLang === "mn" || savedLang === "en")) {
            setLanguage(savedLang);
        }
    }, [searchParams]);

    const toggleLanguage = () => {
        const next = language === "mn" ? "en" : "mn";
        setLanguage(next);
        localStorage.setItem("language", next);
    };

    const t = translations[language] || translations.mn;

    // URL дээрээс id дамжиж ирсэн эсэхийг шалгах (жишээ: /map?id=5)
    useEffect(() => {
        const targetId = searchParams.get("id");
        if (targetId) {
            const match = sitesData.find((s) => String(s.id) === String(targetId));
            if (match) {
                setSelectedSite(match);
                // Хэрэв өөр категори шүүгдсэн байвал "Бүгд" рүү шилжүүлж бүх дурсгалыг харуулах
                setSelectedCategory("All");
            }
        }
    }, [searchParams]);

    const categories = useMemo(() => {
        const unique = [...new Set(sitesData.map((s) => s.category))];
        return ["All", ...unique];
    }, []);

    const filteredSites = useMemo(() => {
        if (selectedCategory === "All") return sitesData;
        return sitesData.filter((s) => s.category === selectedCategory);
    }, [selectedCategory]);

    // Категори солигдох үед газрын зургийн байршлыг тааруулах
    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        // Хэрэв сонгогдсон дурсгал шинэ ангилалд багтахгүй бол хаах
        if (selectedSite && cat !== "All" && selectedSite.category !== cat) {
            setSelectedSite(null);
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        const targetSites = cat === "All" ? sitesData : sitesData.filter((s) => s.category === cat);
        if (targetSites.length === 0) return;

        if (cat === "All") {
            map.flyTo({
                center: [102.55, 47.15],
                zoom: 8.5,
                duration: 800,
            });
        } else {
            const lats = targetSites.map((s) => s.location.lat);
            const lngs = targetSites.map((s) => s.location.lng);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            if (minLng === maxLng && minLat === maxLat) {
                map.flyTo({ center: [minLng, minLat], zoom: 12.5, duration: 800 });
            } else {
                map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
                    padding: { top: 130, bottom: 180, left: 40, right: 40 },
                    maxZoom: 13,
                    duration: 800,
                });
            }
        }
    };

    // Бүх дурсгалыг бүтэн харах / Төв рүү буцах
    const handleResetView = () => {
        setSelectedSite(null);
        const map = mapInstanceRef.current;
        if (!map) return;
        map.flyTo({
            center: [102.55, 47.15],
            zoom: 8.5,
            duration: 800,
        });
    };

    const activeMeta = selectedSite ? getCategoryMeta(selectedSite.category) : null;
    const siteTitle = selectedSite
        ? (language === "en" && selectedSite.nameEn ? selectedSite.nameEn : selectedSite.name)
        : "";

    return (
        <div className="relative w-full overflow-hidden" style={{ height: "100dvh" }}>
            {/* ── Top Header & Filter Bar ── */}
            <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-3 pb-2 flex flex-col gap-2.5 max-w-[480px] mx-auto w-full pointer-events-none">
                <div className="flex items-center justify-between w-full pointer-events-auto">
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/"
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white border border-white/10 transition-colors"
                            style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(16px)" }}
                            aria-label="Нүүр хуудас руу буцах"
                        >
                            <i className="fa-solid fa-arrow-left text-sm"></i>
                        </Link>
                        <div>
                            <h1 className="font-heading font-bold text-base text-white leading-none">
                                {t.navMap || "Газрын зураг"}
                            </h1>
                            <p className="text-[11px] text-amber-400/90 font-medium leading-tight mt-0.5">
                                {filteredSites.length === sitesData.length
                                    ? `${sitesData.length} ${language === "mn" ? "дурсгал" : "sites"}`
                                    : `${filteredSites.length} / ${sitesData.length} ${language === "mn" ? "дурсгал" : "sites"}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white uppercase tracking-wider border border-white/10 transition-colors"
                            style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(16px)" }}
                        >
                            {language === "mn" ? "EN" : "MN"}
                        </button>
                    </div>
                </div>

                {/* Категори шүүлтүүр (Horizontal scroll) */}
                <div className="pointer-events-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 -mx-4 px-4 mask-fade-right">
                    {categories.map((cat) => {
                        const isAll = cat === "All";
                        const isSelected = selectedCategory === cat;
                        const meta = isAll ? null : getCategoryMeta(cat);
                        const count = isAll ? sitesData.length : sitesData.filter((s) => s.category === cat).length;
                        const label = isAll ? (t.all || "Бүгд") : (t[cat] || cat);

                        return (
                            <button
                                key={cat}
                                onClick={() => handleSelectCategory(cat)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition-all duration-200 border flex-shrink-0",
                                    isSelected
                                        ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20"
                                        : "bg-slate-900/80 backdrop-blur-md text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
                                )}
                            >
                                {!isAll && (
                                    <i
                                        className={`${meta.icon} text-[10px]`}
                                        style={!isSelected ? { color: meta.color } : { color: "#0f172a" }}
                                    ></i>
                                )}
                                <span>{label}</span>
                                <span
                                    className={clsx(
                                        "text-[9px] px-1.5 py-0.2 rounded-full font-bold",
                                        isSelected ? "bg-slate-950/20 text-slate-950" : "bg-white/10 text-slate-400"
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* ── Interactive Map View ── */}
            <div className="w-full h-full">
                <MapView
                    sites={filteredSites}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    categoryMeta={categoryMeta}
                    language={language}
                    onMapReady={(map) => {
                        mapInstanceRef.current = map;
                    }}
                />
            </div>

            {/* ── Floating Controls (Recenter Button) ── */}
            <div
                className="fixed right-3.5 z-30 transition-all duration-300"
                style={{ bottom: selectedSite ? "235px" : "120px" }}
            >
                <button
                    onClick={handleResetView}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white border border-white/10 transition-all shadow-xl active:scale-95"
                    style={{
                        background: "rgba(10, 14, 26, 0.9)",
                        backdropFilter: "blur(16px)",
                    }}
                    title={language === "mn" ? "Бүх дурсгалыг харах" : "Fit Orkhon Valley view"}
                    aria-label="Төв рүү буцах"
                >
                    <i className="fa-solid fa-expand text-sm text-amber-400"></i>
                </button>
            </div>

            {/* ── Selected Site Preview Card ── */}
            <AnimatePresence>
                {selectedSite && (
                    <motion.div
                        key={selectedSite.id}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className="fixed left-4 right-4 z-40 max-w-[440px] mx-auto pointer-events-auto"
                        style={{ bottom: "90px" }}
                    >
                        <div
                            className="rounded-2xl p-3 border border-white/10 shadow-2xl overflow-hidden relative"
                            style={{
                                background: "rgba(10, 14, 26, 0.94)",
                                backdropFilter: "blur(24px) saturate(180%)",
                                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
                            }}
                        >
                            <div className="flex gap-3">
                                {/* Thumbnail Image */}
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                                    {selectedSite.images && selectedSite.images[0] ? (
                                        <img
                                            src={selectedSite.images[0]}
                                            alt={siteTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ background: activeMeta.bg }}
                                        >
                                            <i
                                                className={`${activeMeta.icon} text-2xl`}
                                                style={{ color: activeMeta.color }}
                                            ></i>
                                        </div>
                                    )}

                                    {/* VR badge overlay if available */}
                                    {(selectedSite.panoramaTour || selectedSite.panoramaUrl) && (
                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[9px] flex items-center gap-1 shadow">
                                            <i className="fa-solid fa-vr-cardboard text-[8px]"></i>
                                            VR
                                        </div>
                                    )}
                                </div>

                                {/* Content Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        {/* Top row: Category tag & Close button */}
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                                style={{ background: activeMeta.bg, color: activeMeta.text }}
                                            >
                                                <i className={`${activeMeta.icon} text-[9px]`}></i>
                                                {t[selectedSite.category] || selectedSite.category}
                                            </span>
                                            <button
                                                onClick={() => setSelectedSite(null)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                aria-label="Хаах"
                                            >
                                                <i className="fa-solid fa-xmark text-xs"></i>
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-heading font-bold text-white text-[14px] leading-snug line-clamp-2">
                                            {siteTitle}
                                        </h3>

                                        {/* Altitude / protection subtitle */}
                                        {selectedSite.altitude && (
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <i className="fa-solid fa-mountain-sun text-[10px] text-amber-500/80"></i>
                                                <span>{selectedSite.altitude}</span>
                                                {selectedSite.protectionStatus && (
                                                    <span className="truncate">• {selectedSite.protectionStatus}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Link
                                            href={`/sites/${selectedSite.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all duration-200 shadow-md shadow-amber-500/20"
                                        >
                                            <span>{language === "mn" ? "Дэлгэрэнгүй үзэх" : "View Details"}</span>
                                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                        </Link>

                                        {(selectedSite.panoramaTour || selectedSite.panoramaUrl) && (
                                            <Link
                                                href="/tours"
                                                className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-colors"
                                                title={language === "mn" ? "VR аялал" : "VR Tour"}
                                                aria-label="VR аялал"
                                            >
                                                <i className="fa-solid fa-vr-cardboard"></i>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bottom Navigation ── */}
            <BottomNav t={t} />
        </div>
    );
}

export default function MapPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#070b14] gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"></div>
                    <p className="text-xs text-slate-400 font-medium tracking-wider">Уншиж байна...</p>
                </div>
            }
        >
            <MapContent />
        </Suspense>
    );
}