"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BottomNav from "../../components/BottomNav";

// Map component нь browser-д л ажилладаг (WebGL) тул SSR-г унтраана
const MapView = dynamic(() => import("../../components/Map"), { ssr: false });

function MapContent() {
    const searchParams = useSearchParams();
    const lang = searchParams.get("lang") || "mn";

    return (
        <div className="relative w-full" style={{ height: "100dvh" }}>
            <MapView language={lang} />
            <BottomNav />
        </div>
    );
}

export default function MapPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#070b14]">
                <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"></div>
            </div>
        }>
            <MapContent />
        </Suspense>
    );
}