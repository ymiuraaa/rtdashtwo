import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { p, i, d } = await request.json();
    if ([p, i, d].some(val => val === undefined)) {
      return NextResponse.json({ error: 'Missing PID values' }, { status: 400 });
    }
    // TODO: apply the PID values to the motor controller via RTOS task
    
    return NextResponse.json({ status: 'PID updated', p, i, d }, { status: 200 });
  } catch (err: any) {
    console.error('PID update error:', err);
    return NextResponse.json({ error: 'PID update failed' }, { status: 500 });
  }
}
