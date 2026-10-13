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
            <div className="w-full h-[400px] bg-slate-900 rounded-2xl flex items-center justify-center text-white/50 text-[13px]">
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
            className="block w-full h-[400px] bg-slate-900 rounded-2xl"
        >
            <button
                slot="ar-button"
                className="absolute bottom-4 right-4 bg-amber-500 text-slate-900 border-none rounded-full px-[18px] py-2.5 font-semibold text-[13px] cursor-pointer"
            >
                📱 AR-аар харах
            </button>
        </model-viewer>
    );
}