import { NextResponse } from 'next/server';
import { createBuild, listBuilds } from '@/lib/queries';
import { parseString } from '@/lib/parse';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(listBuilds());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = parseString(body?.name);
  if (!name) {
    return NextResponse.json({ error: 'Le nom du build est requis.' }, { status: 400 });
  }
  const build = createBuild(name, parseString(body?.description));
  return NextResponse.json(build, { status: 201 });
}
