// src/app/calibration/page.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import CalibrationPanel from "../../components/calibration/CalibrationPanel";
import PIDPanel from "../../components/calibration/PIDPanel";

export default async function CalibrationPage() {
  const initialPID = { p: 100, i: 25, d: 50 };

  return (
    <main className="p-4">
      <h1 className="mb-4 text-2xl font-semibold">Calibration</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">

        <Card>
          <CardHeader>
            <CardTitle>IMU Calibration</CardTitle>
          </CardHeader>

          <CardContent>
          IMU stands for Inertial Measurement Unit. Usually these IMUs contain an accelerometer, gyroscope, and often a magnetometer.
          For this project, we're using an <a href="https://amazn.so/TNGwIGm" target="_blank" 
          rel="noopener noreferrer" style={{ color: 'cyan' }}> ICM-20948 IMU </a>
          but for the use case of my hardware, we only need the accelerometer and gyroscope.
          Calibration minimizes sensor drift and bias, ensuring the IMU measurements stay consistent with encoder-based velocity data used in the EKF and PID tuning.  


            <CalibrationPanel />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PID Tuning</CardTitle>
          </CardHeader>
          <CardContent>
            This streamlines your PID tuning workflow. No need to reflash every time you retune your PID!
            The best part? These PID values are saved directly to the ESP32's non-volatile memory, so the memory on the ESP32 persists even when you power it off then back on.
            
            <PIDPanel
              initialP={initialPID.p}
              initialI={initialPID.i}
              initialD={initialPID.d}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
