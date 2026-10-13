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

const topButton =
    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/15 text-white hover:bg-black/65 transition-colors';

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
                            label: hotspotLabel(h.label, language),
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
                        <div className="mx-auto max-w-2xl rounded-2xl bg-navy/85 backdrop-blur-lg border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-2 p-2">
                                <button type="button" onClick={() => goToSite(-1)} disabled={currentIndex === 0} aria-label={t.vrPrevSite} title={t.vrPrevSite} className={clsx(topButton, 'disabled:opacity-30')}>
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="min-w-0 flex-1 text-left px-1">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[9px] font-bold uppercase tracking-wider">{category}</span>
                                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-white/80">
                                        {expanded ? t.vrLess : t.vrMore}
                                        <i className={`fa-solid fa-chevron-${expanded ? 'down' : 'up'} text-[9px]`}></i>
                                    </span>
                                </button>
                                <button type="button" onClick={() => goToSite(1)} disabled={currentIndex === sites.length - 1} aria-label={t.vrNextSite} title={t.vrNextSite} className={clsx(topButton, 'disabled:opacity-30')}>
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                            {expanded && (
                                <div className="px-4 pb-4 max-h-[38vh] overflow-y-auto">
                                    <h3 className="font-heading text-lg font-bold mb-2">{name}</h3>
                                    <p className="text-sm leading-relaxed text-slate-200">{description}</p>
                                </div>
                            )}
                        </div>
                    </section>
            </div>
        </div>
    );
}
