'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { StereoEffect } from 'three/addons/effects/StereoEffect.js';
import qrcode from 'qrcode-generator';
import panoramaMeta from '../app/data/panorama-manifest.json';

/**
 * PanoramaViewer — VR-native 360° харагч + HOTSPOT NAVIGATION
 *
 * ШИНЭ БОЛОМЖ (2026-07 сайжруулалт #2): Панорама ДОТОР нь бодит чиглэл рүү
 * заасан сум (hotspot) байрлуулж, түүн дээр дарахад (эсвэл VR controller-оор
 * онож trigger дарахад) холбогдсон дараагийн панорама руу шилждэг. Жишээ нь:
 * Эрдэнэ Зуу хийдийн гол хаалганаас гурван сүм рүү харсан чиглэлд сум байна,
 * түүн дээр дарахад тэр байрлал дахь панорам руу шилжинэ — Google Street View
 * маягийн зам дагасан навигаци.
 *
 * HOTSPOT ӨГӨГДЛИЙН БҮТЭЦ (scenes[i].hotspots):
 *   [{ yaw: 45, pitch: -5, targetIndex: 2, label: 'Гурван сүм рүү' }]
 *   - yaw: 0–360°. 0° = тухайн панорамын зурган голын чиглэл (ихэвчлэн drone
 *     авалт эхэлсэн чиглэл). Градус ЦАГИЙН ЗҮҮНИЙ дагуу нэмэгдэнэ (баруун тийш).
 *   - pitch: -90..90°. 0° = хэвтээ хараа (нүдний түвшин), эерэг = дээш, сөрөг = доош.
 *   - targetIndex: `scenes` array доtorх зорилтот индекс (ижил тур доторх өөр node).
 *   - label: сум дээр харагдах богино тайлбар (жишээ нь "Гурван сүм рүү").
 *
 * Хэрэв scenes[i].hotspots байхгүй эсвэл хоосон бол энэ scene дээр ямар ч
 * дотоод сум харагдахгүй — өмнөх шиг зөвхөн доод HTML prev/next ажиллана
 * (бүрэн ухаангүй нийцтэй — хуучин site өгөгдөл өөрчлөгдөх шаардлагагүй).
 *
 * PROPS:
 * - scenes: [{ url, name, description, hotspots? }]
 * - initialIndex: эхлэх индекс (default 0)
 * - onIndexChange: (index) => void
 */
// Харанхуй панорамыг автоматаар гэрэлтүүлэх зорилтот дундаж гэрэлтүүлэг (0–255, бүх панорамын медиан)
const TARGET_LUM = 116;
const FOV_MIN = 30;
const FOV_MAX = 90;
const VIEW_PREFS_KEY = 'pano-view';
const HINT_KEY = 'pano-hint-seen';
const GAZE_MS = 2000; // Cardboard горимд сум руу ширтэж шилжих хугацаа

/** Хуваалцах хаягийн QR код (SVG) — интернэтгүй ч үүснэ */
function qrSvg(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function readViewPrefs() {
    try {
        const v = JSON.parse(localStorage.getItem(VIEW_PREFS_KEY) || '{}');
        return { enhance: v.enhance !== false, brightness: Number(v.brightness) || 1 };
    } catch {
        return { enhance: true, brightness: 1 };
    }
}

/** Гэрэлтүүлэг/тодруулгын shader параметр: зураг харанхуй байх тусам сүүдрийг илүү өргөнө. */
function enhanceParams(url, enhance, brightness) {
    const lum = panoramaMeta[url]?.lum ?? TARGET_LUM;
    const autoLift = enhance ? Math.min(1.75, Math.max(1, 1 + ((TARGET_LUM - lum) / TARGET_LUM) * 1.2)) : 1;
    return { lift: autoLift * brightness, saturation: enhance ? 1.08 : 1, sharpen: enhance ? 0.35 : 0 };
}

export default function PanoramaViewer({
    scenes,
    initialIndex = 0,
    onIndexChange,
    showControls = true,
    t = {},
    uiHidden = false,
    onToggleUi,
    bottomInset = 20,
}) {
    const containerRef = useRef(null);
    const stripRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [hdLoading, setHdLoading] = useState(false);
    const [isPresenting, setIsPresenting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [xrSupported, setXrSupported] = useState(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const [gyroAvailable, setGyroAvailable] = useState(false);
    const [gyroOn, setGyroOn] = useState(false);
    const [viewPrefs, setViewPrefs] = useState({ enhance: true, brightness: 1 });
    const [showLight, setShowLight] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showVrMenu, setShowVrMenu] = useState(false);
    const [cardboard, setCardboard] = useState(false);
    const [portrait, setPortrait] = useState(false);
    const [isPhone, setIsPhone] = useState(false);
    const reticleRefs = useRef([]);
    const cardboardRestoreRef = useRef(null);
    const viewPrefsRef = useRef(viewPrefs);
    viewPrefsRef.current = viewPrefs;

    const currentIndexRef = useRef(initialIndex);
    const sceneStateRef = useRef({});
    const isFirstRun = useRef(true);

    // navigateTo — ямар ч индекс рүү шууд шилжих (hotspot-той адилгүй, delta биш)
    const navigateTo = useCallback((index) => {
        if (index < 0 || index >= scenes.length || index === currentIndexRef.current) return;
        currentIndexRef.current = index;
        setCurrentIndex(index);
        onIndexChange?.(index);
    }, [scenes.length, onIndexChange]);

    const goTo = useCallback((delta) => {
        navigateTo(currentIndexRef.current + delta);
    }, [navigateTo]);

    useEffect(() => {
        if (initialIndex >= 0 && initialIndex < scenes.length && initialIndex !== currentIndexRef.current) {
            currentIndexRef.current = initialIndex;
            setCurrentIndex(initialIndex);
        }
    }, [initialIndex, scenes.length]);

    useEffect(() => {
        if (!containerRef.current || !scenes || scenes.length === 0) return;

        let isCancelled = false;
        const container = containerRef.current;
        const initWidth = container.clientWidth || window.innerWidth;
        const initHeight = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initWidth, initHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.xr.enabled = true;

        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(renderer.domElement);

        // ---------- Панорама sphere ----------
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
        // Эх зургийг өөрчлөхгүйгээр render үед: харанхуй хэсгийг өргөх (gamma муруй), бага зэрэг
        // өнгө нэмэх, нарийн тодруулга (unsharp mask). Утгыг enhanceParams() тооцно.
        const enhanceUniforms = {
            uLift: { value: 1 },
            uSat: { value: 1 },
            uSharpen: { value: 0 },
            uTexel: { value: new THREE.Vector2(1 / 8192, 1 / 4096) },
        };
        material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, enhanceUniforms);
            shader.fragmentShader =
                'uniform float uLift;\nuniform float uSat;\nuniform float uSharpen;\nuniform vec2 uTexel;\n' +
                shader.fragmentShader.replace(
                    '#include <map_fragment>',
                    `#ifdef USE_MAP
                        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                        if ( uSharpen > 0.0 ) {
                            vec3 nb = texture2D( map, vMapUv + vec2( uTexel.x, 0.0 ) ).rgb + texture2D( map, vMapUv - vec2( uTexel.x, 0.0 ) ).rgb
                                + texture2D( map, vMapUv + vec2( 0.0, uTexel.y ) ).rgb + texture2D( map, vMapUv - vec2( 0.0, uTexel.y ) ).rgb;
                            sampledDiffuseColor.rgb = max( sampledDiffuseColor.rgb + ( sampledDiffuseColor.rgb - nb * 0.25 ) * uSharpen, 0.0 );
                        }
                        diffuseColor *= sampledDiffuseColor;
                        vec3 g = pow( clamp( diffuseColor.rgb, 0.0, 1.0 ), vec3( 1.0 / 2.2 ) );
                        g = 1.0 - pow( 1.0 - g, vec3( uLift ) );
                        float lum = dot( g, vec3( 0.2126, 0.7152, 0.0722 ) );
                        g = mix( vec3( lum ), g, uSat );
                        diffuseColor.rgb = pow( clamp( g, 0.0, 1.0 ), vec3( 2.2 ) );
                    #endif`
                );
        };
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // .glb 3D загварууд ихэвчлэн PBR material (MeshStandardMaterial) ашигладаг тул
        // гэрэлгүй бол бүрэн хар харагдана. Панорама/hotspot (MeshBasicMaterial) эдгээрт
        // нөлөөлдөггүй тул шинэ асуудал үүсгэхгүй.
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2a2a3a, 1.2);
        scene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(2, 3, 2);
        scene.add(dirLight);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'Anonymous';

        // ---------- Fade overlay ----------
        const fadeGeometry = new THREE.SphereGeometry(1, 16, 16);
        const fadeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 1, depthTest: false,
        });
        const fadeMesh = new THREE.Mesh(fadeGeometry, fadeMaterial);
        fadeMesh.renderOrder = 999;
        camera.add(fadeMesh);
        scene.add(camera);

        // Camera-д "наасан" 3D загвар (showModelInFrontOfCamera) толгой хаашаа ч эргэсэн
        // тогтмол гэрэлтэй харагдахын тулд, дэлхийн гэрэл (dirLight)-с гадна
        // camera-д наасан жижиг гэрэл нэмнэ
        const modelLight = new THREE.DirectionalLight(0xffffff, 1.0);
        modelLight.position.set(1, 1.5, 1);
        camera.add(modelLight);

        renderer.outputColorSpace = THREE.SRGBColorSpace;

        let currentUrl = null;
        let loadToken = 0;

        const applyEnhance = () => {
            if (!currentUrl) return;
            const { enhance, brightness } = viewPrefsRef.current;
            const p = enhanceParams(currentUrl, enhance, brightness);
            enhanceUniforms.uLift.value = p.lift;
            enhanceUniforms.uSat.value = p.saturation;
            enhanceUniforms.uSharpen.value = p.sharpen;
        };

        const setMap = (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            const previous = material.map;
            material.map = texture;
            material.color.set(0xffffff);
            material.needsUpdate = true;
            enhanceUniforms.uTexel.value.set(1 / (texture.image?.width || 8192), 1 / (texture.image?.height || 4096));
            if (previous && previous !== texture) previous.dispose();
        };

        const loadImage = (url) =>
            new Promise((resolve, reject) => textureLoader.load(url, resolve, undefined, reject));

        // Эхлээд 2048px preview-г агшин зуур харуулж, дараа нь бүрэн 8K зургийг ард нь ачаална.
        // Офлайн үед 8K кэшэд байхгүй бол preview хэвээр харагдана.
        const loadTexture = async (url, fadeIn = true) => {
            const token = ++loadToken;
            currentUrl = url;
            applyEnhance();
            const preview = panoramaMeta[url]?.preview;
            setLoading(true);
            setHdLoading(false);
            let shown = false;
            if (preview) {
                try {
                    const tex = await loadImage(preview);
                    if (isCancelled || token !== loadToken) return tex.dispose();
                    setMap(tex);
                    shown = true;
                    setLoading(false);
                    if (fadeIn) fadeTo(0, 400);
                } catch {}
            }
            setHdLoading(shown);
            try {
                const full = await loadImage(url);
                if (isCancelled || token !== loadToken) return full.dispose();
                setMap(full);
                if (!shown && fadeIn) fadeTo(0, 400);
            } catch (err) {
                if (!shown && !isCancelled && token === loadToken) {
                    console.error('Failed to load panorama image:', url, err);
                    material.map = null;
                    material.color.set(0x111111);
                    material.needsUpdate = true;
                }
            }
            if (!isCancelled && token === loadToken) {
                setLoading(false);
                setHdLoading(false);
            }
        };

        let fadeAnim = null;
        const fadeTo = (targetOpacity, duration = 400) => {
            if (fadeAnim) cancelAnimationFrame(fadeAnim);
            const start = fadeMaterial.opacity;
            const startTime = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - startTime) / duration);
                fadeMaterial.opacity = start + (targetOpacity - start) * t;
                if (t < 1) fadeAnim = requestAnimationFrame(step);
            };
            fadeAnim = requestAnimationFrame(step);
        };

        loadTexture(scenes[currentIndexRef.current].url, true);

        // ---------- Flat (non-VR) controls ----------
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = -0.25;
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;
        camera.position.set(0, 0, 0.1);
        controls.target.set(-0.87, -0.58, 0.5);
        controls.update();

        const onFirstInteract = () => {
            controls.autoRotate = false;
            setAutoRotate(false);
        };
        renderer.domElement.addEventListener('pointerdown', onFirstInteract, { once: true });

        const setFov = (fov) => {
            camera.fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov));
            camera.updateProjectionMatrix();
        };
        const onWheel = (e) => {
            e.preventDefault();
            setFov(camera.fov + e.deltaY * 0.05);
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // Хоёр хуруугаар чимхэж томруулах
        const touches = new Map();
        let pinchStart = null;
        const pinchDistance = () => {
            const [a, b] = [...touches.values()];
            return Math.hypot(a.x - b.x, a.y - b.y);
        };
        const onTouchDown = (e) => {
            if (e.pointerType !== 'touch') return;
            touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (touches.size === 2) pinchStart = { dist: pinchDistance(), fov: camera.fov };
        };
        const onTouchMove = (e) => {
            if (!touches.has(e.pointerId)) return;
            touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (touches.size === 2 && pinchStart) setFov(pinchStart.fov * (pinchStart.dist / pinchDistance()));
        };
        const onTouchUp = (e) => {
            touches.delete(e.pointerId);
            if (touches.size < 2) pinchStart = null;
        };
        renderer.domElement.addEventListener('pointerdown', onTouchDown);
        renderer.domElement.addEventListener('pointermove', onTouchMove);
        window.addEventListener('pointerup', onTouchUp);
        window.addEventListener('pointercancel', onTouchUp);

        // Гироскоп: утсаа эргүүлэхэд харах чиглэл дагана (хуучин three.js DeviceOrientationControls-ийн томьёо)
        const gyro = { enabled: false, has: false, alpha: 0, beta: 0, gamma: 0, offset: 0 };
        const zee = new THREE.Vector3(0, 0, 1);
        const gyroEuler = new THREE.Euler();
        const q0 = new THREE.Quaternion();
        const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        const onOrientation = (e) => {
            if (e.alpha == null) return;
            gyro.has = true;
            gyro.alpha = e.alpha;
            gyro.beta = e.beta;
            gyro.gamma = e.gamma;
        };
        const screenAngle = () => THREE.MathUtils.degToRad(window.screen?.orientation?.angle ?? window.orientation ?? 0);
        const currentYaw = () => {
            const d = new THREE.Vector3();
            camera.getWorldDirection(d);
            return THREE.MathUtils.radToDeg(Math.atan2(-d.x, -d.z));
        };
        const setGyro = (on) => {
            gyro.enabled = on;
            if (on) {
                window.addEventListener('deviceorientation', onOrientation);
                gyro.offset = null; // эхний уншилтаар одоогийн чиглэлд тааруулна
                controls.enabled = false;
                controls.autoRotate = false;
            } else {
                window.removeEventListener('deviceorientation', onOrientation);
                const d = new THREE.Vector3();
                camera.getWorldDirection(d);
                controls.target.copy(camera.position).add(d);
                controls.enabled = true;
                controls.update();
            }
        };
        const updateGyro = () => {
            if (!gyro.enabled || !gyro.has) return;
            if (gyro.offset === null) gyro.offset = gyro.alpha - currentYaw();
            const alpha = THREE.MathUtils.degToRad(gyro.alpha - gyro.offset);
            const beta = THREE.MathUtils.degToRad(gyro.beta);
            const gamma = THREE.MathUtils.degToRad(gyro.gamma);
            gyroEuler.set(beta, alpha, -gamma, 'YXZ');
            camera.quaternion.setFromEuler(gyroEuler);
            camera.quaternion.multiply(q1);
            camera.quaternion.multiply(q0.setFromAxisAngle(zee, -screenAngle()));
        };

        // ---------- VR: орон зайд тогтсон "dock" хяналт (Quest-ийн системийн UI шиг) ----------
        const roundRectPath = (ctx, x, y, w, h, r) => {
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
            else ctx.rect(x, y, w, h);
        };
        const fitText = (ctx, text, maxW) => {
            let out = text || '';
            if (ctx.measureText(out).width <= maxW) return out;
            while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
            return out.trimEnd() + '…';
        };

        const createInfoTexture = (title, text) => {
            const W = 1024, H = 768;
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');
            roundRectPath(ctx, 4, 4, W - 8, H - 8, 48);
            ctx.fillStyle = 'rgba(12,18,32,0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'top';
            ctx.font = '600 52px Inter, system-ui, sans-serif';
            ctx.fillText(fitText(ctx, title, W - 144), 72, 64);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(72, 140, 64, 5);
            ctx.fillStyle = 'rgba(226,232,240,0.92)';
            ctx.font = '36px Inter, system-ui, sans-serif';
            const words = (text || '').split(/\s+/);
            let line = '';
            let y = 180;
            for (const w of words) {
                const test = line ? line + ' ' + w : w;
                if (ctx.measureText(test).width > W - 144 && line) {
                    ctx.fillText(line, 72, y);
                    line = w;
                    y += 52;
                    if (y > H - 110) { line += ' …'; break; }
                } else line = test;
            }
            ctx.fillText(line, 72, y);
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            return tex;
        };

        // Вектор icon (unicode тэмдэгт Quest-ийн фонтод янз бүр харагддаг)
        const drawIcon = (ctx, kind, cx, cy, s, color) => {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = s * 0.13;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            if (kind === 'prev') {
                ctx.moveTo(cx + s * 0.12, cy - s * 0.3); ctx.lineTo(cx - s * 0.18, cy); ctx.lineTo(cx + s * 0.12, cy + s * 0.3);
            } else if (kind === 'next') {
                ctx.moveTo(cx - s * 0.12, cy - s * 0.3); ctx.lineTo(cx + s * 0.18, cy); ctx.lineTo(cx - s * 0.12, cy + s * 0.3);
            } else if (kind === 'exit') {
                ctx.moveTo(cx - s * 0.22, cy - s * 0.22); ctx.lineTo(cx + s * 0.22, cy + s * 0.22);
                ctx.moveTo(cx + s * 0.22, cy - s * 0.22); ctx.lineTo(cx - s * 0.22, cy + s * 0.22);
            } else if (kind === 'info') {
                ctx.moveTo(cx, cy - s * 0.04); ctx.lineTo(cx, cy + s * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.26, s * 0.085, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            ctx.stroke();
        };

        const makeButtonMesh = (kind, label, accent = false) => {
            const S = 256;
            const canvas = document.createElement('canvas');
            canvas.width = S; canvas.height = S;
            const ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, 116, 0, Math.PI * 2);
            ctx.fillStyle = accent ? '#f59e0b' : 'rgba(255,255,255,0.14)';
            ctx.fill();
            drawIcon(ctx, kind, S / 2, S / 2, S * 0.7, accent ? '#1c1300' : '#ffffff');
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: THREE.DoubleSide, color: 0xd6d6d6 });
            const meshObj = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.085), mat);
            meshObj.renderOrder = 1001;
            meshObj.userData.label = label;
            return meshObj;
        };

        // -----------------------------------------------------------------
        // HOTSPOT MESH — панорама sphere ДОТОР, тодорхой yaw/pitch чиглэлд
        // байрлах, дараагийн scene рүү шилжүүлдэг чиглэлийн сум.
        // Sprite биш PlaneGeometry ашиглаж байгаа шалтгаан: WebXR controller
        // raycasting Sprite дээр найдваргүй ажилладаг (btnPrev/btnNext-д мөн
        // адил шийдвэр аль хэдийн авсан байсан).
        // Билборд эффект (үргэлж камер руу харах)-ыг render loop дотор
        // `mesh.lookAt(camera.position)`-аар гараар хийнэ, учир нь энэ mesh
        // camera-ийн хүүхэд биш, world space дотор тогтмол байрлалтай.
        // -----------------------------------------------------------------
        const makeHotspotMesh = (label) => {
            // Минималист цэг: зөөлөн тунгалаг хүрээтэй цагаан цэг. Нэр нь зөвхөн
            // хулганаар дээр нь очих, VR controller-оор онох эсвэл цэг дэлгэцийн
            // голд ойртох үед (утас, гироскоп, Cardboard) зөөлөн гарч ирнэ.
            const S = 160;
            const canvas = document.createElement('canvas');
            canvas.width = S; canvas.height = S;
            const ctx = canvas.getContext('2d');
            const c = S / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.beginPath();
            ctx.arc(c, c, 52, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(c, c, 22, 0, Math.PI * 2);
            ctx.fill();

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: THREE.DoubleSide });
            const meshObj = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), mat);
            meshObj.renderOrder = 998;
            meshObj.userData.pulsePhase = Math.random() * Math.PI * 2;
            meshObj.userData.focus = 0;

            if (label) {
                const LW = 640, LH = 96;
                const lc = document.createElement('canvas');
                lc.width = LW; lc.height = LH;
                const lctx = lc.getContext('2d');
                lctx.font = '600 44px Inter, system-ui, sans-serif';
                let text = label;
                const maxText = LW - 40;
                if (lctx.measureText(text).width > maxText) {
                    while (text.length > 1 && lctx.measureText(text + '…').width > maxText) text = text.slice(0, -1);
                    text = text.trimEnd() + '…';
                }
                lctx.shadowColor = 'rgba(0,0,0,0.9)';
                lctx.shadowBlur = 12;
                lctx.textAlign = 'center';
                lctx.textBaseline = 'middle';
                lctx.fillStyle = '#ffffff';
                lctx.fillText(text, LW / 2, LH / 2);
                const ltex = new THREE.CanvasTexture(lc);
                ltex.colorSpace = THREE.SRGBColorSpace;
                ltex.anisotropy = 4;
                const lmat = new THREE.MeshBasicMaterial({ map: ltex, transparent: true, depthTest: false, side: THREE.DoubleSide, opacity: 0 });
                const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.5), lmat);
                labelMesh.position.set(0, -2.6, 0);
                labelMesh.renderOrder = 999;
                labelMesh.visible = false;
                meshObj.add(labelMesh);
                meshObj.userData.labelMesh = labelMesh;
            }
            return meshObj;
        };

        const hotspotPosition = (yawDeg, pitchDeg, r = 40) => {
            const yaw = THREE.MathUtils.degToRad(yawDeg);
            const pitch = THREE.MathUtils.degToRad(pitchDeg);
            const x = -r * Math.cos(pitch) * Math.sin(yaw);
            const y = r * Math.sin(pitch);
            const z = -r * Math.cos(pitch) * Math.cos(yaw);
            return new THREE.Vector3(x, y, z);
        };

        let hotspotMeshes = [];

        const clearHotspots = () => {
            hotspotMeshes.forEach((h) => {
                scene.remove(h);
                const lm = h.userData.labelMesh;
                if (lm) {
                    lm.geometry.dispose();
                    lm.material.map?.dispose();
                    lm.material.dispose();
                }
                h.geometry.dispose();
                h.material.map?.dispose();
                h.material.dispose();
            });
            hotspotMeshes = [];
        };

        const buildHotspots = (index) => {
            clearHotspots();
            const hs = scenes[index]?.hotspots;
            if (!hs || hs.length === 0) return;
            hs.forEach((h) => {
                const hm = makeHotspotMesh(h.label);
                hm.position.copy(hotspotPosition(h.yaw, h.pitch));
                hm.userData.action = () => {
                    fadeTo(1, 250);
                    setTimeout(() => {
                        navigateTo(h.targetIndex);
                    }, 260);
                };
                scene.add(hm);
                hotspotMeshes.push(hm);
            });
        };

        // ---------- 3D загвар (.glb) — TRIGGER-BASED арга ----------
        // Панорама зурган дээрх яг байршилд "наах" (fixed-position) оронд,
        // hotspot шиг жижиг "3D үзэх" товч харуулж, дарахад загвар камерын
        // урд (толгой хаашаа ч эргэсэн үргэлж нэг газарт) гарч ирнэ.
        // Давуу тал: байршил/хэмжээ таамаглах шаардлагагүй — bounding-box
        // ашиглан хэмжээг автоматаар camera-той тохируулна.
        // TODO(апп бүрэн болмогц): Хэрэв ирээдүйд объектыг панорама зурган дээрх
        // БОДИТ байршилд нь "наах" (жишээ нь хэрэглэгч зурган дээрх мэлхий чулуу
        // дээгүүр толгойгоо чиглүүлэхэд шууд гарч ирэх) хүсвэл, hotspotPosition-ийг
        // ашиглан world-space байрлал руу шилжүүлж, yaw/pitch/scale-ийг бодит
        // зурган дээр visually тааруулах "polish" ажил хийх шаардлагатай.
        const gltfLoader = new GLTFLoader();
        const modelCache = new Map(); // url -> THREE.Group (дахин ачаалахгүйн тулд)
        let modelTriggerMeshes = [];
        let active3dModel = null; // одоо камерт наасан, харагдаж буй загвар (эсвэл null)
        let active3dCloseBtn = null;
        let loadingIndicator = null;

        const makeModelTriggerMesh = (label) => {
            const canvas = document.createElement('canvas');
            canvas.width = 200; canvas.height = 160;
            const ctx = canvas.getContext('2d');
            const cx = 100, cy = 68, radius = 34;
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.3);
            glow.addColorStop(0, 'rgba(168,85,247,0.16)'); // ягаан (purple) — навигацийн amber-с ялгах
            glow.addColorStop(1, 'rgba(168,85,247,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
            // "3D куб" тэмдэг
            ctx.strokeStyle = 'rgba(255,255,255,0.95)';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 12, cy - 7); ctx.lineTo(cx + 12, cy + 7);
            ctx.lineTo(cx, cy + 14); ctx.lineTo(cx - 12, cy + 7); ctx.lineTo(cx - 12, cy - 7); ctx.closePath();
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy); ctx.moveTo(cx, cy); ctx.lineTo(cx + 12, cy - 7);
            ctx.moveTo(cx, cy); ctx.lineTo(cx - 12, cy - 7); ctx.stroke();
            if (label) {
                ctx.font = '400 15px sans-serif';
                const textWidth = ctx.measureText(label).width;
                const pillY = cy + radius + 20, pillW = textWidth + 20, pillH = 22;
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH, 11);
                else ctx.rect(cx - pillW / 2, pillY - pillH / 2, pillW, pillH);
                ctx.fill();
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.fillText(label, cx, pillY + 1);
            }
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: THREE.DoubleSide, opacity: 0.85 });
            const meshObj = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), mat);
            meshObj.renderOrder = 998;
            meshObj.userData.pulsePhase = Math.random() * Math.PI * 2;
            return meshObj;
        };

        const makeTextSprite = (text, color = '#ffffff') => {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 96;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 20, 512, 56, 16); ctx.fill(); }
            ctx.font = '32px sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 48);
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(1.6, 0.3, 1);
            sprite.renderOrder = 1001;
            return sprite;
        };

        const removeActive3dModel = () => {
            if (active3dModel) { camera.remove(active3dModel); active3dModel = null; }
            if (active3dCloseBtn) { camera.remove(active3dCloseBtn); active3dCloseBtn = null; }
        };

        const showModelInFrontOfCamera = (url) => {
            // Хэрэв аль хэдийн нээлттэй байвал — товчийг дахин дарахад хаана (toggle)
            if (active3dModel && active3dModel.userData.url === url) {
                removeActive3dModel();
                return;
            }
            removeActive3dModel();

            const dockObject = (srcObj) => {
                const obj = srcObj.clone(true);
                // Bounding box-оор дунджийг олж төвлөрүүлэх, хэмжээг camera-д тохирох болгож
                // автоматаар масштаблах — файл бүрийн жинхэнэ хэмжээ өөр өөр байсан ч
                // үргэлж ижил, тохиромжтой хэмжээгээр харагдана (таамаглах шаардлагагүй)
                const box = new THREE.Box3().setFromObject(obj);
                const size = new THREE.Vector3(); box.getSize(size);
                const center = new THREE.Vector3(); box.getCenter(center);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetSize = 1.6; // camera-ийн орон зайд ойролцоогоор ямар том харагдахыг тохируулна
                const scale = targetSize / maxDim;
                obj.position.sub(center.multiplyScalar(scale));
                obj.scale.setScalar(scale);
                obj.position.z += -3.2; // камерын урд, тогтмол зайд
                obj.position.y += -0.35;
                obj.userData.autoRotate = true;
                obj.userData.url = url;
                camera.add(obj);
                active3dModel = obj;

                const closeBtn = makeModelTriggerMesh('Хаах ✕');
                closeBtn.position.set(0, -0.35 - targetSize * 0.62, -3.2);
                closeBtn.userData.action = () => removeActive3dModel();
                camera.add(closeBtn);
                active3dCloseBtn = closeBtn;
            };

            if (modelCache.has(url)) {
                dockObject(modelCache.get(url));
                return;
            }

            if (loadingIndicator) camera.remove(loadingIndicator);
            loadingIndicator = makeTextSprite('3D загвар ачаалж байна...');
            loadingIndicator.position.set(0, -0.3, -3.2);
            camera.add(loadingIndicator);

            gltfLoader.load(url, (gltf) => {
                if (loadingIndicator) { camera.remove(loadingIndicator); loadingIndicator = null; }
                if (isCancelled) return;
                modelCache.set(url, gltf.scene);
                dockObject(gltf.scene);
            }, undefined, (err) => {
                if (loadingIndicator) { camera.remove(loadingIndicator); loadingIndicator = null; }
                console.warn('3D загвар ачаалахад алдаа гарлаа:', url, err);
            });
        };

        const clearModelTriggers = () => {
            modelTriggerMeshes.forEach((m) => {
                scene.remove(m);
                m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose();
            });
            modelTriggerMeshes = [];
        };

        const buildModels3d = (index) => {
            clearModelTriggers();
            removeActive3dModel(); // scene солиход өмнөх нээлттэй загварыг хаана
            const models = scenes[index]?.models3d;
            if (!models || models.length === 0) return;
            models.forEach((m) => {
                const trigger = makeModelTriggerMesh(m.label || '3D үзэх');
                // Trigger товчны байрлал бол зөвхөн "анзаарагдах цэг" тул нарийн
                // тааруулах шаардлагагүй — өгөгдөлд заагаагүй бол анхны утга ашиглана
                trigger.position.copy(hotspotPosition(m.triggerYaw ?? 0, m.triggerPitch ?? -8, 30));
                trigger.userData.action = () => showModelInFrontOfCamera(m.url);
                scene.add(trigger);
                modelTriggerMeshes.push(trigger);
            });
        };

        // Dock: харагчийн өмнө ~1 м, нүднээс ~27° доош, орон зайд тогтмол. Толгойгоо
        // хол эргүүлэхэд аажим дагаж ирнэ; доош харах эсвэл туяагаар онилоход тодорно.
        const DOCK_W = 0.84, DOCK_H = 0.15, DOCK_DIST = 1.0, DOCK_DROP = 0.5;
        const dock = new THREE.Group();
        dock.visible = false;
        scene.add(dock);

        const dockCanvas = document.createElement('canvas');
        dockCanvas.width = 1024; dockCanvas.height = Math.round((1024 * DOCK_H) / DOCK_W);
        const dockTex = new THREE.CanvasTexture(dockCanvas);
        dockTex.colorSpace = THREE.SRGBColorSpace;
        const dockBg = new THREE.Mesh(
            new THREE.PlaneGeometry(DOCK_W, DOCK_H),
            new THREE.MeshBasicMaterial({ map: dockTex, transparent: true, depthTest: false, side: THREE.DoubleSide })
        );
        dockBg.renderOrder = 1000;
        dock.add(dockBg);

        const drawDock = (title, position) => {
            const ctx = dockCanvas.getContext('2d');
            const W = dockCanvas.width, H = dockCanvas.height;
            ctx.clearRect(0, 0, W, H);
            roundRectPath(ctx, 2, 2, W - 4, H - 4, (H - 4) / 2);
            ctx.fillStyle = 'rgba(12,18,32,0.82)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Байршлын нэр + дугаар (зүүн тал; товчнууд баруун талд)
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 38px Inter, system-ui, sans-serif';
            ctx.fillText(fitText(ctx, title, W * 0.36), 64, H * 0.4);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '30px Inter, system-ui, sans-serif';
            ctx.fillText(position, 64, H * 0.72);
            dockTex.needsUpdate = true;
        };

        const btnPrev = makeButtonMesh('prev', t.vrPrevSpot || 'Өмнөх');
        const btnNext = makeButtonMesh('next', t.vrNextSpot || 'Дараах', true);
        const btnInfo = makeButtonMesh('info', t.vrMore || 'Мэдээлэл');
        const btnExit = makeButtonMesh('exit', t.vrExitVr || 'Гарах');
        [[btnPrev, 0.06], [btnNext, 0.16], [btnInfo, 0.265], [btnExit, 0.355]].forEach(([btn, x]) => {
            btn.position.set(x, 0, 0.002);
            dock.add(btn);
        });

        // Онилсон товчны нэр — dock-ийн дээр жижиг шошго
        const tipCanvas = document.createElement('canvas');
        tipCanvas.width = 512; tipCanvas.height = 96;
        const tipTex = new THREE.CanvasTexture(tipCanvas);
        tipTex.colorSpace = THREE.SRGBColorSpace;
        const tip = new THREE.Mesh(
            new THREE.PlaneGeometry(0.32, 0.06),
            new THREE.MeshBasicMaterial({ map: tipTex, transparent: true, depthTest: false, side: THREE.DoubleSide })
        );
        tip.renderOrder = 1002;
        tip.visible = false;
        dock.add(tip);
        let tipFor = null;
        const setTip = (btn) => {
            if (btn === tipFor) return;
            tipFor = btn;
            tip.visible = Boolean(btn);
            if (!btn) return;
            const ctx = tipCanvas.getContext('2d');
            ctx.clearRect(0, 0, 512, 96);
            ctx.font = '600 40px Inter, system-ui, sans-serif';
            const label = fitText(ctx, btn.userData.label, 440);
            const w = ctx.measureText(label).width + 56;
            roundRectPath(ctx, 256 - w / 2, 12, w, 72, 36);
            ctx.fillStyle = 'rgba(12,18,32,0.9)';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 256, 49);
            tipTex.needsUpdate = true;
            tip.position.set(btn.position.x, DOCK_H / 2 + 0.045, 0.003);
        };

        // Мэдээллийн самбар: нээх үед нүдний түвшинд, харагчийн өмнө тогтоно
        const infoPanelMat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, side: THREE.DoubleSide });
        const infoPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), infoPanelMat);
        infoPanel.visible = false;
        infoPanel.renderOrder = 999;
        scene.add(infoPanel);

        const headPos = new THREE.Vector3();
        const headDir = new THREE.Vector3();
        const dockTarget = new THREE.Vector3();
        const dockState = { yaw: 0, place: true, opacity: 0, hover: false };
        const wrapAngle = (x) => Math.atan2(Math.sin(x), Math.cos(x));

        const updateInfoPanelText = (title, text) => {
            const oldMap = infoPanelMat.map;
            infoPanelMat.map = createInfoTexture(title, text);
            infoPanelMat.needsUpdate = true;
            if (oldMap) oldMap.dispose();
            const current = scenes[currentIndexRef.current];
            const siteScenes = scenes.filter((sc) => sc.siteId === current?.siteId);
            const pos = siteScenes.indexOf(current) + 1;
            drawDock(title, siteScenes.length > 1 ? pos + ' / ' + siteScenes.length : '360°');
        };

        const toggleInfoPanel = () => {
            if (infoPanel.visible) {
                infoPanel.visible = false;
                return;
            }
            camera.getWorldPosition(headPos);
            infoPanel.position.set(headPos.x + Math.sin(dockState.yaw) * 1.3, headPos.y + 0.05, headPos.z + Math.cos(dockState.yaw) * 1.3);
            infoPanel.lookAt(headPos);
            infoPanel.visible = true;
        };

        const updateDock = () => {
            camera.getWorldPosition(headPos);
            camera.getWorldDirection(headDir);
            const yaw = Math.atan2(headDir.x, headDir.z);
            const pitch = Math.asin(THREE.MathUtils.clamp(headDir.y, -1, 1));
            const diff = wrapAngle(yaw - dockState.yaw);
            if (dockState.place) dockState.yaw = yaw;
            else if (Math.abs(diff) > 0.75) dockState.yaw = wrapAngle(dockState.yaw + diff * 0.05);
            dockTarget.set(headPos.x + Math.sin(dockState.yaw) * DOCK_DIST, headPos.y - DOCK_DROP, headPos.z + Math.cos(dockState.yaw) * DOCK_DIST);
            if (dockState.place) dock.position.copy(dockTarget);
            else dock.position.lerp(dockTarget, 0.12);
            dockState.place = false;
            dock.lookAt(headPos);
            // Урагш харж байхад бүдэг (үзэгдэлд саад болохгүй), доош харах/онилоход бүрэн тод
            const want = pitch < -0.2 || dockState.hover ? 1 : 0.35;
            dockState.opacity += (want - dockState.opacity) * 0.15;
            dock.children.forEach((m) => { m.material.opacity = dockState.opacity; });
        };

        const animateClick = (btn, action) => {
            btn.scale.set(0.8, 0.8, 0.8);
            setTimeout(() => { if (btn) btn.scale.set(1.0, 1.0, 1.0); }, 150);
            if (action) action();
        };

        btnPrev.userData.action = () => animateClick(btnPrev, () => goTo(-1));
        btnNext.userData.action = () => animateClick(btnNext, () => goTo(1));
        btnInfo.userData.action = () => animateClick(btnInfo, toggleInfoPanel);
        btnExit.userData.action = () => animateClick(btnExit, () => renderer.xr.getSession()?.end());

        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();
        const uiTargets = [btnPrev, btnNext, btnInfo, btnExit];
        const controllers = [];

        const makeController = (index) => {
            const controller = renderer.xr.getController(index);
            controller.addEventListener('select', () => {
                scene.updateMatrixWorld(true);
                tempMatrix.identity().extractRotation(controller.matrixWorld);
                raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
                raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                const allTargets = uiTargets.concat(hotspotMeshes, modelTriggerMeshes, active3dCloseBtn ? [active3dCloseBtn] : []);
                const hits = raycaster.intersectObjects(allTargets, false);
                if (hits.length > 0) hits[0].object.userData.action?.();
            });
            const rayGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -3),
            ]);
            const rayLine = new THREE.Line(rayGeom, new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 }));
            controller.add(rayLine);
            scene.add(controller);
            controllers.push(controller);
            return controller;
        };
        const controller0 = makeController(0);
        const controller1 = makeController(1);

        // ---------- Desktop/mobile: hotspot дээр ДАРАХ (drag-аас ялгаж) ----------
        const isPresentingRef = { current: false };
        const pointerNdc = new THREE.Vector2();
        let pointerDownPos = null;
        let pointerDownTime = 0;

        const onPointerDown = (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
            pointerDownTime = performance.now();
        };
        const onPointerUp = (e) => {
            if (!pointerDownPos) return;
            const dx = e.clientX - pointerDownPos.x;
            const dy = e.clientY - pointerDownPos.y;
            const moved = Math.sqrt(dx * dx + dy * dy);
            const elapsed = performance.now() - pointerDownTime;
            pointerDownPos = null;
            if (moved > 8 || elapsed > 500 || isPresentingRef.current) return;
            const clickTargets = hotspotMeshes.concat(modelTriggerMeshes, active3dCloseBtn ? [active3dCloseBtn] : []);
            if (clickTargets.length === 0) return;

            const rect = renderer.domElement.getBoundingClientRect();
            pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointerNdc, camera);
            const hits = raycaster.intersectObjects(clickTargets, false);
            if (hits.length > 0) hits[0].object.userData.action?.();
        };
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointerup', onPointerUp);

        const onSessionStart = () => {
            setIsPresenting(true);
            isPresentingRef.current = true;
            controls.enabled = false;
            dock.visible = true;
            dockState.place = true;
            dockState.opacity = 0;
        };
        const onSessionEnd = () => {
            setIsPresenting(false);
            isPresentingRef.current = false;
            controls.enabled = true;
            dock.visible = false;
            infoPanel.visible = false;
            setTip(null);
        };
        renderer.xr.addEventListener('sessionstart', onSessionStart);
        renderer.xr.addEventListener('sessionend', onSessionEnd);

        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (!isCancelled) setXrSupported(supported);
            }).catch(() => { if (!isCancelled) setXrSupported(false); });
        } else {
            setXrSupported(false);
        }
        // three.js-ийн VRButton-той ижил session тохиргоо — товчийг өөрсдийн UI-д байрлуулна
        const enterVR = async () => {
            if (renderer.xr.getSession()) return renderer.xr.getSession().end();
            try {
                const session = await navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'layers'],
                });
                await renderer.xr.setSession(session);
            } catch (err) {
                console.error('WebXR session failed', err);
            }
        };

        // ---------- Cardboard / VR Box: хоёр нүдний дүрс + ширтэж сонгох ----------
        const stereo = new StereoEffect(renderer);
        stereo.setEyeSeparation(0.064);
        const cardboardState = { on: false, target: null, since: 0, savedFov: camera.fov };
        const screenCenter = new THREE.Vector2(0, 0);
        const setReticle = (progress) => {
            reticleRefs.current.forEach((el) => el && el.style.setProperty('--p', `${Math.round(progress * 360)}deg`));
        };
        const updateGaze = () => {
            raycaster.setFromCamera(screenCenter, camera);
            const targets = hotspotMeshes.concat(modelTriggerMeshes, active3dCloseBtn ? [active3dCloseBtn] : []);
            const hit = raycaster.intersectObjects(targets, false)[0]?.object || null;
            const now = performance.now();
            if (hit !== cardboardState.target) {
                cardboardState.target = hit;
                cardboardState.since = now;
            }
            const progress = hit ? Math.min(1, (now - cardboardState.since) / GAZE_MS) : 0;
            setReticle(progress);
            if (hit && progress >= 1) {
                cardboardState.target = null;
                setReticle(0);
                hit.userData.action?.();
            }
        };
        const setCardboardMode = (on) => {
            cardboardState.on = on;
            cardboardState.target = null;
            if (on) {
                cardboardState.savedFov = camera.fov;
                camera.fov = 90;
            } else {
                camera.fov = cardboardState.savedFov;
                // StereoEffect viewport-ыг баруун хагаст үлдээдэг тул бүтэн хэмжээг сэргээнэ
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
            camera.updateProjectionMatrix();
            setReticle(0);
        };

        buildHotspots(currentIndexRef.current);
        buildModels3d(currentIndexRef.current);

        // Хулганаар hotspot дээр очиход нэрийг нь харуулж, cursor-ыг солино
        const viewDir = new THREE.Vector3();
        const hotspotDir = new THREE.Vector3();
        const hoverNdc = new THREE.Vector2();
        const hoverRay = new THREE.Raycaster();
        let pointerHover = null;
        const onHoverMove = (e) => {
            if (e.pointerType === 'touch') return;
            const rect = renderer.domElement.getBoundingClientRect();
            hoverNdc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            hoverRay.setFromCamera(hoverNdc, camera);
            pointerHover = hoverRay.intersectObjects(hotspotMeshes, false)[0]?.object || null;
            renderer.domElement.style.cursor = pointerHover ? 'pointer' : '';
        };
        const onHoverLeave = () => {
            pointerHover = null;
            renderer.domElement.style.cursor = '';
        };
        renderer.domElement.addEventListener('pointermove', onHoverMove);
        renderer.domElement.addEventListener('pointerleave', onHoverLeave);

        renderer.setAnimationLoop(() => {
            if (isCancelled) return;
            if (controls.enabled) controls.update();
            updateGyro();

            const pulseTime = performance.now() / 1000;
            camera.getWorldDirection(viewDir);
            hotspotMeshes.forEach((h) => {
                h.lookAt(camera.position);
                // Нэр харуулах эсэх: хулгана/controller-оор онсон, эсвэл дэлгэцийн голд ойр (~9°)
                const centered = hotspotDir.copy(h.position).normalize().dot(viewDir) > 0.988;
                const target = h === pointerHover || h.userData.xrHover || centered ? 1 : 0;
                h.userData.focus += (target - h.userData.focus) * 0.18;
                const f = h.userData.focus;
                // Зөөлөн "амьсгалах" эффект + онох үед томрох
                const s = 1 + 0.06 * Math.sin(pulseTime * 1.4 + (h.userData.pulsePhase || 0)) + 0.25 * f;
                h.scale.set(s, s, s);
                const lm = h.userData.labelMesh;
                if (lm) {
                    lm.material.opacity = f;
                    lm.visible = f > 0.02;
                    lm.scale.setScalar(1 / s);
                }
            });

            // Идэвхтэй нээлттэй 3D загварыг аажим эргүүлж, "амьд" мэдрэмж өгнө
            if (active3dModel && active3dModel.userData.autoRotate) {
                active3dModel.rotation.y += 0.006;
            }
            modelTriggerMeshes.forEach((h) => {
                h.lookAt(camera.position);
                const s = 1 + 0.06 * Math.sin(pulseTime * 1.4 + (h.userData.pulsePhase || 0)) + (h.userData.hoverBoost || 0);
                h.scale.set(s, s, s);
            });

            if (dock.visible) updateDock();

            if (dock.visible && controllers.length > 0) {
                let hoveredObj = null;
                scene.updateMatrixWorld(true);
                const hoverTargets = uiTargets.concat([dockBg], hotspotMeshes, modelTriggerMeshes, active3dCloseBtn ? [active3dCloseBtn] : []);
                for (let c of controllers) {
                    tempMatrix.identity().extractRotation(c.matrixWorld);
                    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    const hits = raycaster.intersectObjects(hoverTargets, false);
                    if (hits.length > 0) { hoveredObj = hits[0].object; break; }
                }
                let dockHover = null;
                uiTargets.forEach((btn) => {
                    const on = btn === hoveredObj;
                    if (on) dockHover = btn;
                    btn.material.color.setHex(on ? 0xffffff : 0xd6d6d6);
                    if (btn.scale.x < 0.9) return;
                    btn.scale.setScalar(on ? 1.12 : 1.0);
                });
                dockState.hover = Boolean(dockHover) || hoveredObj === dockBg;
                setTip(dockHover);
                hotspotMeshes.forEach((h) => {
                    h.userData.xrHover = h === hoveredObj;
                });
                modelTriggerMeshes.forEach((h) => {
                    if (h !== hoveredObj) h.userData.hoverBoost = 0;
                    else h.userData.hoverBoost = 0.15;
                });
                if (active3dCloseBtn) {
                    active3dCloseBtn.scale.setScalar(active3dCloseBtn === hoveredObj ? 1.15 : 1.0);
                }
            }

            if (cardboardState.on && !renderer.xr.isPresenting) {
                updateGaze();
                stereo.render(scene, camera);
            } else {
                renderer.render(scene, camera);
            }
        });

        const resizeObserver = new ResizeObserver((entries) => {
            if (!container || isCancelled) return;
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    renderer.setSize(width, height);
                }
            }
        });
        resizeObserver.observe(container);

        sceneStateRef.current = {
            loadTexture,
            fadeTo,
            updateInfoPanelText,
            buildHotspots,
            buildModels3d,
            applyEnhance,
            zoomBy: (delta) => setFov(camera.fov + delta),
            setAutoRotate: (on) => {
                controls.autoRotate = on;
            },
            setGyro,
            enterVR,
            setCardboardMode,
        };

        return () => {
            isCancelled = true;
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('pointerdown', onTouchDown);
            renderer.domElement.removeEventListener('pointermove', onTouchMove);
            renderer.domElement.removeEventListener('pointermove', onHoverMove);
            renderer.domElement.removeEventListener('pointerleave', onHoverLeave);
            window.removeEventListener('pointerup', onTouchUp);
            window.removeEventListener('pointercancel', onTouchUp);
            window.removeEventListener('deviceorientation', onOrientation);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            renderer.domElement.removeEventListener('pointerup', onPointerUp);
            renderer.xr.removeEventListener('sessionstart', onSessionStart);
            renderer.xr.removeEventListener('sessionend', onSessionEnd);
            resizeObserver.disconnect();
            renderer.setAnimationLoop(null);
            clearHotspots();
            clearModelTriggers();
            removeActive3dModel();
            renderer.dispose();
            controls.dispose();
            if (material.map) material.map.dispose();
            material.dispose();
            geometry.dispose();
            scene.clear();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenes]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            if (sceneStateRef.current?.updateInfoPanelText) {
                sceneStateRef.current.updateInfoPanelText(scenes[currentIndex]?.name, scenes[currentIndex]?.description);
            }
            return;
        }

        const state = sceneStateRef.current;
        if (!state?.loadTexture) return;

        state.fadeTo(1, 250);
        const timer = setTimeout(() => {
            state.loadTexture(scenes[currentIndex].url, false);
            state.buildHotspots?.(currentIndex);
            state.buildModels3d?.(currentIndex);
            if (state.updateInfoPanelText) {
                state.updateInfoPanelText(scenes[currentIndex]?.name, scenes[currentIndex]?.description);
            }
            state.fadeTo(0, 300);
        }, 260);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    // ---------- UI төлөв ↔ three.js ----------
    useEffect(() => {
        setViewPrefs(readViewPrefs());
        setGyroAvailable(typeof window.DeviceOrientationEvent !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
        try {
            if (showControls && !localStorage.getItem(HINT_KEY)) setShowHint(true);
        } catch {}
    }, [showControls]);

    useEffect(() => {
        try {
            localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(viewPrefs));
        } catch {}
        sceneStateRef.current.applyEnhance?.();
    }, [viewPrefs]);

    useEffect(() => {
        sceneStateRef.current.setAutoRotate?.(autoRotate);
    }, [autoRotate]);

    const toggleGyro = async () => {
        const next = !gyroOn;
        if (next && typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
            try {
                if ((await window.DeviceOrientationEvent.requestPermission()) !== 'granted') return;
            } catch {
                return;
            }
        }
        sceneStateRef.current.setGyro?.(next);
        setGyroOn(next);
        if (next) setAutoRotate(false);
    };

    useEffect(() => {
        const update = () => setPortrait(window.innerHeight > window.innerWidth);
        update();
        setIsPhone(window.matchMedia('(pointer: coarse)').matches);
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const enterCardboard = async () => {
        setShowVrMenu(false);
        // iOS-д гироскопын зөвшөөрлийг товч дарсан даруйд асуух ёстой. Зөвшөөрөөгүй (эсвэл
        // мэдрэгчгүй) бол горим асаалттай хэвээр, харин хуруугаар чирж эргүүлнэ.
        let gyroAllowed = true;
        if (typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
            try {
                gyroAllowed = (await window.DeviceOrientationEvent.requestPermission()) === 'granted';
            } catch {
                gyroAllowed = false;
            }
        }
        const restore = { gyroWasOn: gyroOn, wakeLock: null };
        cardboardRestoreRef.current = restore;
        if (gyroAllowed) {
            sceneStateRef.current.setGyro?.(true);
            setGyroOn(true);
        }
        setAutoRotate(false);
        // Fullscreen, чиглэл түгжих, дэлгэц унтрахгүй байх — зарим браузерт promise хэзээ ч
        // дуусахгүй тул хүлээлгүй (fire-and-forget) дуудна
        const fs = document.documentElement.requestFullscreen?.();
        Promise.resolve(fs)
            .then(() => window.screen.orientation?.lock?.('landscape'))
            .catch(() => {});
        navigator.wakeLock?.request('screen').then((lock) => (restore.wakeLock = lock)).catch(() => {});
        sceneStateRef.current.setCardboardMode?.(true);
        setCardboard(true);
    };

    const exitCardboard = useCallback(() => {
        const restore = cardboardRestoreRef.current;
        cardboardRestoreRef.current = null;
        sceneStateRef.current.setCardboardMode?.(false);
        if (!restore?.gyroWasOn) {
            sceneStateRef.current.setGyro?.(false);
            setGyroOn(false);
        }
        restore?.wakeLock?.release?.().catch(() => {});
        try {
            window.screen.orientation?.unlock?.();
        } catch {}
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setCardboard(false);
    }, []);

    useEffect(() => () => cardboardRestoreRef.current && exitCardboard(), [exitCardboard]);

    const shareUrl =
        typeof window !== 'undefined' && scenes[currentIndex]
            ? `${window.location.origin}/tours?site=${scenes[currentIndex].siteId}`
            : '';
    const qrMarkup = useMemo(() => (showVrMenu && shareUrl ? qrSvg(shareUrl) : ''), [showVrMenu, shareUrl]);

    const dismissHint = () => {
        setShowHint(false);
        try {
            localStorage.setItem(HINT_KEY, '1');
        } catch {}
    };

    useEffect(() => {
        if (!showControls) return;
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea, select')) return;
            if (e.key === 'Escape' && cardboardRestoreRef.current) {
                e.stopImmediatePropagation();
                exitCardboard();
                return;
            }
            if (e.key === 'ArrowLeft') goTo(-1);
            else if (e.key === 'ArrowRight') goTo(1);
            else if (e.key === '+' || e.key === '=') sceneStateRef.current.zoomBy?.(-8);
            else if (e.key === '-') sceneStateRef.current.zoomBy?.(8);
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [showControls, goTo, exitCardboard]);

    const siteScenes = useMemo(() => {
        const siteId = scenes[currentIndex]?.siteId;
        return scenes.map((s, index) => ({ ...s, index })).filter((s) => s.siteId === siteId);
    }, [scenes, currentIndex]);
    const scenePosition = siteScenes.findIndex((s) => s.index === currentIndex) + 1;

    useEffect(() => {
        stripRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [currentIndex, uiHidden]);

    const railButton = (key, { icon, label, onClick, active = false }) => (
        <button
            key={key}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={clsx(
                'w-10 h-10 shrink-0 rounded-full flex items-center justify-center border backdrop-blur-md transition-colors',
                active ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-glass/70 text-white border-white/15 hover:bg-glass/90'
            )}
        >
            <i className={`fa-solid ${icon} text-sm`} aria-hidden="true"></i>
        </button>
    );

    const controlsVisible = showControls && !isPresenting && !cardboard;

    return (
        <div className={clsx('bg-black overflow-hidden', cardboard ? 'fixed inset-0 z-[60]' : 'relative w-full h-full')}>
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 pointer-events-none">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl" aria-hidden="true"></i>
                    <span className="text-xs font-semibold tracking-wide">{t.vrLoading || 'Loading 360°'}</span>
                </div>
            )}

            {controlsVisible && uiHidden && (
                <button
                    type="button"
                    onClick={onToggleUi}
                    aria-label={t.vrShowUI}
                    title={t.vrShowUI}
                    className="absolute right-3 bottom-4 z-40 w-11 h-11 rounded-full bg-glass/70 border border-white/20 text-white backdrop-blur-md flex items-center justify-center"
                >
                    <i className="fa-solid fa-eye" aria-hidden="true"></i>
                </button>
            )}

            {controlsVisible && !uiHidden && (
                <>
                    {/* Баруун талын хяналт */}
                    <div
                        className="absolute right-3 top-[72px] z-40 flex flex-col gap-1.5 overflow-y-auto no-scrollbar"
                        style={{ maxHeight: `calc(100% - ${72 + bottomInset + (siteScenes.length > 1 ? 118 : 8)}px)` }}
                    >
                        {railButton('vr', { icon: 'fa-vr-cardboard', label: t.vrMenuTitle, active: showVrMenu, onClick: () => setShowVrMenu((v) => !v) })}
                        {railButton('zin', { icon: 'fa-plus', label: t.vrZoomIn, onClick: () => sceneStateRef.current.zoomBy?.(-10) })}
                        {railButton('zout', { icon: 'fa-minus', label: t.vrZoomOut, onClick: () => sceneStateRef.current.zoomBy?.(10) })}
                        {railButton('rot', { icon: 'fa-rotate', label: t.vrAutoRotate, active: autoRotate, onClick: () => setAutoRotate((v) => !v) })}
                        {gyroAvailable && railButton('gyro', { icon: 'fa-mobile-screen-button', label: t.vrGyro, active: gyroOn, onClick: toggleGyro })}
                        {railButton('light', { icon: 'fa-sun', label: t.vrBrightness, active: showLight, onClick: () => setShowLight((v) => !v) })}
                        {railButton('help', { icon: 'fa-circle-question', label: t.vrHelp, onClick: () => setShowHint(true) })}
                        {onToggleUi && railButton('hide', { icon: 'fa-eye-slash', label: t.vrHideUI, onClick: onToggleUi })}
                    </div>

                    {/* Гэрэлтүүлэг / сайжруулалт */}
                    {showLight && (
                        <div className="absolute right-16 top-[72px] z-40 w-60 rounded-2xl bg-navy/95 backdrop-blur-lg border border-white/10 p-4 text-white shadow-2xl">
                            <div className="flex items-center justify-between text-xs font-semibold mb-2">
                                <span>{t.vrBrightness}</span>
                                <span className="text-amber-400">{Math.round(viewPrefs.brightness * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.6"
                                max="1.6"
                                step="0.05"
                                value={viewPrefs.brightness}
                                onChange={(e) => setViewPrefs((p) => ({ ...p, brightness: Number(e.target.value) }))}
                                aria-label={t.vrBrightness}
                                className="w-full accent-amber-500"
                            />
                            <label className="mt-3 flex items-center justify-between gap-3 text-xs cursor-pointer">
                                <span>{t.vrEnhance}</span>
                                <input
                                    type="checkbox"
                                    checked={viewPrefs.enhance}
                                    onChange={(e) => setViewPrefs((p) => ({ ...p, enhance: e.target.checked }))}
                                    className="w-4 h-4 accent-amber-500"
                                />
                            </label>
                        </div>
                    )}

                    {hdLoading && (
                        <div className="absolute left-3 top-[76px] z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur text-[10px] font-bold text-white/80 pointer-events-none">
                            <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> HD
                        </div>
                    )}

                    {/* Энэ дурсгалын байршлууд */}
                    {siteScenes.length > 1 && (
                        <div className="absolute left-0 right-0 z-30 px-3" style={{ bottom: bottomInset }}>
                            <div className="px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 drop-shadow">
                                {t.vrScenes} · {scenePosition}/{siteScenes.length}
                            </div>
                            <div ref={stripRef} className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1">
                                {siteScenes.map((sc) => {
                                    const active = sc.index === currentIndex;
                                    const thumb = panoramaMeta[sc.url]?.thumb;
                                    return (
                                        <button
                                            key={sc.index}
                                            type="button"
                                            data-active={active}
                                            aria-current={active ? 'true' : undefined}
                                            onClick={() => navigateTo(sc.index)}
                                            className={clsx(
                                                'snap-start shrink-0 w-[112px] rounded-xl overflow-hidden border text-left bg-black/55 backdrop-blur-md transition-all',
                                                active ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/15 opacity-80 hover:opacity-100'
                                            )}
                                        >
                                            {thumb ? (
                                                <img src={thumb} alt="" loading="lazy" className="w-full h-14 object-cover" />
                                            ) : (
                                                <div className="w-full h-14 bg-white/10" />
                                            )}
                                            <span className="block px-2 py-1 h-[30px] text-[10px] leading-tight text-white line-clamp-2">{sc.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {showVrMenu && controlsVisible && (
                <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-4" onClick={() => setShowVrMenu(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vr-menu-title"
                        className="w-full max-w-sm max-h-[85%] overflow-y-auto rounded-2xl bg-navy/95 border border-white/10 p-4 text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 id="vr-menu-title" className="font-heading text-lg font-bold">{t.vrMenuTitle}</h3>
                            <button type="button" onClick={() => setShowVrMenu(false)} aria-label={t.vrLess} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div className="space-y-2">
                            {xrSupported && (
                                <button type="button" onClick={() => { setShowVrMenu(false); sceneStateRef.current.enterVR?.(); }} className="w-full flex items-start gap-3 p-3 rounded-xl bg-amber-500 text-slate-900 text-left">
                                    <i className="fa-solid fa-vr-cardboard text-lg mt-0.5" aria-hidden="true"></i>
                                    <span><span className="block text-sm font-bold">{t.vrHeadsetHere}</span><span className="block text-xs opacity-80">{t.vrHeadsetHereDesc}</span></span>
                                </button>
                            )}
                            {isPhone && (
                                <button type="button" onClick={enterCardboard} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.06] border border-white/10 text-left hover:bg-white/10">
                                    <i className="fa-solid fa-glasses text-lg text-amber-400 mt-0.5" aria-hidden="true"></i>
                                    <span><span className="block text-sm font-bold">{t.vrCardboard}</span><span className="block text-xs text-slate-300">{t.vrCardboardDesc}</span></span>
                                </button>
                            )}
                            <a
                                href={`https://www.oculus.com/open_url/?url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.06] border border-white/10 text-left hover:bg-white/10"
                            >
                                <i className="fa-brands fa-meta text-lg text-sky-400 mt-0.5" aria-hidden="true"></i>
                                <span><span className="block text-sm font-bold">{t.vrSendQuest}</span><span className="block text-xs text-slate-300">{t.vrSendQuestDesc}</span></span>
                            </a>
                        </div>
                        {qrMarkup && (
                            <div className="mt-4 flex items-center gap-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                                <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-white p-1" aria-label="QR" dangerouslySetInnerHTML={{ __html: qrMarkup }} />
                                <p className="text-xs text-slate-300 leading-relaxed">{t.vrScanQr}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {cardboard && (
                <>
                    {/* Нүд бүрийн голд ширтэх цэг — сум дээр ширтэхэд дугуй дүүрнэ */}
                    {[25, 75].map((left, i) => (
                        <div
                            key={left}
                            ref={(el) => (reticleRefs.current[i] = el)}
                            className="absolute top-1/2 z-50 w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                            style={{
                                left: `${left}%`,
                                '--p': '0deg',
                                background: 'conic-gradient(#f59e0b var(--p), rgba(255,255,255,0.35) 0)',
                                WebkitMask: 'radial-gradient(circle, transparent 7px, #000 8px)',
                                mask: 'radial-gradient(circle, transparent 7px, #000 8px)',
                            }}
                        />
                    ))}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/25 z-40 pointer-events-none" />
                    <button
                        type="button"
                        onClick={exitCardboard}
                        className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white text-xs font-semibold"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i> {t.vrExitCardboard}
                    </button>
                    {portrait && (
                        <div className="absolute inset-0 z-[55] flex flex-col items-center justify-center gap-4 bg-black/85 text-white text-center p-6">
                            <i className="fa-solid fa-mobile-screen-button text-5xl rotate-90" aria-hidden="true"></i>
                            <p className="text-sm max-w-xs">{t.vrRotateHint}</p>
                            <p className="text-xs text-slate-400 max-w-xs">{t.vrGazeHint}</p>
                            <button type="button" onClick={exitCardboard} className="btn btn-secondary px-5 py-2">{t.vrExitCardboard}</button>
                        </div>
                    )}
                </>
            )}

            {showHint && controlsVisible && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-6" onClick={dismissHint}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pano-hint-title"
                        className="w-full max-w-xs rounded-2xl bg-navy/95 border border-white/10 p-5 text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="pano-hint-title" className="font-heading text-lg font-bold mb-4">{t.vrHintTitle}</h3>
                        <ul className="space-y-3 text-sm text-slate-200">
                            <li className="flex gap-3"><i className="fa-solid fa-hand-pointer text-amber-400 w-5 mt-0.5" aria-hidden="true"></i>{t.vrHintDrag}</li>
                            <li className="flex gap-3"><i className="fa-solid fa-magnifying-glass-plus text-amber-400 w-5 mt-0.5" aria-hidden="true"></i>{t.vrHintZoom}</li>
                            <li className="flex gap-3"><i className="fa-solid fa-circle-arrow-up text-amber-400 w-5 mt-0.5" aria-hidden="true"></i>{t.vrHintHotspot}</li>
                            {xrSupported === false && (
                                <li className="flex gap-3 text-xs text-slate-400"><i className="fa-solid fa-vr-cardboard w-5 mt-0.5" aria-hidden="true"></i>{t.vrQuestHint}</li>
                            )}
                        </ul>
                        <button type="button" onClick={dismissHint} className="btn btn-primary w-full mt-5">{t.vrHintGotIt}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
