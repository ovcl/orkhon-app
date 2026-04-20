"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { sitesData, getPlaceHolder } from "../data/sites";
import { translations } from "../data/translations";
import { motion, AnimatePresence } from "framer-motion";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function SitesPage() {
    const [language, setLanguage] = useState('mn');
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
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

    // Count per category
    const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = cat === "All"
            ? sitesData.length
            : sitesData.filter(s => s.category === cat).length;
        return acc;
    }, {});

    return (
        <div className="pb-28 min-h-screen bg-[#0f172a]">
            {/* Header */}
            <header
                className={clsx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full",
                    scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-sm" : "bg-gradient-to-b from-[#0f172a] to-transparent"
                )}
            >
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5">
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className="font-heading font-bold text-lg text-white">
                        {t.heritageSitesTitle}
                    </h1>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="glass-panel px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors uppercase tracking-wider border border-white/5"
                >
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </header>

            {/* Search + Category Filter — fixed below header */}
            <div className="fixed top-[72px] left-0 right-0 z-40 max-w-[480px] mx-auto bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5">
                {/* Search input */}
                <div className="px-6 pt-3 pb-2">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Category pills */}
                <div className="overflow-x-auto no-scrollbar py-2 px-6 flex gap-2 w-full">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={clsx(
                                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border flex items-center gap-1.5",
                                filter === cat
                                    ? "bg-amber-500 text-slate-900 border-amber-500 shadow-lg shadow-amber-500/20"
                                    : "bg-slate-800/50 text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200"
                            )}
                        >
                            {cat === "All" ? t.all : (t[cat] || cat)}
                            <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                filter === cat ? "bg-slate-900/20 text-slate-900" : "bg-white/5 text-slate-500"
                            )}>
                                {categoryCounts[cat]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sites Grid */}
            <main className="pt-44 px-6">
                <motion.div
                    className="grid gap-5"
                    variants={containerVariants}
                    initial="visible"
                    animate="visible"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredSites.map(site => (
                            <motion.div
                                key={site.id}
                                variants={itemVariants}
                                layout
                            >
                                <Link href={`/sites/${site.id}`} className="block group">
                                    <div className="card-simple overflow-hidden border-0 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={site.images && site.images.length > 0 ? site.images[0] : getPlaceHolder(site.id)}
                                                alt={site.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10 shadow-lg">
                                                    {t[site.category] || site.category}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                                        </div>

                                        <div className="p-4 relative">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-heading text-lg font-bold text-white mb-1 leading-tight group-hover:text-amber-400 transition-colors">
                                                        {language === 'en' && site.nameEn ? site.nameEn : site.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                        <i className="fa-solid fa-location-dot text-amber-500/80"></i>
                                                        <span className="truncate max-w-[200px]">{t.viewOnMap}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
                                                    <i className="fa-solid fa-arrow-right text-xs -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredSites.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <i className="fa-solid fa-magnifying-glass text-4xl mb-4 opacity-50"></i>
                        <p>{t.noResults}</p>
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="mt-3 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                            >
                                {language === 'mn' ? 'Хайлтыг арилгах' : 'Clear search'}
                            </button>
                        )}
                    </div>
                )}
            </main>

            <BottomNav t={t} />
        </div>
    );
}
