// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

const ThreeImuViewer = dynamic(() => import('@/components/ThreeImuViewer'), { ssr: false });

export default function Dashboard() {
  const [gyro, setGyro] = useState([0, 0, 0]);
  const [accel, setAccel] = useState([0, 0, 0]);
  const [mag, setMag] = useState([0, 0, 0]);
  const [pwm1Data, setPwm1Data] = useState<number[]>([]);
  const [pwm2Data, setPwm2Data] = useState<number[]>([]);
  const [imuRotation, setImuRotation] = useState({ roll: 0, pitch: 0, yaw: 0 });
  const [imuHistory, setImuHistory] = useState<{ accel: number[][]; gyro: number[][]; mag: number[][] }>({
    accel: [],
    gyro: [],
    mag: [],
  });
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
        setImuHistory((prev) => ({
          accel: [...prev.accel.slice(-maxPoints + 1), data.accel],
          gyro: [...prev.gyro.slice(-maxPoints + 1), data.gyro],
          mag: [...prev.mag.slice(-maxPoints + 1), data.mag],
        }));
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

  const imuChartData = {
    labels: imuHistory.accel.map((_, i) => i),
    datasets: [
      {
        label: 'Accel X',
        data: imuHistory.accel.map((v) => v[0]),
        borderColor: 'red',
      },
      {
        label: 'Accel Y',
        data: imuHistory.accel.map((v) => v[1]),
        borderColor: 'orange',
      },
      {
        label: 'Accel Z',
        data: imuHistory.accel.map((v) => v[2]),
        borderColor: 'yellow',
      },
      {
        label: 'Gyro X',
        data: imuHistory.gyro.map((v) => v[0]),
        borderColor: 'green',
      },
      {
        label: 'Gyro Y',
        data: imuHistory.gyro.map((v) => v[1]),
        borderColor: 'blue',
      },
      {
        label: 'Gyro Z',
        data: imuHistory.gyro.map((v) => v[2]),
        borderColor: 'purple',
      },
      {
        label: 'Mag X',
        data: imuHistory.mag.map((v) => v[0]),
        borderColor: 'brown',
      },
      {
        label: 'Mag Y',
        data: imuHistory.mag.map((v) => v[1]),
        borderColor: 'grey',
      },
      {
        label: 'Mag Z',
        data: imuHistory.mag.map((v) => v[2]),
        borderColor: 'black',
      },
    ],
  };

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
      <Card className="col-span-1 md:col-span-1 xl:col-span-1">
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <h2 className="text-xl font-bold mb-4 text-center">3D IMU Model (Three.js)</h2>
          <div className="w-[300px] h-full">
            <ThreeImuViewer rotation={imuRotation} />
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-64">
          <h2 className="text-xl font-bold mb-2">IMU Sensor Data</h2>
          <Line data={imuChartData} options={{ responsive: true, maintainAspectRatio: false }} />
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
