import { NextRequest, NextResponse } from 'next/server';

type PidBody = { kp?: number; ki?: number; kd?: number };

export async function POST(request: NextRequest) {
  const bodyUnknown: unknown = await request.json();
  const body = ((): PidBody | null => {
    if (!bodyUnknown || typeof bodyUnknown !== "object") return null;
    const b = bodyUnknown as Record<string, unknown>;
    const kp = typeof b.kp === "number" ? b.kp : undefined;
    const ki = typeof b.ki === "number" ? b.ki : undefined;
    const kd = typeof b.kd === "number" ? b.kd : undefined;
    return { kp, ki, kd };
  })();

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const { p, i, d } = await request.json();
    if ([p, i, d].some(val => val === undefined)) {
      return NextResponse.json({ error: 'Missing PID values' }, { status: 400 });
    }
    // TODO: apply the PID values to the motor controller via RTOS task
    
    return NextResponse.json({ status: 'PID updated', p, i, d }, { status: 200 });
  } catch (err: unknown) {
    console.error('PID update error:', err);
    return NextResponse.json({ error: 'PID update failed' }, { status: 500 });
  }
}
