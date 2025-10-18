// src/app/calibration/PIDTuner.tsx
'use client';
import React, { useState } from 'react';

interface PIDTunerProps {
  initialP?: number;
  initialI?: number;
  initialD?: number;
}

export default function PIDTuner({ initialP = 0, initialI = 0, initialD = 0 }: PIDTunerProps) {
  // State for PID values
  const [pGain, setPGain] = useState<number>(initialP);
  const [iGain, setIGain] = useState<number>(initialI);
  const [dGain, setDGain] = useState<number>(initialD);
  const [status, setStatus] = useState<string>('');

  // Handlers for slider and input changes
  const handlePChange = (value: string) => {
    const val = parseFloat(value);
    setPGain(isNaN(val) ? 0 : val);
  };
  const handleIChange = (value: string) => {
    const val = parseFloat(value);
    setIGain(isNaN(val) ? 0 : val);
  };
  const handleDChange = (value: string) => {
    const val = parseFloat(value);
    setDGain(isNaN(val) ? 0 : val);
  };

  // Handler to submit new PID values to server
  const applyPID = async () => {
    setStatus('Applying PID settings...');
    try {
      const res = await fetch('/api/pid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: pGain, i: iGain, d: dGain })
      });
      if (res.ok) {
        setStatus('PID settings updated successfully.');
      } else {
        const errText = await res.text();
        setStatus(`Failed to update PID: ${errText}`);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="pid-tuner">
      <h2>PID Tuning</h2>

      <div className="pid-control">
        <label>P Gain: </label>
        <input 
          type="range" min="0" max="1000" step="0.01"
          value={pGain}
          onChange={(e) => handlePChange(e.target.value)} 
        />
        <input 
          type="number" step="0.01"
          value={pGain}
          onChange={(e) => handlePChange(e.target.value)}
        />
      </div>

      <div className="pid-control">
        <label>I Gain: </label>
        <input 
          type="range" min="0" max="1000" step="0.01"
          value={iGain}
          onChange={(e) => handleIChange(e.target.value)} 
        />
        <input 
          type="number" step="0.01"
          value={iGain}
          onChange={(e) => handleIChange(e.target.value)}
        />
      </div>

      <div className="pid-control">
        <label>D Gain: </label>
        <input 
          type="range" min="0" max="1000" step="0.01"
          value={dGain}
          onChange={(e) => handleDChange(e.target.value)} 
        />
        <input 
          type="number" step="0.01"
          value={dGain}
          onChange={(e) => handleDChange(e.target.value)}
        />
      </div>

      <button onClick={applyPID}>Apply PID Settings</button>
      {status && <p>{status}</p>}
    </div>
  );
}
