/**
 * The fixed set of part categories ("slots") that make up a PC build.
 * One build has at most one *selected* part per non-multiple category, but it
 * can hold any number of candidate parts per category (the alternatives).
 */

export type CategoryKey =
  | 'cpu'
  | 'cooler'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'fans'
  | 'os';

export interface Category {
  key: CategoryKey;
  /** Full label, French. */
  label: string;
  /** Short tag shown in monospace badges. */
  short: string;
  /** Essential slots count towards build completeness. */
  essential: boolean;
  /** Categories where several parts can be selected at once (RAM kits, disks…). */
  allowMultiple: boolean;
  hint: string;
}

export const CATEGORIES: Category[] = [
  { key: 'cpu',         label: 'Processeur',            short: 'CPU',  essential: true,  allowMultiple: false, hint: 'Le cœur de calcul de la machine.' },
  { key: 'cooler',      label: 'Refroidissement CPU',   short: 'COOL', essential: false, allowMultiple: false, hint: 'Ventirad ou watercooling.' },
  { key: 'motherboard', label: 'Carte mère',            short: 'MOBO', essential: true,  allowMultiple: false, hint: 'Relie et alimente tous les composants.' },
  { key: 'ram',         label: 'Mémoire vive',          short: 'RAM',  essential: true,  allowMultiple: true,  hint: 'Barrettes ou kit mémoire.' },
  { key: 'gpu',         label: 'Carte graphique',       short: 'GPU',  essential: true,  allowMultiple: false, hint: 'Rendu graphique et jeu.' },
  { key: 'storage',     label: 'Stockage',              short: 'SSD',  essential: true,  allowMultiple: true,  hint: 'SSD NVMe, SATA ou disque dur.' },
  { key: 'psu',         label: 'Alimentation',          short: 'PSU',  essential: true,  allowMultiple: false, hint: 'Bloc d’alimentation.' },
  { key: 'case',        label: 'Boîtier',               short: 'CASE', essential: true,  allowMultiple: false, hint: 'Le châssis qui accueille le build.' },
  { key: 'fans',        label: 'Ventilation boîtier',   short: 'FANS', essential: false, allowMultiple: true,  hint: 'Ventilateurs additionnels.' },
  { key: 'os',          label: 'Système d’exploitation', short: 'OS',  essential: false, allowMultiple: false, hint: 'Licence Windows, support Linux…' },
];

export const CATEGORY_MAP: Record<CategoryKey, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, Category>;

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === 'string' && value in CATEGORY_MAP;
}
