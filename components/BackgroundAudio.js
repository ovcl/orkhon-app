'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundAudio({ className = '' }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Хэрэглэгч өөрөө хаасан эсэх
    const interactionDone = useRef(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.08; // Зөөлөн намуухан байгальд ууссан байдлаар дуугарах

        const tryPlay = () => {
            if (!interactionDone.current && !isMuted) {
                audio.play().then(() => {
                    setIsPlaying(true);
                    interactionDone.current = true; // Зөвхөн анхны interaction дээр л автоматаар тоглуулна
                    document.removeEventListener('pointerdown', tryPlay);
                    document.removeEventListener('keydown', tryPlay);
                }).catch((err) => {
                    // Browser autoplay хориглосон, хэрэглэгч дарахыг хүлээнэ
                });
            }
        };

        tryPlay(); // Шууд тоглуулахыг оролдох (VR 360 руу орох үед аль хэдийнэ товч дарагдсан байдаг тул шууд дуугарах магадлалтай)

        // Хэрэв шууд дуугарахгүй бол дараагийн үйлдэл дээр дуугаргах
        document.addEventListener('pointerdown', tryPlay);
        document.addEventListener('keydown', tryPlay);

        return () => {
            document.removeEventListener('pointerdown', tryPlay);
            document.removeEventListener('keydown', tryPlay);
        };
    }, [isMuted]);

    const toggleAudio = (e) => {
        // Event bubbling-г зогсоох (өөр товчны click давхар ажиллах вий)
        e.preventDefault();
        e.stopPropagation();

        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            setIsMuted(true);
        } else {
            audio.play().then(() => {
                setIsPlaying(true);
                setIsMuted(false);
            });
        }
        interactionDone.current = true;
    };

    return (
        <>
            <audio ref={audioRef} src="/sounds/orkhon-valley.mp3" loop preload="auto" />
            <button
                onClick={toggleAudio}
                className={`${className} ${isPlaying ? 'text-amber-400' : 'text-white/70'}`}
                aria-label="Toggle Background Music"
                aria-pressed={isPlaying}
            >
                <i className={`fa-solid ${isPlaying ? 'fa-music' : 'fa-volume-xmark'} text-[14px]`}></i>
            </button>
        </>
    );
}