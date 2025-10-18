'use client';

import { useEffect, useRef, useState } from 'react';

export type ImuVec3 = [number, number, number];
export type ImuRPY = { roll: number; pitch: number; yaw: number };

export type ImuHookOptions = {
  url?: string;
  
  alpha?: number;

  autoComputeRPY?: boolean;

  onError?: (e: unknown) => void;
};

export function getDefaultImuWsUrl(): string {
  const host =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_HOST) ||
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const proto = isHttps ? 'wss' : 'ws';
  return `${proto}://${host}:8080`;
}

function isFiniteNum(v: unknown): v is number {
  const n = Number(v);
  return Number.isFinite(n);
}

export function useImuStream(opts: ImuHookOptions = {}) {
  const {
    url = getDefaultImuWsUrl(),
    alpha = 0.98,
    autoComputeRPY = true,
    onError,
  } = opts;

  const [accel, setAccel] = useState<ImuVec3>([0, 0, 0]);
  const [gyro, setGyro] = useState<ImuVec3>([0, 0, 0]);
  const [rotation, setRotation] = useState<ImuRPY>({ roll: 0, pitch: 0, yaw: 0 });
  const [connected, setConnected] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  // complementary filter integrator state (radians) stored in refs to avoid stale closures
  const rpyRef = useRef<{ r: number; p: number; y: number }>({ r: 0, p: 0, y: 0 });
  const lastTRef = useRef<number>(0);

  useEffect(() => {
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(url);
    } catch (e) {
      onError?.(e);
      return;
    }

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = (e) => onError?.(e);

    socket.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        if (d?.type !== 'imu') return;

        const ax = Number(d?.accel?.[0]);
        const ay = Number(d?.accel?.[1]);
        const az = Number(d?.accel?.[2]);
        const gx = Number(d?.gyro?.[0]);
        const gy = Number(d?.gyro?.[1]);
        const gz = Number(d?.gyro?.[2]);

        if (![ax, ay, az, gx, gy, gz].every(isFiniteNum)) return;

        setAccel([ax, ay, az]);
        setGyro([gx, gy, gz]);
        setLastMessageAt(performance.now());

        const hasRPY =
          isFiniteNum(d?.roll) &&
          isFiniteNum(d?.pitch) &&
          isFiniteNum(d?.yaw) &&
          (Number(d.roll) !== 0 || Number(d.pitch) !== 0 || Number(d.yaw) !== 0);

        if (hasRPY) {
          const roll = Number(d.roll);
          const pitch = Number(d.pitch);
          const yaw = Number(d.yaw);
          setRotation({ roll, pitch, yaw });
          // keep integrator roughly in sync to minimize jumps if autoCompute toggles later
          rpyRef.current = { r: roll, p: pitch, y: yaw };
          lastTRef.current = performance.now() / 1000;
          return;
        }

        if (!autoComputeRPY) return;

        // complementary filter path (compute roll/pitch from accel, integrate gyro)
        const now = performance.now() / 1000;
        const prev = lastTRef.current || now;
        const dt = Math.max(0.001, Math.min(0.1, now - prev));
        lastTRef.current = now;

        // gyro: deg/s --> rad/s
        const gxRad = (gx * Math.PI) / 180;
        const gyRad = (gy * Math.PI) / 180;
        const gzRad = (gz * Math.PI) / 180;

        let { r, p, y } = rpyRef.current;
        r += gxRad * dt;
        p += gyRad * dt;
        y += gzRad * dt;

        // accel-based angles (assuming small angles; gravity aligned)
        const rollAcc = Math.atan2(ay, az);
        const pitchAcc = Math.atan2(-ax, Math.hypot(ay, az));

        r = alpha * r + (1 - alpha) * rollAcc;
        p = alpha * p + (1 - alpha) * pitchAcc;

        rpyRef.current = { r, p, y };
        setRotation({ roll: r, pitch: p, yaw: y });
      } catch (e) {
        onError?.(e);
      }
    };

    return () => {
      try {
        socket?.close();
      } catch {
        // no op for now
      }
    };
  }, [url, alpha, autoComputeRPY, onError]);

  return {
    accel,
    gyro,
    rotation,
    connected,
    lastMessageAt,
  };
}
