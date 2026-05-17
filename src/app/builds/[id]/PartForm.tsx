'use client';

import { useState } from 'react';
import type { Part } from '@/lib/types';
import { Field } from '@/components/Field';
import { Spinner } from '@/components/icons';

export interface PartFormData {
  brand: string;
  model: string;
  description: string;
  perf_score: number | null;
  perf_label: string;
  quantity: number;
}

export function PartForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Part;
  onSubmit: (data: PartFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [perfScore, setPerfScore] = useState(
    initial?.perf_score != null ? String(initial.perf_score) : '',
  );
  const [perfLabel, setPerfLabel] = useState(initial?.perf_label ?? '');
  const [busy, setBusy] = useState(false);

  const valid = brand.trim() !== '' || model.trim() !== '';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !valid) return;
    setBusy(true);
    try {
      const score = perfScore.trim() === '' ? NaN : Number(perfScore);
      const qty = Math.round(Number(quantity));
      await onSubmit({
        brand: brand.trim(),
        model: model.trim(),
        description: description.trim(),
        perf_score: Number.isFinite(score) ? score : null,
        perf_label: perfLabel.trim(),
        quantity: Number.isFinite(qty) && qty >= 1 ? qty : 1,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <div className="inline-form__title">
        {initial ? 'Modifier la pièce' : 'Nouvelle pièce'}
      </div>
      <div className="form-grid">
        <div className="form-grid form-grid--2">
          <Field label="Marque">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="ex. AMD"
              maxLength={80}
              autoFocus
            />
          </Field>
          <Field label="Modèle">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ex. Ryzen 7 7800X3D"
              maxLength={140}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, caractéristiques clés, compatibilité…"
            maxLength={600}
          />
        </Field>
        <div className="form-grid form-grid--3">
          <Field label="Quantité" mono>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>
          <Field label="Score de performance" mono>
            <input
              value={perfScore}
              onChange={(e) => setPerfScore(e.target.value)}
              inputMode="decimal"
              placeholder="ex. 34000"
            />
          </Field>
          <Field label="Référence du score">
            <input
              value={perfLabel}
              onChange={(e) => setPerfLabel(e.target.value)}
              placeholder="ex. PassMark"
              maxLength={40}
            />
          </Field>
        </div>
      </div>
      <div className="form-actions" style={{ marginTop: 13 }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn btn--primary btn--sm" disabled={busy || !valid}>
          {busy && <Spinner size={13} className="spin" />}
          {initial ? 'Enregistrer' : 'Ajouter la pièce'}
        </button>
      </div>
    </form>
  );
}
