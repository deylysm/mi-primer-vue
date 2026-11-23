# jira-guardar-token.ps1 - Guarda de forma segura el token de API de Jira y tu correo.
#
# Ejecutalo UNA vez, en una terminal interactiva:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\jira-guardar-token.ps1
#
# - El token se pide oculto, se valida (sin mostrarlo) y se guarda cifrado con DPAPI
#   en %APPDATA%\Farma\jira-token.txt (solo tu usuario de Windows puede descifrarlo).
# - El correo se guarda en la variable de entorno de usuario JIRA_EMAIL.
# - Nada de esto se escribe dentro del repositorio.
#
# IMPORTANTE para pegar el token: en el prompt oculto, pega con clic derecho o
# Shift+Insert. Ctrl+V a veces envia un caracter de control (U+0016) en vez de pegar,
# y eso fue justo lo que se guardo la primera vez.

$ErrorActionPreference = "Stop"

$email = (Read-Host "Correo de tu cuenta Atlassian").Trim()
if ($email -notmatch '^[^@\s]+@[^@\s]+$') { throw "Correo no valido." }

$secure = Read-Host "Pega tu token de API de Jira (no se vera en pantalla)" -AsSecureString
$plain = [System.Net.NetworkCredential]::new("", $secure).Password

# Validaciones: solo informan el problema, nunca muestran el token.
if ($plain -match '[\x00-\x1F\x7F]') {
    $plain = $null
    throw "El texto pegado contiene caracteres de control. Vuelve a ejecutar y pega con clic derecho o Shift+Insert."
}
if ($plain -match '\s') {
    $plain = $null
    throw "El token contiene espacios. Revisa que hayas copiado solo el token."
}
if ($plain.Length -lt 20) {
    $len = $plain.Length
    $plain = $null
    throw "El token tiene solo $len caracteres; un token de API real es mucho mas largo. Revisa el pegado."
}
$longitud = $plain.Length
$plain = $null

$carpeta = Join-Path $env:APPDATA "Farma"
if (-not (Test-Path $carpeta)) { New-Item -ItemType Directory -Path $carpeta | Out-Null }
$ruta = Join-Path $carpeta "jira-token.txt"

# ConvertFrom-SecureString sin -Key = cifrado DPAPI ligado a este usuario y equipo.
$cifrado = $secure | ConvertFrom-SecureString
[System.IO.File]::WriteAllText($ruta, $cifrado, [System.Text.Encoding]::ASCII)

[Environment]::SetEnvironmentVariable("JIRA_EMAIL", $email, "User")

# Tipo de token: el CLASICO (sin alcances) entra por la URL del sitio y permite tableros, sprints y /myself.
# El token CON ALCANCES entra por la pasarela api.atlassian.com y solo ve lo que sus alcances permitan.
$tipo = (Read-Host "Tipo de token: [C]lasico (sin alcances, recomendado) o con [A]lcances").Trim().ToLower()
if ($tipo -like "a*") {
    [Environment]::SetEnvironmentVariable("JIRA_SITE", $null, "User")
    Write-Output "Modo: token con alcances (pasarela api.atlassian.com)."
}
else {
    $sitio = (Read-Host "Sitio de Jira [Enter = deylui27.atlassian.net]").Trim()
    if (-not $sitio) { $sitio = "deylui27.atlassian.net" }
    if ($sitio -notmatch '^[A-Za-z0-9-]+\.atlassian\.net$') { throw "Sitio no valido (ej: midominio.atlassian.net)." }
    [Environment]::SetEnvironmentVariable("JIRA_SITE", $sitio, "User")
    Write-Output "Modo: token clasico (sitio $sitio)."
}

Write-Output "Token guardado cifrado en: $ruta (longitud $longitud, sin caracteres de control)."
Write-Output "JIRA_EMAIL guardado como variable de usuario."
Write-Output "Siguiente paso: .\scripts\jira-api.ps1"
