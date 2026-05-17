'use client';

import { useState } from 'react';
import type { Category } from '@/lib/categories';
import type { Part } from '@/lib/types';
import { api } from '@/lib/api';
import { Plus } from '@/components/icons';
import { PartCard } from './PartCard';
import { PartForm } from './PartForm';

type Run = (fn: () => Promise<unknown>) => Promise<void>;

export function CategorySlot({
  index,
  category,
  buildId,
  parts,
  vendors,
  run,
}: {
  index: number;
  category: Category;
  buildId: number;
  parts: Part[];
  vendors: string[];
  run: Run;
}) {
  const [adding, setAdding] = useState(false);
  const empty = parts.length === 0;

  return (
    <section className={empty ? 'slot slot--empty' : 'slot'}>
      <div className="slot__head">
        <span className="slot__index">{String(index).padStart(2, '0')}</span>
        <div className="slot__titles">
          <div className="slot__title">
            {category.label}
            <span className="tag">{category.short}</span>
            {category.essential && <span className="tag tag--amber">essentiel</span>}
          </div>
          <div className="slot__hint">{category.hint}</div>
        </div>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => setAdding((value) => !value)}
        >
          <Plus size={13} /> Pièce
        </button>
      </div>

      <div className="slot__body">
        {parts.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            allowMultiple={category.allowMultiple}
            vendors={vendors}
            run={run}
          />
        ))}

        {adding && (
          <PartForm
            onSubmit={async (data) => {
              await run(() =>
                api.createPart(buildId, { category: category.key, ...data }),
              );
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        {empty && !adding && (
          <div
            className={
              category.essential
                ? 'slot-empty-note slot-empty-note--essential'
                : 'slot-empty-note'
            }
          >
            {category.essential
              ? 'Emplacement essentiel — aucune pièce ajoutée'
              : 'Aucune pièce — emplacement optionnel'}
          </div>
        )}
      </div>
    </section>
  );
}
