# jira-crear.ps1 - Crea UNA historia (y sus subtareas) en Jira Cloud. Solo crea: no edita ni borra.
#
# Uso:
#   .\scripts\jira-crear.ps1 tipos SCRUM                 -> lista los tipos de incidencia del proyecto (GET)
#   .\scripts\jira-crear.ps1 crear <archivo.json>        -> crea la historia y sus subtareas (POST)
#
# Formato del archivo JSON (UTF-8):
#   {
#     "proyecto": "SCRUM",
#     "tipo": "Story",
#     "titulo": "Titulo de la historia",
#     "descripcion": "## Encabezado\nTexto\n- punto uno\n- punto dos\n1. paso uno",
#     "subtareas": [ { "titulo": "Subtarea A", "descripcion": "Texto" } ]
#   }
# En "descripcion": "## " = encabezado, "- " = lista, "1. " = lista numerada, otra cosa = parrafo.
#
# Credenciales: las mismas que jira-api.ps1 (JIRA_CLOUD_ID, JIRA_EMAIL y el token cifrado con
# DPAPI en %APPDATA%\Farma\jira-token.txt). Para "crear" el token necesita el alcance write:jira-work.
# Nunca se imprime el token.
#
# Nota: el archivo es ASCII a proposito (Windows PowerShell 5.1 lee mal los acentos sin BOM).

param(
    [Parameter(Position = 0)][string]$Accion = "tipos",
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

# ---------- 1. Configuracion y token (igual que jira-api.ps1) ----------
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
$base = "https://api.atlassian.com/ex/jira/$cloudId"

function Llamar([string]$metodo, [string]$ruta, $cuerpo) {
    try {
        if ($cuerpo) {
            # Se envia como bytes UTF-8 para conservar tildes y enes.
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
            401 { Fallar "HTTP 401: rechazado. Si leer funciona pero crear no, al token le falta el alcance write:jira-work." }
            403 { Fallar "HTTP 403: tu usuario o el token no tienen permiso para esta accion." }
            400 { Fallar "HTTP 400: Jira rechazo los datos: $detalle" }
            default { Fallar "Fallo la llamada a Jira (HTTP $codigo): $($_.Exception.Message) $detalle" }
        }
    }
}

# ---------- 2. Convertir texto simple a ADF (formato de documento que exige Jira v3) ----------
function Nuevo-Texto([string]$t) { return @{ type = "text"; text = $t } }
function Nuevo-Parrafo([string]$t) {
    return @{ type = "paragraph"; content = @(, (Nuevo-Texto $t)) }
}
function Nuevo-Item([string]$t) {
    return @{ type = "listItem"; content = @(, (Nuevo-Parrafo $t)) }
}

function Texto-A-Adf([string]$texto) {
    $bloques = New-Object System.Collections.ArrayList
    $lista = $null   # lista en construccion: @{ tipo = "bulletList"|"orderedList"; items = ArrayList }

    function Cerrar-Lista {
        if ($script:lista) {
            [void]$script:bloques.Add(@{ type = $script:lista.tipo; content = @($script:lista.items) })
            $script:lista = $null
        }
    }
    $script:bloques = $bloques
    $script:lista = $null

    foreach ($linea in ($texto -split "`r?`n")) {
        if ($linea.Trim() -eq "") { Cerrar-Lista; continue }
        if ($linea -match '^##\s+(.+)$') {
            Cerrar-Lista
            [void]$bloques.Add(@{ type = "heading"; attrs = @{ level = 3 }; content = @(, (Nuevo-Texto $Matches[1])) })
        }
        elseif ($linea -match '^-\s+(.+)$') {
            if (-not $script:lista -or $script:lista.tipo -ne "bulletList") {
                Cerrar-Lista
                $script:lista = @{ tipo = "bulletList"; items = New-Object System.Collections.ArrayList }
            }
            [void]$script:lista.items.Add((Nuevo-Item $Matches[1]))
        }
        elseif ($linea -match '^\d+\.\s+(.+)$') {
            if (-not $script:lista -or $script:lista.tipo -ne "orderedList") {
                Cerrar-Lista
                $script:lista = @{ tipo = "orderedList"; items = New-Object System.Collections.ArrayList }
            }
            [void]$script:lista.items.Add((Nuevo-Item $Matches[1]))
        }
        else {
            Cerrar-Lista
            [void]$bloques.Add((Nuevo-Parrafo $linea))
        }
    }
    Cerrar-Lista
    return @{ type = "doc"; version = 1; content = @($bloques) }
}

# ---------- 3. Acciones ----------
switch ($Accion.ToLower()) {
    "tipos" {
        if (-not $Arg1 -or $Arg1 -notmatch '^[A-Za-z][A-Za-z0-9_]+$') { Fallar "Uso: tipos <CLAVE_PROYECTO>  (ej: tipos SCRUM)" }
        $r = Llamar "Get" "/rest/api/3/issue/createmeta/$Arg1/issuetypes" $null
        $lista = if ($r.issueTypes) { $r.issueTypes } else { $r.values }
        $lista | ForEach-Object { "{0}`t{1}`tsubtarea={2}" -f $_.id, $_.name, $_.subtask }
    }
    "crear" {
        if (-not $Arg1 -or -not (Test-Path $Arg1)) { Fallar "Uso: crear <archivo.json>  (el archivo no existe)" }
        $datos = (Get-Content $Arg1 -Raw -Encoding UTF8) | ConvertFrom-Json
        if (-not $datos.proyecto -or -not $datos.titulo -or -not $datos.tipo) { Fallar "El JSON necesita: proyecto, tipo y titulo." }
        if ($datos.proyecto -notmatch '^[A-Za-z][A-Za-z0-9_]+$') { Fallar "Clave de proyecto no valida." }

        # Historia
        $campos = @{
            project   = @{ key = $datos.proyecto }
            issuetype = @{ name = $datos.tipo }
            summary   = $datos.titulo
        }
        if ($datos.descripcion) { $campos.description = Texto-A-Adf $datos.descripcion }
        $historia = Llamar "Post" "/rest/api/3/issue" @{ fields = $campos }
        Write-Output "Historia creada: $($historia.key)"

        # Subtareas (cuelgan de la historia)
        foreach ($s in @($datos.subtareas)) {
            if (-not $s -or -not $s.titulo) { continue }
            $camposSub = @{
                project   = @{ key = $datos.proyecto }
                issuetype = @{ name = "Subtask" }
                parent    = @{ key = $historia.key }
                summary   = $s.titulo
            }
            if ($s.descripcion) { $camposSub.description = Texto-A-Adf $s.descripcion }
            $sub = Llamar "Post" "/rest/api/3/issue" @{ fields = $camposSub }
            Write-Output "  Subtarea creada: $($sub.key) - $($s.titulo)"
        }
    }
    default { Fallar "Accion desconocida '$Accion'. Usa: tipos o crear." }
}
$headers = $null
