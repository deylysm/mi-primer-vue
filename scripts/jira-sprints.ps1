# jira-sprints.ps1 - Crea sprints (sin iniciarlos) en un tablero de Jira Cloud y mueve historias a ellos.
# NO borra nada, NO inicia ni cierra sprints. Es idempotente por nombre de sprint (no duplica).
#
# Uso:
#   .\scripts\jira-sprints.ps1 plan <archivo.json>      -> crea los sprints que falten y mueve sus historias
#   .\scripts\jira-sprints.ps1 listar [tablero]         -> muestra los sprints del tablero (por defecto el 1)
#
# Formato de <archivo.json> (UTF-8):
#   {
#     "tablero": 1,
#     "sprints": [
#       { "nombre": "Sprint 1", "objetivo": "Texto", "historias": ["SCRUM-5", "SCRUM-6"] }
#     ]
#   }
#
# Requiere un token que pueda usar la API Agile: un token CLASICO (sin alcances) con JIRA_SITE definido,
# o un token con alcances de Jira Software (read:sprint:jira-software, write:sprint:jira-software...).
# Credenciales: las mismas que jira-estructura.ps1. Nunca se imprime el token.
#
# Nota: el archivo es ASCII a proposito (Windows PowerShell 5.1 lee mal los acentos sin BOM).
# Los textos con tildes viven en el JSON (UTF-8), no aqui.

param(
    [Parameter(Position = 0)][string]$Accion = "listar",
    [Parameter(Position = 1)][string]$Arg1
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

function Llamar([string]$metodo, [string]$ruta, $cuerpo) {
    try {
        if ($cuerpo) {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Depth 30 -Compress))
            return Invoke-RestMethod -Uri ($base + $ruta) -Headers $headers -Method $metodo `
                -ContentType "application/json; charset=utf-8" -Body $bytes
        }
        return Invoke-RestMethod -Uri ($base + $ruta) -Headers $headers -Method $metodo
    }
    catch {
        $codigo = $null
        $detalle = ""
        if ($_.Exception.Response) {
            $codigo = [int]$_.Exception.Response.StatusCode
            try {
                $lector = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $detalle = $lector.ReadToEnd()
            } catch { }
        }
        switch ($codigo) {
            401 { Fallar "HTTP 401 en ${metodo} ${ruta}: rechazado. Este token no puede usar la API Agile (sprints). Crea un token CLASICO (sin alcances) y guardalo con scripts\jira-guardar-token.ps1." }
            403 { Fallar "HTTP 403: tu usuario o el token no tienen permiso para esta accion." }
            400 { Fallar "HTTP 400: Jira rechazo los datos: $detalle" }
            default { Fallar "Fallo la llamada a Jira (HTTP $codigo) en ${metodo} ${ruta}: $($_.Exception.Message) $detalle" }
        }
    }
}

function Validar-Clave([string]$k) {
    if ($k -notmatch '^[A-Za-z][A-Za-z0-9_]+-\d+$') { Fallar "Clave de incidencia no valida: '$k' (ej: SCRUM-5)." }
}

function Sprints-Del-Tablero([int]$tablero) {
    $lista = @()
    $inicio = 0
    do {
        $r = Llamar "Get" "/rest/agile/1.0/board/$tablero/sprint?state=future,active,closed&startAt=$inicio&maxResults=50" $null
        $lista += @($r.values)
        $inicio += 50
    } while (-not $r.isLast)
    return $lista
}

# ---------- 2. Acciones ----------
switch ($Accion.ToLower()) {
    "listar" {
        $tablero = 1
        if ($Arg1) { $tablero = [int]$Arg1 }
        foreach ($s in (Sprints-Del-Tablero $tablero)) {
            "$($s.id)`t$($s.state)`t$($s.name)"
        }
    }
    "plan" {
        if (-not $Arg1 -or -not (Test-Path $Arg1)) { Fallar "Uso: plan <archivo.json>  (el archivo no existe)" }
        $datos = (Get-Content $Arg1 -Raw -Encoding UTF8) | ConvertFrom-Json
        if (-not $datos.tablero) { Fallar "El JSON necesita 'tablero' (id numerico)." }
        if (-not $datos.sprints) { Fallar "El JSON necesita la lista 'sprints'." }
        $tablero = [int]$datos.tablero

        $porNombre = @{}
        foreach ($s in (Sprints-Del-Tablero $tablero)) { $porNombre[$s.name] = $s }

        foreach ($p in @($datos.sprints)) {
            if (-not $p.nombre) { Fallar "Cada sprint necesita 'nombre'." }
            if ($porNombre.ContainsKey($p.nombre)) {
                $sprint = $porNombre[$p.nombre]
                Write-Output "Sprint ya existia: $($sprint.id) [$($sprint.state)] - $($p.nombre)"
            }
            else {
                $cuerpo = @{ name = $p.nombre; originBoardId = $tablero }
                if ($p.objetivo) { $cuerpo.goal = $p.objetivo }
                $sprint = Llamar "Post" "/rest/agile/1.0/sprint" $cuerpo
                Write-Output "Sprint creado: $($sprint.id) [$($sprint.state)] - $($p.nombre)"
            }
            if ($sprint.state -eq "closed") {
                Write-Output "  (sprint cerrado: no se mueven historias)"
                continue
            }
            $claves = @()
            foreach ($h in @($p.historias)) {
                if (-not $h) { continue }
                Validar-Clave $h
                $claves += $h
            }
            if ($claves.Count -gt 0) {
                [void](Llamar "Post" "/rest/agile/1.0/sprint/$($sprint.id)/issue" @{ issues = @($claves) })
                Write-Output "  movidas a '$($p.nombre)': $($claves -join ', ')"
            }
        }
    }
    default { Fallar "Accion desconocida '$Accion'. Usa: listar o plan." }
}
$headers = $null
