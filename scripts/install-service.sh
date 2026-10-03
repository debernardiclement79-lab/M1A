#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/m1a"
state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/m1a"
unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
node_bin="$(command -v node)"
if [[ ! -f "$config_dir/server.env" ]]; then echo 'Exécuter install-linux.sh en premier.' >&2; exit 1; fi
mkdir -p "$unit_dir"
if [[ -e "$unit_dir/m1a.service" ]]; then echo 'Un service m1a.service existe déjà ; comparer manuellement avant remplacement.' >&2; exit 1; fi
export M1A_INSTALL_PROJECT="$project_dir" M1A_INSTALL_NODE="$node_bin" M1A_INSTALL_CONFIG="$config_dir" M1A_INSTALL_STATE="$state_dir" M1A_INSTALL_UNIT="$unit_dir"
python3 - <<'PY'
import os
from pathlib import Path
def quote(value):
    return '"'+value.replace('\\','\\\\').replace('"','\\"').replace('%','%%')+'"'
env=os.environ
project=env['M1A_INSTALL_PROJECT']
if any('\n' in env[k] or '\r' in env[k] for k in env if k.startswith('M1A_INSTALL_')):
    raise SystemExit('Les chemins contenant un retour à la ligne ne sont pas pris en charge.')
text='''[Unit]
Description=M1A - interface de discussion et API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
'''
text+='WorkingDirectory='+project.replace('%','%%')+'\n'
text+='EnvironmentFile='+env['M1A_INSTALL_CONFIG'].replace('%','%%')+'/server.env\n'
text+='Environment='+quote('M1A_DATA_DIR='+env['M1A_INSTALL_STATE'])+'\n'
text+='ExecStart='+quote(env['M1A_INSTALL_NODE'])+' '+quote(project+'/server.mjs')+'\n'
text+='''Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=default.target
'''
Path(env['M1A_INSTALL_UNIT']+'/m1a.service').write_text(text)
PY
if ! systemctl --user daemon-reload; then
  echo "Unité générée dans $unit_dir/m1a.service ; activation impossible sans session systemd utilisateur." >&2
  echo 'Depuis un terminal de session Linux : systemctl --user daemon-reload' >&2
  exit 1
fi
echo 'Service installé, pas encore activé. Après configuration :'
echo 'systemctl --user enable --now m1a.service'
echo 'Pour fonctionner après déconnexion et au démarrage : sudo loginctl enable-linger "$USER"'
