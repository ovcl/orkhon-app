"use client";

import { useState, useEffect } from "react";
import { sitesData, getPlaceHolder } from "../../data/sites";
import { translations } from "../../data/translations";
import Link from 'next/link';
import clsx from 'clsx';
import { motion } from "framer-motion";
import BottomNav from '../../../components/BottomNav';

export default function SiteDetail({ params }) {
    const [language, setLanguage] = useState('mn');
    const site = sitesData.find(s => s.id.toString() === params.id);
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

    if (!site) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-slate-400">
            <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 text-amber-500"></i>
            <p>Site not found</p>
            <Link href="/sites" className="mt-4 text-amber-500 hover:underline">Return to Sites</Link>
        </div>
    );

    const t = translations[language];
    const heroImage = site.images && site.images.length > 0 ? site.images[0] : getPlaceHolder(site.id);

    const siteName = language === 'en' && site.nameEn ? site.nameEn : site.name;
    const siteDescription = language === 'en' && site.descriptionEn ? site.descriptionEn : site.description;
    const siteCategory = t[site.category] || site.category;

    // Protection status colors
    const protectionColors = {
        'Улсын хамгаалалтад': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'Аймаг, нийслэлийн хамгаалалтад': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        'Сум, дүүргийн хамгаалалтад': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    const protectionStyle = site.protectionStatus
        ? (protectionColors[site.protectionStatus] || 'text-slate-400 bg-slate-500/10 border-slate-500/20')
        : null;

    return (
        <div className="pb-28 min-h-screen bg-[#0f172a]">
            {/* Navbar Controls */}
            <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
                <Link href="/sites" className="pointer-events-auto w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors border border-white/10">
                    <i className="fa-solid fa-arrow-left"></i>
                </Link>

                <button
                    onClick={toggleLanguage}
                    className="pointer-events-auto glass-panel px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors uppercase tracking-wider border border-white/20 bg-black/40 backdrop-blur-md"
                >
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </div>

            {/* Hero Image */}
            <div className="relative h-[400px]">
                <img
                    src={heroImage}
                    alt={siteName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/30"></div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-block px-3 py-1 rounded-lg bg-amber-500 text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg shadow-amber-500/20">
                            {siteCategory}
                        </span>
                        <h1 className="font-heading text-3xl font-bold text-white leading-tight drop-shadow-lg">{siteName}</h1>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 -mt-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-3 mb-6"
                >
                    <div className="flex-1 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg">
                        <i className="fa-regular fa-clock text-blue-400 mb-1"></i>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">{t.openStatus}</span>
                        <span className="text-xs font-bold text-slate-200">24/7</span>
                    </div>
                    {site.altitude && (
                        <div className="flex-1 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg">
                            <i className="fa-solid fa-mountain text-purple-400 mb-1"></i>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">{t.altitudeLabel}</span>
                            <span className="text-xs font-bold text-slate-200">{site.altitude}</span>
                        </div>
                    )}
                    <Link href={`/map?id=${site.id}`} className="flex-1 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-transform cursor-pointer group">
                        <i className="fa-solid fa-location-dot text-emerald-400 mb-1 group-hover:scale-110 transition-transform"></i>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">{t.viewOnMap}</span>
                        <span className="text-xs font-bold text-slate-200">Map</span>
                    </Link>
                </motion.div>

                {/* Protection status badge */}
                {site.protectionStatus && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mb-5"
                    >
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${protectionStyle}`}>
                            <i className="fa-solid fa-shield text-[10px]"></i>
                            <span>{t.protectionStatus}: {site.protectionStatus}</span>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="font-heading text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-amber-500 rounded-full block"></span>
                        {t.detailAbout}
                    </h3>
                    <div className="text-slate-300 text-sm leading-relaxed text-justify glass-panel p-5 rounded-xl border-none bg-slate-800/30">
                        {siteDescription}
                    </div>
                </motion.div>

                {/* Photo Gallery if more than 1 image */}
                {site.images && site.images.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8"
                    >
                        <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full block"></span>
                            {t.detailGallery}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {site.images.slice(1).map((img, index) => (
                                <div key={index} className="h-32 rounded-xl overflow-hidden border border-white/5 relative group">
                                    <img
                                        src={img}
                                        alt={`${siteName} Gallery ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="mt-8 mb-4">
                    <Link href="/tours">
                        <button className="btn btn-primary w-full h-14 text-base shadow-lg shadow-amber-500/20">
                            {t.startTourHere}
                            <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </Link>
                </div>
            </div>

            <BottomNav t={t} />
        </div>
    );
}
