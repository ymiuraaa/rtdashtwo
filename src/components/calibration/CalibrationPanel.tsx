"use client";

import { useState, useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import D3TimeSeries from "@/components/graphs"; // uses your graphs index default export
import { useEspWs } from "@/lib/useEspWs";

// ---- local types (no extra files) ----
type Target = "accel_x" | "accel_y" | "accel_z" | "gyro" | "mag" | "all";
type ImuTriple = { x: number; y: number; z: number };
type StreamImuEvent = {
  evt: "STREAM_IMU";
  accel_x?: ImuTriple;
  accel_y?: ImuTriple;
  accel_z?: ImuTriple;
  gyro?: ImuTriple;
  mag?: ImuTriple;
  all?: ImuTriple;
};
type EspEvent =
  | StreamImuEvent
  | { evt: "CAL_PROGRESS"; pct?: number }
  | {
      evt: "CAL_RESULT";
      gyro_bias?: [number, number, number];
      accel_bias?: [number, number, number];
      accel_scale?: [number, number, number];
    }
  | { evt: "CAL_CANCELED" }
  | { evt: "CAL_ABORTED" }
  | { evt: "CAL_ERROR"; message?: string };

const isImuTriple = (v: unknown): v is ImuTriple => {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.x === "number" &&
    typeof r.y === "number" &&
    typeof r.z === "number"
  );
};
// --------------------------------------

export default function CalibrationPanel() {
  const { ready, send, subscribe } = useEspWs();
  const [target, setTarget] = useState<Target>("accel_x");
  const [status, setStatus] = useState("idle");
  const [bias, setBias] = useState<[number, number, number] | null>(null);
  const [scale, setScale] = useState<[number, number, number] | null>(null);
  const [series, setSeries] = useState<
    { t: number; x: number; y: number; z: number }[]
  >([]);

  useEffect(() => {
    return subscribe((msg: EspEvent) => {
      if (msg.evt === "STREAM_IMU") {
        const maybe = (msg as Record<string, unknown>)[target];
        if (!isImuTriple(maybe)) return;
        const now = performance.now();
        const { x, y, z } = maybe;
        setSeries((old) => {
          const next = [...old, { t: now, x, y, z }];
          if (next.length > 800) next.shift();
          return next;
        });
        return;
      }
      if (msg.evt === "CAL_PROGRESS") setStatus(`collecting… ${msg.pct ?? 0}%`);
      if (msg.evt === "CAL_RESULT") {
        setStatus("done");
        if (msg.gyro_bias && (target === "gyro" || target === "all"))
          setBias(msg.gyro_bias);
        if (msg.accel_bias && target.startsWith("accel"))
          setBias(msg.accel_bias);
        if (msg.accel_scale) setScale(msg.accel_scale);
      }
      if (msg.evt === "CAL_CANCELED") setStatus("canceled");
      if (msg.evt === "CAL_ABORTED") setStatus("aborted");
      if (msg.evt === "CAL_ERROR") setStatus("error");
    });
  }, [subscribe, target]);

  const begin = () => {
    setStatus("starting…");
    send({ cmd: "CAL_START", type: target, duration_ms: 5000 });
  };
  const cancel = () => send({ cmd: "CAL_CANCEL" });
  const save = () => {
    send({ cmd: "SET_CAL_REQUEST" });
    setStatus("save requested");
  };

  // Which axes to draw for this target
  const seriesOrder = useMemo<("x" | "y" | "z")[]>(() => {
    switch (target) {
      case "accel_x":
        return ["x"];
      case "accel_y":
        return ["y"];
      case "accel_z":
        return ["z"];
      default:
        return ["x", "y", "z"]; // gyro, mag, all
    }
  }, [target]);

  const latest = series.length
    ? series[series.length - 1]
    : { x: 0, y: 0, z: 0 };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr] items-start">
      {/* Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>WebSocket</span>
          <span>{ready ? "connected" : "offline"}</span>
        </div>

        <div className="space-y-1">
          <Label htmlFor="target">Target</Label>
          <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
            <SelectTrigger id="target" className="w-full">
              <SelectValue placeholder="Select axis/sensor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accel_x">Accel X</SelectItem>
              <SelectItem value="accel_y">Accel Y</SelectItem>
              <SelectItem value="accel_z">Accel Z</SelectItem>
              <SelectItem value="gyro">Gyroscope</SelectItem>
              <SelectItem value="mag">Magnetometer</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={begin}>
          Begin Calibration
        </Button>
        <Button variant="secondary" className="w-full" onClick={cancel}>
          Cancel
        </Button>

        <div className="rounded-md border p-2 text-sm">
          <div>
            status: <b>{status}</b>
          </div>
          <div>
            bias:{" "}
            <code>{bias ? bias.map((n) => n.toFixed(2)).join(", ") : "—"}</code>
          </div>
          <div>
            scale:{" "}
            <code>
              {scale ? scale.map((n) => n.toFixed(4)).join(", ") : "—"}
            </code>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={save}>
          Save Calibration
        </Button>
      </div>

      {/* Graph */}
      <div className="rounded-md border bg-muted p-3">
        <D3TimeSeries
          key={target} // reset internal buffer when target changes
          sample={{ x: latest.x, y: latest.y, z: latest.z }}
          seriesOrder={seriesOrder}
        />
      </div>
    </div>
  );
}
