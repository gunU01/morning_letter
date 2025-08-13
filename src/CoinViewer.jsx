// src/components/CoinViewer.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export default function CoinViewer() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;

        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dir = new THREE.DirectionalLight(0xffffff, 2.0);
        dir.position.set(5, 10, 7.5);
        dir.castShadow = true;
        scene.add(dir);

        // ✅ 텍스처 파일 이름의 오타를 수정했습니다.
        const textureLoader = new THREE.TextureLoader();
        const baseColor = textureLoader.load('/Smiley_Coin_0813083433_texture.png');
        const normalMap = textureLoader.load('/Smiley_Coin_0813083433_texture_normal.png');
        const roughnessMap = textureLoader.load('/Smiley_Coin_0813083433_texture_roughness.png');
        const metallicMap = textureLoader.load('/Smiley_Coin_0813083433_texture_metallic.png');
        
        new RGBELoader()
            .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/')
            .load('brown_photostudio_02_1k.hdr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.background = texture;
                scene.environment = texture;

                loadFBX();
            });


        const loadFBX = () => {
            const fbxLoader = new FBXLoader();
            fbxLoader.load(
                '/Smiley_Coin_0813083433_texture.fbx',
                (object) => {
                    object.traverse((child) => {
                        if (child.isMesh) {
                            const newMat = new THREE.MeshStandardMaterial({
                                map: baseColor,
                                normalMap: normalMap,
                                roughnessMap: roughnessMap,
                                metalnessMap: metallicMap,
                                metalness: 0.9,
                                roughness: 0.2,
                                envMapIntensity: 1.0
                            });

                            child.material = newMat;
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    scene.add(object);

                    // 모델 프레이밍
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
                }
            );
        }

        let req = null;
        const animate = () => {
            req = requestAnimationFrame(animate);
            controls.update(); // 드래그, 줌, 회전 등 컨트롤을 업데이트
            renderer.render(scene, camera);
        };
        animate();

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