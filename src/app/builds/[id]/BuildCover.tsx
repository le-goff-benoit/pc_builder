'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Pencil, Spinner, Trash } from '@/components/icons';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

export function BuildCover({
  buildId,
  imagePath,
  onChange,
}: {
  buildId: number;
  imagePath: string;
  onChange: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await api.uploadBuildImage(buildId, file);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Téléversement impossible.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.removeBuildImage(buildId);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="build-cover">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {imagePath ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="build-cover__img"
            src={`/api/builds/${buildId}/image?v=${encodeURIComponent(imagePath)}`}
            alt="Visuel du build"
          />
          <div className="build-cover__bar">
            <button
              type="button"
              className="btn btn--sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Spinner size={13} className="spin" /> : <Pencil size={13} />}
              Remplacer
            </button>
            <button
              type="button"
              className="btn btn--sm btn--danger"
              disabled={busy}
              onClick={remove}
            >
              <Trash size={13} /> Retirer
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="build-cover__empty"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Spinner size={22} className="spin" /> : <Box size={24} />}
          <span className="build-cover__empty-title">
            {busy ? 'Téléversement…' : 'Ajouter une image du build'}
          </span>
          <span className="build-cover__empty-hint">JPEG · PNG · WebP — 6 Mo max</span>
        </button>
      )}

      {error && <div className="build-cover__error">{error}</div>}
    </div>
  );
}
