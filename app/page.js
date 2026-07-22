'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { motion } from "framer-motion";
import { translations } from './data/translations';
import { sitesData } from './data/sites';
import clsx from 'clsx';
import BottomNav from '../components/BottomNav';
import OfflineIndicator from '../components/OfflineIndicator';

const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export default function Home() {
    const [language, setLanguage] = useState('mn');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const t = translations[language];
    const toggleLanguage = () => {
        const newLang = language === 'mn' ? 'en' : 'mn';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const vrSitesCount = sitesData.filter(s => s.panoramaUrl || (s.panoramaTour && s.panoramaTour.length > 0)).length;

    const popularSites = [
        { img: "https://res.cloudinary.com/dsyqxmmxi/image/upload/f_auto,q_auto,w_400/v1775462133/images/16.jpg", title: t.kharakhorum, type: language === 'mn' ? 'Эртний хот' : 'Ancient City', id: 16 },
        { img: "https://res.cloudinary.com/dsyqxmmxi/image/upload/f_auto,q_auto,w_400/v1775462133/images/24.jpg", title: t.erdeneZuu, type: language === 'mn' ? 'Сүм хийд' : 'Monastery', id: 24 },
        { img: "https://res.cloudinary.com/dsyqxmmxi/image/upload/f_auto,q_auto,w_400/v1775462133/images/31.jpg", title: t.ulaanTsutgalan, type: language === 'mn' ? 'Байгаль' : 'Nature', id: 31 },
    ];

    const navCards = [
        { href: "/sites", icon: "fa-solid fa-landmark", title: t.navSites, desc: language === 'mn' ? `${sitesData.length} дурсгал` : `${sitesData.length} sites`, gradient: "from-blue-500/20 via-indigo-500/10 to-transparent", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", accentColor: "bg-blue-500" },
        { href: "/map", icon: "fa-solid fa-map-location-dot", title: t.navMap, desc: language === 'mn' ? 'Интерактив' : 'Interactive', gradient: "from-emerald-500/20 via-teal-500/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", accentColor: "bg-emerald-500" },
        { href: "/tours", icon: "fa-solid fa-vr-cardboard", title: t.navTours, desc: `${vrSitesCount} VR`, gradient: "from-orange-500/20 via-amber-500/10 to-transparent", iconBg: "bg-orange-500/15", iconColor: "text-orange-400", accentColor: "bg-orange-500" },
        { href: "/info", icon: "fa-solid fa-circle-info", title: t.navInfo, desc: language === 'mn' ? 'Мэдээлэл' : 'Details', gradient: "from-purple-500/20 via-pink-500/10 to-transparent", iconBg: "bg-purple-500/15", iconColor: "text-purple-400", accentColor: "bg-purple-500" }
    ];

    return (
        <div className="pb-28">
            <OfflineIndicator />

            {/* Header */}
            <header className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-5 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full",
                scrolled
                    ? "bg-[#070b14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
                    : "bg-transparent"
            )}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg bg-white">
                        <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" />
                    </div>
                    <h1 className={clsx(
                        "font-heading font-bold text-lg tracking-wide text-white transition-all duration-500",
                        scrolled ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    )}>
                        {t.appName}
                    </h1>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/10"
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </header>

            <main>
                {/* Hero */}
                <div className="relative h-[62vh] flex items-end p-6 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img src="/hero.jpg" className="w-full h-full object-cover scale-105" alt="Orkhon Valley" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/30 to-transparent"></div>
                        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-amber-500/8 rounded-full blur-[100px] animate-pulse"></div>
                        <div className="absolute top-1/3 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px]"></div>
                    </div>

                    {/* FIX: initial="hidden" — анимейшн зөв ажиллана */}
                    <motion.div
                        className="relative z-10 w-full mb-8"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeIn} className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20"
                                style={{
                                    background: 'rgba(245, 158, 11, 0.06)',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 0 24px rgba(245, 158, 11, 0.08)',
                                }}>
                                <i className="fa-solid fa-crown text-[10px] text-amber-400"></i>
                                <span className="text-amber-300 text-[10px] font-bold uppercase tracking-[0.15em]">{t.heroBadge}</span>
                            </span>
                        </motion.div>

                        <motion.h2 variants={fadeIn} className="font-heading text-[2.6rem] font-bold text-white leading-[1.05] mb-3 drop-shadow-2xl">
                            {t.heroTitle}
                        </motion.h2>

                        <motion.p variants={fadeIn} className="text-slate-300/80 text-sm max-w-[85%] leading-relaxed font-light">
                            {t.heroSubtitle}
                        </motion.p>
                    </motion.div>
                </div>

                {/* Nav Grid */}
                <motion.div
                    className="grid grid-cols-2 gap-3 px-5 -mt-8 relative z-20"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    {navCards.map((item, idx) => (
                        <Link href={item.href} key={idx} className="block group">
                            <motion.div
                                variants={scaleIn}
                                whileTap={{ scale: 0.97 }}
                                className={`p-4 h-[96px] flex flex-col items-start justify-between rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/6 transition-all duration-300 group-hover:border-white/12 group-hover:shadow-lg relative overflow-hidden`}
                                style={{ backdropFilter: 'blur(10px)' }}
                            >
                                <div className={`absolute -top-6 -right-6 w-16 h-16 ${item.accentColor} rounded-full opacity-[0.06] blur-xl`}></div>
                                <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                                    <i className={`${item.icon} text-base`}></i>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <span className="text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors block leading-tight">{item.title}</span>
                                        <span className="text-[10px] text-slate-500 font-medium">{item.desc}</span>
                                    </div>
                                    <i className="fa-solid fa-arrow-right text-[9px] text-white/0 group-hover:text-white/50 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"></i>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>

                {/* Popular Sites */}
                <div className="mt-10 px-5">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
                            <span className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full block"></span>
                            {t.popularTitle}
                        </h3>
                        <Link href="/sites" className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors">
                            {t.seeAll}
                            <i className="fa-solid fa-chevron-right text-[9px]"></i>
                        </Link>
                    </div>

                    <div className="flex gap-3.5 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar -mx-5 px-5">
                        {popularSites.map((item, idx) => (
                            <Link key={idx} href={item.id ? `/sites/${item.id}` : '/sites'} className="block min-w-[170px]">
                                <motion.div
                                    className="h-[235px] rounded-2xl overflow-hidden relative snap-start group cursor-pointer"
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                                    }}
                                >
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent p-4 flex flex-col justify-end">
                                        <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-[0.15em] mb-1">{item.type}</span>
                                        <span className="text-white font-heading font-semibold text-[17px] leading-tight">{item.title}</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Map Preview */}
                <div className="px-5 mt-1 mb-8">
                    <Link href="/map" className="block group">
                        <div className="relative rounded-2xl overflow-hidden h-28 border border-white/6 transition-all duration-300 group-hover:border-white/12 group-hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, rgba(10,15,30,0.95), rgba(25,35,55,0.8))' }}>
                            <div className="absolute inset-0 opacity-15 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px]"></div>
                            <div className="absolute inset-0 z-10 flex items-center justify-between px-6">
                                <div>
                                    <h4 className="text-white font-bold text-base mb-0.5">{t.navMap}</h4>
                                    <p className="text-slate-400 text-xs max-w-[160px] leading-snug">{t.mapDescription}</p>
                                </div>
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                                    <i className="fa-solid fa-location-arrow text-sm"></i>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>

            <BottomNav t={t} />
        </div>
    );
}
