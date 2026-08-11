"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function Map({ sites, selectedSite, onSelectSite, filter, meta }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    const DEFAULT_CENTER = { lng: 102.55, lat: 47.15 };
    const DEFAULT_ZOOM = 8.2;

    // Газрын зураг эхлүүлэх
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
            zoom: DEFAULT_ZOOM,
            maxZoom: 16,
            minZoom: 6,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

        map.on("load", () => {
            mapRef.current = map;
            // Canvas-ийн хэмжээг гарцаагүй зөв авахын тулд resize дуудна
            setTimeout(() => {
                map.resize();
            }, 200);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Маркеруудыг шинэчлэх
    useEffect(() => {
        if (!mapRef.current) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        sites.forEach((site) => {
            if (!site.location) return;
            const { color, icon } = meta(site.category);

            const el = document.createElement("div");
            el.className = "orkhon-marker";
            el.innerHTML = `
                <div style="
                    width:36px; height:36px;
                    background:${color};
                    border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    box-shadow: 0 2px 12px ${color}66;
                    cursor:pointer;
                    border: 2px solid rgba(255,255,255,0.6);
                "><i class="${icon}" style="color:white;font-size:14px;"></i></div>
            `;

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                onSelectSite(site);
                mapRef.current.flyTo({
                    center: [site.location.lng, site.location.lat],
                    zoom: Math.max(mapRef.current.getZoom(), 11),
                    duration: 800,
                });
            });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([site.location.lng, site.location.lat])
                .addTo(mapRef.current);

            markersRef.current.push(marker);
        });
    }, [sites, meta, onSelectSite]);

    return (
        <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
        />
    );
}