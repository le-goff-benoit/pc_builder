'use client';

import { useState } from 'react';
import type { Offer, Part } from '@/lib/types';
import { api } from '@/lib/api';
import { formatEUR } from '@/lib/format';
import { Check, External, Pencil, Plus, Star, Trash } from '@/components/icons';
import { PartForm } from './PartForm';
import { OfferForm } from './OfferForm';

type Run = (fn: () => Promise<unknown>) => Promise<void>;

function OfferRow({
  offer,
  onPrefer,
  onEdit,
  onDelete,
}: {
  offer: Offer;
  onPrefer: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={offer.is_preferred ? 'offer offer--preferred' : 'offer'}>
      <button
        type="button"
        className={offer.is_preferred ? 'offer__star offer__star--on' : 'offer__star'}
        onClick={onPrefer}
        aria-pressed={offer.is_preferred}
        title={
          offer.is_preferred
            ? 'Offre retenue pour le total'
            : 'Retenir cette offre pour le total'
        }
      >
        <Star size={13} filled={offer.is_preferred} />
      </button>

      {offer.url ? (
        <a
          className="offer__vendor offer__vendor-link"
          href={offer.url}
          target="_blank"
          rel="noreferrer"
        >
          {offer.vendor_name}
          <External size={11} />
        </a>
      ) : (
        <span className="offer__vendor">{offer.vendor_name}</span>
      )}

      {offer.delivery_days != null && (
        <span className="offer__delivery">{offer.delivery_days} j</span>
      )}
      <span className="offer__price">{formatEUR(offer.price)}</span>

      <div className="offer__actions">
        <button
          type="button"
          className="iconbtn"
          onClick={onEdit}
          aria-label="Modifier le lien"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          className="iconbtn iconbtn--danger"
          onClick={onDelete}
          aria-label="Supprimer le lien"
        >
          <Trash size={12} />
        </button>
      </div>
    </div>
  );
}

export function PartCard({
  part,
  allowMultiple,
  vendors,
  run,
}: {
  part: Part;
  allowMultiple: boolean;
  vendors: string[];
  run: Run;
}) {
  const [editing, setEditing] = useState(false);
  const [addingOffer, setAddingOffer] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);

  const selectClass = [
    'part__select',
    allowMultiple ? 'part__select--box' : '',
    part.is_selected ? 'part__select--on' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={part.is_selected ? 'part part--selected' : 'part'}>
      <div className="part__main">
        <button
          type="button"
          className={selectClass}
          onClick={() =>
            run(() => api.updatePart(part.id, { is_selected: !part.is_selected }))
          }
          aria-pressed={part.is_selected}
          title={part.is_selected ? 'Retirer du build' : 'Mettre dans le build'}
        >
          {part.is_selected && <Check size={13} />}
        </button>

        <div className="part__info">
          {editing ? (
            <PartForm
              initial={part}
              onSubmit={async (data) => {
                await run(() => api.updatePart(part.id, data));
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="part__title">
                {part.model || part.brand || 'Pièce sans nom'}
                {part.model && part.brand && (
                  <span className="part__brand"> · {part.brand}</span>
                )}
                {part.quantity > 1 && (
                  <span className="part__qty">×{part.quantity}</span>
                )}
              </div>
              {part.description && <p className="part__desc">{part.description}</p>}
              <div className="part__badges">
                {part.is_selected && (
                  <span className="tag tag--accent">dans le build</span>
                )}
                {part.perf_score != null && (
                  <span className="tag">
                    {part.perf_label || 'score'} {part.perf_score}
                  </span>
                )}
                <span className="tag">
                  {part.offers.length} lien{part.offers.length > 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="part__actions">
            <button
              type="button"
              className="iconbtn"
              onClick={() => setEditing(true)}
              aria-label="Modifier la pièce"
              title="Modifier"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="iconbtn iconbtn--danger"
              onClick={() => {
                if (window.confirm('Supprimer cette pièce et ses liens de commande ?')) {
                  run(() => api.deletePart(part.id));
                }
              }}
              aria-label="Supprimer la pièce"
              title="Supprimer"
            >
              <Trash size={13} />
            </button>
          </div>
        )}
      </div>

      {!editing && (
        <div className="offers">
          <div className="offers__title">Liens de commande</div>

          {part.offers.length === 0 && !addingOffer && (
            <span className="offer-empty">
              Aucun lien — ajoutez un prix pour suivre cette pièce.
            </span>
          )}

          {part.offers.map((offer) =>
            editingOfferId === offer.id ? (
              <OfferForm
                key={offer.id}
                initial={offer}
                vendors={vendors}
                onSubmit={async (data) => {
                  await run(() => api.updateOffer(offer.id, data));
                  setEditingOfferId(null);
                }}
                onCancel={() => setEditingOfferId(null)}
              />
            ) : (
              <OfferRow
                key={offer.id}
                offer={offer}
                onPrefer={() =>
                  run(() =>
                    api.updateOffer(offer.id, { is_preferred: !offer.is_preferred }),
                  )
                }
                onEdit={() => setEditingOfferId(offer.id)}
                onDelete={() => run(() => api.deleteOffer(offer.id))}
              />
            ),
          )}

          {addingOffer ? (
            <OfferForm
              vendors={vendors}
              onSubmit={async (data) => {
                await run(() => api.createOffer(part.id, data));
                setAddingOffer(false);
              }}
              onCancel={() => setAddingOffer(false)}
            />
          ) : (
            <div className="add-row">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setAddingOffer(true)}
              >
                <Plus size={13} /> Lien de commande
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
