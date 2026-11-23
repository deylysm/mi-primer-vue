# jira-borrar.ps1 - Borra incidencias de Jira Cloud por clave EXPLICITA (irreversible).
# Solo se usa cuando el usuario lo pide. No acepta JQL ni borrado masivo: hay que pasar cada clave.
#
# Uso:
#   .\scripts\jira-borrar.ps1 SCRUM-1 SCRUM-2 ...
#
# Antes de borrar muestra tipo, titulo y estado de cada clave. Si una incidencia no existe, la salta.
# Si una incidencia tiene subtareas, se niega a borrarla (borra primero las subtareas indicandolas).
# Credenciales: las mismas que los demas scripts. Nunca se imprime el token.
#
# Nota: el archivo es ASCII a proposito (Windows PowerShell 5.1 lee mal los acentos sin BOM).

param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Claves
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Fallar([string]$mensaje) {
    [Console]::Error.WriteLine("ERROR: $mensaje")
    exit 1
}

function Leer-Variable([string]$nombre) {
    $valor = [Environment]::GetEnvironmentVariable($nombre, "User")
    if (-not $valor) { $valor = [Environment]::GetEnvironmentVariable($nombre, "Process") }
    return $valor
}

if (-not $Claves -or $Claves.Count -eq 0) { Fallar "Uso: jira-borrar.ps1 SCRUM-1 [SCRUM-2 ...]" }
foreach ($k in $Claves) {
    if ($k -notmatch '^[A-Za-z][A-Za-z0-9_]+-\d+$') { Fallar "Clave de incidencia no valida: '$k' (ej: SCRUM-5)." }
}

# ---------- 1. Configuracion y token ----------
$cloudId = Leer-Variable "JIRA_CLOUD_ID"
$email = Leer-Variable "JIRA_EMAIL"
$site = Leer-Variable "JIRA_SITE"
$tokenPath = Join-Path $env:APPDATA "Farma\jira-token.txt"

if (-not $cloudId -or $cloudId -notmatch '^[0-9a-fA-F-]{36}$') { Fallar "Falta JIRA_CLOUD_ID (o no es un UUID valido)." }
if (-not $email -or $email -notmatch '^[^@\s]+@[^@\s]+$') { Fallar "Falta JIRA_EMAIL." }
if (-not (Test-Path $tokenPath)) { Fallar "No existe el token cifrado. Ejecuta scripts\jira-guardar-token.ps1." }

try { $secureToken = (@(Get-Content $tokenPath) -join "") | ConvertTo-SecureString }
catch { Fallar "No se pudo descifrar el token. Vuelve a guardarlo con scripts\jira-guardar-token.ps1." }
$token = [System.Net.NetworkCredential]::new("", $secureToken).Password
if ($token.Length -lt 20 -or $token -match '[\x00-\x1F\x7F]') {
    $token = $null
    Fallar "El token guardado no parece valido. Vuelve a guardarlo con scripts\jira-guardar-token.ps1."
}

$basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("${email}:${token}"))
$token = $null
$headers = @{ Authorization = "Basic $basic"; Accept = "application/json" }
$basic = $null

if ($site -and $site -match '^[A-Za-z0-9-]+\.atlassian\.net$') { $base = "https://$site" }
else { $base = "https://api.atlassian.com/ex/jira/$cloudId" }

function Codigo-Http($err) {
    if ($err.Exception.Response) { return [int]$err.Exception.Response.StatusCode }
    return $null
}

# ---------- 2. Revisar y borrar ----------
foreach ($k in $Claves) {
    try {
        $i = Invoke-RestMethod -Uri "$base/rest/api/3/issue/${k}?fields=summary,issuetype,status,subtasks" -Headers $headers -Method Get
    }
    catch {
        $c = Codigo-Http $_
        if ($c -eq 404) { Write-Output "${k}: no existe, se omite."; continue }
        if ($c -eq 401) { Fallar "HTTP 401 al leer ${k}: el token no tiene permiso de lectura." }
        Fallar "No se pudo leer ${k} (HTTP $c): $($_.Exception.Message)"
    }

    $f = $i.fields
    if ($f.subtasks -and @($f.subtasks).Count -gt 0) {
        $hijas = (@($f.subtasks) | ForEach-Object { $_.key }) -join ", "
        Fallar "${k} tiene subtareas ($hijas). Borra primero las subtareas; no se borra nada en cascada."
    }

    Write-Output "Borrando ${k} | $($f.issuetype.name) | $($f.status.name) | $($f.summary)"
    try {
        [void](Invoke-RestMethod -Uri "$base/rest/api/3/issue/$k" -Headers $headers -Method Delete)
        Write-Output "  borrada: $k"
    }
    catch {
        $c = Codigo-Http $_
        if ($c -eq 401 -or $c -eq 403) {
            Fallar "HTTP $c al borrar ${k}: el token o tu usuario no tienen permiso de borrado (falta el alcance delete:issue:jira o el permiso 'Eliminar incidencias')."
        }
        Fallar "No se pudo borrar ${k} (HTTP $c): $($_.Exception.Message)"
    }
}
$headers = $null
