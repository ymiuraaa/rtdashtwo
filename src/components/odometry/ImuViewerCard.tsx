'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ThreeImuViewer from './ThreeImuViewer';
import D3TimeSeries from '@/components/graphs';

export default function ImuViewerCard() {
  const [gyro, setGyro] = useState([0, 0, 0]);
  const [accel, setAccel] = useState([0, 0, 0]);
  const [imuRotation, setImuRotation] = useState({ roll: 0, pitch: 0, yaw: 0 });

useEffect(() => {
  // TODO soon: let's do the complementary filter on the ESP for lower latency unless EKF is too computationally expensive
  const host =
    process.env.NEXT_PUBLIC_WS_HOST ??
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const socket = new WebSocket(`ws://${host}:8080`);

  // Complementary filter state (radians)
  let r = 0, p = 0, y = 0;
  let lastT = performance.now() / 1000;
  const alpha = 0.98; // gyro vs accel blend

  socket.onopen = () => console.log('IMU WS open');
  socket.onerror = (e) => console.error('IMU WS error', e);
  socket.onclose = () => console.log('IMU WS close');

  socket.onmessage = (event) => {
    try {
      const d = JSON.parse(event.data);
      if (d.type !== 'imu') return;

      if (Array.isArray(d.accel) && Array.isArray(d.gyro)) {
        const [ax, ay, az] = d.accel.map(Number);
        const [gx, gy, gz] = d.gyro.map(Number);
        if ([ax, ay, az, gx, gy, gz].every(Number.isFinite)) {
          setAccel([ax, ay, az]);
          setGyro([gx, gy, gz]);

          // we get valid RPY, use it (assume radians); otherwise compute
          const hasRPY =
            Number.isFinite(Number(d.roll)) &&
            Number.isFinite(Number(d.pitch)) &&
            Number.isFinite(Number(d.yaw)) &&
            (d.roll !== 0 || d.pitch !== 0 || d.yaw !== 0);

          if (hasRPY) {
            setImuRotation({
              roll: Number(d.roll),
              pitch: Number(d.pitch),
              yaw: Number(d.yaw),
            });
          } else {
            const now = performance.now() / 1000;
            const dt = Math.max(0.001, Math.min(0.1, now - lastT));
            lastT = now;

            // TODO on MCU: euler bad. integrate on SO(3) group w quaternions on MCU after EKF

            const gxRad = gx * Math.PI / 180;
            const gyRad = gy * Math.PI / 180;
            const gzRad = gz * Math.PI / 180;
            r += gxRad * dt;
            p += gyRad * dt;
            y += gzRad * dt;

            const rollAcc  = Math.atan2(ay, az);
            const pitchAcc = Math.atan2(-ax, Math.hypot(ay, az));

            r = alpha * r + (1 - alpha) * rollAcc;
            p = alpha * p + (1 - alpha) * pitchAcc;

            setImuRotation({ roll: r, pitch: p, yaw: y });
          }
        }
      }
    } catch (e) {
      console.error('Bad IMU JSON', e);
    }
  };

  return () => socket.close();
}, []);



  return (
    <>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Accelerometer</h2>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>X: {accel[0].toFixed(3)}</div>
            <div>Y: {accel[1].toFixed(3)}</div>
            <div>Z: {accel[2].toFixed(3)}</div>
          </div>
          <D3TimeSeries
            sample={{ x: accel[0], y: accel[1], z: accel[2] }}
            seriesOrder={['x', 'y', 'z']}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Gyroscope</h2>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>X: {gyro[0].toFixed(3)}</div>
            <div>Y: {gyro[1].toFixed(3)}</div>
            <div>Z: {gyro[2].toFixed(3)}</div>
          </div>
          <D3TimeSeries
            sample={{ x: gyro[0], y: gyro[1], z: gyro[2] }}
            seriesOrder={['x', 'y', 'z']}
          />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-1 xl:col-span-1">
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <h2 className="text-xl font-bold mb-4 text-center">IMU orientation (Visualized)</h2>
          <div className="w-[300px] h-full">
            <ThreeImuViewer rotation={imuRotation} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}