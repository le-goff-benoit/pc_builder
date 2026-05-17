#!/usr/bin/env bash
#
# Établi — déclare un nom d'hôte local propre (par défaut « etabli.test »)
# en l'ajoutant à /etc/hosts. L'application reste 100 % locale (→ 127.0.0.1).
#
# Usage :  sudo ./scripts/setup-hostname.sh [nom-hôte]
# Exemple : sudo ./scripts/setup-hostname.sh etabli.test
#
set -euo pipefail

# --- Journalisation ----------------------------------------------------------
BOLD=$'\e[1m'; DIM=$'\e[2m'
GREEN=$'\e[32m'; BLUE=$'\e[34m'; RED=$'\e[31m'; RESET=$'\e[0m'
step() { echo; echo "${BLUE}${BOLD}▸ $*${RESET}"; }
ok()   { echo "  ${GREEN}✓${RESET} $*"; }
info() { echo "  ${DIM}$*${RESET}"; }
fail() { echo "  ${RED}✗ $*${RESET}" >&2; exit 1; }

APP_HOST="${1:-etabli.test}"
HOSTS_FILE="/etc/hosts"
ENTRY="127.0.0.1   ${APP_HOST}"

echo "${BOLD}═══ Établi · nom d'hôte local ═══${RESET}"

# --- 1. Droits root ----------------------------------------------------------
step "Vérification des droits"
if [ "$(id -u)" -ne 0 ]; then
  fail "Droits root requis. Relancez : sudo ./scripts/setup-hostname.sh ${APP_HOST}"
fi
ok "Exécution en root"

# --- 2. Mise à jour de /etc/hosts -------------------------------------------
step "Déclaration de « ${APP_HOST} » → 127.0.0.1"
if grep -qE "[[:space:]]${APP_HOST}([[:space:]]|\$)" "$HOSTS_FILE"; then
  ok "« ${APP_HOST} » est déjà présent dans ${HOSTS_FILE} — rien à faire"
else
  echo "$ENTRY" >> "$HOSTS_FILE"
  ok "Ligne ajoutée à ${HOSTS_FILE} :"
  info "$ENTRY"
fi

# --- Fin ---------------------------------------------------------------------
echo
echo "${GREEN}${BOLD}✓ Terminé.${RESET} L'application sera accessible via :"
info "http://${APP_HOST}:3000   (ou le port choisi)"
info "Le nom reste 100 % local — rien n'est exposé sur Internet."
