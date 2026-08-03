"use client";

import { useEffect, useState } from "react";

/**
 * Model3DViewer — .glb 3D загвар харуулах, утасны камераар AR-аар
 * харах боломжтой (Android Scene Viewer / iOS Quick Look автоматаар
 * идэвхжинэ, тусдаа тохиргоо хэрэггүй).
 *
 * ЧУХАЛ: @google/model-viewer-г ГАДААД CDN-с БИШ, локал npm package-аас
 * dynamic import хийнэ — офлайн-киоск горимд интернэт шаардахгүй байхын тулд
 * (package.json-д @google/model-viewer аль хэдийн суулгагдсан байгаа).
 *
 * Props:
 * - src: "/models/melkhii-1.glb"
 * - alt: "Мэлхий хөшөө №1"
 * - poster: (заавал биш) урьдчилан харуулах зураг, ачаалж дуустал
 */
export default function Model3DViewer({ src, alt, poster }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Dynamic import — SSR-ийн үед custom element бүртгэгдэхийг оролдохгүй,
        // зөвхөн client дээр, browser бэлэн болмогц нэг удаа ачаална
        import("@google/model-viewer")
            .then(() => setReady(true))
            .catch((err) => console.error("model-viewer ачаалахад алдаа гарлаа:", err));
    }, []);

    if (!ready) {
        return (
            <div style={{ width: "100%", height: "400px", backgroundColor: "#0f172a", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                3D загвар бэлдэж байна...
            </div>
        );
    }

    return (
        // eslint-disable-next-line react/no-unknown-property
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
    );
}