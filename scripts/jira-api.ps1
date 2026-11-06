# jira-api.ps1 - Cliente de SOLO LECTURA para Jira Cloud (API REST directa, sin MCP).
#
# Uso:
#   .\scripts\jira-api.ps1                      -> prueba de conexion (/myself)
#   .\scripts\jira-api.ps1 buscar "<JQL>"       -> busca tareas/historias con JQL
#   .\scripts\jira-api.ps1 issue ABC-123        -> detalle de una tarea
#   .\scripts\jira-api.ps1 proyectos            -> lista proyectos
#   .\scripts\jira-api.ps1 tableros             -> lista tableros (Jira Software)
#   .\scripts\jira-api.ps1 sprints <idTablero> [active|future|closed]
#   .\scripts\jira-api.ps1 backlog <idTablero>
#
# Credenciales (nunca dentro del repositorio):
#   - JIRA_CLOUD_ID : variable de entorno de usuario.
#   - JIRA_EMAIL    : variable de entorno de usuario (correo de tu cuenta Atlassian).
#   - Token         : %APPDATA%\Farma\jira-token.txt, cifrado con DPAPI
#                     (se guarda con scripts\jira-guardar-token.ps1).
#
# Nota: el archivo es ASCII a proposito; Windows PowerShell 5.1 lee mal los
# acentos de un .ps1 sin BOM.

param(
    [Parameter(Position = 0)][string]$Accion = "myself",
    [Parameter(Position = 1)][string]$Arg1,
    [Parameter(Position = 2)][string]$Arg2
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

# ---------- 1. Configuracion ----------
$cloudId = Leer-Variable "JIRA_CLOUD_ID"
$email = Leer-Variable "JIRA_EMAIL"
$tokenPath = Join-Path $env:APPDATA "Farma\jira-token.txt"

if (-not $cloudId) { Fallar "Falta la variable de entorno JIRA_CLOUD_ID." }
if ($cloudId -notmatch '^[0-9a-fA-F-]{36}$') { Fallar "JIRA_CLOUD_ID no parece un UUID valido." }
if (-not $email -or $email -notmatch '^[^@\s]+@[^@\s]+$') {
    Fallar "Falta JIRA_EMAIL (o no es un correo). Ejecuta scripts\jira-guardar-token.ps1."
}
if (-not (Test-Path $tokenPath)) {
    Fallar "No existe el token cifrado. Ejecuta scripts\jira-guardar-token.ps1."
}

# ---------- 2. Recuperar el token cifrado (sin transformarlo) ----------
try {
    $secureToken = (@(Get-Content $tokenPath) -join "") | ConvertTo-SecureString
}
catch {
    Fallar "No se pudo descifrar el token (se guardo con otro usuario o equipo de Windows). Vuelve a guardarlo con scripts\jira-guardar-token.ps1."
}
$token = [System.Net.NetworkCredential]::new("", $secureToken).Password

# Validar sin modificar: si esta danado, avisar (sin mostrar su contenido).
if ($token -match '[\x00-\x1F\x7F]') {
    $token = $null
    Fallar "El token guardado contiene caracteres de control (suele pasar si el pegado fallo al guardarlo). Vuelve a guardarlo con scripts\jira-guardar-token.ps1."
}
if ($token.Length -lt 20) {
    $largo = $token.Length
    $token = $null
    Fallar "El token guardado es demasiado corto (longitud $largo); no parece un token de API. Vuelve a guardarlo con scripts\jira-guardar-token.ps1."
}

# ---------- 3. Encabezado de autenticacion ----------
# Token de API (con o sin alcances) = Basic base64("email:token").
# "Bearer" solo sirve para tokens OAuth 2.0, no para estos.
$basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("${email}:${token}"))
$token = $null
$headers = @{
    Authorization = "Basic $basic"
    Accept        = "application/json"
}
$basic = $null

# ---------- 4. Ruta segun la accion (todas son GET) ----------
$base = "https://api.atlassian.com/ex/jira/$cloudId"
$campos = "summary,status,assignee,issuetype,priority,parent"

switch ($Accion.ToLower()) {
    "myself" { $ruta = "/rest/api/3/myself" }
    "buscar" {
        if (-not $Arg1) { Fallar "Uso: buscar ""<JQL>""   (ej: project = ABC ORDER BY created DESC)" }
        $jql = [uri]::EscapeDataString($Arg1)
        $ruta = "/rest/api/3/search/jql?jql=$jql&maxResults=50&fields=$campos"
    }
    "issue" {
        if ($Arg1 -notmatch '^[A-Za-z][A-Za-z0-9_]+-\d+$') { Fallar "Uso: issue CLAVE-123" }
        $ruta = "/rest/api/3/issue/$Arg1"
    }
    "proyectos" { $ruta = "/rest/api/3/project/search" }
    "tableros" { $ruta = "/rest/agile/1.0/board" }
    "sprints" {
        if ($Arg1 -notmatch '^\d+$') { Fallar "Uso: sprints <idTablero> [active|future|closed]" }
        $ruta = "/rest/agile/1.0/board/$Arg1/sprint"
        if ($Arg2) {
            if ($Arg2 -notmatch '^(active|future|closed)(,(active|future|closed))*$') { Fallar "Estado de sprint no valido: usa active, future o closed." }
            $ruta += "?state=$Arg2"
        }
    }
    "backlog" {
        if ($Arg1 -notmatch '^\d+$') { Fallar "Uso: backlog <idTablero>" }
        $ruta = "/rest/agile/1.0/board/$Arg1/backlog?maxResults=50&fields=$campos"
    }
    default { Fallar "Accion desconocida '$Accion'. Usa: myself, buscar, issue, proyectos, tableros, sprints, backlog." }
}

# ---------- 5. Llamada ----------
try {
    $respuesta = Invoke-RestMethod -Uri ($base + $ruta) -Headers $headers -Method Get
}
catch {
    $codigo = $null
    if ($_.Exception.Response) { $codigo = [int]$_.Exception.Response.StatusCode }
    switch ($codigo) {
        401 { Fallar "HTTP 401: rechazado. Si otras acciones SI funcionan, al token le falta el alcance (scope) de esta consulta (Atlassian responde 401 y no 403). Si ninguna funciona, revisa JIRA_EMAIL y que el token no haya caducado." }
        403 { Fallar "HTTP 403: el token no tiene el alcance (scope) necesario para esta consulta." }
        404 { Fallar "HTTP 404: no se encontro el recurso (revisa JIRA_CLOUD_ID, la clave o el id)." }
        default { Fallar "No se pudo consultar Jira (HTTP $codigo): $($_.Exception.Message)" }
    }
}
finally {
    $headers = $null
}

if ($Accion.ToLower() -eq "myself") {
    Write-Output "Conexion con Jira exitosa"
    Write-Output "Usuario: $($respuesta.displayName)"
}
else {
    $respuesta | ConvertTo-Json -Depth 20
}
