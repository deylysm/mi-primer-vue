#!/usr/bin/env bash
# jira.sh - Envoltorio de Git Bash para scripts/jira-api.ps1 (solo lectura).
#
# El token esta cifrado con DPAPI de Windows: solo PowerShell puede descifrarlo,
# por eso este script se limita a llamar al .ps1 y pasarle los argumentos tal cual.
#
# Uso (los mismos argumentos que jira-api.ps1):
#   ./scripts/jira.sh                     # prueba de conexion
#   ./scripts/jira.sh buscar "project = ABC ORDER BY created DESC"
#   ./scripts/jira.sh issue ABC-123
#   ./scripts/jira.sh proyectos | tableros
#   ./scripts/jira.sh sprints 1 active
#   ./scripts/jira.sh backlog 1
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Git Bash usa rutas /c/Users/...; powershell.exe necesita C:\Users\...
PS1_WIN="$(cygpath -w "$DIR/jira-api.ps1")"

exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1_WIN" "$@"
