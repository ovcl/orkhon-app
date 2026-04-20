'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

export default function PanoramaViewer({ imageUrl }) {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !imageUrl) return;

        let isCancelled = false;

        const initWidth = containerRef.current.clientWidth || window.innerWidth;
        const initHeight = containerRef.current.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initWidth, initHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap pixel ratio for performance
        renderer.xr.enabled = true; // ENABLE WEBXR FOR VR GLASSES
        
        // Ensure container is empty before appending
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert the sphere

        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'Anonymous';
        
        let mesh;
        let controls;
        let animationId;

        console.log('Starting texture load for:', imageUrl);

        textureLoader.load(imageUrl, (texture) => {
            if (isCancelled) return;
            console.log('Texture loaded successfully');
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.MeshBasicMaterial({ map: texture });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            setLoading(false);
        }, undefined, (error) => {
            if (isCancelled) return;
            console.error('Error loading panorama:', error);
            setLoading(false);
        });

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.rotateSpeed = -0.5; // Invert rotation for inside sphere
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        camera.position.set(0, 0, 0.1);

        camera.position.set(0, 0, 0.1);

        // Add "ENTER VR" button overlay
        const vrButtonElement = VRButton.createButton(renderer);
        vrButtonElement.style.position = 'absolute';
        vrButtonElement.style.bottom = '20px';
        vrButtonElement.style.left = '50%';
        vrButtonElement.style.transform = 'translateX(-50%)';
        vrButtonElement.style.zIndex = '100';
        containerRef.current.appendChild(vrButtonElement);

        // WebXR requires setAnimationLoop instead of requestAnimationFrame
        renderer.setAnimationLoop(() => {
            if (isCancelled) return;
            controls.update();
            renderer.render(scene, camera);
        });

        // Use ResizeObserver instead of window resize for more accurate container tracking
        const resizeObserver = new ResizeObserver((entries) => {
            if (!containerRef.current || isCancelled) return;
            for (let entry of entries) {
                const width = entry.contentRect.width;
                const height = entry.contentRect.height;
                if (width > 0 && height > 0) {
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    renderer.setSize(width, height);
                }
            }
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            isCancelled = true;
            resizeObserver.disconnect();
            renderer.setAnimationLoop(null);
            
            renderer.dispose();
            if (controls) controls.dispose();
            
            if (mesh) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                    if (mesh.material.map) mesh.material.map.dispose();
                    mesh.material.dispose();
                }
            }
            scene.clear();
            
            if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [imageUrl]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            {loading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading 360...</span>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        </div>
    );
}
