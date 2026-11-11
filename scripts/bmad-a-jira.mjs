// scripts/bmad-a-jira.mjs
// ----------------------------------------------------------------------------
// Convierte el archivo de épicas e historias que genera BMAD (epics.md) en un
// archivo JSON por historia, con el formato que lee scripts/jira-crear.sh.
//
// IMPORTANTE: este script NO se conecta a Jira. Solo lee un .md y escribe .json.
// Subir a Jira es un paso aparte (ver "Uso" abajo) que se hace con revisión humana.
//
// Uso (desde la raíz del proyecto):
//   node scripts/bmad-a-jira.mjs _bmad-output/planning-artifacts/epics.md
//   node scripts/bmad-a-jira.mjs ruta/epics.md --proyecto SCRUM --tipo Historia --salida _bmad-output/jira-json
//
// Después, para subir UNA historia (tras revisar el JSON):
//   ./scripts/jira-crear.sh crear _bmad-output/jira-json/1-1-nombre.json
//
// Imports: solo módulos que ya trae Node (prefijo "node:"); no hay que instalar nada.
// ----------------------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ---------- 1. Leer argumentos ----------
const args = process.argv.slice(2)
// El primer argumento (si no empieza por --) es la ruta del epics.md.
const archivoMd = args[0] && !args[0].startsWith('--') ? args[0] : undefined

function valorDe(opcion, porDefecto) {
  const i = args.indexOf(opcion)
  return i !== -1 && args[i + 1] ? args[i + 1] : porDefecto
}

const proyecto = valorDe('--proyecto', 'SCRUM')
// En el proyecto SCRUM de FarmaApp el tipo se llama "Historia" (no "Story"); se comprobó con
// ./scripts/jira-crear.sh tipos SCRUM
const tipo = valorDe('--tipo', 'Historia')
const carpetaSalida = resolve(valorDe('--salida', '_bmad-output/jira-json'))

if (!archivoMd) {
  console.error('Uso: node scripts/bmad-a-jira.mjs <epics.md> [--proyecto SCRUM] [--tipo Historia] [--salida carpeta]')
  process.exit(1)
}

// ---------- 2. Expresiones regulares (aceptan inglés y español) ----------
const reEpica = /^##\s+(?:Epic|Épica|Epica)\s+(\d+)\s*[:：-]\s*(.+?)\s*$/i
const reHistoria = /^###\s+(?:Story|Historia)\s+(\d+)\.(\d+)\s*[:：-]\s*(.+?)\s*$/i
const reTituloAC = /^\*\*(?:Acceptance Criteria|Criterios de aceptaci[oó]n)\s*:?\*\*:?\s*$/i

// Quita los ** de negritas y espacios sobrantes de una línea.
const limpiar = (linea) => linea.replace(/\*\*/g, '').trim()

// ---------- 3. Recorrer el archivo línea por línea ----------
const lineas = readFileSync(archivoMd, 'utf8').split(/\r?\n/)
const historias = []
let epicaActual = null // { numero, titulo }
let actual = null // historia que se está leyendo
let enCriterios = false
let bloqueAC = [] // líneas del criterio de aceptación en curso

function cerrarBloqueAC() {
  if (actual && bloqueAC.length) actual.criterios.push(bloqueAC.join(' '))
  bloqueAC = []
}
function cerrarHistoria() {
  cerrarBloqueAC()
  if (actual) historias.push(actual)
  actual = null
  enCriterios = false
}

for (const linea of lineas) {
  let m
  if ((m = linea.match(reEpica))) {
    cerrarHistoria()
    epicaActual = { numero: m[1], titulo: m[2] }
  } else if ((m = linea.match(reHistoria))) {
    cerrarHistoria()
    actual = { epica: epicaActual, epicaNum: m[1], numero: m[2], titulo: m[3], texto: [], criterios: [] }
  } else if (actual) {
    if (/^#{1,3}\s/.test(linea)) {
      // Otro encabezado (de nivel igual o mayor) que no es historia: termina la historia.
      cerrarHistoria()
    } else if (reTituloAC.test(linea.trim())) {
      enCriterios = true
    } else if (enCriterios) {
      if (linea.trim() === '') cerrarBloqueAC()
      else if (!linea.trim().startsWith('<!--')) bloqueAC.push(limpiar(linea))
    } else if (linea.trim() !== '') {
      actual.texto.push(limpiar(linea))
    }
  }
}
cerrarHistoria()

if (historias.length === 0) {
  console.error('No se encontró ninguna historia (### Story N.M: ... / ### Historia N.M: ...) en ' + archivoMd)
  process.exit(1)
}

// ---------- 4. Escribir un JSON por historia ----------
// "descripcion" usa el mini-formato de jira-crear.ps1: "## " encabezado, "- " lista, otra cosa párrafo.
mkdirSync(carpetaSalida, { recursive: true })

const slug = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

for (const h of historias) {
  const partes = []
  if (h.epica) partes.push('## Épica ' + h.epica.numero, h.epica.titulo, '')
  partes.push('## Historia de usuario', ...h.texto, '')
  if (h.criterios.length) {
    partes.push('## Criterios de aceptación', ...h.criterios.map((c) => '- ' + c))
  }

  const json = {
    proyecto,
    tipo,
    titulo: `[${h.epicaNum}.${h.numero}] ${h.titulo}`,
    descripcion: partes.join('\n'),
    subtareas: [],
  }

  const archivo = join(carpetaSalida, `${h.epicaNum}-${h.numero}-${slug(h.titulo)}.json`)
  writeFileSync(archivo, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`✔ ${archivo}  (${h.criterios.length} criterios)`)
}

console.log(`\n${historias.length} historia(s) convertida(s). Nada se subió a Jira.`)
console.log('Revisa los JSON y sube cada uno con: ./scripts/jira-crear.sh crear <archivo.json>')
