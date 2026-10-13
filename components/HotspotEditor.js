'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sitesData } from '../app/data/sites';

/**
 * Hotspot тааруулах редактор (зөвхөн dev): панорама дээр дарж сумны байрлалыг
 * тогтоогоод "Хадгалах" дарахад app/data/sites.js шууд шинэчлэгдэнэ.
 *
 * yaw/pitch-ийн тооцоо PanoramaViewer-ийн hotspotPosition()-тэй ЯГ ИЖИЛ:
 *   x = -cos(p)·sin(y), y = sin(p), z = -cos(p)·cos(y)
 */

const DEFAULT_YAWS = new Set([0, 180]);
const isDefault = (h) => DEFAULT_YAWS.has(h.yaw) && h.pitch === -8;

const toRad = THREE.MathUtils.degToRad;
const toDeg = THREE.MathUtils.radToDeg;

function directionFromYawPitch(yaw, pitch) {
    const y = toRad(yaw);
    const p = toRad(pitch);
    return new THREE.Vector3(-Math.cos(p) * Math.sin(y), Math.sin(p), -Math.cos(p) * Math.cos(y));
}

function yawPitchFromDirection(d) {
    const yaw = (toDeg(Math.atan2(-d.x, -d.z)) + 360) % 360;
    const pitch = toDeg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)));
    return { yaw: Math.round(yaw * 10) / 10, pitch: Math.round(pitch * 10) / 10 };
}

const tourSites = sitesData.filter((s) => s.panoramaTour?.length);

export default function HotspotEditor() {
    const [siteId, setSiteId] = useState(tourSites[0]?.id);
    const [nodeIndex, setNodeIndex] = useState(0);
    const [drafts, setDrafts] = useState({}); // `${siteId}:${node}` → hotspots[]
    // Энэ session-д хадгалсан утгууд — sites.js дахин ачаалагдтал эдгээрийг харуулна
    const [saved, setSaved] = useState({});
    const [selected, setSelected] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const containerRef = useRef(null);
    const overlayRef = useRef(null);
    const threeRef = useRef({});
    const stateRef = useRef({});

    const site = tourSites.find((s) => s.id === siteId);
    const nodes = site?.panoramaTour || [];
    const node = nodes[nodeIndex];
    const key = `${siteId}:${nodeIndex}`;
    const hotspots = drafts[key] ?? saved[key] ?? node?.hotspots ?? [];
    const dirty = drafts[key] !== undefined;

    stateRef.current = { hotspots, selected };

    // Нийт ахиц: анхны (0/180°, -8°) утгатай hotspot хэд үлдсэн
    const progress = useMemo(() => {
        let total = 0;
        let remaining = 0;
        tourSites.forEach((s) =>
            s.panoramaTour.forEach((n, i) => {
                const hs = drafts[`${s.id}:${i}`] ?? saved[`${s.id}:${i}`] ?? n.hotspots ?? [];
                total += hs.length;
                remaining += hs.filter(isDefault).length;
            })
        );
        return { total, remaining };
    }, [drafts, saved]);

    const setHotspots = useCallback(
        (updater) => {
            setDrafts((d) => {
                const current = d[key] ?? saved[key] ?? node?.hotspots ?? [];
                return { ...d, [key]: typeof updater === 'function' ? updater(current) : updater };
            });
        },
        [key, node, saved]
    );

    // ---------- Three.js ----------
    useEffect(() => {
        const container = containerRef.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 0.1);

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = -0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.15;

        const onWheel = (e) => {
            e.preventDefault();
            camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, 25, 100);
            camera.updateProjectionMatrix();
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const pointToYawPitch = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            raycaster.setFromCamera(ndc, camera);
            return yawPitchFromDirection(raycaster.ray.direction.clone().normalize());
        };

        let down = null;
        const onDown = (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() });
        const onMove = (e) => setCursor(pointToYawPitch(e));
        const onUp = (e) => {
            if (!down) return;
            const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
            const quick = performance.now() - down.t < 500;
            down = null;
            if (moved > 6 || !quick) return;
            const { selected: sel } = stateRef.current;
            if (sel === null || sel === undefined) return;
            const pos = pointToYawPitch(e);
            threeRef.current.place?.(sel, pos);
        };
        renderer.domElement.addEventListener('pointerdown', onDown);
        renderer.domElement.addEventListener('pointermove', onMove);
        renderer.domElement.addEventListener('pointerup', onUp);

        // Hotspot-уудыг HTML overlay-ээр дэлгэцэн дээр проекцлоно
        const projected = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        renderer.setAnimationLoop(() => {
            controls.update();
            renderer.render(scene, camera);
            const overlay = overlayRef.current;
            if (!overlay) return;
            camera.getWorldDirection(camDir);
            const w = container.clientWidth;
            const h = container.clientHeight;
            stateRef.current.hotspots.forEach((hs, i) => {
                const el = overlay.children[i];
                if (!el) return;
                const dir = directionFromYawPitch(hs.yaw, hs.pitch);
                if (dir.dot(camDir) <= 0.05) {
                    el.style.display = 'none';
                    return;
                }
                projected.copy(dir).multiplyScalar(40).project(camera);
                el.style.display = 'flex';
                el.style.transform = `translate(${((projected.x + 1) / 2) * w}px, ${((1 - projected.y) / 2) * h}px) translate(-50%, -50%)`;
            });
        });

        const resize = new ResizeObserver(() => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        });
        resize.observe(container);

        const loader = new THREE.TextureLoader();
        threeRef.current = {
            loadPanorama(url) {
                setLoading(true);
                loader.load(
                    url,
                    (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace;
                        material.map?.dispose();
                        material.map = tex;
                        material.color.set(0xffffff);
                        material.needsUpdate = true;
                        setLoading(false);
                    },
                    undefined,
                    () => setLoading(false)
                );
            },
            lookAt(yaw, pitch) {
                const d = directionFromYawPitch(yaw, pitch);
                // OrbitControls камерыг target-ийн эсрэг талд байрлуулдаг
                camera.position.copy(d.multiplyScalar(-0.1));
                controls.target.set(0, 0, 0);
                controls.update();
            },
        };

        return () => {
            renderer.setAnimationLoop(null);
            resize.disconnect();
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('pointerdown', onDown);
            renderer.domElement.removeEventListener('pointermove', onMove);
            renderer.domElement.removeEventListener('pointerup', onUp);
            controls.dispose();
            material.map?.dispose();
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    // Hotspot байрлуулах функцийг сүүлийн state-тэй холбоно
    useEffect(() => {
        threeRef.current.place = (index, pos) => {
            setHotspots((hs) => hs.map((h, i) => (i === index ? { ...h, ...pos } : h)));
            setStatus(`#${index + 1} → yaw ${pos.yaw}°, pitch ${pos.pitch}°`);
        };
    }, [setHotspots]);

    useEffect(() => {
        if (node?.url) threeRef.current.loadPanorama?.(node.url);
        setSelected(null);
    }, [node?.url]);

    // sites.js хадгалахад dev server хуудсыг дахин ачаалж болох тул байрлалаа санана
    useEffect(() => {
        try {
            const last = JSON.parse(localStorage.getItem('hotspot-editor') || 'null');
            if (last && tourSites.some((s) => s.id === last.siteId)) {
                setSiteId(last.siteId);
                setNodeIndex(last.nodeIndex || 0);
            }
        } catch {}
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem('hotspot-editor', JSON.stringify({ siteId, nodeIndex }));
        } catch {}
    }, [siteId, nodeIndex]);

    // ---------- Үйлдлүүд ----------
    const save = useCallback(async () => {
        if (!dirty) return true;
        setStatus('Хадгалж байна…');
        const res = await fetch('/api/dev/hotspots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: node.url, hotspots, nodeCount: nodes.length }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setStatus(`Алдаа: ${data.error || res.status}`);
            return false;
        }
        setSaved((s) => ({ ...s, [key]: hotspots }));
        setDrafts((d) => {
            const next = { ...d };
            delete next[key];
            return next;
        });
        setStatus('✓ sites.js-д хадгалагдлаа');
        return true;
    }, [dirty, node, hotspots, nodes.length, key]);

    const goToNode = async (siteIdNext, indexNext) => {
        if (dirty && !window.confirm('Хадгалаагүй өөрчлөлт байна. Хадгалалгүй шилжих үү?')) return;
        setSiteId(siteIdNext);
        setNodeIndex(indexNext);
    };

    const saveAndNext = async () => {
        if (!(await save())) return;
        if (nodeIndex + 1 < nodes.length) return setNodeIndex(nodeIndex + 1);
        const i = tourSites.findIndex((s) => s.id === siteId);
        if (i + 1 < tourSites.length) {
            setSiteId(tourSites[i + 1].id);
            setNodeIndex(0);
        }
    };

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                save();
            }
            if (e.key === 'Escape') setSelected(null);
        };
        const onBeforeUnload = (e) => {
            if (Object.keys(drafts).length) e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [save, drafts]);

    const update = (i, patch) => setHotspots((hs) => hs.map((h, j) => (j === i ? { ...h, ...patch } : h)));

    const addHotspot = () => {
        const target = nodes.findIndex((_, i) => i !== nodeIndex);
        setHotspots((hs) => [...hs, { yaw: 0, pitch: -8, targetIndex: Math.max(0, target), label: 'Дараах' }]);
        setSelected(hotspots.length);
    };

    const nodeState = (s, i) => {
        const k = `${s.id}:${i}`;
        const hs = drafts[k] ?? saved[k] ?? s.panoramaTour[i].hotspots ?? [];
        if (drafts[k]) return 'dirty';
        if (hs.length && !hs.some(isDefault)) return 'done';
        if (!hs.length) return 'empty';
        return 'todo';
    };

    const pct = progress.total ? Math.round(((progress.total - progress.remaining) / progress.total) * 100) : 100;

    return (
        <div className="fixed inset-0 flex flex-col lg:flex-row bg-[#05070d] text-slate-200 text-sm" style={{ maxWidth: 'none' }}>
            {/* Панорама */}
            <div className="relative flex-1 min-h-[50vh]">
                <div ref={containerRef} className="absolute inset-0" style={{ cursor: selected !== null ? 'crosshair' : 'grab' }} />
                <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
                    {hotspots.map((h, i) => (
                        <button
                            key={i}
                            onClick={() => setSelected(i)}
                            className="absolute left-0 top-0 pointer-events-auto flex-col items-center gap-1"
                            style={{ display: 'none' }}
                        >
                            <span
                                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold ${
                                    selected === i ? 'border-amber-400 bg-amber-500/40' : isDefault(h) ? 'border-red-400 bg-red-500/30' : 'border-white bg-black/40'
                                }`}
                            >
                                {i + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/70 text-[11px] whitespace-nowrap">
                                {h.label} → {nodes[h.targetIndex]?.name?.split(' — ').pop() ?? h.targetIndex}
                            </span>
                        </button>
                    ))}
                </div>
                {loading && <div className="absolute inset-0 flex items-center justify-center text-slate-400">Панорама ачаалж байна…</div>}
                <div className="absolute left-3 bottom-3 px-3 py-2 rounded-lg bg-black/70 text-xs space-y-0.5 pointer-events-none">
                    <div>
                        {selected !== null ? (
                            <span className="text-amber-300">#{selected + 1}-ийг байрлуулах: зураг дээрх хаалга/зам руу дарна уу (Esc — цуцлах)</span>
                        ) : (
                            'Чирж эргүүлнэ · хулганы дугуйгаар томруулна · hotspot сонгоод зураг дээр дарна'
                        )}
                    </div>
                    {cursor && (
                        <div className="text-slate-400">
                            yaw {cursor.yaw}° · pitch {cursor.pitch}°
                        </div>
                    )}
                </div>
            </div>

            {/* Самбар */}
            <aside className="w-full lg:w-[400px] max-h-[50vh] lg:max-h-none overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/10 p-4 space-y-4">
                <div>
                    <h1 className="text-base font-bold text-white">Hotspot тааруулах</h1>
                    <p className="text-xs text-slate-400">Зөвхөн dev горимд. Хадгалахад app/data/sites.js шинэчлэгдэнэ.</p>
                    <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        {progress.total - progress.remaining}/{progress.total} тааруулсан · {progress.remaining} анхны утгатай үлдсэн
                    </p>
                </div>

                <label className="block">
                    <span className="text-xs text-slate-400">Дурсгал</span>
                    <select
                        value={siteId}
                        onChange={(e) => goToNode(Number(e.target.value), 0)}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded px-2 py-1.5"
                    >
                        {tourSites.map((s) => {
                            const todo = s.panoramaTour.filter((_, i) => nodeState(s, i) === 'todo').length;
                            return (
                                <option key={s.id} value={s.id}>
                                    {s.id}. {s.name} {todo ? `(${todo} үлдсэн)` : '✓'}
                                </option>
                            );
                        })}
                    </select>
                </label>

                <div>
                    <span className="text-xs text-slate-400">Панорама</span>
                    <div className="mt-1 grid gap-1">
                        {nodes.map((n, i) => {
                            const st = nodeState(site, i);
                            return (
                                <button
                                    key={n.url}
                                    onClick={() => goToNode(siteId, i)}
                                    className={`text-left px-2 py-1.5 rounded border text-xs flex justify-between gap-2 ${
                                        i === nodeIndex ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="truncate">
                                        {i}. {n.name}
                                    </span>
                                    <span className={st === 'done' ? 'text-emerald-400' : st === 'dirty' ? 'text-amber-300' : st === 'empty' ? 'text-slate-500' : 'text-red-400'}>
                                        {st === 'done' ? '✓' : st === 'dirty' ? '●' : st === 'empty' ? '—' : '○'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Энэ панорамын hotspot-ууд</span>
                        <button onClick={addHotspot} disabled={nodes.length < 2} className="text-xs text-amber-300 disabled:opacity-40">
                            + Нэмэх
                        </button>
                    </div>
                    {hotspots.length === 0 && <p className="text-xs text-slate-500">Hotspot алга.</p>}
                    {hotspots.map((h, i) => (
                        <div
                            key={i}
                            className={`p-2 rounded border space-y-2 ${selected === i ? 'border-amber-400 bg-amber-500/5' : 'border-white/10'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDefault(h) ? 'bg-red-500/30' : 'bg-white/10'}`}>
                                    {i + 1}
                                </span>
                                <input
                                    value={h.label}
                                    maxLength={60}
                                    onChange={(e) => update(i, { label: e.target.value })}
                                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1"
                                    aria-label="Шошго"
                                />
                                <button onClick={() => setHotspots((hs) => hs.filter((_, j) => j !== i))} className="text-red-400 text-xs px-1" aria-label="Устгах">
                                    ✕
                                </button>
                            </div>
                            <label className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400 w-14">Зорилт</span>
                                <select
                                    value={h.targetIndex}
                                    onChange={(e) => update(i, { targetIndex: Number(e.target.value) })}
                                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-1 py-1"
                                >
                                    {nodes.map((n, j) =>
                                        j === nodeIndex ? null : (
                                            <option key={j} value={j}>
                                                {j}. {n.name}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400">yaw</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={h.yaw}
                                    onChange={(e) => update(i, { yaw: ((Number(e.target.value) % 360) + 360) % 360 })}
                                    className="w-16 bg-black/40 border border-white/10 rounded px-1 py-1"
                                />
                                <span className="text-slate-400">pitch</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={h.pitch}
                                    onChange={(e) => update(i, { pitch: THREE.MathUtils.clamp(Number(e.target.value), -90, 90) })}
                                    className="w-16 bg-black/40 border border-white/10 rounded px-1 py-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelected(selected === i ? null : i)}
                                    className={`flex-1 py-1 rounded text-xs font-semibold ${selected === i ? 'bg-amber-500 text-black' : 'bg-white/10'}`}
                                >
                                    {selected === i ? 'Зураг дээр дарна уу…' : '📍 Байрлуулах'}
                                </button>
                                <button onClick={() => threeRef.current.lookAt?.(h.yaw, h.pitch)} className="px-2 py-1 rounded bg-white/10 text-xs">
                                    Харах
                                </button>
                                <button onClick={() => goToNode(siteId, h.targetIndex)} className="px-2 py-1 rounded bg-white/10 text-xs">
                                    Очих →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-[#05070d] border-t border-white/10 space-y-2">
                    {status && <p className="text-xs text-slate-300">{status}</p>}
                    <div className="flex gap-2">
                        <button onClick={save} disabled={!dirty} className="flex-1 py-2 rounded bg-white/10 font-semibold disabled:opacity-40">
                            Хадгалах (Ctrl+S)
                        </button>
                        <button onClick={saveAndNext} className="flex-1 py-2 rounded bg-amber-500 text-black font-bold">
                            Хадгалаад дараах →
                        </button>
                    </div>
                    {dirty && (
                        <button
                            onClick={() =>
                                setDrafts((d) => {
                                    const next = { ...d };
                                    delete next[key];
                                    return next;
                                })
                            }
                            className="w-full text-xs text-slate-500 underline"
                        >
                            Өөрчлөлтийг буцаах
                        </button>
                    )}
                </div>
            </aside>
        </div>
    );
}
