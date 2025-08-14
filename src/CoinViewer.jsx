// src/components/CoinViewer.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default function CoinViewer() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // ----- Scene -----
        const scene = new THREE.Scene();
        scene.background = null; // 배경 제거

        // ----- Camera -----
        const camera = new THREE.PerspectiveCamera(
            45,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);

        // ----- Renderer -----
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.8; // 밝기 강화
        renderer.setClearColor(0x000000, 0); // 배경 투명

        mountRef.current.appendChild(renderer.domElement);

        // ----- Controls -----
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // ----- Lights: 금빛 + 강한 흰 조명 -----
        // Key Light (금빛 주광)
        const keyLight = new THREE.DirectionalLight(0xfff8dc, 2.5);
        keyLight.position.set(5, 5, 5);
        scene.add(keyLight);

        // Fill Light (강한 흰색 보조광)
        const fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
        fillLight.position.set(-3, 2, 2);
        scene.add(fillLight);

        // Rim Light (금빛 윤곽 강조)
        const rimLight = new THREE.DirectionalLight(0xfffacd, 1.2);
        rimLight.position.set(0, 5, -5);
        scene.add(rimLight);

        // Point Light: 흰색 반사 강화
        const brightWhite = new THREE.PointLight(0xffffff, 1.5, 10);
        brightWhite.position.set(0, 3, 3);
        scene.add(brightWhite);

        // 기존 금빛 PointLight 유지
        const pointLight1 = new THREE.PointLight(0xfffacd, 0.5, 10);
        pointLight1.position.set(-2, 3, 3);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xfffacd, 0.4, 10);
        pointLight2.position.set(2, -2, 3);
        scene.add(pointLight2);

        // ----- 흰색 단색 환경맵 (반사용) -----
        const cubeData = new Uint8Array([255, 255, 255, 255]);
        const whiteEnv = new THREE.CubeTexture();
        whiteEnv.images = [cubeData, cubeData, cubeData, cubeData, cubeData, cubeData];
        whiteEnv.needsUpdate = true;

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
                        color: 0xffd700, // 금색
                        map: baseColor,
                        normalMap: normalMap,
                        roughnessMap: roughnessMap,
                        metalnessMap: metallicMap,
                        metalness: 1.0,
                        roughness: 0.05,  // 매끄럽게
                        envMap: whiteEnv, // 흰색 반사
                        envMapIntensity: 1.5
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(object);

            // ----- 모델 프레이밍 -----
            const bbox = new THREE.Box3().setFromObject(object);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let camZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
            if (!isFinite(camZ)) camZ = 5;
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

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (req) cancelAnimationFrame(req);
            mountRef.current && mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
