---
name: jira
description: Consulta Jira Cloud (proyecto SCRUM de FarmaApp) en SOLO LECTURA: tareas, historias, backlog, sprints, tableros y detalle de una tarea. Úsalo cuando se pida "ver tareas", "historias", "backlog", "sprint activo", "qué hay en Jira" o "detalle de SCRUM-3". No crea ni modifica nada en Jira.
---

# Objetivo

Leer información de Jira Cloud usando la API REST directa, **sin el MCP de Atlassian**.
Todo pasa por `scripts/jira.sh`, que llama a `scripts/jira-api.ps1`.

# Comandos (ejecutar desde la raíz del proyecto, en Git Bash)

| Qué se pide | Comando |
|-------------|---------|
| Probar la conexión | `./scripts/jira.sh` |
| Buscar tareas/historias con JQL | `./scripts/jira.sh buscar "project = SCRUM ORDER BY created DESC"` |
| Detalle de una tarea | `./scripts/jira.sh issue SCRUM-3` |
| Listar proyectos | `./scripts/jira.sh proyectos` |
| Listar tableros | `./scripts/jira.sh tableros` |
| Sprints de un tablero | `./scripts/jira.sh sprints 1 [active\|future\|closed]` |
| Backlog de un tablero | `./scripts/jira.sh backlog 1` |

Datos conocidos: proyecto `SCRUM`, tablero id `1` ("SCRUM board").

Ejemplos de JQL útiles:
- Sprint activo: `project = SCRUM AND sprint in openSprints()`
- Historias: `project = SCRUM AND issuetype = Story`
- Mis tareas: `project = SCRUM AND assignee = currentUser()`

# Cómo responder

- La salida es JSON. Resúmelo en español en una tabla corta: clave, título, estado, responsable.
- Si no hay resultados, dilo claro; no inventes tareas.

# Reglas de seguridad (obligatorias)

- **Solo lectura.** Estos scripts solo hacen `GET`. No crear, editar ni mover tareas desde aquí.
- **Nunca mostrar, pedir, imprimir ni guardar el token** en archivos, logs, informes o capturas.
- Las credenciales viven **fuera del repositorio**:
  - Token: `%APPDATA%\Farma\jira-token.txt`, cifrado con DPAPI (solo este usuario y equipo de Windows).
  - Variables de usuario: `JIRA_CLOUD_ID` y `JIRA_EMAIL`.
- No usar el MCP de Atlassian para estas consultas.

# Si falla

| Mensaje | Causa y solución |
|---------|------------------|
| `Falta JIRA_EMAIL` / `No existe el token cifrado` | Falta configurar este equipo (ver abajo). |
| `No se pudo descifrar el token` | Se guardó con otro usuario o equipo. Volver a guardarlo. |
| `HTTP 401` en una acción pero otras funcionan | Al token le falta el scope de esa consulta (Atlassian responde 401, no 403). |
| `HTTP 401` en todas | El token caducó (vence el 25 feb 2027) o el correo es incorrecto. |
| `HTTP 404` | Revisar `JIRA_CLOUD_ID`, la clave (`SCRUM-3`) o el id del tablero. |

# Configurar un equipo nuevo

1. Crear un token de API **con alcances** en `https://id.atlassian.com/manage-profile/security/api-tokens`
   (lectura de Jira, incluidos los de Jira Software para tableros, backlog y sprints).
2. Definir la variable de usuario `JIRA_CLOUD_ID` (id del sitio de Jira Cloud).
3. Ejecutar en una terminal interactiva:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\jira-guardar-token.ps1`
4. Pegar el token con **clic derecho o Shift+Insert**, nunca con Ctrl+V (puede guardar un carácter de control).
5. Verificar con `./scripts/jira.sh`.
