#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ $# != 1 ]]; then echo "Usage : $0 NOM_UTILISATEUR" >&2; exit 1; fi
# La réinitialisation doit être atomique avec le serveur arrêté.
was_active=0
if systemctl --user is-active --quiet m1a.service 2>/dev/null; then
  was_active=1
  systemctl --user stop m1a.service
fi
trap 'if [[ "$was_active" == 1 ]]; then systemctl --user start m1a.service; fi' EXIT
export M1A_DATA_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/m1a"
exec_node="$(command -v node)"
"$exec_node" "$project_dir/account.mjs" "$1"
