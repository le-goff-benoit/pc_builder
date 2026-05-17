import type { CategoryKey } from './categories';

/** A PC build: a named collection of parts. */
export interface Build {
  id: number;
  name: string;
  description: string;
  /** Filename (within data/uploads) of the build's cover image, or '' when none. */
  image_path: string;
  created_at: string;
  updated_at: string;
}

/** A retailer / website an order link points to. */
export interface Vendor {
  id: number;
  name: string;
  website: string;
}

/** An order link for a part: a price (EUR) at a given vendor. */
export interface Offer {
  id: number;
  part_id: number;
  vendor_id: number;
  vendor_name: string;
  url: string;
  price: number;
  /** Estimated delivery delay in days, or null when unknown. */
  delivery_days: number | null;
  /** The offer used for totals; falls back to cheapest when none is preferred. */
  is_preferred: boolean;
  created_at: string;
}

/** A candidate component in a build, belonging to one category. */
export interface Part {
  id: number;
  build_id: number;
  category: CategoryKey;
  brand: string;
  model: string;
  description: string;
  /** Optional manual performance score (e.g. a PassMark value). */
  perf_score: number | null;
  /** Free-text label for the score, e.g. "PassMark", "Geekbench 6". */
  perf_label: string;
  /** True when this part is the one chosen for the build in its category. */
  is_selected: boolean;
  /** How many units of this part the build needs (RAM kits, SSDs…). */
  quantity: number;
  created_at: string;
  offers: Offer[];
}

/** A build together with all of its parts and their offers. */
export interface BuildDetail extends Build {
  parts: Part[];
}

/** Lightweight build figures for the home listing. */
export interface BuildSummary extends Build {
  partCount: number;
  selectedCount: number;
  totalPrice: number;
  pricedSelectedCount: number;
  missingEssentialCount: number;
}
