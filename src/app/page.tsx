'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

export default function Dashboard() {
  const [gyro, setGyro] = useState([0, 0, 0]);
  const [accel, setAccel] = useState([0, 0, 0]);
  const [mag, setMag] = useState([0, 0, 0]);
  const [pwm1Data, setPwm1Data] = useState<number[]>([]);
  const [pwm2Data, setPwm2Data] = useState<number[]>([]);
  const maxPoints = 50;

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080'); // Update to your endpoint
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'imu') {
        setGyro(data.gyro);
        setAccel(data.accel);
        setMag(data.mag);
      } else if (data.type === 'pwm') {
        setPwm1Data((prev) => [...prev.slice(-maxPoints + 1), data.pwm1]);
        setPwm2Data((prev) => [...prev.slice(-maxPoints + 1), data.pwm2]);
      }
    };
    return () => socket.close();
  }, []);

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 255,
      },
    },
  };

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
      <Card className="col-span-1 md:col-span-2 xl:col-span-3">
        <CardContent>
          <h2 className="text-xl font-bold mb-2">3D IMU Model</h2>
          <div className="w-full h-48">
            <ModelViewer />
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-64">
          <h2 className="text-xl font-bold mb-2">DRV8833 Motor PWM</h2>
          <Line data={pwmChartData('PWM1 (DRV8833)', pwm1Data)} options={chartOptions} />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-64">
          <h2 className="text-xl font-bold mb-2">Servo PWM</h2>
          <Line data={pwmChartData('PWM2 (Servo)', pwm2Data)} options={chartOptions} />
        </CardContent>
      </Card>
    </main>
  );
}
