'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { getPlaceHolder } from '../app/data/sites';
import { translations } from '../app/data/translations';
import { siteName as localizedSiteName, siteDescription as localizedSiteDescription, nodeName, hotspotLabel } from '../lib/i18n';
import BackgroundAudio from './BackgroundAudio';
import LanguageSwitcher from './LanguageSwitcher';

// Three.js (VR/3D) том bundle тул зөвхөн панорама хэрэгтэй үед ачаална
const PanoramaViewer = dynamic(() => import('./PanoramaViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center text-white/50">
            <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
        </div>
    ),
});

// "Дараах/Буцах" гэх ерөнхий шошгын оронд сум очих байршлын нэрийг харуулна
// ("Тэмээн чулууны амны — 2-р харагдац" → "2-р харагдац").
const GENERIC_HOTSPOT_LABELS = new Set(['Дараах', 'Буцах']);
const shortNodeName = (node, language) => (node ? nodeName(node, language).split(' — ').pop() : null);

const topButton =
    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/15 text-white hover:bg-black/65 transition-colors';

// Дурсгал хооронд шилжих товч: чиглэл + хөрш дурсгалын нэр харагдана. Төгсгөлд идэвхгүй.
function SiteNavButton({ dir, site, label, language, onClick }) {
    const next = dir > 0;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!site}
            title={site ? `${label}: ${localizedSiteName(site, language)}` : label}
            className={clsx(
                'group min-w-0 flex items-center gap-2 sm:gap-2.5 px-2 sm:px-2.5 py-2.5 transition-colors enabled:hover:bg-white/5 disabled:opacity-30',
                next ? 'flex-row-reverse text-right' : 'text-left'
            )}
        >
            <span className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center transition-colors group-enabled:group-hover:bg-amber-500 group-enabled:group-hover:text-slate-900">
                <i className={`fa-solid fa-arrow-${next ? 'right' : 'left'} text-sm`} aria-hidden="true"></i>
            </span>
            <span className="min-w-0">
                <span className="block text-[10px] font-semibold sm:uppercase sm:tracking-wider text-white/55 truncate">{label}</span>
                <span className="text-[12px] sm:text-[13px] font-semibold leading-tight line-clamp-2 break-words">{site ? localizedSiteName(site, language) : '—'}</span>
            </span>
        </button>
    );
}

export default function VirtualTour({ sites, onClose, language = 'mn', onLanguageChange, initialSiteId = null }) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        const i = initialSiteId == null ? -1 : sites.findIndex((s) => s.id === initialSiteId);
        return i >= 0 ? i : 0;
    });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [sceneIndex, setSceneIndex] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [uiHidden, setUiHidden] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [canFullscreen, setCanFullscreen] = useState(false);
    const [sheetHeight, setSheetHeight] = useState(96);
    const sheetRef = useRef(null);
    const rootRef = useRef(null);

    const t = translations[language] || translations.mn;
    const currentSite = sites[currentIndex];

    // Бүх дурсгалын панорамыг нэг flat жагсаалт болгоно; hotspot.targetIndex-ийг тухайн дурсгалын
    // локал индексээс глобал индекс рүү хөрвүүлнэ. Нэр, шошгыг сонгосон хэлээр.
    const panoramaScenes = useMemo(() => {
        const flat = [];
        sites.forEach((s) => {
            if (s.panoramaTour?.length) {
                const offset = flat.length;
                s.panoramaTour.forEach((node) => {
                    flat.push({
                        url: node.url,
                        name: nodeName(node, language),
                        description: node.description,
                        group: node.group || null,
                        siteId: s.id,
                        models3d: node.models3d || [],
                        hotspots: (node.hotspots || []).map((h) => ({
                            ...h,
                            label: GENERIC_HOTSPOT_LABELS.has(h.label)
                                ? shortNodeName(s.panoramaTour[h.targetIndex], language) || hotspotLabel(h.label, language)
                                : hotspotLabel(h.label, language),
                            targetIndex: offset + h.targetIndex,
                        })),
                    });
                });
            } else if (s.panoramaUrl) {
                flat.push({ url: s.panoramaUrl, name: localizedSiteName(s, language), siteId: s.id, hotspots: [] });
            }
        });
        return flat;
    }, [sites, language]);

    const isPanorama = Boolean(currentSite?.panoramaUrl || currentSite?.panoramaTour?.length);
    const firstSceneOfSite = panoramaScenes.findIndex((s) => s.siteId === currentSite?.id);
    const activeScene = sceneIndex != null && panoramaScenes[sceneIndex]?.siteId === currentSite?.id ? panoramaScenes[sceneIndex] : panoramaScenes[firstSceneOfSite];

    const handlePanoramaIndexChange = useCallback(
        (index) => {
            setSceneIndex(index);
            const targetSiteIndex = sites.findIndex((s) => s.id === panoramaScenes[index]?.siteId);
            if (targetSiteIndex !== -1 && targetSiteIndex !== currentIndex) {
                setCurrentIndex(targetSiteIndex);
                setCurrentImageIndex(0);
            }
        },
        [sites, panoramaScenes, currentIndex]
    );

    const goToSite = useCallback(
        (delta) => {
            const next = currentIndex + delta;
            if (next < 0 || next >= sites.length) return;
            setCurrentIndex(next);
            setCurrentImageIndex(0);
            setSceneIndex(null);
        },
        [currentIndex, sites.length]
    );

    // Бүтэн дэлгэц (iPhone Safari элементийн fullscreen дэмждэггүй тул товч нуугдана)
    useEffect(() => {
        setCanFullscreen(Boolean(document.fullscreenEnabled));
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, []);
    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else rootRef.current?.requestFullscreen?.().catch(() => {});
    };

    // Доод самбарын өндрийг хэмжиж, панорамын байршлын жагсаалтыг түүнээс дээш байрлуулна
    useEffect(() => {
        if (!sheetRef.current) return;
        const ro = new ResizeObserver(([entry]) => setSheetHeight(Math.round(entry.contentRect.height)));
        ro.observe(sheetRef.current);
        return () => ro.disconnect();
    }, [uiHidden]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea, select')) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'i' || e.key === 'I') setExpanded((v) => !v);
            // Панорама горимд ←/→-г харагч өөрөө (байршил хооронд) зохицуулна
            if (!isPanorama && e.key === 'ArrowRight') goToSite(1);
            if (!isPanorama && e.key === 'ArrowLeft') goToSite(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isPanorama, goToSite, onClose]);

    if (!currentSite) return null;

    const name = localizedSiteName(currentSite, language);
    const description = localizedSiteDescription(currentSite, language);
    const category = t[currentSite.category] || currentSite.category;
    const images = currentSite.images?.length ? currentSite.images : [getPlaceHolder(currentSite.id)];
    const currentImage = images[currentImageIndex] || images[0];
    const sceneTitle = isPanorama && activeScene && activeScene.name !== name ? activeScene.name : null;

    return (
        <div ref={rootRef} className="fixed inset-0 z-[9999] bg-black text-white select-none">
            {/* Үзэгдэл */}
            <div className="absolute inset-0">
                {isPanorama ? (
                    <PanoramaViewer
                        scenes={panoramaScenes}
                        initialIndex={firstSceneOfSite >= 0 ? firstSceneOfSite : 0}
                        onIndexChange={handlePanoramaIndexChange}
                        showControls
                        t={t}
                        uiHidden={uiHidden}
                        onToggleUi={() => setUiHidden((v) => !v)}
                        bottomInset={uiHidden ? 16 : sheetHeight + 12}
                    />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-[92%] h-[70%]">
                            <Image src={currentImage} alt={name} fill sizes="92vw" className="object-contain" />
                        </div>
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))}
                                    disabled={currentImageIndex === 0}
                                    aria-label={t.prevImage}
                                    className={clsx(topButton, 'absolute left-3 top-1/2 -translate-y-1/2 disabled:opacity-30')}
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentImageIndex((i) => Math.min(images.length - 1, i + 1))}
                                    disabled={currentImageIndex === images.length - 1}
                                    aria-label={t.nextImage}
                                    className={clsx(topButton, 'absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-30')}
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/55 text-xs">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Нуух горимд ч unmount хийхгүй — арын хөгжим тасрахгүй */}
            <div className={uiHidden ? 'hidden' : undefined}>
                    {/* Дээд мөр */}
                    <header className="absolute top-0 inset-x-0 z-50 flex items-start gap-3 px-3 pt-3 pb-8 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
                        <button type="button" onClick={onClose} aria-label={t.shortcutsExit} className={clsx(topButton, 'pointer-events-auto')}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <div className="min-w-0 flex-1 pt-0.5 pr-[176px]">
                            <h2 className="font-heading text-base font-bold leading-tight truncate drop-shadow">{name}</h2>
                            <p className="text-[11px] text-white/75 truncate drop-shadow">
                                {sceneTitle || category}
                                <span className="text-white/50"> · {currentIndex + 1}/{sites.length}</span>
                            </p>
                        </div>
                        <div className="absolute right-3 top-3 flex items-center gap-2 pointer-events-auto">
                            <BackgroundAudio className={topButton} />
                            {canFullscreen && (
                                <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? t.vrExitFullscreen : t.vrFullscreen} title={isFullscreen ? t.vrExitFullscreen : t.vrFullscreen} className={topButton}>
                                    <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                                </button>
                            )}
                            {onLanguageChange && <LanguageSwitcher language={language} onChange={onLanguageChange} className="h-10 rounded-full" />}
                        </div>
                    </header>

                    {/* Доод самбар: дурсгалын мэдээлэл + дурсгал хооронд шилжих */}
                    <section ref={sheetRef} className="absolute bottom-0 inset-x-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className="mx-auto max-w-2xl rounded-2xl bg-navy/85 backdrop-blur-lg border border-white/10 shadow-2xl overflow-hidden">
                            {expanded && (
                                <div className="px-4 pt-4 pb-3 max-h-[38vh] overflow-y-auto border-b border-white/10">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[9px] font-bold uppercase tracking-wider">{category}</span>
                                    <h3 className="font-heading text-lg font-bold mt-2 mb-2">{name}</h3>
                                    <p className="text-sm leading-relaxed text-slate-200">{description}</p>
                                </div>
                            )}
                            <nav className="grid grid-cols-[1fr_auto_1fr] items-stretch" aria-label={`${t.vrPrevSite} / ${t.vrNextSite}`}>
                                <SiteNavButton dir={-1} site={sites[currentIndex - 1]} label={t.vrPrevSite} language={language} onClick={() => goToSite(-1)} />
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    aria-expanded={expanded}
                                    aria-label={expanded ? t.vrLess : t.vrMore}
                                    title={expanded ? t.vrLess : t.vrMore}
                                    className={clsx(
                                        'flex flex-col items-center justify-center gap-1 px-3.5 sm:px-4 border-x border-white/10 transition-colors',
                                        expanded ? 'text-amber-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <i className={`fa-solid ${expanded ? 'fa-chevron-down' : 'fa-circle-info'} text-base`} aria-hidden="true"></i>
                                    <span className="hidden sm:block text-[10px] font-semibold">{expanded ? t.vrLess : t.vrMore}</span>
                                </button>
                                <SiteNavButton dir={1} site={sites[currentIndex + 1]} label={t.vrNextSite} language={language} onClick={() => goToSite(1)} />
                            </nav>
                        </div>
                    </section>
            </div>
        </div>
    );
}
