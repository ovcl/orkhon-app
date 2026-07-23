"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { sitesData, getPlaceHolder } from "../data/sites";
import { translations } from "../data/translations";
import { motion, AnimatePresence } from "framer-motion";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const categoryColors = {
    'Чулуун зэвсэг': { bg: 'bg-amber-500/12', text: 'text-amber-400', dot: 'bg-amber-400' },
    'Хөшөө дурсгал': { bg: 'bg-purple-500/12', text: 'text-purple-400', dot: 'bg-purple-400' },
    'Булш хиргисүүр': { bg: 'bg-cyan-500/12', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    'Хот суурин': { bg: 'bg-green-500/12', text: 'text-green-400', dot: 'bg-green-400' },
    'Эртний хот': { bg: 'bg-green-500/12', text: 'text-green-400', dot: 'bg-green-400' },
    'Сүм хийд': { bg: 'bg-orange-500/12', text: 'text-orange-400', dot: 'bg-orange-400' },
    'Хадны зураг': { bg: 'bg-red-500/12', text: 'text-red-400', dot: 'bg-red-400' },
    'Тахилгат газар': { bg: 'bg-pink-500/12', text: 'text-pink-400', dot: 'bg-pink-400' },
    'Түрэгийн үе': { bg: 'bg-indigo-500/12', text: 'text-indigo-400', dot: 'bg-indigo-400' },
};

function getCat(cat) {
    return categoryColors[cat] || { bg: 'bg-slate-500/12', text: 'text-slate-400', dot: 'bg-slate-400' };
}

export default function SitesPage() {
    const [language, setLanguage] = useState('mn');
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [viewMode, setViewMode] = useState('list');

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'mn' ? 'en' : 'mn';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = translations[language];
    const categories = ["All", ...new Set(sitesData.map(s => s.category))];

    const filteredSites = sitesData.filter(site => {
        const matchesCategory = filter === "All" || site.category === filter;
        const query = search.toLowerCase();
        const matchesSearch = !query ||
            site.name.toLowerCase().includes(query) ||
            (site.nameEn && site.nameEn.toLowerCase().includes(query));
        return matchesCategory && matchesSearch;
    });

    const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = cat === "All" ? sitesData.length : sitesData.filter(s => s.category === cat).length;
        return acc;
    }, {});

    return (
        <div className="pb-28 min-h-screen" style={{ background: '#070b14' }}>
            {/* Header */}
            <header className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-5 py-3.5 flex justify-between items-center max-w-[480px] mx-auto w-full",
                scrolled
                    ? "bg-[#070b14]/95 backdrop-blur-xl border-b border-white/5 shadow-lg"
                    : "bg-transparent"
            )}>
                <div className="flex items-center gap-3">
                    <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors border border-white/8"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <div>
                        <h1 className="font-heading font-bold text-base text-white leading-tight">{t.heritageSitesTitle}</h1>
                        <p className="text-slate-500 text-[10px] font-medium">
                            {filteredSites.length} {language === 'mn' ? 'дурсгал' : 'sites'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* List / Grid toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/8 p-0.5 gap-0.5"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {['list', 'grid'].map(m => (
                            <button key={m}
                                onClick={() => setViewMode(m)}
                                className={clsx(
                                    "w-7 h-7 flex items-center justify-center rounded-md transition-all text-xs",
                                    viewMode === m ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"
                                )}>
                                <i className={m === 'list' ? "fa-solid fa-list" : "fa-solid fa-grip"}></i>
                            </button>
                        ))}
                    </div>
                    <button onClick={toggleLanguage}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/8">
                        {language === 'mn' ? 'EN' : 'MN'}
                    </button>
                </div>
            </header>

            {/* Search + Filter sticky */}
            <div className="fixed top-[60px] left-0 right-0 z-40 max-w-[480px] mx-auto border-b border-white/5"
                style={{ background: 'rgba(7,11,20,0.97)', backdropFilter: 'blur(20px)' }}>
                <div className="px-5 pt-3 pb-2">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors border border-white/6 focus:border-amber-500/40"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar pb-3 pt-1 px-5 flex gap-2">
                    {categories.map(cat => {
                        const s = getCat(cat);
                        const isActive = filter === cat;
                        return (
                            <button key={cat} onClick={() => setFilter(cat)}
                                className={clsx(
                                    "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                                    isActive
                                        ? "bg-amber-500 text-slate-900 border-amber-500 shadow-md shadow-amber-500/20"
                                        : "text-slate-400 border-white/6 hover:border-white/15 hover:text-slate-200"
                                )}
                                style={isActive ? {} : { background: 'rgba(255,255,255,0.04)' }}>
                                {cat !== "All" && <span className={clsx("w-1.5 h-1.5 rounded-full", isActive ? "bg-slate-900" : s.dot)}></span>}
                                {cat === "All" ? (t.all || 'Бүгд') : (t[cat] || cat)}
                                <span className={clsx(
                                    "text-[9px] px-1 py-0.5 rounded-full font-bold",
                                    isActive ? "bg-black/15 text-slate-900" : "bg-white/5 text-slate-500"
                                )}>{categoryCounts[cat]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sites */}
            <main className="pt-[148px] px-5">
                <AnimatePresence mode="wait">
                    {filteredSites.length > 0 ? (
                        <motion.div
                            key={`${filter}-${search}-${viewMode}`}
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
                            className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
                        >
                            {filteredSites.map(site => {
                                const catStyle = getCat(site.category);
                                const hasVR = !!site.panoramaUrl || !!(site.panoramaTour && site.panoramaTour.length > 0);
                                const imgSrc = site.images && site.images.length > 0
                                    ? site.images[0]
                                    : (typeof getPlaceHolder === 'function' ? getPlaceHolder(site.id) : '');
                                const name = language === 'en' && site.nameEn ? site.nameEn : site.name;
                                const catLabel = t[site.category] || site.category;

                                if (viewMode === 'grid') {
                                    return (
                                        <motion.div key={site.id} variants={itemVariants}>
                                            <Link href={`/sites/${site.id}`} className="block group">
                                                <div className="rounded-2xl overflow-hidden border border-white/6 transition-all duration-300 group-hover:border-white/14"
                                                    style={{ background: 'rgba(16,24,48,0.7)' }}>
                                                    <div className="relative h-[130px] overflow-hidden">
                                                        <img src={imgSrc} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#101830] via-transparent to-transparent opacity-60"></div>
                                                        {hasVR && (
                                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-[8px] font-bold text-slate-900 flex items-center gap-0.5">
                                                                <i className="fa-solid fa-vr-cardboard text-[7px]"></i> VR
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3">
                                                        <div className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold mb-2", catStyle.bg, catStyle.text)}>
                                                            <span className={clsx("w-1 h-1 rounded-full", catStyle.dot)}></span>
                                                            {catLabel}
                                                        </div>
                                                        <h3 className="text-white font-semibold text-[13px] leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">{name}</h3>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                }

                                // List mode — horizontal card
                                return (
                                    <motion.div key={site.id} variants={itemVariants}>
                                        <Link href={`/sites/${site.id}`} className="block group">
                                            <div className="flex rounded-2xl overflow-hidden border border-white/6 transition-all duration-300 group-hover:border-white/12 group-hover:shadow-lg group-hover:shadow-black/20"
                                                style={{ background: 'rgba(16,24,48,0.6)' }}>
                                                {/* Thumb */}
                                                <div className="relative w-[108px] min-h-[96px] flex-shrink-0 overflow-hidden">
                                                    <img src={imgSrc} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    {hasVR && (
                                                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-[7px] font-bold text-slate-900 flex items-center gap-0.5">
                                                            <i className="fa-solid fa-vr-cardboard text-[6px]"></i> VR
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <div className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold mb-1.5", catStyle.bg, catStyle.text)}>
                                                            <span className={clsx("w-1 h-1 rounded-full", catStyle.dot)}></span>
                                                            {catLabel}
                                                        </div>
                                                        <h3 className="text-white font-semibold text-[14px] leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">{name}</h3>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        {site.protectionStatus && (
                                                            <div className="flex items-center gap-1 text-slate-500 text-[10px] truncate max-w-[140px]">
                                                                <i className="fa-solid fa-shield-halved text-[9px] text-amber-500/50 flex-shrink-0"></i>
                                                                <span className="truncate">{site.protectionStatus}</span>
                                                            </div>
                                                        )}
                                                        <div className="w-5 h-5 flex items-center justify-center text-slate-600 group-hover:text-amber-400 transition-colors ml-auto">
                                                            <i className="fa-solid fa-chevron-right text-[9px]"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24 text-slate-500">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/6"
                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <i className="fa-solid fa-magnifying-glass text-2xl opacity-40"></i>
                            </div>
                            <p className="text-sm font-medium text-slate-400">{t.noResults}</p>
                            {search && (
                                <button onClick={() => setSearch("")}
                                    className="mt-3 text-xs text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                    <i className="fa-solid fa-xmark text-[10px]"></i>
                                    {language === 'mn' ? 'Хайлтыг арилгах' : 'Clear search'}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <BottomNav t={t} />
        </div>
    );
}