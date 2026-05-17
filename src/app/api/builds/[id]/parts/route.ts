import { NextResponse } from 'next/server';
import { createPart } from '@/lib/queries';
import { isCategoryKey } from '@/lib/categories';
import { parseNullableNumber, parseQuantity, parseString } from '@/lib/parse';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const buildId = Number((await params).id);
  const body = await request.json().catch(() => null);

  if (!isCategoryKey(body?.category)) {
    return NextResponse.json({ error: 'Catégorie de pièce invalide.' }, { status: 400 });
  }
  const brand = parseString(body?.brand);
  const model = parseString(body?.model);
  if (!brand && !model) {
    return NextResponse.json(
      { error: 'Indique au moins une marque ou un modèle.' },
      { status: 400 },
    );
  }

  const part = createPart(buildId, {
    category: body.category,
    brand,
    model,
    description: parseString(body?.description),
    perf_score: parseNullableNumber(body?.perf_score),
    perf_label: parseString(body?.perf_label),
    quantity: parseQuantity(body?.quantity),
  });
  if (!part) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }
  return NextResponse.json(part, { status: 201 });
}
