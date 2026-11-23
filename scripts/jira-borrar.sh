#!/usr/bin/env bash
# jira-borrar.sh - Envoltorio de Git Bash para scripts/jira-borrar.ps1
# (borra incidencias por clave explicita; irreversible; solo cuando el usuario lo pide).
#
# Uso:
#   ./scripts/jira-borrar.sh SCRUM-1 SCRUM-2
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS1_WIN="$(cygpath -w "$DIR/jira-borrar.ps1")"
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" "$@"
