"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { translations } from "../data/translations";
import Link from "next/link";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';

export default function MapPage() {
    const [language, setLanguage] = useState('mn');
    // Map doesn't need scroll detection for header transparency as it's full screen, 
    // but we might want a semi-transparent header over the map.

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'mn' ? 'en' : 'mn';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = translations[language];

    const Map = useMemo(() => dynamic(
        () => import("../../components/Map"),
        {
            loading: () => <div className="flex items-center justify-center h-screen bg-[#0f172a] text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i> {t.loading}</div>,
            ssr: false
        }
    ), [language]);

    return (
        <div className="flex flex-col h-screen bg-[#0f172a]">
            {/* Header - consistently styled but ensuring map visibility */}
            <header
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5">
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className="font-heading font-bold text-lg text-white">
                        {t.navMap}
                    </h1>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="glass-panel px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors uppercase tracking-wider border border-white/5"
                >
                    {language === 'mn' ? 'EN' : 'MN'}
                </button>
            </header>

            <div className="flex-1 relative pt-[73px] pb-[80px]">
                <Map language={language} />
            </div>

            <BottomNav t={t} />
        </div>
    );
}
