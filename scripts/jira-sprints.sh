#!/usr/bin/env bash
# jira-sprints.sh - Envoltorio de Git Bash para scripts/jira-sprints.ps1
# (crea sprints sin iniciarlos y mueve historias a ellos; no borra nada).
#
# Igual que jira.sh: el token esta cifrado con DPAPI, solo PowerShell puede descifrarlo.
#
# Uso:
#   ./scripts/jira-sprints.sh listar [tablero]
#   ./scripts/jira-sprints.sh plan ruta/al/archivo.json
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_WIN="$(cygpath -w "$DIR/jira-sprints.ps1")"

# El archivo JSON (si se pasa) se convierte a ruta de Windows para PowerShell.
if [ "${1:-}" = "plan" ] && [ -n "${2:-}" ]; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" plan "$(cygpath -w "$2")"
fi
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" "$@"
