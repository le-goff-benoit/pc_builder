#!/usr/bin/env bash
#
# Établi — script de build de production.
# Vérifie l'environnement, installe les dépendances si besoin, puis compile.
#
set -euo pipefail
cd "$(dirname "$0")/.."

# --- Journalisation ----------------------------------------------------------
BOLD=$'\e[1m'; DIM=$'\e[2m'
GREEN=$'\e[32m'; BLUE=$'\e[34m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; RESET=$'\e[0m'
step() { echo; echo "${BLUE}${BOLD}▸ $*${RESET}"; }
ok()   { echo "  ${GREEN}✓${RESET} $*"; }
info() { echo "  ${DIM}$*${RESET}"; }
fail() { echo "  ${RED}✗ $*${RESET}" >&2; exit 1; }

echo "${BOLD}═══ Établi · build de production ═══${RESET}"

# --- 1. Node.js --------------------------------------------------------------
step "Vérification de Node.js"
command -v node >/dev/null 2>&1 || fail "Node.js est introuvable dans le PATH."
NODE_VERSION="$(node -v)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  fail "Node.js 22+ est requis (module natif node:sqlite). Détecté : ${NODE_VERSION}"
fi
ok "Node.js ${NODE_VERSION}"

# --- 2. Dépendances ----------------------------------------------------------
step "Dépendances npm"
if [ -d node_modules ]; then
  ok "node_modules déjà présent — installation ignorée"
  info "Forcez une mise à jour avec : npm install"
else
  info "Installation en cours…"
  npm install --no-audit --no-fund
  ok "Dépendances installées"
fi

# --- 3. Compilation ----------------------------------------------------------
step "Compilation Next.js (next build)"
npm run build
ok "Build terminé — dossier .next/ généré"

# --- Fin ---------------------------------------------------------------------
echo
echo "${GREEN}${BOLD}✓ Build prêt.${RESET} Démarrez l'application avec : ${BOLD}./scripts/start.sh${RESET}"
