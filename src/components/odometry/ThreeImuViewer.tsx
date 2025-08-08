'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF} from '@react-three/drei';
import * as THREE from 'three';

type Rotation = {
  roll: number;
  pitch: number;
  yaw: number;
};

function ImuModel({ rotation }: { rotation: Rotation }) {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/imu.gltf');

  React.useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({ color: 'cyan' });
      }
    })
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    
    scene.position.sub(center);
    scene.rotation.x = -Math.PI / 2;
  }, [scene]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.set(rotation.pitch, rotation.yaw, rotation.roll);
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={0.05} />
    </group>
  );
}

// Main ThreeImuViewer component
export default function ThreeImuViewer({ rotation }: { rotation: Rotation }) {
  return (
    <Canvas
      style={{ width: '120%', height: '100%' }}
      camera={{ position: [1, 1, 1], fov: 60 }}
    >
    <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <Suspense fallback={null}>
        <ImuModel rotation={rotation} />
      </Suspense>
      <OrbitControls />
      <axesHelper args={[2]} />
    </Canvas>
  );
}