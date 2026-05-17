import { NextResponse } from 'next/server';
import { deletePart, setPartSelected, updatePartFields } from '@/lib/queries';
import { parseNullableNumber, parseQuantity } from '@/lib/parse';
import type { PartInput } from '@/lib/queries';
import type { Part } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  let part: Part | null = null;
  let touched = false;

  const fields: Partial<Omit<PartInput, 'category'>> = {};
  if (typeof body.brand === 'string') fields.brand = body.brand.trim();
  if (typeof body.model === 'string') fields.model = body.model.trim();
  if (typeof body.description === 'string') fields.description = body.description.trim();
  if (typeof body.perf_label === 'string') fields.perf_label = body.perf_label.trim();
  if ('perf_score' in body) fields.perf_score = parseNullableNumber(body.perf_score);
  if ('quantity' in body) fields.quantity = parseQuantity(body.quantity);

  if (Object.keys(fields).length > 0) {
    part = updatePartFields(id, fields);
    touched = true;
  }
  if (typeof body.is_selected === 'boolean') {
    part = setPartSelected(id, body.is_selected);
    touched = true;
  }

  if (!touched) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 });
  }
  if (!part) {
    return NextResponse.json({ error: 'Pièce introuvable.' }, { status: 404 });
  }
  return NextResponse.json(part);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!deletePart(Number((await params).id))) {
    return NextResponse.json({ error: 'Pièce introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
