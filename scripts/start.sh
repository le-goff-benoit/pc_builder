#!/usr/bin/env bash
#
# Établi — démarrage du serveur de production.
# Variables d'environnement : PORT (défaut 3000), APP_HOST (défaut etabli.test).
#
set -euo pipefail
cd "$(dirname "$0")/.."

# --- Journalisation ----------------------------------------------------------
BOLD=$'\e[1m'; DIM=$'\e[2m'
GREEN=$'\e[32m'; BLUE=$'\e[34m'; RED=$'\e[31m'; RESET=$'\e[0m'
step() { echo; echo "${BLUE}${BOLD}▸ $*${RESET}"; }
ok()   { echo "  ${GREEN}✓${RESET} $*"; }
info() { echo "  ${DIM}$*${RESET}"; }
fail() { echo "  ${RED}✗ $*${RESET}" >&2; exit 1; }

PORT="${PORT:-3000}"
APP_HOST="${APP_HOST:-etabli.test}"

echo "${BOLD}═══ Établi · démarrage ═══${RESET}"

# --- 1. Build présent --------------------------------------------------------
step "Vérification du build"
if [ ! -d .next ]; then
  fail "Aucun build trouvé. Lancez d'abord : ./scripts/build.sh"
fi
ok "Build présent (.next/)"

# --- 2. Base de données ------------------------------------------------------
step "Base de données SQLite"
if [ -f data/pcbuilder.db ]; then
  ok "Base existante : ./data/pcbuilder.db"
else
  ok "Base absente — elle sera créée automatiquement au premier accès"
fi
info "Images des builds stockées dans ./data/uploads/"

# --- 3. Adresse d'accès ------------------------------------------------------
step "Adresse d'accès"
if getent hosts "$APP_HOST" >/dev/null 2>&1; then
  ok "URL : ${BOLD}http://${APP_HOST}:${PORT}${RESET}"
  info "Aussi accessible via http://localhost:${PORT}"
else
  ok "URL : ${BOLD}http://localhost:${PORT}${RESET}"
  info "Astuce : pour une URL propre http://${APP_HOST}:${PORT},"
  info "lancez une fois : sudo ./scripts/setup-hostname.sh"
fi

# --- 4. Serveur --------------------------------------------------------------
step "Démarrage du serveur"
info "Arrêt : Ctrl+C"
echo
export PORT
exec npm run start
