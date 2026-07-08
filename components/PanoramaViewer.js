'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

/**
 * PanoramaViewer — VR-native 360° харагч
 *
 * ШИНЭ БОЛОМЖУУД (2026-07 сайжруулалт):
 * 1. VR session-той зөрчилдөж байсан OrbitControls-ыг session эхлэхэд автоматаар унтраана
 * 2. Headset дотор controller (trigger)-оор дарж болох 3D navigation UI
 *    (Өмнөх / Дараах / Гарах) — HTML overlay биш, THREE.js dэx бодит 3D объект тул VR дотор харагдана
 * 3. Тайван "fade to black" шилжилт — толгой эргэх мэдрэмжгүй, шууд солигдохгүй
 * 4. Олон панорама (scenes array)-ийг нэг viewer дотор шилжүүлэх боломж — VR-ээс гарахгүйгээр
 *    дараагийн дурсгал руу шилждэг
 *
 * PROPS:
 * - scenes: [{ url, name, description }] — панорама бүхий дурсгалуудын жагсаалт
 * - initialIndex: эхлэх индекс (default 0)
 * - onIndexChange: (index) => void — flat 2D horizontal UI-д зориулсан callback (info overlay update хийхэд)
 */
export default function PanoramaViewer({ scenes, initialIndex = 0, onIndexChange }) {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [isPresenting, setIsPresenting] = useState(false); // XR session идэвхтэй эсэх
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showDragHint, setShowDragHint] = useState(true);
    const [xrSupported, setXrSupported] = useState(null); // null = шалгаж байна, true/false = үр дүн

    // Refs — эффект дотор бус, callback дотор шинэ утга ашиглах шаардлагатай тул ref-ээр дамжуулна
    const currentIndexRef = useRef(initialIndex);
    const sceneStateRef = useRef({}); // three.js объектуудыг effect хооронд хадгална
    const isFirstRun = useRef(true);

    const goTo = useCallback((delta) => {
        const next = currentIndexRef.current + delta;
        if (next < 0 || next >= scenes.length) return;
        currentIndexRef.current = next;
        setCurrentIndex(next);
        onIndexChange?.(next);
    }, [scenes.length, onIndexChange]);

    // Parent UI (VirtualTour 2D buttons) өөрчлөгдөхөд дотоод state-ийг синхрончилно
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
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'Anonymous';

        // ---------- Fade overlay (тайван шилжилт) ----------
        // Камерын өмнө байрлах хар бөмбөгөр — opacity-г 0↔1 болгож fade хийнэ
        const fadeGeometry = new THREE.SphereGeometry(1, 16, 16);
        const fadeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide,
            transparent: true,
            opacity: 1,
            depthTest: false,
        });
        const fadeMesh = new THREE.Mesh(fadeGeometry, fadeMaterial);
        fadeMesh.renderOrder = 999;
        camera.add(fadeMesh);
        scene.add(camera);

        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const loadTexture = (url, fadeIn = true) => {
            setLoading(true);
            textureLoader.load(url, (texture) => {
                if (isCancelled) return;
                texture.colorSpace = THREE.SRGBColorSpace;
                // Зурагны тод, өндөр чанарыг хангах: anisotropic filtering + mipmap
                // (эх зураг бага нягтралтай бол код үүнийг нөхөж чадахгүй — эх файлыг
                // өндөр нягтралаар (жишээ нь 4096×2048+, equirectangular) экспортлохыг зөвлөж байна)
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = true;
                material.map = texture;
                material.color.set(0xffffff);
                material.needsUpdate = true;
                setLoading(false);
                if (fadeIn) fadeTo(0); // хараас гэрэл рүү аажим гарна
            }, undefined, () => { if (!isCancelled) setLoading(false); });
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

        // ---------- Flat (non-VR) controls: mouse/touch эргүүлэх ----------
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = -0.25;
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        // Эхлээд илүү тод хурдтай эргүүлж "энэ бол 360° панорама" гэдгийг тод мэдрүүлнэ,
        // 3 секундийн дараа энгийн, тайван хурд руу буурна (хэрэглэгч гар хүрэхгүй бол)
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.4;
        setTimeout(() => { if (!isCancelled) controls.autoRotateSpeed = 0.2; }, 3000);
        camera.position.set(0, 0, 0.1);
        controls.target.set(-0.87, -0.58, 0.5);
        controls.update();

        const onFirstInteract = () => {
            setShowDragHint(false);
            controls.autoRotate = false;
        };
        renderer.domElement.addEventListener('pointerdown', onFirstInteract, { once: true });

        const onWheel = (e) => {
            e.preventDefault();
            camera.fov = Math.max(30, Math.min(100, camera.fov + e.deltaY * 0.05));
            camera.updateProjectionMatrix();
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // ---------- VR: 3D navigation UI (controller raycast-аар дарна) ----------
        
        // Мэдээллийн текст үүсгэх canvas
        const createInfoTexture = (title, text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 768; // 4:3 харьцаа
            const ctx = canvas.getContext('2d');
            
            // bg
            ctx.fillStyle = 'rgba(10,14,26,0.92)';
            ctx.fillRect(0,0,1024,768);
            
            // border
            ctx.strokeStyle = 'rgba(245,158,11,0.8)';
            ctx.lineWidth = 10;
            ctx.strokeRect(5,5,1014,758);

            // title
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = 'bold 50px sans-serif';
            ctx.fillText(title || '', 512, 60);

            // separator
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(100, 140, 824, 2);

            // description text
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '36px sans-serif';
            ctx.textAlign = 'left';
            
            const words = (text || '').split(' ');
            let line = '';
            let y = 180;
            for(let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                if (ctx.measureText(testLine).width > 880 && i > 0) {
                    ctx.fillText(line, 72, y);
                    line = words[i] + ' ';
                    y += 50; // Мөр хоорондын зай
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 72, y);
            const tex = new THREE.CanvasTexture(canvas);
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            return tex;
        };

        // Canvas texture-аар товч үүсгэх туслах функц (Солигдов: Sprite -> Mesh PlaneGeometry)
        // учир нь Sprite-ийн raycasting WebXR орчинд алдаа зааж асуудал үүсгэдэг. PlaneMesh илүү найдвартай!
        const makeButtonMesh = (label, icon) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(10,10,14,0.75)';
            ctx.beginPath();
            ctx.arc(128, 128, 118, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245,158,11,0.9)'; // amber accent
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 90px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, 128, 120);
            ctx.font = '28px sans-serif';
            ctx.fillText(label, 128, 200);
            const tex = new THREE.CanvasTexture(canvas);
            
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, side: THREE.DoubleSide });
            const geom = new THREE.PlaneGeometry(0.3, 0.3); // 30cm дөрвөлжин mesh
            const mesh = new THREE.Mesh(geom, mat);
            mesh.renderOrder = 1000;
            return mesh;
        };

        const vrUiGroup = new THREE.Group();
        vrUiGroup.visible = false; // зөвхөн VR session-ий үед харагдана

        // Текст харуулах Info Panel үүсгэх
        const infoPanelMat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, side: THREE.DoubleSide });
        const infoPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), infoPanelMat);
        infoPanel.position.set(0, 0.35, -1.2); // Товчнуудын дээр байрлана
        infoPanel.visible = false; // Эхлээд харагдахгүй
        infoPanel.renderOrder = 999;
        
        const updateInfoPanelText = (title, text) => {
            const oldMap = infoPanelMat.map;
            infoPanelMat.map = createInfoTexture(title, text);
            infoPanelMat.needsUpdate = true;
            if (oldMap) oldMap.dispose();
        };

        const btnPrev = makeButtonMesh('Өмнөх', '◀');
        const btnInfo = makeButtonMesh('Мэдээлэл', 'i');
        const btnNext = makeButtonMesh('Дараах', '▶');
        const btnExit = makeButtonMesh('Гарах', '✕');
        
        btnPrev.position.set(-0.6, -0.35, -1.2);
        btnInfo.position.set(-0.2, -0.35, -1.2);
        btnExit.position.set(0.2, -0.35, -1.2);
        btnNext.position.set(0.6, -0.35, -1.2);

        // Click хийснээ мэдрэх зорилгоор жижигрэх анимейшн нэмэв
        const animateClick = (btn, action) => {
            btn.scale.set(0.8, 0.8, 0.8);
            setTimeout(() => { if (btn) btn.scale.set(1.0, 1.0, 1.0); }, 150);
            if (action) action();
        };

        btnPrev.userData.action = () => animateClick(btnPrev, () => goTo(-1));
        btnNext.userData.action = () => animateClick(btnNext, () => goTo(1));
        btnInfo.userData.action = () => animateClick(btnInfo, () => { infoPanel.visible = !infoPanel.visible; });
        btnExit.userData.action = () => animateClick(btnExit, () => renderer.xr.getSession()?.end());
        vrUiGroup.add(infoPanel, btnPrev, btnInfo, btnExit, btnNext);
        camera.add(vrUiGroup); // камерт наасан тул толгой хаашаа ч харсан "гараар дагадаг" биш, session эхлэхэд урд байрандаа тогтмол байна

        // Controller raycast setup
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();
        const uiTargets = [btnPrev, btnInfo, btnNext, btnExit]; // infoPanel дарагдахгүй (зөвхөн харагдана)
        const controllers = []; // Render loop дотор hover шалгахын тулд хадгална

        const makeController = (index) => {
            const controller = renderer.xr.getController(index);
            controller.addEventListener('select', () => {
                // VR-д camera.matrixWorld хоцрох магадлалтай тул raycast хийхээс өмнө шинэчилнэ
                scene.updateMatrixWorld(true);

                tempMatrix.identity().extractRotation(controller.matrixWorld);
                raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
                raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                const hits = raycaster.intersectObjects(uiTargets, false);
                if (hits.length > 0) hits[0].object.userData.action?.();
            });
            // Энгийн ray line (харагдац)
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

        // ---------- XR session lifecycle ----------
        const onSessionStart = () => {
            setIsPresenting(true);
            controls.enabled = false; // OrbitControls-той зөрчилдөхгүйн тулд унтраана — XR camera-г WebXR өөрөө удирдана
            vrUiGroup.visible = true;
        };
        const onSessionEnd = () => {
            setIsPresenting(false);
            controls.enabled = true;
            vrUiGroup.visible = false;
        };
        renderer.xr.addEventListener('sessionstart', onSessionStart);
        renderer.xr.addEventListener('sessionend', onSessionEnd);

        // WebXR дэмжигдэж байгаа эсэхийг эхлээд шалгаад, дэмжихгүй бол
        // three.js-ийн стандарт цайвар "VR NOT SUPPORTED" харагдацыг өөрийн
        // зөөлөн, тайлбартай tooltip-ээр орлуулна
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (isCancelled) return;
                setXrSupported(supported);
            }).catch(() => { if (!isCancelled) setXrSupported(false); });
        } else {
            setXrSupported(false);
        }

        let vrButtonElement = null;
        if (navigator.xr) {
            vrButtonElement = VRButton.createButton(renderer);
            vrButtonElement.style.position = 'absolute';
            vrButtonElement.style.bottom = '20px';
            vrButtonElement.style.left = '50%';
            vrButtonElement.style.transform = 'translateX(-50%)';
            vrButtonElement.style.zIndex = '100';
            container.appendChild(vrButtonElement);
        }

        renderer.setAnimationLoop(() => {
            if (isCancelled) return;
            if (controls.enabled) controls.update();

            // VR Hover logic: Controller ray-ээр товчлуурыг онож буйг бодит цаг хугацаанд шалгах 
            // (хэрэглэгч яг дарж болох үгүйгээ мэдэхэд тусална)
            if (vrUiGroup.visible && controllers.length > 0) {
                let hoveredObj = null;
                scene.updateMatrixWorld(true);
                for (let c of controllers) {
                    tempMatrix.identity().extractRotation(c.matrixWorld);
                    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    const hits = raycaster.intersectObjects(uiTargets, false);
                    if (hits.length > 0) {
                        hoveredObj = hits[0].object;
                        break; 
                    }
                }
                
                uiTargets.forEach(btn => {
                    // Хэрэв дарж байгаа буюу animateClick ажиллаж scale 0.8 болсон бол hover-ийг түр алгасна
                    if (btn.scale.x < 0.9) return; 

                    if (btn === hoveredObj) {
                        btn.scale.setScalar(1.15); // оносон үед томрох
                        btn.material.color.setHex(0xffffff); // тодрох
                    } else {
                        btn.scale.setScalar(1.0); // хэвийн
                        btn.material.color.setHex(0xb0b0b0); // бүдгэрэх
                    }
                });
            }

            renderer.render(scene, camera);
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

        sceneStateRef.current = { loadTexture, fadeTo, updateInfoPanelText };

        return () => {
            isCancelled = true;
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.xr.removeEventListener('sessionstart', onSessionStart);
            renderer.xr.removeEventListener('sessionend', onSessionEnd);
            resizeObserver.disconnect();
            renderer.setAnimationLoop(null);
            renderer.dispose();
            controls.dispose();
            if (material.map) material.map.dispose();
            material.dispose();
            geometry.dispose();
            scene.clear();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            if (vrButtonElement && container.contains(vrButtonElement)) container.removeChild(vrButtonElement);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenes]);

    // Дурсгал солигдоход: fade out → texture солих → fade in
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            // Анхны 3D текст мэдээллийг шинэчлэх
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
            if (state.updateInfoPanelText) {
                state.updateInfoPanelText(scenes[currentIndex]?.name, scenes[currentIndex]?.description);
            }
            state.fadeTo(0, 300);
        }, 260);
        
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            {loading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading 360...</span>
                </div>
            )}

            {/* Толгой/хулгана чирж тойрч харах боломжтойг сануулах, эхний хүрэлцээний дараа алга болно */}
            {!loading && showDragHint && !isPresenting && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '999px', fontSize: '12px', zIndex: 60, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-arrows-up-down-left-right" style={{ fontSize: '11px' }}></i>
                    Чирж тойрч хараарай
                </div>
            )}

            {/* WebXR дэмжигдэхгүй орчинд (жишээ нь энгийн desktop browser) three.js-ийн
                default "VR NOT SUPPORTED" харагдацын оронд зөөлөн тайлбар харуулна */}
            {xrSupported === false && !isPresenting && (
                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: '999px', fontSize: '11px', zIndex: 60, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-info"></i>
                    VR-ээр үзэхийн тулд Meta Quest Browser-аар нээнэ үү
                </div>
            )}

            {/* Flat (2D browser) preview-д зориулсан HTML nav — VR session идэвхтэй үед автоматаар нуугдана,
                учир нь энэ overlay headset дотор ажиглагдахгүй бөгөөд ХОЁР дахин удирдлага болохоос сэргийлнэ */}
            {!isPresenting && scenes.length > 1 && (
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 50, pointerEvents: 'none' }}>
                    <button
                        onClick={() => goTo(-1)}
                        disabled={currentIndex === 0}
                        style={{ pointerEvents: 'auto', background: 'rgba(10,10,14,0.6)', border: '1px solid rgba(245,158,11,0.4)', color: '#fff', borderRadius: '999px', padding: '10px 18px', opacity: currentIndex === 0 ? 0.3 : 1 }}
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span style={{ pointerEvents: 'auto', background: 'rgba(10,10,14,0.6)', color: '#fff', borderRadius: '999px', padding: '10px 18px', fontSize: '13px' }}>
                        {currentIndex + 1} / {scenes.length}
                    </span>
                    <button
                        onClick={() => goTo(1)}
                        disabled={currentIndex === scenes.length - 1}
                        style={{ pointerEvents: 'auto', background: 'rgba(10,10,14,0.6)', border: '1px solid rgba(245,158,11,0.4)', color: '#fff', borderRadius: '999px', padding: '10px 18px', opacity: currentIndex === scenes.length - 1 ? 0.3 : 1 }}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            )}

            <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        </div>
    );
}
