// src/components/CoinViewer.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default function CoinViewer() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(
            45,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 7);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.2;
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // ----- Front Lights -----
        const keyFront = new THREE.DirectionalLight(0xfff8dc, 3.0);
        keyFront.position.set(3, 4, 5);
        scene.add(keyFront);

        const fillFront = new THREE.DirectionalLight(0xffffff, 2.2);
        fillFront.position.set(-3, 2, 3);
        scene.add(fillFront);

        const rimFront = new THREE.DirectionalLight(0xfffacd, 1.5);
        rimFront.position.set(0, 5, -4);
        scene.add(rimFront);

        const pointFront = new THREE.PointLight(0xffffff, 2.0, 10);
        pointFront.position.set(0, 3, 3);
        scene.add(pointFront);

        // ----- Back Lights -----
        const keyBack = new THREE.DirectionalLight(0xfff8dc, 2.5);
        keyBack.position.set(-3, -4, -5);
        scene.add(keyBack);

        const fillBack = new THREE.DirectionalLight(0xffffff, 2.0);
        fillBack.position.set(3, -2, -3);
        scene.add(fillBack);

        const rimBack = new THREE.DirectionalLight(0xfffacd, 1.2);
        rimBack.position.set(0, -5, 4);
        scene.add(rimBack);

        const pointBack = new THREE.PointLight(0xffffff, 1.5, 10);
        pointBack.position.set(0, -3, -3);
        scene.add(pointBack);

        // ----- Textures -----
        const textureLoader = new THREE.TextureLoader();
        const baseColor = textureLoader.load('/Smiley_Coin_0813083433_texture.png');
        const normalMap = textureLoader.load('/Smiley_Coin_0813083433_texture_normal.png');
        const roughnessMap = textureLoader.load('/Smiley_Coin_0813083433_texture_roughness.png');
        const metallicMap = textureLoader.load('/Smiley_Coin_0813083433_texture_metallic.png');

        // ----- Load FBX -----
        const fbxLoader = new FBXLoader();
        fbxLoader.load('/Smiley_Coin_0813083433_texture.fbx', (object) => {
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xffd700,
                        map: baseColor,
                        normalMap: normalMap,
                        roughnessMap: roughnessMap,
                        metalnessMap: metallicMap,
                        metalness: 1.0,
                        roughness: 0.08, // 하이라이트 선명
                        envMap: null,
                        envMapIntensity: 0
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(object);

            const bbox = new THREE.Box3().setFromObject(object);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let camZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
            if (!isFinite(camZ)) camZ = 7;
            camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, camZ)));
            camera.near = Math.max(0.1, camZ / 100);
            camera.far = camZ * 100;
            camera.updateProjectionMatrix();
            controls.target.copy(center);
            controls.update();
        });

        // ----- Animate -----
        let req = null;
        const animate = () => {
            req = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // ----- Resize -----
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (req) cancelAnimationFrame(req);
            mountRef.current && mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
