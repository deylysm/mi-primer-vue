# jira-estructura.ps1 - Organiza el tablero de Jira Cloud: crea epicas, vincula historias a epicas y asigna.
# NO borra nada. Las acciones que escriben son idempotentes en lo posible (no duplican epicas).
#
# Uso:
#   .\scripts\jira-estructura.ps1 yo                              -> tu accountId y nombre (GET /myself)
#   .\scripts\jira-estructura.ps1 epicas <archivo.json>           -> crea las epicas que falten y vincula sus historias
#   .\scripts\jira-estructura.ps1 asignar <accountId|yo> KEY...   -> asigna las incidencias indicadas
#
# Formato de <archivo.json> (UTF-8):
#   {
#     "proyecto": "SCRUM",
#     "epicas": [
#       { "titulo": "Nombre de la epica", "descripcion": "Texto", "historias": ["SCRUM-5", "SCRUM-6"] }
#     ]
#   }
#
# Credenciales: las mismas que jira-crear.ps1 (JIRA_CLOUD_ID, JIRA_EMAIL y el token cifrado con DPAPI
# en %APPDATA%\Farma\jira-token.txt). Necesita el alcance write:jira-work. Nunca se imprime el token.
#
# Nota: el archivo es ASCII a proposito (Windows PowerShell 5.1 lee mal los acentos sin BOM).
# Los textos con tildes viven en el JSON (UTF-8), no aqui.

param(
    [Parameter(Position = 0)][string]$Accion = "yo",
    [Parameter(Position = 1)][string]$Arg1,
    [Parameter(Position = 2, ValueFromRemainingArguments = $true)][string[]]$Resto
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

# ---------- 1. Configuracion y token (igual que jira-crear.ps1) ----------
$cloudId = Leer-Variable "JIRA_CLOUD_ID"
$email = Leer-Variable "JIRA_EMAIL"
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
# Token con alcances -> pasarela api.atlassian.com. Token clasico (sin alcances) -> URL del sitio (JIRA_SITE).
$site = Leer-Variable "JIRA_SITE"
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
            401 { Fallar "HTTP 401 en ${metodo} ${ruta}: rechazado. Si leer funciona, al token le falta un alcance (write:jira-work o de Jira Software)." }
            403 { Fallar "HTTP 403: tu usuario o el token no tienen permiso para esta accion." }
            400 { Fallar "HTTP 400: Jira rechazo los datos: $detalle" }
            default { Fallar "Fallo la llamada a Jira (HTTP $codigo) en ${metodo} ${ruta}: $($_.Exception.Message) $detalle" }
        }
    }
}

function Validar-Clave([string]$k) {
    if ($k -notmatch '^[A-Za-z][A-Za-z0-9_]+-\d+$') { Fallar "Clave de incidencia no valida: '$k' (ej: SCRUM-5)." }
}

# Texto simple -> ADF (un solo parrafo; suficiente para la descripcion de una epica)
function Texto-A-Adf([string]$texto) {
    $parrafos = @()
    foreach ($linea in ($texto -split "`r?`n")) {
        if ($linea.Trim() -eq "") { continue }
        $parrafos += , @{ type = "paragraph"; content = @(, @{ type = "text"; text = $linea }) }
    }
    return @{ type = "doc"; version = 1; content = @($parrafos) }
}

function Mi-AccountId {
    $yo = Llamar "Get" "/rest/api/3/myself" $null
    return $yo
}

# ---------- 2. Acciones ----------
switch ($Accion.ToLower()) {
    "yo" {
        $yo = Mi-AccountId
        "accountId`t$($yo.accountId)"
        "nombre`t$($yo.displayName)"
    }
    "epicas" {
        if (-not $Arg1 -or -not (Test-Path $Arg1)) { Fallar "Uso: epicas <archivo.json>  (el archivo no existe)" }
        $datos = (Get-Content $Arg1 -Raw -Encoding UTF8) | ConvertFrom-Json
        if (-not $datos.proyecto -or $datos.proyecto -notmatch '^[A-Za-z][A-Za-z0-9_]+$') { Fallar "El JSON necesita un 'proyecto' valido." }
        if (-not $datos.epicas) { Fallar "El JSON necesita la lista 'epicas'." }

        # Epicas que ya existen (para no duplicar si se repite el comando)
        $jql = [uri]::EscapeDataString("project = $($datos.proyecto) AND issuetype = Epic")
        $existentes = Llamar "Get" "/rest/api/3/search/jql?jql=$jql&fields=summary&maxResults=100" $null
        $porTitulo = @{}
        foreach ($i in @($existentes.issues)) { $porTitulo[$i.fields.summary] = $i.key }

        foreach ($e in @($datos.epicas)) {
            if (-not $e.titulo) { Fallar "Cada epica necesita 'titulo'." }
            if ($porTitulo.ContainsKey($e.titulo)) {
                $clave = $porTitulo[$e.titulo]
                Write-Output "Epica ya existia: $clave - $($e.titulo)"
            }
            else {
                $campos = @{
                    project   = @{ key = $datos.proyecto }
                    issuetype = @{ name = "Epic" }
                    summary   = $e.titulo
                }
                if ($e.descripcion) { $campos.description = Texto-A-Adf $e.descripcion }
                $nueva = Llamar "Post" "/rest/api/3/issue" @{ fields = $campos }
                $clave = $nueva.key
                Write-Output "Epica creada: $clave - $($e.titulo)"
            }
            # Vincular historias: en este tipo de proyecto el vinculo es el campo "parent"
            foreach ($h in @($e.historias)) {
                if (-not $h) { continue }
                Validar-Clave $h
                [void](Llamar "Put" "/rest/api/3/issue/$h" @{ fields = @{ parent = @{ key = $clave } } })
                Write-Output "  $h -> $clave"
            }
        }
    }
    "asignar" {
        if (-not $Arg1) { Fallar "Uso: asignar <accountId|yo> KEY [KEY...]" }
        $cuenta = $Arg1
        if ($cuenta.ToLower() -eq "yo") { $cuenta = (Mi-AccountId).accountId }
        if ($cuenta -notmatch '^[A-Za-z0-9:_-]{5,128}$') { Fallar "accountId no valido." }
        if (-not $Resto -or $Resto.Count -eq 0) { Fallar "Indica al menos una clave (ej: SCRUM-5)." }
        foreach ($k in $Resto) {
            Validar-Clave $k
            [void](Llamar "Put" "/rest/api/3/issue/$k/assignee" @{ accountId = $cuenta })
            Write-Output "Asignada: $k"
        }
    }
    default { Fallar "Accion desconocida '$Accion'. Usa: yo, epicas o asignar." }
}
$headers = $null
