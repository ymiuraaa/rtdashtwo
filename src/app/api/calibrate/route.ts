import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const { axis } = await request.json();  // JSON format plan for now: { "axis": "x" or "y" ... }
    if (!axis) {
      return NextResponse.json({ error: 'No axis specified' }, { status: 400 });
    }
    // TODO: perform the actual calibration via the RTOS task
    
    return NextResponse.json({ status: 'success', axis }, { status: 200 });
  } catch (err: unknown) {
    console.error('Calibration error:', err);
    return NextResponse.json({ error: 'Calibration failed' }, { status: 500 });
  }
}