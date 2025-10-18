'use client';

import { Card, CardContent } from '@/components/ui/card';
import ThreeImuViewer from './ThreeImuViewer';
import D3TimeSeries from '@/components/graphs';
import { getDefaultImuWsUrl, useImuStream } from './useImuStream';

type Props = {

  wsUrl?: string;

  alpha?: number;

  autoComputeRPY?: boolean;
};

export default function ImuViewerCard({
  wsUrl,
  alpha,
  autoComputeRPY,
}: Props) {
  const { accel, gyro, rotation, connected, lastMessageAt } = useImuStream({
    url: wsUrl ?? getDefaultImuWsUrl(),
    alpha,
    autoComputeRPY,
    onError: (e) => console.error('IMU stream error:', e),
  });

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
            <ThreeImuViewer rotation={rotation} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
