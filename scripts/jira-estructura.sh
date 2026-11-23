#!/usr/bin/env bash
# jira-estructura.sh - Envoltorio de Git Bash para scripts/jira-estructura.ps1
# (crea epicas, vincula historias a epicas y asigna incidencias; no borra nada).
#
# Igual que jira.sh: el token esta cifrado con DPAPI, solo PowerShell puede descifrarlo.
#
# Uso:
#   ./scripts/jira-estructura.sh yo
#   ./scripts/jira-estructura.sh epicas ruta/al/archivo.json
#   ./scripts/jira-estructura.sh asignar yo SCRUM-5 SCRUM-6
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_WIN="$(cygpath -w "$DIR/jira-estructura.ps1")"

# El archivo JSON (si se pasa) se convierte a ruta de Windows para PowerShell.
if [ "${1:-}" = "epicas" ] && [ -n "${2:-}" ]; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" epicas "$(cygpath -w "$2")"
fi
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" "$@"
