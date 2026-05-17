import { NextResponse } from 'next/server';
import { listVendors } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(listVendors());
}
