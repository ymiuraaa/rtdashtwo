'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ThreeImuViewer from './ThreeImuViewer';

export default function ImuViewerCard() {
  const [gyro, setGyro] = useState([0, 0, 0]);
  const [accel, setAccel] = useState([0, 0, 0]);
  const [imuRotation, setImuRotation] = useState({ roll: 0, pitch: 0, yaw: 0 });

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'imu') {
        setGyro(data.gyro);
        setAccel(data.accel);
        setImuRotation({
          roll: data.roll,
          pitch: data.pitch,
          yaw: data.yaw,
        });
      }
    };

    return () => socket.close();
  }, []);

  return (
    <>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Accelerometer</h2>
          <div>X: {accel[0]}</div>
          <div>Y: {accel[1]}</div>
          <div>Z: {accel[2]}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Gyroscope</h2>
          <div>X: {gyro[0]}</div>
          <div>Y: {gyro[1]}</div>
          <div>Z: {gyro[2]}</div>
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