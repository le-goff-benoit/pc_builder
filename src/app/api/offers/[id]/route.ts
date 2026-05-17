import { NextResponse } from 'next/server';
import { deleteOffer, setOfferPreferred, updateOfferFields } from '@/lib/queries';
import { parseNullableInt, parseNumber } from '@/lib/parse';
import type { OfferInput } from '@/lib/queries';
import type { Offer } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  let offer: Offer | null = null;
  let touched = false;

  const fields: Partial<OfferInput> = {};
  if (typeof body.vendorName === 'string') fields.vendorName = body.vendorName.trim();
  if (typeof body.url === 'string') fields.url = body.url.trim();
  if ('price' in body) fields.price = Math.max(0, parseNumber(body.price));
  if ('delivery_days' in body) fields.delivery_days = parseNullableInt(body.delivery_days);

  if (Object.keys(fields).length > 0) {
    offer = updateOfferFields(id, fields);
    touched = true;
  }
  if (typeof body.is_preferred === 'boolean') {
    offer = setOfferPreferred(id, body.is_preferred);
    touched = true;
  }

  if (!touched) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 });
  }
  if (!offer) {
    return NextResponse.json({ error: 'Lien de commande introuvable.' }, { status: 404 });
  }
  return NextResponse.json(offer);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!deleteOffer(Number((await params).id))) {
    return NextResponse.json({ error: 'Lien de commande introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
