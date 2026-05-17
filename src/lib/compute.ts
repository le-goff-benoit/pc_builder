import { CATEGORIES } from './categories';
import type { CategoryKey } from './categories';
import type { Offer, Part } from './types';

/**
 * The offer used when pricing a part: the explicitly preferred one, or the
 * cheapest available when none is marked. Returns null when the part has no
 * order link yet.
 */
export function chosenOffer(part: Part): Offer | null {
  if (part.offers.length === 0) return null;
  const preferred = part.offers.find((o) => o.is_preferred);
  if (preferred) return preferred;
  return [...part.offers].sort((a, b) => a.price - b.price)[0];
}

/** Unit price of a part's chosen offer, or null when it has no offers. */
export function bestPrice(part: Part): number | null {
  const offer = chosenOffer(part);
  return offer ? offer.price : null;
}

/** Total cost of a part: unit price × quantity, or null when unpriced. */
export function partSubtotal(part: Part): number | null {
  const offer = chosenOffer(part);
  return offer ? offer.price * part.quantity : null;
}

export interface BuildStats {
  partCount: number;
  selectedCount: number;
  totalPrice: number;
  pricedSelectedCount: number;
  unpricedSelectedCount: number;
  /** Longest known delivery delay among selected, priced parts. */
  maxDeliveryDays: number | null;
  /** True when a selected, priced part has no delivery delay set. */
  deliveryUnknown: boolean;
  missingEssential: CategoryKey[];
  /** Per selected part, the offer that prices it (sorted by category order). */
  lines: { part: Part; offer: Offer | null }[];
}

const CATEGORY_ORDER = new Map(CATEGORIES.map((c, i) => [c.key, i]));

/** Aggregates everything the receipt and the home cards need from a part list. */
export function computeStats(parts: Part[]): BuildStats {
  const selected = parts
    .filter((p) => p.is_selected)
    .sort(
      (a, b) =>
        (CATEGORY_ORDER.get(a.category) ?? 99) - (CATEGORY_ORDER.get(b.category) ?? 99),
    );

  const lines = selected.map((part) => ({ part, offer: chosenOffer(part) }));

  let totalPrice = 0;
  let pricedSelectedCount = 0;
  let unpricedSelectedCount = 0;
  let maxDeliveryDays: number | null = null;
  let deliveryUnknown = false;

  for (const { part, offer } of lines) {
    if (offer) {
      totalPrice += offer.price * part.quantity;
      pricedSelectedCount += 1;
      if (offer.delivery_days != null) {
        maxDeliveryDays =
          maxDeliveryDays == null
            ? offer.delivery_days
            : Math.max(maxDeliveryDays, offer.delivery_days);
      } else {
        deliveryUnknown = true;
      }
    } else {
      unpricedSelectedCount += 1;
    }
  }

  const present = new Set(selected.map((p) => p.category));
  const missingEssential = CATEGORIES.filter(
    (c) => c.essential && !present.has(c.key),
  ).map((c) => c.key);

  return {
    partCount: parts.length,
    selectedCount: selected.length,
    totalPrice,
    pricedSelectedCount,
    unpricedSelectedCount,
    maxDeliveryDays,
    deliveryUnknown,
    missingEssential,
    lines,
  };
}

export interface CheapestScenario {
  /** Chosen part id per category, picking the lowest-priced candidate. */
  picks: Map<CategoryKey, number>;
  totalPrice: number;
}

/**
 * The theoretical cheapest build: for every category, the candidate part with
 * the lowest price. Used by the comparator to show savings potential.
 */
export function cheapestScenario(parts: Part[]): CheapestScenario {
  const picks = new Map<CategoryKey, number>();
  const byCategory = new Map<CategoryKey, Part[]>();

  for (const part of parts) {
    const list = byCategory.get(part.category) ?? [];
    list.push(part);
    byCategory.set(part.category, list);
  }

  let totalPrice = 0;
  for (const [category, list] of byCategory) {
    let best: { part: Part; price: number } | null = null;
    for (const part of list) {
      const price = partSubtotal(part);
      if (price == null) continue;
      if (!best || price < best.price) best = { part, price };
    }
    if (best) {
      picks.set(category, best.part.id);
      totalPrice += best.price;
    }
  }

  return { picks, totalPrice };
}
