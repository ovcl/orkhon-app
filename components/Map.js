"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MarkerClusterGroup from "react-leaflet-cluster";
import { sitesData, getPlaceHolder } from "../app/data/sites";
import { translations } from "../app/data/translations";

const { BaseLayer } = LayersControl;

// Custom icons based on category
const createIcon = (category) => {
    let iconHTML = '';
    let color = '#d97706';

    switch (category) {
        case "Сүм хийд":
            iconHTML = '<i class="fa-solid fa-place-of-worship"></i>';
            color = '#8b5cf6';
            break;
        case "Хот суурин":
            iconHTML = '<i class="fa-solid fa-archway"></i>';
            color = '#3b82f6';
            break;
        case "Хадны зураг":
            iconHTML = '<i class="fa-solid fa-palette"></i>';
            color = '#10b981';
            break;
        case "Булш хиргисүүр":
            iconHTML = '<i class="fa-solid fa-monument"></i>';
            color = '#64748b';
            break;
        case "Тахилгат газар":
            iconHTML = '<i class="fa-solid fa-mountain"></i>';
            color = '#f59e0b';
            break;
        default:
            iconHTML = '<i class="fa-solid fa-location-dot"></i>';
            color = '#1e3a8a';
    }

    return L.divIcon({
        html: `<div class="marker-pin" style="background-color: ${color}; transform: rotate(-45deg);">${iconHTML}</div>`,
        className: 'custom-div-icon',
        iconSize: [40, 42],
        iconAnchor: [20, 42],
        popupAnchor: [0, -42]
    });
};



export default function Map({ language = 'mn' }) {
    const t = translations[language];
    const position = [47.1975, 102.8256];
    const sitesWithLocation = sitesData.filter(s => s.location);
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    // Filter State
    const [filterCategory, setFilterCategory] = useState("All");
    const categories = ["All", ...new Set(sitesWithLocation.map(s => s.category))];

    // Filtered sites
    const displayedSites = filterCategory === "All"
        ? sitesWithLocation
        : sitesWithLocation.filter(s => s.category === filterCategory);

    return (
        <div style={{ height: "100%", width: "100%", background: '#0f172a', position: 'relative' }}>
            {/* Filter Control */}
            <div className="filter-control">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                    >
                        {cat === "All" ? (language === 'mn' ? 'Бүгд' : 'All') : (t[cat] || cat)}
                    </button>
                ))}
            </div>

            <MapContainer center={position} zoom={9} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <LayersControl position="topright">
                    <BaseLayer checked name="Standard">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </BaseLayer>
                    <BaseLayer name="Satellite">
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </BaseLayer>
                    <BaseLayer name="Terrain">
                        <TileLayer
                            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        />
                    </BaseLayer>
                </LayersControl>

                {/* Auto Zoom Controller */}
                <AutoZoom displayedSites={displayedSites} selectedId={selectedId} />

                {displayedSites.map((site) => (
                    <Marker
                        key={site.id}
                        position={[site.location.lat, site.location.lng]}
                        icon={createIcon(site.category)}
                        zIndexOffset={selectedId === site.id.toString() ? 1000 : 0}
                    >
                        <Popup maxWidth={280} className="custom-popup">
                            <div style={{ textAlign: 'left', minWidth: '220px', padding: '4px' }}>
                                <div style={{
                                    width: '100%',
                                    height: '140px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    marginBottom: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <img
                                        src={site.images && site.images.length > 0 ? site.images[0] : getPlaceHolder(site.id)}
                                        alt={site.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <b style={{
                                    fontSize: '1rem',
                                    color: '#0f172a',
                                    display: 'block',
                                    marginBottom: '4px',
                                    lineHeight: '1.4'
                                }}>
                                    {language === 'en' && site.nameEn ? site.nameEn : site.name}
                                </b>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    borderRadius: '6px',
                                    marginBottom: '12px',
                                    fontWeight: '500'
                                }}>
                                    {t[site.category] || site.category}
                                </span>
                                <a
                                    href={`/sites/${site.id}`}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        background: '#3b82f6',
                                        color: 'white',
                                        padding: '8px 0',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {language === 'mn' ? 'Дэлгэрэнгүй' : 'Details'}
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <style jsx global>{`
                .filter-control {
                    position: absolute;
                    top: 10px;
                    left: 50px; /* moved right to avoid zoom controls */
                    z-index: 1000;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    max-width: 90%;
                }
                .filter-btn {
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0,0,0,0.05);
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    backdrop-filter: blur(4px);
                }
                .filter-btn:hover {
                    background: white;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .filter-btn.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }

                .marker-pin {
                    width: 40px;
                    height: 40px;
                    border-radius: 50% 50% 50% 0;
                    background: #3b82f6;
                    position: absolute;
                    transform: rotate(-45deg);
                    left: 50%;
                    top: 50%;
                    margin: -20px 0 0 -20px;
                    box-shadow: -3px 3px 6px 2px rgba(0, 0, 0, 0.3);
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .marker-pin i {
                    transform: rotate(45deg); /* Counter-rotate icon */
                    color: white;
                    font-size: 18px;
                }

                .marker-pin:hover {
                    transform: rotate(-45deg) scale(1.1);
                    z-index: 999;
                }

                .custom-div-icon {
                    background: transparent;
                    border: none;
                }

                .custom-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .custom-popup .leaflet-popup-content {
                    margin: 16px;
                    line-height: 1.5;
                }
                .custom-popup a.leaflet-popup-close-button {
                    top: 8px;
                    right: 8px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    font-size: 16px;
                }
            `}</style>
        </div>
    );
}

// Separate component to handle map side-effects
function AutoZoom({ displayedSites, selectedId }) {
    const map = useMap();

    useEffect(() => {
        if (selectedId) {
            const site = displayedSites.find(s => s.id.toString() === selectedId);
            if (site && site.location) {
                map.flyTo([site.location.lat, site.location.lng], 15, {
                    duration: 1.5
                });
                return;
            }
        }

        // Check if map tracks valid bounds
        if (displayedSites.length > 0) {
            const bounds = L.latLngBounds(displayedSites.map(s => [s.location.lat, s.location.lng]));
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            }
        }
    }, [displayedSites, map, selectedId]);

    return null;
}
