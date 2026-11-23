---
name: jira
description: Consulta y organiza Jira Cloud (proyecto SCRUM de FarmaApp). Lectura - tareas, historias, backlog, sprints, tableros y detalle de una tarea. Escritura (solo si el usuario la pide) - crear historias, crear épicas, vincular historias a épicas y asignar. Úsalo cuando se pida "ver tareas", "historias", "backlog", "sprint activo", "qué hay en Jira", "detalle de SCRUM-3", "crear épicas" o "asignar". Solo borra si el usuario lo pide, con claves explícitas.
---

# Objetivo

Leer y organizar Jira Cloud usando la API REST directa, **sin el MCP de Atlassian**.
Todo pasa por scripts de `scripts/` que llaman a PowerShell (el token está cifrado con DPAPI y solo PowerShell puede descifrarlo).

| Script | Qué hace | ¿Escribe en Jira? |
|--------|----------|-------------------|
| `scripts/jira.sh` (→ `jira-api.ps1`) | Consultas: buscar, issue, proyectos, tableros, sprints, backlog | No (solo `GET`) |
| `scripts/jira-crear.sh` (→ `jira-crear.ps1`) | Crea historias/tareas (y subtareas) desde un JSON | Sí |
| `scripts/jira-estructura.sh` (→ `jira-estructura.ps1`) | Crea épicas, vincula historias a épicas, asigna | Sí |
| `scripts/jira-sprints.sh` (→ `jira-sprints.ps1`) | Crea sprints (sin iniciarlos) y mueve historias a ellos | Sí |
| `scripts/jira-borrar.sh` (→ `jira-borrar.ps1`) | Borra incidencias por clave explícita (irreversible) | Sí, destructivo |

# Comandos de lectura (ejecutar desde la raíz del proyecto, en Git Bash)

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
- Historias: `project = SCRUM AND issuetype = Historia`
- Con épica: `project = SCRUM AND parent is not EMPTY`
- Mis tareas: `project = SCRUM AND assignee = currentUser()`

# Comandos de escritura (solo con petición explícita del usuario)

| Qué se pide | Comando |
|-------------|---------|
| Ver tipos de incidencia | `./scripts/jira-crear.sh tipos SCRUM` |
| Crear UNA historia desde un JSON | `./scripts/jira-crear.sh crear ruta/historia.json` |
| Crear épicas y vincular sus historias | `./scripts/jira-estructura.sh epicas _bmad-output/jira-estructura/epicas.json` |
| Asignar incidencias | `./scripts/jira-estructura.sh asignar <accountId> SCRUM-5 SCRUM-6` |
| Ver sprints del tablero | `./scripts/jira-sprints.sh listar [tablero]` |
| Crear los sprints y mover sus historias | `./scripts/jira-sprints.sh plan _bmad-output/jira-estructura/sprints.json` |
| Borrar incidencias concretas (**solo si el usuario lo pide**) | `./scripts/jira-borrar.sh SCRUM-4 SCRUM-2` |

- `jira-borrar` solo acepta claves explícitas (nada de JQL ni borrado masivo), muestra tipo/título/estado antes de borrar,
  salta las que no existen y se niega a borrar una incidencia con subtareas (hay que indicar primero las subtareas).

- Los JSON de historias los genera `node scripts/bmad-a-jira.mjs <epics.md>` (no se conecta a Jira).
- `epicas` es **idempotente por título**: si la épica ya existe, no la duplica; solo vuelve a vincular.
- El vínculo historia → épica usa el campo `parent` (proyecto gestionado por el equipo).
- `plan` de sprints es **idempotente por nombre**: no duplica sprints, **no los inicia ni los cierra**, y no mueve historias a sprints cerrados.
- `asignar yo` y `jira-estructura.sh yo` usan `/myself`, que un token **con alcances** no puede leer (HTTP 401).
  Con un token clásico sí funciona; si no, usar el `accountId` explícito (se ve en `creator`/`reporter` de `./scripts/jira.sh issue SCRUM-5`).
- Después de escribir, esperar unos segundos antes de verificar con JQL: el índice de búsqueda de Jira se retrasa.

# Cómo responder

- La salida es JSON o texto. Resúmelo en español en una tabla corta: clave, título, estado, responsable.
- Si no hay resultados, dilo claro; no inventes tareas.
- Tras cualquier escritura, **verifica contra Jira** (JQL o `issue`) y muestra la evidencia.

# Reglas de seguridad (obligatorias)

- **Antes de crear algo, buscar si ya existe** (por ejemplo `buscar "project = SCRUM AND summary ~ \"[1.1]\""`). Así se evita repetir el error del duplicado SCRUM-28.
- **Borrar solo cuando el usuario lo pida expresamente**, con `jira-borrar.sh` y claves explícitas, nunca en bloque. El borrado es irreversible: listar antes lo que se va a borrar y verificar después.
- **Nunca cerrar ni mover a "Hecho"** incidencias desde aquí.
- **Escribir solo lo que el usuario pidió** en esa tarea. No cambiar estados sin que se pida. (SCRUM-1 a SCRUM-4 eran datos de ejemplo y SCRUM-28 un duplicado; se borraron el 2026-11-13 a petición del usuario.)
- **Nunca mostrar, pedir, imprimir ni guardar el token** en archivos, logs, informes o capturas.
- Las credenciales viven **fuera del repositorio**:
  - Token: `%APPDATA%\Farma\jira-token.txt`, cifrado con DPAPI (solo este usuario y equipo de Windows).
  - Variables de usuario: `JIRA_CLOUD_ID`, `JIRA_EMAIL` y `JIRA_SITE` (solo con token clásico, ej. `deylui27.atlassian.net`).
  - Con `JIRA_SITE` definido los scripts llaman a `https://<sitio>.atlassian.net`; sin ella, a la pasarela `api.atlassian.com/ex/jira/<cloudId>` (token con alcances).
- No usar el MCP de Atlassian para estas consultas.

# Si falla

| Mensaje | Causa y solución |
|---------|------------------|
| `Falta JIRA_EMAIL` / `No existe el token cifrado` | Falta configurar este equipo (ver abajo). |
| `No se pudo descifrar el token` | Se guardó con otro usuario o equipo. Volver a guardarlo. |
| `HTTP 401` en una acción pero otras funcionan | Al token le falta el scope de esa consulta (Atlassian responde 401, no 403). Un token con alcances sin Jira Software no puede usar `sprints`, `backlog` ni crear sprints, ni `/myself`. Solución: usar un token **clásico** (sin alcances) y `JIRA_SITE`. |
| `HTTP 401` en todas | El token caducó (vence el 25 feb 2027) o el correo es incorrecto. |
| `HTTP 400` al escribir | Jira rechazó los datos (tipo de incidencia, campo o clave incorrectos); el mensaje trae el detalle. |
| `HTTP 404` | Revisar `JIRA_CLOUD_ID`, la clave (`SCRUM-3`) o el id del tablero. |

# Configurar un equipo nuevo

1. Crear un token de API **clásico (sin alcances)** en `https://id.atlassian.com/manage-profile/security/api-tokens`
   ("Crear token de API", no "con alcances"). Hereda los permisos de tu usuario y sirve para tableros, backlog y sprints.
   (Alternativa: token con alcances `read:jira-work`, `write:jira-work` y los de Jira Software `*:jira-software`.)
2. Definir la variable de usuario `JIRA_CLOUD_ID` (id del sitio de Jira Cloud).
3. Ejecutar en una terminal interactiva:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\jira-guardar-token.ps1`
   y elegir **C** (clásico) cuando pregunte el tipo; guarda también `JIRA_SITE`.
4. Pegar el token con **clic derecho o Shift+Insert**, nunca con Ctrl+V (puede guardar un carácter de control).
5. Verificar con `./scripts/jira.sh`.
