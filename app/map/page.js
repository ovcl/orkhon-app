"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { sitesData } from "../data/sites";
import { translations } from "../data/translations";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import BottomNav from "../../components/BottomNav";

// CSS-ийг энд шууд import хийнэ
import "maplibre-gl/dist/maplibre-gl.css";

// ... [Бусад categoryMeta болон тогтмол утгууд хэвээрээ] ...

export default function MapPage() {
    // ... State-үүд хэвээрээ ...

    useEffect(() => {
        let map;
        let cancelled = false;

        async function init() {
            const maplibregl = (await import("maplibre-gl")).default;

            if (cancelled || !mapContainer.current) return;

            map = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        cartoDark: {
                            type: "raster",
                            tiles: [
                                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                                "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                            ],
                            tileSize: 256,
                            attribution: '&copy; OpenStreetMap &copy; CARTO',
                        },
                    },
                    layers: [{ id: "cartoDark-layer", type: "raster", source: "cartoDark" }],
                },
                center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
                zoom: DEFAULT_ZOOM,
                maxZoom: 16,
                minZoom: 6,
            });

            map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

            map.on("load", () => {
                if (!cancelled) {
                    mapRef.current = map;
                    map.resize();
                    setMapLoaded(true);
                }
            });
        }

        init();

        return () => {
            cancelled = true;
            if (map) map.remove();
        };
    }, []);

// ... [Бусад useEffect болон JSX хэсгүүд хэвээрээ] ...