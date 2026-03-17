import { NextResponse } from 'next/server';
import { getBridgeStatus } from '@/lib/scrape';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await getBridgeStatus();
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        bridgeName: 'Brickell Avenue Bridge',
        status: 'UNKNOWN',
        rawStatus: 'Unavailable',
        checkedAt: new Date().toISOString(),
        sourceUrl: process.env.FL511_SOURCE_URL || 'https://fl511.com/list/bridge',
        note: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
