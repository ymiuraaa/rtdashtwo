"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEspWs } from "@/lib/useEspWs";

export default function PIDPanel({
  initialP = 100,
  initialI = 25,
  initialD = 50,
}: { initialP?: number; initialI?: number; initialD?: number }) {
  const { ready, send } = useEspWs();
  const [p, setP] = useState(initialP);
  const [i, setI] = useState(initialI);
  const [d, setD] = useState(initialD);
  const [msg, setMsg] = useState("");

  const apply = () => {
    send({ cmd: "SET_PID", p, i, d });
    setMsg("Applied");
    setTimeout(() => setMsg(""), 1200);
  };

  const Row = (label: string, value: number, set: (n: number) => void) => (
    <div className="my-3">
      <div className="mb-1 flex items-center justify-between">
        <Label className="font-semibold">{label}</Label>
        {/* number input on the right */}
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
          className="w-24"
        />
      </div>
      {/* keep the slider theme-aware */}
      <Slider
        min={0}
        max={200}
        step={0.01}
        value={[value]}
        onValueChange={([v]: number[]) => set(v)}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>WebSocket</span>
        <span>{ready ? "connected" : "offline"}</span>
      </div>

      {Row("P", p, setP)}
      {Row("I", i, setI)}
      {Row("D", d, setD)}

      <Button className="w-full" onClick={apply}>Apply</Button>
      {!!msg && <div className="text-xs opacity-75">{msg}</div>}
    </div>
  );
}
