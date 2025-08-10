'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import OdometryPlot from '@/components/odometry/OdometryPlot';
import { useDynamicChartOptions } from '@/components/useDynamicChartOptions';
import { Line } from 'react-chartjs-2';
import ImuViewerCard from '@/components/odometry/ImuViewerCard';
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

export default function Dashboard() {
  const [pwm1Data, setPwm1Data] = useState<number[]>([]);
  const [pwm2Data, setPwm2Data] = useState<number[]>([]);
  const [odomPath, setOdomPath] = useState<{ x: number; y: number }[]>([]);
  const maxPoints = 50;

  useEffect(() => {
  // Use same host as current page unless overridden by env
  const host =
    process.env.NEXT_PUBLIC_WS_HOST ??
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const socket = new WebSocket(`ws://${host}:8080`);


  socket.onopen = () => console.log('WS open');
  socket.onerror = (e) => console.error('WS error', e);
  socket.onclose = () => console.log('WS close');

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pwm') {
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
      <ImuViewerCard />
      <Card className="col-span-1">
        <CardContent className="h-[400px] flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-center">2D Odometry</h2>
          <OdometryPlot path={odomPath} />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-[40vh] md:h-[45vh] xl:h-[50vh]">
          <h2 className="text-xl font-bold mb-2">Motor 1 PWM signal</h2>
          <Line data={pwmChartData('PWM1', pwm1Data)} options={pwmChartOptions} />
        </CardContent>
      </Card>
      {/* 

      maybe turn this part into a visualization of the servo angles
      
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="h-[40vh] md:h-[45vh] xl:h-[50vh]">
          <h2 className="text-xl font-bold mb-2">Motor 2 PWM</h2>
          <Line data={pwmChartData('PWM2', pwm2Data)} options={pwmChartOptions} />
        </CardContent>
      </Card> */}
    </main>
  );
}