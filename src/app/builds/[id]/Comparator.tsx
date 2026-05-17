'use client';

import type { BuildDetail } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { cheapestScenario, chosenOffer, computeStats, partSubtotal } from '@/lib/compute';
import { formatEUR } from '@/lib/format';
import { api } from '@/lib/api';

type Run = (fn: () => Promise<unknown>) => Promise<void>;

export function Comparator({ build, run }: { build: BuildDetail; run: Run }) {
  const stats = computeStats(build.parts);
  const cheapest = cheapestScenario(build.parts);
  const delta = stats.totalPrice - cheapest.totalPrice;
  const categories = CATEGORIES.filter((category) =>
    build.parts.some((part) => part.category === category.key),
  );

  return (
    <div>
      <div className="compare-summary">
        <div className="compare-summary__cell">
          <div className="compare-summary__label">Total du build actuel</div>
          <div className="compare-summary__value">{formatEUR(stats.totalPrice)}</div>
          <div className="compare-summary__delta">sur les pièces sélectionnées</div>
        </div>
        <div className="compare-summary__cell">
          <div className="compare-summary__label">Scénario le moins cher</div>
          <div className="compare-summary__value compare-summary__value--green">
            {formatEUR(cheapest.totalPrice)}
          </div>
          <div className="compare-summary__delta">
            {delta > 0.01
              ? `économie possible : ${formatEUR(delta)}`
              : 'le build est déjà au plus bas'}
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty">
          <strong>Comparateur vide</strong>
          Ajoutez des pièces et leurs alternatives dans l’onglet Build pour les
          comparer ici.
        </div>
      ) : (
        categories.map((category) => {
          const parts = build.parts.filter((p) => p.category === category.key);
          const cheapestId = cheapest.picks.get(category.key);
          return (
            <section className="compare-cat" key={category.key}>
              <div className="compare-cat__head">
                <span className="tag">{category.short}</span>
                <span className="compare-cat__title">{category.label}</span>
                <span
                  className="muted"
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  {parts.length} alternative{parts.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="compare-grid">
                {parts.map((part) => {
                  const price = partSubtotal(part);
                  const offer = chosenOffer(part);
                  return (
                    <button
                      type="button"
                      key={part.id}
                      className={part.is_selected ? 'alt alt--selected' : 'alt'}
                      onClick={() =>
                        run(() =>
                          api.updatePart(part.id, {
                            is_selected: !part.is_selected,
                          }),
                        )
                      }
                      title={
                        part.is_selected
                          ? 'Retirer du build'
                          : 'Choisir pour le build'
                      }
                    >
                      <div className="alt__name">
                        {part.model || part.brand || 'Pièce'}
                        {part.model && part.brand && (
                          <span className="alt__brand"> · {part.brand}</span>
                        )}
                      </div>
                      <div className="alt__row">
                        {price != null ? (
                          <span className="alt__price">{formatEUR(price)}</span>
                        ) : (
                          <span className="alt__price alt__price--none">
                            sans prix
                          </span>
                        )}
                        {offer?.delivery_days != null && (
                          <span className="alt__meta">{offer.delivery_days} j</span>
                        )}
                      </div>
                      <div className="alt__flags">
                        {part.is_selected && (
                          <span className="tag tag--accent">choisi</span>
                        )}
                        {part.quantity > 1 && (
                          <span className="tag">× {part.quantity}</span>
                        )}
                        {part.id === cheapestId && price != null && (
                          <span className="tag tag--green">moins cher</span>
                        )}
                        {part.perf_score != null && (
                          <span className="tag">
                            {part.perf_label || 'score'} {part.perf_score}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
