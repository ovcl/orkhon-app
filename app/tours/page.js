"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { sitesData } from "../data/sites";
import { buildTourSites, tourSiteId } from "../../lib/tour-sites";
import { DonateButton, DonateDialog } from "../../components/Donate";
import VirtualTour from "../../components/VirtualTour";
import UnityPlayer from "../../components/UnityPlayer";
import { translations } from "../data/translations";
import { motion } from "framer-motion";
import clsx from 'clsx';
import BottomNav from '../../components/BottomNav';
import { useLanguage } from '../../lib/useLanguage';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// Unity build (public/unity-build/) байхгүй үед AR товчийг нууна. Build нэмсний дараа true болго.
const UNITY_ENABLED = false;

export default function ToursPage() {
    const [language, setLanguage] = useLanguage();
    const [isTourActive, setIsTourActive] = useState(false);
    const [useUnityMode, setUseUnityMode] = useState(false);
    const [unityReady, setUnityReady] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [initialSiteId, setInitialSiteId] = useState(null);

    useEffect(() => {

        // /tours?site=ID — дурсгалын хуудаснаас шууд тухайн дурсгалын VR аялал руу
        const siteParam = Number(new URLSearchParams(window.location.search).get('site'));
        if (siteParam && sitesData.some((s) => s.id === siteParam)) {
            setInitialSiteId(tourSiteId(siteParam));
            setIsTourActive(true);
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const t = translations[language];

    const startTour = (unityMode = false) => {
        setUseUnityMode(unityMode);
        setIsTourActive(true);
    };

    // "VR 360 Аялал" дарахад эхлээд хандивын цонх гарна; "Аялал эхлүүлэх" эсвэл хаахад аялал эхэлнэ
    const [donateGate, setDonateGate] = useState(false);
    const startVrTour = () => setDonateGate(true);
    const closeDonateGate = () => {
        setDonateGate(false);
        startTour(false);
    };

    // Панорамтай дурсгалууд; дөрвөн чулуун яст мэлхий зэргийг нэг дурсгал болгон нэгтгэнэ
    const vrSites = buildTourSites(sitesData);
    // Давхардалгүй панорамын тоо (нэгтгэсэн дурсгал өөр дурсгалын зургийг давтан ашигладаг)
    const vrViewCount = new Set(vrSites.flatMap((s) => (s.panoramaTour || []).map((n) => n.url).concat(s.panoramaUrl || []))).size;

    const closeTour = () => {
        setIsTourActive(false);
        setInitialSiteId(null);
        if (window.location.search) window.history.replaceState(null, '', '/tours');
        setUnityReady(false);
    };

    const handleUnityReady = ({ sendMessage }) => {
        setUnityReady(true);
        // Unity WebGL ачаалагдаж дууслаа
    };

    return (
        <div className="pb-28 min-h-screen bg-[#0f172a]">
            {/* Header */}
            <header
                className={clsx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex justify-between items-center max-w-[480px] mx-auto w-full",
                    scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-sm" : "bg-transparent"
                )}
            >
                <div className="flex items-center gap-4">
                    <Link href="/" aria-label={t.back} title={t.back} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5">
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className={clsx("font-heading font-bold text-lg text-white transition-all", scrolled ? "opacity-100" : "opacity-0")}>
                        {t.tourTitle}
                    </h1>
                </div>
                <LanguageSwitcher language={language} onChange={setLanguage} className="rounded-lg text-slate-200 border-white/5" />
            </header>

            <main className="pt-0">
                {/* Hero section */}
                <div className="relative h-[50vh] flex flex-col justify-end p-6 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/10 z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent z-10"></div>
                        <img
                            src="/hero.jpg"
                            className="w-full h-full object-cover opacity-60"
                            alt="Tour Hero"
                        />
                    </div>

                    <div className="relative z-20 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 animate-float">
                            <i className="fa-solid fa-vr-cardboard text-2xl text-white"></i>
                        </div>
                        <h2 className="font-heading text-3xl font-bold text-white mb-2">{t.tourHeroTitle}</h2>
                        <p className="text-slate-300 text-sm">{vrSites.length} {t.tourHeroSubtitle}</p>
                    </div>

                    {/* Tour Mode Selection */}
                    <div className="grid grid-cols-1 gap-3 relative z-20">
                        <button
                            className="btn btn-primary w-full shadow-lg shadow-amber-500/20"
                            onClick={startVrTour}
                        >
                            <i className="fa-solid fa-vr-cardboard"></i>
                            {t.vr360Tour}
                        </button>

                        <DonateButton t={t} className="btn btn-secondary w-full border-rose-500/25 text-rose-200 hover:bg-rose-500/10" />
                        {donateGate && <DonateDialog t={t} onClose={closeDonateGate} actionLabel={t.donateStartTour} onAction={closeDonateGate} />}

                        {UNITY_ENABLED && (
                            <button
                                className="btn btn-secondary w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                                onClick={() => startTour(true)}
                            >
                                <i className="fa-solid fa-cube"></i>
                                {language === 'mn' ? 'AR Аялал (Unity)' : 'AR Tour (Unity)'}
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">BETA</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Info section */}
                <div className="px-6 py-8">
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="card-simple p-3 flex flex-col items-center justify-center text-center h-24 bg-slate-800/50">
                            <i className="fa-solid fa-location-dot text-amber-500 mb-2"></i>
                            <h3 className="text-white font-bold text-lg leading-none mb-1">{vrSites.length}</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.tourStatSites}</p>
                        </div>
                        <div className="card-simple p-3 flex flex-col items-center justify-center text-center h-24 bg-slate-800/50">
                            <i className="fa-solid fa-street-view text-blue-500 mb-2"></i>
                            <h3 className="text-white font-bold text-lg leading-none mb-1">{vrViewCount}</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.tourStatViews}</p>
                        </div>
                        <div className="card-simple p-3 flex flex-col items-center justify-center text-center h-24 bg-slate-800/50">
                            <i className="fa-solid fa-images text-emerald-500 mb-2"></i>
                            <h3 className="text-white font-bold text-lg leading-none mb-1">8K</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.tourStatResolution}</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-amber-500 rounded-full block"></span>
                            {t.tourFeaturesTitle}
                        </h3>
                        <div className="card-simple p-5 space-y-3 bg-slate-800/30">
                            {[
                                { icon: "fa-solid fa-vr-cardboard", text: t.tourFeatureVr },
                                { icon: "fa-solid fa-list-ul", text: t.tourFeatureList },
                                { icon: "fa-solid fa-magnifying-glass-plus", text: t.tourFeatureZoom },
                                { icon: "fa-solid fa-circle-info", text: t.tourFeatureDetail },
                                { icon: "fa-solid fa-cloud-arrow-down", text: t.tourFeatureOffline },
                                { icon: "fa-solid fa-keyboard", text: t.tourFeatureShortcuts }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-amber-500/80 text-xs">
                                        <i className={feature.icon}></i>
                                    </div>
                                    <span>{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Tour Modals */}
            {isTourActive && !useUnityMode && (
                <VirtualTour
                    sites={vrSites}
                    onClose={closeTour}
                    language={language}
                    onLanguageChange={setLanguage}
                    initialSiteId={initialSiteId}
                />
            )}

            {isTourActive && useUnityMode && (
                <div className="fixed inset-0 z-[100] bg-black">
                    <button
                        className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        onClick={closeTour}
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <UnityPlayer
                        onReady={handleUnityReady}
                        onError={(error) => {
                            console.error('Unity error:', error);
                            alert('Unity failed to load. Please try the Classic Tour instead.');
                            closeTour();
                        }}
                    />
                </div>
            )}

            <BottomNav t={t} />
        </div>
    );
}
