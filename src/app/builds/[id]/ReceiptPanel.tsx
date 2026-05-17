'use client';

import type { BuildStats } from '@/lib/compute';
import { CATEGORY_MAP } from '@/lib/categories';
import { addDays, formatDateLong, formatEUR } from '@/lib/format';

export function ReceiptPanel({
  stats,
  orderDate,
  onOrderDateChange,
}: {
  stats: BuildStats;
  orderDate: string;
  onOrderDateChange: (value: string) => void;
}) {
  const readyDate =
    stats.maxDeliveryDays != null ? addDays(orderDate, stats.maxDeliveryDays) : null;

  return (
    <div className="receipt">
      <div className="receipt__head">
        <h2 className="eyebrow">Récapitulatif</h2>
        <span className="tag">
          {stats.selectedCount} pièce{stats.selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="receipt__body">
        {stats.lines.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Cochez des pièces dans les emplacements pour composer le total.
          </p>
        ) : (
          <div className="receipt__lines">
            {stats.lines.map(({ part, offer }) => (
              <div className="receipt__line" key={part.id}>
                <span className="receipt__line-cat">
                  {CATEGORY_MAP[part.category]?.short}
                </span>
                <span className="receipt__line-name">
                  {part.brand && (
                    <span className="receipt__line-brand">{part.brand} </span>
                  )}
                  {part.model || (part.brand ? '' : 'Pièce')}
                  {part.quantity > 1 && (
                    <span className="receipt__line-qty"> ×{part.quantity}</span>
                  )}
                </span>
                {offer ? (
                  <span className="receipt__line-price">
                    {formatEUR(offer.price * part.quantity)}
                  </span>
                ) : (
                  <span className="receipt__line-price receipt__line-price--missing">
                    sans prix
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="receipt__rule receipt__rule--dashed" />

        <div className="receipt__total">
          <span className="receipt__total-label">Total</span>
          <span className="receipt__total-value">{formatEUR(stats.totalPrice)}</span>
        </div>
        {stats.unpricedSelectedCount > 0 && (
          <p className="receipt__note">
            {stats.unpricedSelectedCount} pièce
            {stats.unpricedSelectedCount > 1 ? 's' : ''} sans prix renseigné
          </p>
        )}

        <div className="date-input">
          <span className="field__label">Commande le</span>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => onOrderDateChange(e.target.value)}
          />
        </div>

        <div className="receipt__block">
          <div className="receipt__block-label">Réception estimée</div>
          {readyDate ? (
            <>
              <div className="receipt__date">{formatDateLong(readyDate)}</div>
              <div className="receipt__date-sub">
                délai le plus long&nbsp;: {stats.maxDeliveryDays}&nbsp;j
                {stats.deliveryUnknown ? ' · des pièces sans délai' : ''}
              </div>
            </>
          ) : (
            <div className="receipt__date-sub" style={{ marginTop: 3 }}>
              Aucun délai de livraison renseigné.
            </div>
          )}
        </div>

        {stats.missingEssential.length > 0 && (
          <div className="receipt__block">
            <div className="receipt__block-label">
              Emplacements essentiels à combler
            </div>
            <div className="receipt__warn">
              {stats.missingEssential.map((key) => (
                <span className="tag tag--amber" key={key}>
                  {CATEGORY_MAP[key].label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
