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
    const [activeImg, setActiveImg] = useState(0);
    const site = sitesData.find(s => s.id.toString() === params.id);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
    }, []);

    // Auto-slide images
    useEffect(() => {
        if (!site || !site.images || site.images.length <= 1) return;
        const autoSlide = setInterval(() => {
            setActiveImg((prev) => (prev + 1) % site.images.length);
        }, 4000);
        return () => clearInterval(autoSlide);
    }, [site]);

    const toggleLanguage = () => {
        const newLang = language === 'mn' ? 'en' : 'mn';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    if (!site) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-slate-400" style={{ background: '#070b14' }}>
            <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 text-amber-500"></i>
            <p className="mb-4">Дурсгалт газар олдсонгүй</p>
            <Link href="/sites" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold">
                Буцах
            </Link>
        </div>
    );

    const t = translations[language];
    const images = site.images && site.images.length > 0 ? site.images : [getPlaceHolder(site.id)];
    const heroImage = images[activeImg];
    const siteName = language === 'en' && site.nameEn ? site.nameEn : site.name;
    const siteDescription = language === 'en' && site.descriptionEn ? site.descriptionEn : site.description;
    const catLabel = t[site.category] || site.category;

    const protectionColors = {
        'Улсын хамгаалалтад': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'Аймаг, нийслэлийн хамгаалалтад': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        'Сум, дүүргийн хамгаалалтад': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    const protStyle = site.protectionStatus
        ? (protectionColors[site.protectionStatus] || 'text-slate-400 bg-slate-500/10 border-slate-500/20')
        : null;

    return (
        <div className="pb-28 min-h-screen" style={{ background: '#070b14' }}>
            {/* Top controls */}
            <div className="fixed top-0 left-0 right-0 z-50 p-5 flex justify-between items-start pointer-events-none max-w-[480px] mx-auto w-full">
                <Link href="/sites"
                    className="pointer-events-auto w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors border border-white/15"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                    <i className="fa-solid fa-arrow-left text-sm"></i>
                </Link>
                <div className="flex items-center gap-2 pointer-events-auto">
                    {(site.panoramaUrl || (site.panoramaTour && site.panoramaTour.length > 0)) && (
                        <Link href="/tours"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-400 border border-amber-500/30 transition-colors"
                            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                            <i className="fa-solid fa-vr-cardboard text-[11px]"></i>
                            VR
                        </Link>
                    )}
                    <button onClick={toggleLanguage}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest border border-white/15 transition-colors"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                        {language === 'mn' ? 'EN' : 'MN'}
                    </button>
                </div>
            </div>

            {/* Hero image with thumbnail strip */}
            <div className="relative h-[420px]">
                <img src={heroImage} alt={siteName} className="w-full h-full object-cover transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/30 to-transparent"></div>

                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute top-16 right-5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/15"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                        {activeImg + 1} / {images.length}
                    </div>
                )}

                {/* Bottom Overlay - Thumbnail strip & Title */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent flex flex-col justify-end">
                    
                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className="flex gap-2 w-full overflow-x-auto no-scrollbar mb-4 mask-fade-right">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setActiveImg(i)}
                                    className={clsx(
                                        "flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 transition-all duration-200",
                                        activeImg === i ? "border-amber-400 scale-105" : "border-white/20 opacity-60 hover:opacity-90"
                                    )}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-block px-3 py-1 rounded-lg bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider mb-2.5 shadow-lg shadow-amber-500/20">
                            {catLabel}
                        </span>
                        <h1 className="font-heading text-2xl md:text-[1.7rem] font-bold text-white leading-tight drop-shadow-lg">{siteName}</h1>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 -mt-2 relative z-10">
                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex gap-3 mb-5">
                    <div className="flex-1 p-3 rounded-2xl border border-white/6 flex flex-col items-center justify-center text-center"
                        style={{ background: 'rgba(16,24,48,0.7)' }}>
                        <i className="fa-regular fa-clock text-blue-400 mb-1 text-sm"></i>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">{t.openStatus || 'Нээлтэй'}</span>
                        <span className="text-xs font-bold text-slate-200">24/7</span>
                    </div>
                    {site.altitude && (
                        <div className="flex-1 p-3 rounded-2xl border border-white/6 flex flex-col items-center justify-center text-center"
                            style={{ background: 'rgba(16,24,48,0.7)' }}>
                            <i className="fa-solid fa-mountain text-purple-400 mb-1 text-sm"></i>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">{t.altitudeLabel || 'Өндөр'}</span>
                            <span className="text-xs font-bold text-slate-200">{site.altitude}</span>
                        </div>
                    )}
                    <Link href={`/map?id=${site.id}`}
                        className="flex-1 p-3 rounded-2xl border border-white/6 flex flex-col items-center justify-center text-center transition-all active:scale-95 group"
                        style={{ background: 'rgba(16,24,48,0.7)' }}>
                        <i className="fa-solid fa-location-dot text-emerald-400 mb-1 text-sm group-hover:scale-110 transition-transform"></i>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">{t.viewOnMap}</span>
                        <span className="text-xs font-bold text-slate-200">Map</span>
                    </Link>
                </motion.div>

                {/* Protection badge */}
                {site.protectionStatus && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${protStyle}`}>
                            <i className="fa-solid fa-shield text-[10px]"></i>
                            <span>{t.protectionStatus}: {site.protectionStatus}</span>
                        </div>
                    </motion.div>
                )}

                {/* Description */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <h3 className="font-heading text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-amber-500 rounded-full block"></span>
                        {t.detailAbout}
                    </h3>
                    <div className="text-slate-300 text-sm leading-relaxed text-justify p-4 rounded-2xl border border-white/5"
                        style={{ background: 'rgba(16,24,48,0.5)' }}>
                        {siteDescription}
                    </div>
                </motion.div>

                {/* Gallery grid — show all images as tappable grid */}
                {images.length > 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7">
                        <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full block"></span>
                            {t.detailGallery}
                            <span className="text-xs font-normal text-slate-500 ml-1">({images.length})</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => { setActiveImg(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className={clsx(
                                        "relative rounded-xl overflow-hidden border-2 transition-all duration-200",
                                        i === 0 ? "col-span-2 row-span-2 h-48" : "h-[90px]",
                                        activeImg === i ? "border-amber-400" : "border-transparent opacity-80 hover:opacity-100"
                                    )}>
                                    <img src={img} alt={`${siteName} ${i + 1}`} className="w-full h-full object-cover" />
                                    {activeImg === i && (
                                        <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                            <i className="fa-solid fa-check text-amber-400 text-sm drop-shadow"></i>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* CTA */}
                <div className="mt-8 mb-4">
                    <Link href="/tours">
                        <button className="btn btn-primary w-full h-14 text-base shadow-lg shadow-amber-500/20">
                            {t.startTourHere || 'Аялал эхлэх'}
                            <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </Link>
                </div>
            </div>

            <BottomNav t={t} />
        </div>
    );
}
