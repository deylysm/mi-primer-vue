#!/usr/bin/env bash
# jira-crear.sh - Envoltorio de Git Bash para scripts/jira-crear.ps1 (SOLO CREA historias y subtareas).
#
# Igual que jira.sh: el token esta cifrado con DPAPI, solo PowerShell puede descifrarlo.
#
# Uso:
#   ./scripts/jira-crear.sh tipos SCRUM
#   ./scripts/jira-crear.sh crear ruta/al/archivo.json
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_WIN="$(cygpath -w "$DIR/jira-crear.ps1")"

# El archivo JSON (si se pasa) se convierte a ruta de Windows para PowerShell.
if [ "${1:-}" = "crear" ] && [ -n "${2:-}" ]; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" crear "$(cygpath -w "$2")"
fi
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" "$@"
