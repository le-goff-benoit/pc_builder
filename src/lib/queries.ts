/**
 * Data-access layer. Every SQL statement for Établi lives here so route
 * handlers and server components stay thin and the schema has a single home.
 */
import { db } from './db';
import { CATEGORY_MAP } from './categories';
import type { CategoryKey } from './categories';
import { computeStats } from './compute';
import type { Build, BuildDetail, BuildSummary, Offer, Part, Vendor } from './types';

type Row = Record<string, unknown>;
type SqlValue = string | number | bigint | null;

const num = (v: unknown): number => Number(v);
const str = (v: unknown): string => (v == null ? '' : String(v));
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

/* -------------------------------------------------------------------------- */
/* Normalisation: SQLite returns 0/1 for booleans — map rows to typed objects. */
/* -------------------------------------------------------------------------- */

function normalizeBuild(r: Row): Build {
  return {
    id: num(r.id),
    name: str(r.name),
    description: str(r.description),
    image_path: str(r.image_path),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  };
}

function normalizeOffer(r: Row): Offer {
  return {
    id: num(r.id),
    part_id: num(r.part_id),
    vendor_id: num(r.vendor_id),
    vendor_name: str(r.vendor_name),
    url: str(r.url),
    price: num(r.price),
    delivery_days: numOrNull(r.delivery_days),
    is_preferred: Boolean(r.is_preferred),
    created_at: str(r.created_at),
  };
}

function normalizePart(r: Row, offers: Offer[]): Part {
  return {
    id: num(r.id),
    build_id: num(r.build_id),
    category: str(r.category) as CategoryKey,
    brand: str(r.brand),
    model: str(r.model),
    description: str(r.description),
    perf_score: numOrNull(r.perf_score),
    perf_label: str(r.perf_label),
    is_selected: Boolean(r.is_selected),
    quantity: r.quantity == null ? 1 : num(r.quantity),
    created_at: str(r.created_at),
    offers,
  };
}

function touchBuild(buildId: number): void {
  db.prepare(`UPDATE builds SET updated_at = datetime('now') WHERE id = ?`).run(buildId);
}

/* -------------------------------------------------------------------------- */
/* Builds                                                                     */
/* -------------------------------------------------------------------------- */

function getParts(buildId: number): Part[] {
  const partRows = db
    .prepare('SELECT * FROM parts WHERE build_id = ? ORDER BY id')
    .all(buildId) as Row[];
  if (partRows.length === 0) return [];

  const offerRows = db
    .prepare(
      `SELECT o.*, v.name AS vendor_name
         FROM offers o
         JOIN vendors v ON v.id = o.vendor_id
        WHERE o.part_id IN (SELECT id FROM parts WHERE build_id = ?)
        ORDER BY o.price ASC, o.id ASC`,
    )
    .all(buildId) as Row[];

  const offersByPart = new Map<number, Offer[]>();
  for (const row of offerRows) {
    const offer = normalizeOffer(row);
    const list = offersByPart.get(offer.part_id) ?? [];
    list.push(offer);
    offersByPart.set(offer.part_id, list);
  }

  return partRows.map((r) => normalizePart(r, offersByPart.get(num(r.id)) ?? []));
}

export function getBuild(id: number): BuildDetail | null {
  const row = db.prepare('SELECT * FROM builds WHERE id = ?').get(id) as Row | undefined;
  if (!row) return null;
  return { ...normalizeBuild(row), parts: getParts(id) };
}

export function listBuilds(): BuildSummary[] {
  const rows = db
    .prepare('SELECT * FROM builds ORDER BY updated_at DESC, id DESC')
    .all() as Row[];

  return rows.map((r) => {
    const build = normalizeBuild(r);
    const stats = computeStats(getParts(build.id));
    return {
      ...build,
      partCount: stats.partCount,
      selectedCount: stats.selectedCount,
      totalPrice: stats.totalPrice,
      pricedSelectedCount: stats.pricedSelectedCount,
      missingEssentialCount: stats.missingEssential.length,
    };
  });
}

export function createBuild(name: string, description: string): BuildDetail {
  const info = db
    .prepare('INSERT INTO builds (name, description) VALUES (?, ?)')
    .run(name, description);
  return getBuild(Number(info.lastInsertRowid))!;
}

export function updateBuild(
  id: number,
  fields: { name?: string; description?: string },
): BuildDetail | null {
  const exists = db.prepare('SELECT id FROM builds WHERE id = ?').get(id);
  if (!exists) return null;
  if (fields.name !== undefined) {
    db.prepare('UPDATE builds SET name = ? WHERE id = ?').run(fields.name, id);
  }
  if (fields.description !== undefined) {
    db.prepare('UPDATE builds SET description = ? WHERE id = ?').run(fields.description, id);
  }
  touchBuild(id);
  return getBuild(id);
}

export function deleteBuild(id: number): boolean {
  return db.prepare('DELETE FROM builds WHERE id = ?').run(id).changes > 0;
}

/** Current cover image filename: '' when none, null when the build is missing. */
export function getBuildImage(id: number): string | null {
  const row = db.prepare('SELECT image_path FROM builds WHERE id = ?').get(id) as
    | Row
    | undefined;
  return row ? str(row.image_path) : null;
}

export function setBuildImage(id: number, imagePath: string): boolean {
  const result = db
    .prepare(`UPDATE builds SET image_path = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(imagePath, id);
  return result.changes > 0;
}

/* -------------------------------------------------------------------------- */
/* Vendors                                                                    */
/* -------------------------------------------------------------------------- */

export function listVendors(): Vendor[] {
  const rows = db.prepare('SELECT * FROM vendors ORDER BY name COLLATE NOCASE').all() as Row[];
  return rows.map((r) => ({ id: num(r.id), name: str(r.name), website: str(r.website) }));
}

/** Finds the vendor by name (case-sensitive) or creates it, returning its id. */
function resolveVendor(name: string): number {
  const clean = name.trim() || 'Inconnu';
  db.prepare('INSERT OR IGNORE INTO vendors (name) VALUES (?)').run(clean);
  const row = db.prepare('SELECT id FROM vendors WHERE name = ?').get(clean) as Row;
  return num(row.id);
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                      */
/* -------------------------------------------------------------------------- */

export interface PartInput {
  category: CategoryKey;
  brand: string;
  model: string;
  description: string;
  perf_score: number | null;
  perf_label: string;
  quantity: number;
}

function getPart(partId: number): Part | null {
  const row = db.prepare('SELECT * FROM parts WHERE id = ?').get(partId) as Row | undefined;
  if (!row) return null;
  const offerRows = db
    .prepare(
      `SELECT o.*, v.name AS vendor_name
         FROM offers o JOIN vendors v ON v.id = o.vendor_id
        WHERE o.part_id = ? ORDER BY o.price ASC, o.id ASC`,
    )
    .all(partId) as Row[];
  return normalizePart(row, offerRows.map(normalizeOffer));
}

function partBuildId(partId: number): number | null {
  const row = db.prepare('SELECT build_id FROM parts WHERE id = ?').get(partId) as Row | undefined;
  return row ? num(row.build_id) : null;
}

export function createPart(buildId: number, input: PartInput): Part | null {
  const build = db.prepare('SELECT id FROM builds WHERE id = ?').get(buildId);
  if (!build) return null;

  // Convenience: the first part added to a category is selected automatically.
  const selectedSibling = db
    .prepare(
      'SELECT 1 FROM parts WHERE build_id = ? AND category = ? AND is_selected = 1 LIMIT 1',
    )
    .get(buildId, input.category);
  const autoSelect = selectedSibling ? 0 : 1;

  const info = db
    .prepare(
      `INSERT INTO parts
         (build_id, category, brand, model, description,
          perf_score, perf_label, quantity, is_selected)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      buildId,
      input.category,
      input.brand,
      input.model,
      input.description,
      input.perf_score,
      input.perf_label,
      input.quantity,
      autoSelect,
    );

  touchBuild(buildId);
  return getPart(Number(info.lastInsertRowid));
}

export function updatePartFields(
  partId: number,
  fields: Partial<Omit<PartInput, 'category'>>,
): Part | null {
  const buildId = partBuildId(partId);
  if (buildId == null) return null;

  const cols: string[] = [];
  const vals: SqlValue[] = [];
  for (const key of [
    'brand',
    'model',
    'description',
    'perf_score',
    'perf_label',
    'quantity',
  ] as const) {
    const value = fields[key];
    if (value !== undefined) {
      cols.push(`${key} = ?`);
      vals.push(value);
    }
  }
  if (cols.length > 0) {
    db.prepare(`UPDATE parts SET ${cols.join(', ')} WHERE id = ?`).run(...vals, partId);
  }
  touchBuild(buildId);
  return getPart(partId);
}

export function setPartSelected(partId: number, selected: boolean): Part | null {
  const row = db
    .prepare('SELECT build_id, category FROM parts WHERE id = ?')
    .get(partId) as Row | undefined;
  if (!row) return null;

  const buildId = num(row.build_id);
  const category = str(row.category) as CategoryKey;
  const allowMultiple = CATEGORY_MAP[category]?.allowMultiple ?? false;

  // Single-choice categories: selecting one clears the rest of the slot.
  if (selected && !allowMultiple) {
    db.prepare('UPDATE parts SET is_selected = 0 WHERE build_id = ? AND category = ?').run(
      buildId,
      category,
    );
  }
  db.prepare('UPDATE parts SET is_selected = ? WHERE id = ?').run(selected ? 1 : 0, partId);
  touchBuild(buildId);
  return getPart(partId);
}

export function deletePart(partId: number): boolean {
  const buildId = partBuildId(partId);
  const changed = db.prepare('DELETE FROM parts WHERE id = ?').run(partId).changes > 0;
  if (changed && buildId != null) touchBuild(buildId);
  return changed;
}

/* -------------------------------------------------------------------------- */
/* Offers                                                                     */
/* -------------------------------------------------------------------------- */

export interface OfferInput {
  vendorName: string;
  url: string;
  price: number;
  delivery_days: number | null;
}

function getOffer(offerId: number): Offer | null {
  const row = db
    .prepare(
      `SELECT o.*, v.name AS vendor_name
         FROM offers o JOIN vendors v ON v.id = o.vendor_id
        WHERE o.id = ?`,
    )
    .get(offerId) as Row | undefined;
  return row ? normalizeOffer(row) : null;
}

function offerBuildId(offerId: number): number | null {
  const row = db
    .prepare(
      `SELECT p.build_id AS build_id
         FROM offers o JOIN parts p ON p.id = o.part_id
        WHERE o.id = ?`,
    )
    .get(offerId) as Row | undefined;
  return row ? num(row.build_id) : null;
}

export function createOffer(partId: number, input: OfferInput): Offer | null {
  const buildId = partBuildId(partId);
  if (buildId == null) return null;

  const vendorId = resolveVendor(input.vendorName);
  const hasOffer = db.prepare('SELECT 1 FROM offers WHERE part_id = ? LIMIT 1').get(partId);
  const preferred = hasOffer ? 0 : 1; // first offer of a part becomes preferred

  const info = db
    .prepare(
      `INSERT INTO offers (part_id, vendor_id, url, price, delivery_days, is_preferred)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(partId, vendorId, input.url, input.price, input.delivery_days, preferred);

  touchBuild(buildId);
  return getOffer(Number(info.lastInsertRowid));
}

export function updateOfferFields(
  offerId: number,
  fields: Partial<OfferInput>,
): Offer | null {
  const buildId = offerBuildId(offerId);
  if (buildId == null) return null;

  const cols: string[] = [];
  const vals: SqlValue[] = [];
  if (fields.vendorName !== undefined) {
    cols.push('vendor_id = ?');
    vals.push(resolveVendor(fields.vendorName));
  }
  if (fields.url !== undefined) {
    cols.push('url = ?');
    vals.push(fields.url);
  }
  if (fields.price !== undefined) {
    cols.push('price = ?');
    vals.push(fields.price);
  }
  if (fields.delivery_days !== undefined) {
    cols.push('delivery_days = ?');
    vals.push(fields.delivery_days);
  }
  if (cols.length > 0) {
    db.prepare(`UPDATE offers SET ${cols.join(', ')} WHERE id = ?`).run(...vals, offerId);
  }
  touchBuild(buildId);
  return getOffer(offerId);
}

export function setOfferPreferred(offerId: number, preferred: boolean): Offer | null {
  const row = db.prepare('SELECT part_id FROM offers WHERE id = ?').get(offerId) as Row | undefined;
  if (!row) return null;

  const partId = num(row.part_id);
  const buildId = partBuildId(partId);
  db.prepare('UPDATE offers SET is_preferred = 0 WHERE part_id = ?').run(partId);
  if (preferred) {
    db.prepare('UPDATE offers SET is_preferred = 1 WHERE id = ?').run(offerId);
  }
  if (buildId != null) touchBuild(buildId);
  return getOffer(offerId);
}

export function deleteOffer(offerId: number): boolean {
  const buildId = offerBuildId(offerId);
  const changed = db.prepare('DELETE FROM offers WHERE id = ?').run(offerId).changes > 0;
  if (changed && buildId != null) touchBuild(buildId);
  return changed;
}
