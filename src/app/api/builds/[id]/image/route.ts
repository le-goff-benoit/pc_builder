import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getBuild, getBuildImage, setBuildImage } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_BYTES = 6 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

type Ctx = { params: Promise<{ id: string }> };

/** Streams the build's cover image. */
export async function GET(_request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const filename = getBuildImage(id);
  if (!filename) {
    return NextResponse.json({ error: 'Aucune image.' }, { status: 404 });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
  }
  const ext = path.extname(filename).slice(1).toLowerCase();
  return new Response(fs.readFileSync(filePath), {
    headers: {
      'Content-Type': TYPE_BY_EXT[ext] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}

/** Uploads (or replaces) the build's cover image. */
export async function POST(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (getBuildImage(id) === null) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Envoi invalide.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Format non supporté — utilisez JPEG, PNG, WebP, GIF ou AVIF.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image trop lourde (6 Mo maximum).' }, { status: 400 });
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = `build-${id}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const previous = getBuildImage(id);
  setBuildImage(id, filename);
  if (previous && previous !== filename) {
    fs.rm(path.join(UPLOADS_DIR, previous), { force: true }, () => {});
  }

  return NextResponse.json(getBuild(id), { status: 201 });
}

/** Removes the build's cover image. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const filename = getBuildImage(id);
  if (filename === null) {
    return NextResponse.json({ error: 'Build introuvable.' }, { status: 404 });
  }
  if (filename) {
    fs.rm(path.join(UPLOADS_DIR, filename), { force: true }, () => {});
    setBuildImage(id, '');
  }
  return NextResponse.json(getBuild(id));
}
