"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Model3DViewer — .glb 3D загвар харуулах, утасны камераар AR-аар
 * харах боломжтой (Android Scene Viewer / iOS Quick Look автоматаар
 * идэвхжинэ, тусдаа тохиргоо хэрэггүй).
 *
 * Props:
 * - src: "/models/melkhii-1.glb"
 * - alt: "Мэлхий хөшөө №1"
 * - poster: (заавал биш) урьдчилан харуулах зураг, ачаалж дуустал
 */
export default function Model3DViewer({ src, alt, poster }) {
    return (
        <>
            <Script
                type="module"
                src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
                strategy="afterInteractive"
            />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <model-viewer
                src={src}
                alt={alt}
                poster={poster}
                camera-controls
                auto-rotate
                ar
                ar-modes="webxr scene-viewer quick-look"
                shadow-intensity="1"
                style={{ width: "100%", height: "400px", backgroundColor: "#0f172a", borderRadius: "16px" }}
            >
                <button
                    slot="ar-button"
                    style={{
                        position: "absolute", bottom: "16px", right: "16px",
                        background: "#f59e0b", color: "#0f172a", border: "none",
                        borderRadius: "999px", padding: "10px 18px", fontWeight: "600",
                        fontSize: "13px", cursor: "pointer",
                    }}
                >
                    📱 AR-аар харах
                </button>
            </model-viewer>
        </>
    );
}
