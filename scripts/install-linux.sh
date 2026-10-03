#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
node_bin="$(command -v node || true)"
if [[ -z "$node_bin" ]] || ! "$node_bin" -e 'process.exit(Number(process.versions.node.split(".")[0])>=24?0:1)'; then
  echo 'Node.js 24 ou supérieur requis. Installer sa version LTS avant de continuer.' >&2
  exit 1
fi
cd "$project_dir"
# Le serveur n'a aucune dépendance externe ; Electron est facultatif.
npm ci --omit=dev --ignore-scripts
npm test
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/m1a"
state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/m1a"
mkdir -p "$config_dir" "$state_dir"
chmod 700 "$config_dir" "$state_dir"
if [[ ! -e "$config_dir/server.env" ]]; then
  (umask 077; cp deploy/m1a.env.example "$config_dir/server.env")
fi
printf 'Préparation terminée. Configuration : %s/server.env\nDonnées : %s\n' "$config_dir" "$state_dir"
echo 'Créer ensuite un compte avec scripts/account-linux.sh NOM, puis installer le service.'
