'use client';

import { useId, useState } from 'react';
import type { Offer } from '@/lib/types';
import { Field } from '@/components/Field';
import { Spinner } from '@/components/icons';

export interface OfferFormData {
  vendorName: string;
  url: string;
  price: number;
  delivery_days: number | null;
}

export function OfferForm({
  initial,
  vendors,
  onSubmit,
  onCancel,
}: {
  initial?: Offer;
  vendors: string[];
  onSubmit: (data: OfferFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const listId = useId();
  const [vendorName, setVendorName] = useState(initial?.vendor_name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [delivery, setDelivery] = useState(
    initial?.delivery_days != null ? String(initial.delivery_days) : '',
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !vendorName.trim()) return;
    setBusy(true);
    try {
      const priceNum = Number(price);
      const deliveryNum = delivery.trim() === '' ? NaN : Number(delivery);
      await onSubmit({
        vendorName: vendorName.trim(),
        url: url.trim(),
        price: Number.isFinite(priceNum) ? Math.max(0, priceNum) : 0,
        delivery_days: Number.isFinite(deliveryNum)
          ? Math.max(0, Math.round(deliveryNum))
          : null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <div className="inline-form__title">
        {initial ? 'Modifier le lien de commande' : 'Nouveau lien de commande'}
      </div>
      <div className="form-grid">
        <div className="form-grid form-grid--2">
          <Field label="Site marchand">
            <input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              list={listId}
              placeholder="ex. Amazon"
              maxLength={80}
              autoFocus
            />
            <datalist id={listId}>
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor} />
              ))}
            </datalist>
          </Field>
          <Field label="Prix en euros" mono>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </Field>
        </div>
        <Field label="Lien de commande (optionnel)">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://…"
          />
        </Field>
        <Field label="Délai de livraison en jours (optionnel)" mono>
          <input
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            inputMode="numeric"
            placeholder="ex. 3"
          />
        </Field>
      </div>
      <div className="form-actions" style={{ marginTop: 13 }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Annuler
        </button>
        <button
          className="btn btn--primary btn--sm"
          disabled={busy || !vendorName.trim()}
        >
          {busy && <Spinner size={13} className="spin" />}
          {initial ? 'Enregistrer' : 'Ajouter le lien'}
        </button>
      </div>
    </form>
  );
}
