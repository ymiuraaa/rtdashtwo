'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type ImuRotation = {
  roll: number;   // rotation around Z
  pitch: number;  // rotation around X
  yaw: number;    // rotation around Y
};

function ImuModel({ rotation }: { rotation: ImuRotation }) {
  const { scene } = useGLTF('/imu.GLB'); // make sure imu.glb is in /public
  const ref = useRef<THREE.Object3D>(null!);

  useFrame(() => {
    ref.current.rotation.set(rotation.pitch, rotation.yaw, rotation.roll);
  });

  return <primitive ref={ref} object={scene} scale={1.0} />;
}

export default function ThreeImuViewer({ rotation }: { rotation: ImuRotation }) {
  return (
    <Canvas camera={{ position: [0, 0, 1.5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} intensity={0.8} />
      <ImuModel rotation={rotation} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
