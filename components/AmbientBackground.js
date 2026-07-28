"use client";

import { useEffect, useRef } from "react";

/**
 * AmbientBackground — статик зураг биш, "виртуал орчинд орсон" мэдрэмж өгөх
 * амьд дэвсгэр. Давхарга бүр өөр хурдтай хулгана/gyroscope дагаж хөдөлдөг
 * (parallax), одод анивчдаг, эрдэнэ зуугийн хана дээгүүр амбер гэрэл
 * аажим амьсгалдаг (breathing glow).
 *
 * Хэрэглээ: app/layout.js-д <body> дотор хамгийн эхэнд <AmbientBackground />
 * оруулна, дараа нь globals.css-ийн статик background-image-г арилгана.
 */
export default function AmbientBackground() {
    const farRef = useRef(null);
    const midRef = useRef(null);
    const nearRef = useRef(null);
    const rafRef = useRef(null);
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handlePointerMove = (e) => {
            const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
            const ny = (e.clientY / window.innerHeight - 0.5) * 2;
            targetRef.current = { x: nx, y: ny };
        };

        const handleOrientation = (e) => {
            // Хэрэв ирээдүйд Quest/утсаар нээвэл gyroscope-оор мөн адил ажиллана
            if (e.gamma == null || e.beta == null) return;
            targetRef.current = {
                x: Math.max(-1, Math.min(1, e.gamma / 30)),
                y: Math.max(-1, Math.min(1, (e.beta - 45) / 30)),
            };
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("deviceorientation", handleOrientation);

        // Зөөлөн, "чичиргээгүй" дагах анимаци (lerp) — шууд бус, амьсгалж буй мэт хөдөлгөөн
        const animate = () => {
            const cur = currentRef.current;
            const tgt = targetRef.current;
            cur.x += (tgt.x - cur.x) * 0.04;
            cur.y += (tgt.y - cur.y) * 0.04;

            if (farRef.current) farRef.current.style.transform = `translate(${cur.x * 10}px, ${cur.y * 6}px)`;
            if (midRef.current) midRef.current.style.transform = `translate(${cur.x * 20}px, ${cur.y * 12}px)`;
            if (nearRef.current) nearRef.current.style.transform = `translate(${cur.x * 34}px, ${cur.y * 18}px)`;

            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("deviceorientation", handleOrientation);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
                overflow: "hidden",
                background: "#020617",
            }}
        >
            <svg
                viewBox="0 0 1920 1080"
                preserveAspectRatio="xMidYMax slice"
                style={{ width: "110%", height: "110%", position: "absolute", left: "-5%", top: "-5%" }}
            >
                <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#020617" />
                        <stop offset="55%" stopColor="#0b1226" />
                        <stop offset="100%" stopColor="#141d33" />
                    </linearGradient>
                    <radialGradient id="horizonGlow" cx="50%" cy="100%" r="75%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                        <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1b2740" />
                        <stop offset="100%" stopColor="#141c30" />
                    </linearGradient>
                    <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#111a2e" />
                        <stop offset="100%" stopColor="#0c1322" />
                    </linearGradient>
                    <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a0f1c" />
                        <stop offset="100%" stopColor="#060a14" />
                    </linearGradient>
                </defs>

                <rect width="1920" height="1080" fill="url(#sky)" />

                {/* Одод — тус бүр өөр хугацаанд анивчина */}
                <g fill="#e8ecf5">
                    {[
                        [120, 90, 1.4, "0s"], [260, 180, 1, "0.6s"], [410, 70, 1.6, "1.1s"],
                        [560, 150, 1, "1.8s"], [700, 60, 1.2, "0.3s"], [860, 130, 1.4, "2.2s"],
                        [1010, 80, 1, "1.4s"], [1160, 170, 1.3, "0.9s"], [1320, 55, 1, "2.6s"],
                        [1470, 140, 1.5, "0.5s"], [1620, 90, 1.1, "1.6s"], [1780, 160, 1.3, "2.0s"],
                        [1850, 70, 1, "1.2s"], [60, 220, 1, "2.4s"], [960, 200, 1.2, "0.8s"],
                    ].map(([cx, cy, r, delay], i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} className="amb-star" style={{ animationDelay: delay }} />
                    ))}
                </g>

                <rect x="0" y="500" width="1920" height="580" fill="url(#horizonGlow)" className="amb-glow" />

                <g ref={farRef}>
                    <path d="M0,620 C180,560 340,600 520,570 C700,540 860,600 1040,575 C1220,550 1380,610 1560,580 C1700,558 1820,590 1920,570 L1920,1080 L0,1080 Z" fill="url(#hillFar)" opacity="0.9" />
                </g>

                <g ref={midRef}>
                    <path d="M0,700 C160,650 300,690 460,660 C640,625 800,680 980,655 C1160,630 1320,690 1500,660 C1650,635 1800,670 1920,650 L1920,1080 L0,1080 Z" fill="url(#hillMid)" />
                    <g stroke="#3a4a6a" strokeWidth="1" opacity="0.25" fill="none">
                        <path d="M0,730 C200,700 380,725 560,700 C760,672 940,715 1140,695 C1340,672 1540,710 1920,690" />
                        <path d="M0,760 C220,735 400,755 600,732 C800,705 980,745 1180,725 C1400,700 1600,738 1920,718" />
                    </g>
                </g>

                <g ref={nearRef}>
                    <path d="M0,820 C220,780 420,810 620,790 C820,768 1000,805 1220,788 C1420,770 1620,800 1920,782 L1920,1080 L0,1080 Z" fill="url(#hillNear)" />

                    <g transform="translate(660,865)" fill="#05070d" opacity="0.9">
                        <rect x="0" y="46" width="600" height="14" />
                        <g id="stupaRow">
                            <path d="M8,46 L8,34 C8,28 12,24 16,24 C20,24 24,28 24,34 L24,46 Z" />
                            <circle cx="16" cy="21" r="4" />
                            <rect x="14" y="10" width="4" height="9" />
                        </g>
                        <use href="#stupaRow" x="48" /><use href="#stupaRow" x="96" /><use href="#stupaRow" x="144" />
                        <use href="#stupaRow" x="192" /><use href="#stupaRow" x="240" /><use href="#stupaRow" x="288" />
                        <use href="#stupaRow" x="336" /><use href="#stupaRow" x="384" /><use href="#stupaRow" x="432" />
                        <use href="#stupaRow" x="480" /><use href="#stupaRow" x="528" /><use href="#stupaRow" x="560" />
                    </g>

                    <g fill="#05070d" opacity="0.92">
                        <rect x="210" y="890" width="22" height="90" rx="3" />
                        <rect x="205" y="885" width="32" height="10" rx="2" />
                        <rect x="1660" y="880" width="22" height="100" rx="3" />
                        <rect x="1655" y="875" width="32" height="10" rx="2" />
                    </g>

                    <path d="M0,960 C260,935 500,955 760,940 C1000,925 1240,950 1500,935 C1660,925 1800,940 1920,930 L1920,1080 L0,1080 Z" fill="#05070d" />
                </g>
            </svg>

            <style jsx>{`
                .amb-star {
                    animation: amb-twinkle 3.4s ease-in-out infinite;
                }
                @keyframes amb-twinkle {
                    0%, 100% { opacity: 0.25; }
                    50% { opacity: 0.9; }
                }
                .amb-glow {
                    animation: amb-breathe 6s ease-in-out infinite;
                    transform-origin: center;
                }
                @keyframes amb-breathe {
                    0%, 100% { opacity: 0.85; }
                    50% { opacity: 1.15; }
                }
                svg g[ref] {
                    transition: transform 0.05s linear;
                }
            `}</style>
        </div>
    );
}
