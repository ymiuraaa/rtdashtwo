'use client';

import '@google/model-viewer';

export default function ModelViewer() {
  return (
    <model-viewer
      src="/imu.glb"
      auto-rotate
      camera-controls
      disable-zoom
      style={{ width: '100%', height: '400px' }}
    />
  );
}
