'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './VirtualTour.module.css';
import { getPlaceHolder } from '../app/data/sites';
import { translations } from '../app/data/translations';
import BackgroundAudio from './BackgroundAudio';
import PanoramaViewer from './PanoramaViewer';

export default function VirtualTour({ sites, onClose, language = 'mn', onToggleLanguage }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const touchStartX = useRef(null);

    const t = translations[language];
    const currentSite = sites[currentIndex];
    const progress = ((currentIndex + 1) / sites.length) * 100;

    const siteName = language === 'en' && currentSite?.nameEn ? currentSite.nameEn : currentSite?.name;
    const siteDescription = language === 'en' && currentSite?.descriptionEn ? currentSite.descriptionEn : currentSite?.description;
    const siteCategory = t[currentSite?.category] || currentSite?.category;

    // panoramaUrl-тэй БҮХ дурсгалыг нэг "scenes" жагсаалт болгож PanoramaViewer рүү дамжуулна.
    // Ингэснээр VR session-с гарахгүйгээр headset дотроос шууд дараагийн панорама руу шилжих боломжтой болно.
    const panoramaScenes = useMemo(
        () => sites
            .filter((s) => s.panoramaUrl)
            .map((s) => ({
                url: s.panoramaUrl,
                name: language === 'en' && s.nameEn ? s.nameEn : s.name,
                description: language === 'en' && s.descriptionEn ? s.descriptionEn : s.description,
                siteId: s.id,
            })),
        [sites, language]
    );

    const currentPanoramaIndex = panoramaScenes.findIndex((s) => s.siteId === currentSite?.id);

    // PanoramaViewer дотор VR controller-оор "Дараах/Өмнөх" дарахад,
    // 2D info overlay-г мөн синхрон шинэчлэхийн тулд site index рүү буцаан хөрвүүлнэ
    const handlePanoramaIndexChange = (newPanoramaIndex) => {
        const targetSiteId = panoramaScenes[newPanoramaIndex]?.siteId;
        const targetSiteIndex = sites.findIndex((s) => s.id === targetSiteId);
        if (targetSiteIndex !== -1) {
            setCurrentIndex(targetSiteIndex);
            setCurrentImageIndex(0);
        }
    };

    const goToNext = () => {
        if (currentIndex < sites.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentImageIndex(0);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setCurrentImageIndex(0);
        }
    };

    const nextImage = () => {
        if (currentSite.images && currentImageIndex < currentSite.images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const previousImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'Escape') onClose();
            if (e.key === 'i' || e.key === 'I') setIsInfoVisible(!isInfoVisible);
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, isInfoVisible]);

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const deltaX = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) goToNext(); else goToPrevious();
        }
        touchStartX.current = null;
    };

    if (!currentSite) return null;

    const currentImage = currentSite.images && currentSite.images.length > 0
        ? currentSite.images[currentImageIndex]
        : getPlaceHolder(currentSite.id);

    return (
        <div className={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <BackgroundAudio />
            <button className={styles.closeBtn} onClick={onClose} aria-label={t.shortcutsExit}>
                <i className="fa-solid fa-xmark"></i>
            </button>

            <button className={styles.langBtn} onClick={onToggleLanguage} aria-label="Toggle language">
                {language === 'mn' ? 'EN' : 'MN'}
            </button>

            <div className={styles.progressBar}>
                <div className={styles.progress} style={{ width: `${progress}%` }}></div>
            </div>

            <div className={styles.imageContainer}>
                {currentSite.panoramaUrl ? (
                    <div className={styles.panoramaWrapper}>
                        <PanoramaViewer
                            scenes={panoramaScenes}
                            initialIndex={currentPanoramaIndex >= 0 ? currentPanoramaIndex : 0}
                            onIndexChange={handlePanoramaIndexChange}
                        />
                    </div>
                ) : (
                    <img src={currentImage} alt={siteName} className={styles.mainImage} />
                )}

                {!currentSite.panoramaUrl && currentSite.images && currentSite.images.length > 1 && (
                    <>
                        <button
                            className={`${styles.imageNav} ${styles.imagePrev}`}
                            onClick={previousImage}
                            disabled={currentImageIndex === 0}
                            aria-label={language === 'mn' ? "Өмнөх зураг" : "Previous image"}
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <button
                            className={`${styles.imageNav} ${styles.imageNext}`}
                            onClick={nextImage}
                            disabled={currentImageIndex === currentSite.images.length - 1}
                            aria-label={language === 'mn' ? "Дараах зураг" : "Next image"}
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                        <div className={styles.imageIndicator}>
                            {currentImageIndex + 1} / {currentSite.images.length}
                        </div>
                    </>
                )}
            </div>

            {isInfoVisible && (
                <div className={styles.infoOverlay}>
                    <div className={styles.siteInfo}>
                        <span className={styles.category}>{siteCategory}</span>
                        <h2 className={styles.siteName}>{siteName}</h2>
                        <p className={styles.description}>{siteDescription}</p>
                        <div className={styles.counter}>{currentIndex + 1} / {sites.length}</div>
                    </div>
                </div>
            )}

            <button
                className={styles.infoToggle}
                onClick={() => setIsInfoVisible(!isInfoVisible)}
                aria-label={isInfoVisible ? t.hideInfo : t.showInfo}
            >
                <i className={`fa-solid fa-${isInfoVisible ? 'eye-slash' : 'eye'}`}></i>
            </button>

            <div className={styles.navigation}>
                <button className={styles.navBtn} onClick={goToPrevious} disabled={currentIndex === 0} aria-label={t.tourPrevious}>
                    <i className="fa-solid fa-chevron-left"></i>
                    <span>{t.tourPrevious}</span>
                </button>
                <button className={styles.navBtn} onClick={goToNext} disabled={currentIndex === sites.length - 1} aria-label={t.tourNext}>
                    <span>{t.tourNext}</span>
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            <div className={styles.shortcuts}>
                <span>← → {t.shortcutsNav}</span>
                <span>I {t.shortcutsInfo}</span>
                <span>ESC {t.shortcutsExit}</span>
            </div>
        </div>
    );
}
