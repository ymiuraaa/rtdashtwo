'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import OdometryPlot from '@/components/odometry/OdometryPlot';
import { useDynamicChartOptions } from '@/components/useDynamicChartOptions';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(Filler);

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const ThreeImuViewer = dynamic(() => import('@/components/odometry/ThreeImuViewer'), { ssr: false });

export default function Dashboard() {
  const [gyro, setGyro] = useState([0, 0, 0]);
  const [accel, setAccel] = useState([0, 0, 0]);
  const [mag, setMag] = useState([0, 0, 0]);
  const [pwm1Data, setPwm1Data] = useState<number[]>([]);
  const [pwm2Data, setPwm2Data] = useState<number[]>([]);
  const [imuRotation, setImuRotation] = useState({ roll: 0, pitch: 0, yaw: 0 });
  const [odomPath, setOdomPath] = useState<{ x: number; y: number }[]>([]);
  const maxPoints = 50;

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'imu') {
        setGyro(data.gyro);
        setAccel(data.accel);
        setMag(data.mag);
        setImuRotation({
          roll: data.roll,
          pitch: data.pitch,
          yaw: data.yaw,
        });
      } else if (data.type === 'pwm') {
        setPwm1Data((prev) => [...prev.slice(-maxPoints + 1), data.pwm1]);
        setPwm2Data((prev) => [...prev.slice(-maxPoints + 1), data.pwm2]);
        
      } else if (data.type === 'odom') {
        setOdomPath((prev) => [...prev, { x: data.x, y: data.y }]);
      }
    };
    return () => socket.close();
  }, []);

  const pwmChartOptions = useDynamicChartOptions('pwm');

  const pwmChartData = (label: string, data: number[]) => ({
    labels: data.map((_, i) => i),
    datasets: [
      {
        label,
        data,
        borderColor: 'rgba(119, 242, 161, 1)',
        backgroundColor: 'rgba(119, 242, 161, 0.2)',
        fill: true,
      },
    ],
  });

  return (
    <main className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Magnetometer</h2>
          <div>X: {mag[0]}</div>
          <div>Y: {mag[1]}</div>
          <div>Z: {mag[2]}</div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-1 xl:col-span-1">
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <h2 className="text-xl font-bold mb-4 text-center">IMU orientation (Visualized)</h2>
          <div className="w-[300px] h-full">
            <ThreeImuViewer rotation={imuRotation} />
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-[50vh] flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-center">2D Odometry (local frame)</h2>
          <OdometryPlot path={odomPath} />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-[40vh] md:h-[45vh] xl:h-[50vh]">
          <h2 className="text-xl font-bold mb-2">Motor 1 PWM signal</h2>
          <Line data={pwmChartData('PWM1', pwm1Data)} options={pwmChartOptions} />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-[40vh] md:h-[45vh] xl:h-[50vh]">
          <h2 className="text-xl font-bold mb-2">Motor 2 PWM</h2>
          <Line data={pwmChartData('PWM2', pwm2Data)} options={pwmChartOptions} />
        </CardContent>
      </Card>
    </main>
  );
}
