import { NextResponse } from 'next/server';
import { deleteBuild, getBuild, updateBuild } from '@/lib/queries';
import { parseString } from '@/lib/parse';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const build = getBuild(Number((await params).id));
  if (!build) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }
  return NextResponse.json(build);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const body = await request.json().catch(() => null);

  const fields: { name?: string; description?: string } = {};
  if (typeof body?.name === 'string') {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: 'Le nom ne peut pas être vide.' }, { status: 400 });
    }
    fields.name = name;
  }
  if (typeof body?.description === 'string') {
    fields.description = body.description.trim();
  }

  const build = updateBuild(id, fields);
  if (!build) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }
  return NextResponse.json(build);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!deleteBuild(Number((await params).id))) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
