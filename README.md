# Établi — suivi de montage PC

Application web pour préparer un montage PC : on crée un **build**, on remplit ses
**emplacements** (processeur, carte mère, carte graphique…), on empile des
**alternatives** pour chaque emplacement, et on relie à chaque pièce ses
**liens de commande** (site marchand, prix, délai de livraison). Établi calcule
en continu le **prix total** et la **date de réception estimée**.

## Fonctionnalités

- **Builds** sauvegardés en SQLite — avec nom, description et **image de couverture** (upload).
- **10 emplacements** prédéfinis : CPU, refroidissement, carte mère, RAM, GPU,
  stockage, alimentation, boîtier, ventilation, OS.
- **Pièces** : marque, modèle, description, **quantité** (RAM ×2, SSD ×3…) et un
  **score de performance** manuel optionnel (PassMark, Geekbench… — voir la note).
- **Liens de commande** multiples par pièce : site marchand, URL, prix en €,
  délai de livraison. Une offre « retenue » sert au calcul du total.
- **Alternatives** : plusieurs pièces candidates par emplacement ; on en choisit
  une comme « officielle ». À ne pas confondre avec la *quantité* — un emplacement
  peut aussi contenir plusieurs pièces réellement montées ensemble (deux SSD
  différents, deux kits de RAM…), chacune sélectionnée et comptée dans le total.
- **Comparateur** : toutes les alternatives côte à côte, mise en avant de la
  moins chère, et calcul du « scénario le moins cher ».
- **Récapitulatif** : total prix, date de réception estimée à partir d'une date
  de commande, alerte sur les emplacements essentiels manquants.

## Pile technique

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **SQLite** via `node:sqlite` — le module SQLite intégré à Node.js, donc
  **aucune dépendance native à compiler**
- CSS « maison » (aucun framework), design sobre type fiche technique d'atelier

## Prérequis

- **Node.js 22 ou supérieur** (le module `node:sqlite` est requis ; testé sur Node 24)
- npm

## Installation & lancement

```bash
# 1. Build (installe les dépendances si besoin, puis compile)
./scripts/build.sh

# 2. Démarrage du serveur de production
./scripts/start.sh
```

L'application est alors disponible sur <http://localhost:3000>.
Pour changer de port : `PORT=4000 ./scripts/start.sh`.

### Mode développement

```bash
npm install
npm run dev
```

### Nom d'hôte local propre (optionnel)

Pour accéder à l'application via `http://etabli.test:3000` plutôt que par
`localhost` — tout en restant **100 % local** :

```bash
sudo ./scripts/setup-hostname.sh
```

Le script ajoute `127.0.0.1   etabli.test` à `/etc/hosts`. Ensuite, `start.sh`
détecte ce nom et affiche directement la bonne URL. Le nom est personnalisable :
`sudo ./scripts/setup-hostname.sh mon-app.test`.

## Données

Tout est stocké localement et **hors du dépôt Git** (voir `.gitignore`) :

- `data/pcbuilder.db` — base SQLite (créée automatiquement au premier accès)
- `data/uploads/` — images de couverture des builds

Pour repartir de zéro, il suffit de supprimer le dossier `data/`.

## Note sur les indicateurs de performance

Il n'existe **aucune API publique gratuite et fiable** de scores de benchmark
(PassMark, UserBenchmark, Geekbench, 3DMark sont payants ou interdisent le
scraping ; l'API UL Benchmarks est réservée aux partenaires). Le champ
« score de performance » de chaque pièce est donc **saisi manuellement** :
on y colle la valeur de son choix et on précise sa référence (ex. `PassMark`).

## Structure du projet

```
src/
  lib/         couche de données et logique métier (db, requêtes SQL, calculs)
  app/         pages (App Router) et routes API REST
  components/  composants React partagés
scripts/       build.sh et start.sh
```

Voir `CLAUDE.md` pour le détail de l'architecture.
