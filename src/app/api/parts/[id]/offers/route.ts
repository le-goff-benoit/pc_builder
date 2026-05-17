import { NextResponse } from 'next/server';
import { createOffer } from '@/lib/queries';
import { parseNullableInt, parseNumber, parseString } from '@/lib/parse';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const partId = Number((await params).id);
  const body = await request.json().catch(() => null);

  const vendorName = parseString(body?.vendorName);
  if (!vendorName) {
    return NextResponse.json(
      { error: 'Le site marchand est requis.' },
      { status: 400 },
    );
  }

  const offer = createOffer(partId, {
    vendorName,
    url: parseString(body?.url),
    price: Math.max(0, parseNumber(body?.price)),
    delivery_days: parseNullableInt(body?.delivery_days),
  });
  if (!offer) {
    return NextResponse.json({ error: 'Pièce introuvable.' }, { status: 404 });
  }
  return NextResponse.json(offer, { status: 201 });
}
