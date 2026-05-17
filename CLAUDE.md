# CLAUDE.md

Notes d'architecture pour Claude Code (et tout agent) travaillant sur ce dépôt.

## Le projet

**Établi** — application de suivi de montage PC. On gère des *builds*, chacun
contenant des *pièces* réparties dans 10 *emplacements* (catégories), avec des
*alternatives* par emplacement et des *liens de commande* (offres) par pièce.
Devise : EUR. Langue de l'interface : français.

## Commandes

| Commande | Effet |
|----------|-------|
| `./scripts/build.sh` | Vérifie Node, installe les deps si besoin, `next build` |
| `./scripts/start.sh` | Démarre le serveur de prod (variables `PORT`, `APP_HOST`) |
| `sudo ./scripts/setup-hostname.sh` | Déclare un nom d'hôte local (`etabli.test`) dans `/etc/hosts` |
| `npm run dev` | Serveur de développement |

**Node.js 22+ obligatoire** : la base s'appuie sur le module intégré `node:sqlite`.

## Architecture

```
src/lib/         Couche serveur — TOUTE la logique métier et SQL
  db.ts          Connexion SQLite (proxy paresseux), schéma, migrations
  queries.ts     SEUL endroit contenant du SQL. Fonctions CRUD typées.
  compute.ts     Calculs purs (total, offre retenue, scénario le moins cher)
  categories.ts  Les 10 emplacements (CATEGORIES) — source de vérité
  types.ts       Types partagés (Build, Part, Offer, Vendor…)
  format.ts      Formatage EUR / dates
  parse.ts       Coercition des corps de requête JSON
  api.ts         Client fetch utilisé UNIQUEMENT côté navigateur
src/app/api/     Routes REST — handlers fins, délèguent à queries.ts
src/app/         Pages App Router (page.tsx = serveur, force-dynamic)
src/components/  Composants React partagés (HomeView, icônes, Field)
src/app/builds/[id]/  Composants client de l'espace de travail d'un build
```

### Règles à respecter

- **Tout le SQL vit dans `queries.ts`.** Les routes API et les composants
  serveur n'écrivent jamais de SQL directement.
- **`lib/db.ts` et `lib/queries.ts` sont strictement serveur.** Ne jamais les
  importer dans un composant `'use client'` — celui-ci passe par `lib/api.ts`.
- Les composants client mutent via `lib/api.ts` puis rafraîchissent les données
  (rechargement complet du build — pas de mises à jour optimistes).
- Les pages qui lisent la base exportent `export const dynamic = 'force-dynamic'`.

## Modèle de données

- `builds` — nom, description, `image_path` (image de couverture).
- `parts` — appartient à un build + une `category` (clé de `categories.ts`).
  `is_selected` = pièce retenue pour le build. La première pièce ajoutée dans
  un emplacement est sélectionnée automatiquement. Pour les catégories
  *non* `allowMultiple`, sélectionner une pièce désélectionne ses sœurs.
  `quantity` = nombre d'unités identiques (RAM ×2, SSD ×3…) ; le total compte
  `prix × quantity`. À distinguer de `allowMultiple`, qui autorise *plusieurs
  pièces distinctes* sélectionnées dans le même emplacement.
- `offers` — lien de commande d'une pièce : `vendor_id`, prix, délai.
  `is_preferred` = offre retenue pour le total ; à défaut, la moins chère.
- `vendors` — sites marchands, créés à la volée (upsert par nom).

Suppression en cascade via `PRAGMA foreign_keys = ON`.

## Pièges connus (node:sqlite)

- **Booléens** : `node:sqlite` n'accepte pas `true`/`false` en paramètre.
  Stockés en `INTEGER` 0/1 ; convertir à l'écriture, `Boolean(...)` à la lecture
  (voir les `normalize*` de `queries.ts`).
- **Connexion paresseuse** : `db.ts` expose un `Proxy` qui n'ouvre le fichier
  qu'à la première requête. Indispensable : `next build` importe tous les
  modules de route en parallèle ; une ouverture à l'import provoquait des
  erreurs « database is locked ».
- Les lignes renvoyées sont des objets à prototype `null` — accès par propriété
  uniquement, pas de méthodes héritées.

## Images de build

Upload en `multipart/form-data` sur `POST /api/builds/[id]/image`. Le fichier
est écrit dans `data/uploads/`, son nom est stocké dans `builds.image_path`, et
l'image est servie par `GET /api/builds/[id]/image`. `data/` est git-ignoré.

## Performance / benchmarks

Aucune API gratuite fiable n'existe pour les scores de benchmark. Le champ
`perf_score` (+ `perf_label`) de chaque pièce est saisi manuellement. Ne pas
réintroduire de scraping de PassMark/UserBenchmark/Geekbench.
