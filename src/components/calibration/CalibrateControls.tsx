// src/app/calibration/CalibrateControls.tsx
'use client';
import React from 'react';

export default function CalibrateControls() {
  // (Optional) state to show calibration status messages
  const [message, setMessage] = React.useState('');

  async function handleCalibrate(axis: string) {
    try {
      // call an API endpoint to perform calibration for the given axis
      const res = await fetch('/api/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis })
      });
      if (res.ok) {
        setMessage(`Calibrated ${axis.toUpperCase()} axis successfully.`);
      } else {
        const err = await res.text();
        setMessage(`Calibration failed: ${err}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  }

  return (
    <div className="calibrate-controls">
      <h2>Sensor Calibration</h2>
      <div>
        <button onClick={() => handleCalibrate('x')}>Calibrate Acc X</button>
        <button onClick={() => handleCalibrate('y')}>Calibrate Acc Y</button>
        <button onClick={() => handleCalibrate('z')}>Calibrate Acc Z</button>
        <button onClick={() => handleCalibrate('gyro')}>Calibrate Gyroscope</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
