---
name: evidencias-pr
description: Toma capturas y videos de evidencia (antes y después de un cambio), los sube a la rama evidencias-qa y los muestra en un comentario del Pull Request. Úsalo cuando se pida "tomar evidencias", "capturas", "subir al PR", "mostrar lo que modifiqué" o "videos de las pruebas".
---

# Objetivo

Dejar **pruebas visibles** de lo que se modificó y de los resultados de las pruebas, dentro del
Pull Request, para que el usuario las vea sin abrir el proyecto. La usa el agente `qa`.

# Requisitos previos (verifícalos primero)

| Requisito | Cómo comprobarlo | Si falta |
|-----------|------------------|----------|
| GitHub CLI | `gh --version` y `gh auth status` | Detente e informa al líder: instalar `gh` requiere autorización del usuario. |
| PR existente | `gh pr view --json number,url` | No lo crees. Pide al líder la autorización del usuario para abrirlo. |
| App en marcha | `http://localhost:5173/` responde | Avisa al líder (él arranca `npm run dev`). |
| Grabador MP4 | `ffmpeg -version` | Los videos van en **MP4**. Sin grabador, dilo en el informe; usar GIF solo si el líder lo autoriza. |

# 1. Capturas

- Anchos: **320, 375, 768, 1024 y 1440 px** de cada pantalla afectada.
- Nombres: `<flujo>_<ancho>_antes.png` y `<flujo>_<ancho>_despues.png` (ej. `busqueda_375_antes.png`).
- “Antes”: se toman **antes** de que el desarrollador toque el código.
- Guarda en la carpeta temporal o scratchpad. **Nunca** en `src/`, `public/` ni en la raíz del proyecto.
- Usa `computer` → `screenshot` (con `save_to_disk` si está disponible).

# 2. Videos

- Formato **MP4**, de preferencia menos de 10 MB y de corta duración (un flujo por video).
- Nombre descriptivo: `<flujo>.mp4` (ej. `busqueda_filtros.mp4`).
- Graba el flujo principal completo: acción, resultado y estados de error/carga si se pueden provocar.

# 3. Subida a la rama `evidencias-qa`

- Carpeta de destino: `pr-<número>/` dentro de la rama `evidencias-qa` (autorizada por el usuario).
- Sube cada archivo con `gh api` (API de contenidos: `PUT /repos/{owner}/{repo}/contents/pr-<N>/<archivo>`
  con el contenido en base64). **No** hagas `git checkout`, `git commit` ni `git push` locales.
- Si la rama `evidencias-qa` no existe, créala solo con `gh api` (es la única rama que se puede crear).
- No sobrescribas evidencias de rondas anteriores: usa sufijo `_r2`, `_r3`… en rondas siguientes.

# 4. Mostrar en el PR

- Publica **un comentario** con `gh pr comment <N> --body-file <archivo.md>` (el informe de `qa`).
- Imágenes incrustadas: `![descripción](URL_raw_o_blob?raw=true)`. Para videos, un enlace directo al archivo.
- Tabla antes/después por ancho. Después de publicar, abre el comentario (`gh pr view <N> --comments`)
  y comprueba que las rutas de las imágenes sean correctas.

# Seguridad

- Solo `localhost`. No dispares diálogos de JavaScript (`alert`, `confirm`, `prompt`).
- Nunca capturar ni grabar contraseñas, tokens, `.env` ni datos personales reales.
- Para login/admin usa solo la cuenta de prueba indicada por el usuario; no la escribas en archivos ni informes.

# Resultado

Devuelve a `qa` un bloque en Markdown con las rutas locales y los enlaces del PR de cada
evidencia, listo para pegarlo en la sección “Antes / después” y “Videos” de su informe.
