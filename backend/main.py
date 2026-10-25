# backend/main.py
# Archivo principal de la API de FarmaApp (FastAPI). Aquí se definen los "endpoints":
# direcciones (URL) que el frontend Vue puede visitar para pedir datos.
# Por ahora SOLO LEE datos (SELECT); no guarda ni modifica nada en la base.
# Se arranca con:  python -m uvicorn main:app --reload --port 8000   (ver README.md)

import psycopg  # paquete instalado en backend/.venv: driver de PostgreSQL (aquí solo para capturar sus errores)
from fastapi import FastAPI, HTTPException, Path, Query  # paquete instalado en backend/.venv: el framework web (Path/Query validan lo que llega por la URL)
from fastapi.middleware.cors import CORSMiddleware  # viene dentro de fastapi: permite el CORS (explicado abajo)
from fastapi.responses import JSONResponse  # viene dentro de fastapi: para devolver una respuesta JSON a mano

from db import obtener_conexion  # archivo local backend/db.py (misma carpeta, por eso no lleva ruta)

# La "aplicación": uvicorn busca esta variable `app` (de ahí el "main:app" del comando).
app = FastAPI(title="FarmaApp API")

# CORS: por seguridad, el navegador NO deja que una página (Vue en localhost:5173) llame a otro
# servidor (esta API en localhost:8000) a menos que la API lo permita. Aquí solo permitimos
# el origen de Vite (el servidor de desarrollo de Vue); cualquier otro sitio será rechazado.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],  # esta API por ahora solo lee
    allow_headers=["*"],
)


@app.exception_handler(psycopg.OperationalError)
async def base_de_datos_caida(request, exc):
    # Si la base se cae EN MEDIO de una consulta, respondemos 503 claro en vez de un 500 con traza.
    return JSONResponse(
        status_code=503,
        content={"detail": "La base de datos no está disponible en este momento. Intenta de nuevo más tarde."},
    )


@app.exception_handler(psycopg.DataError)
async def dato_invalido(request, exc):
    # Red de seguridad: si PostgreSQL rechaza un dato raro (número fuera de rango, texto con byte NUL...),
    # respondemos 422 con un mensaje genérico. No mostramos la traza ni detalles internos.
    return JSONResponse(
        status_code=422,
        content={"detail": "Algún dato enviado no es válido."},
    )


@app.get("/salud")
def salud():
    """Comprueba que la API vive y que la base responde (SELECT 1)."""
    with obtener_conexion() as conn:  # si la base está caída, obtener_conexion() lanza el 503
        conn.execute("SELECT 1")
    return {"estado": "ok"}


@app.get("/categorias")
def listar_categorias():
    """Categorías, cada una con sus subcategorías: [{id, nombre, subcategorias: [{slug, nombre}]}]."""
    with obtener_conexion() as conn:
        # Sin ORDER BY en categorías (su id es texto y no hay columna de orden): PostgreSQL las
        # devuelve en el orden en que se insertaron, igual que en el mock.
        categorias = conn.execute("SELECT id, nombre FROM categorias").fetchall()
        subs = conn.execute(
            "SELECT categoria_id, slug, nombre FROM subcategorias ORDER BY id"
        ).fetchall()

    # Agrupamos las subcategorías por categoría en Python (2 consultas en total, sin N+1).
    por_categoria = {c["id"]: [] for c in categorias}
    for s in subs:
        por_categoria[s["categoria_id"]].append({"slug": s["slug"], "nombre": s["nombre"]})

    return [
        {"id": c["id"], "nombre": c["nombre"], "subcategorias": por_categoria[c["id"]]}
        for c in categorias
    ]


@app.get("/farmacias")
def listar_farmacias():
    """Lista de farmacias."""
    with obtener_conexion() as conn:
        return conn.execute(
            "SELECT id, nombre, direccion, ciudad, telefono FROM farmacias ORDER BY id"
        ).fetchall()


def _armar_medicamentos(conn, categoria=None, medicamento_id=None):
    """Devuelve medicamentos con la MISMA forma que src/mocks/medicamentos.mock.js (camelCase).

    Hace solo 2 consultas: una para los medicamentos y otra para TODO su inventario
    (así evitamos el problema "N+1": una consulta extra por cada medicamento).
    """
    # 1) Medicamentos (con filtro opcional). Los %s son parámetros: psycopg los escapa por seguridad
    #    (nunca pegues texto del usuario directamente dentro del SQL).
    sql = """
        SELECT id, imagen, nombre, marca, principio_activo, presentacion,
               requiere_receta, categoria_id
        FROM medicamentos
        WHERE (%s::text IS NULL OR categoria_id = %s::text)
          AND (%s::int IS NULL OR id = %s::int)
        ORDER BY id
    """
    filas = conn.execute(sql, (categoria, categoria, medicamento_id, medicamento_id)).fetchall()
    if not filas:
        return []

    # 2) Inventario de esos medicamentos, todo de una vez (= ANY(lista)).
    ids = [f["id"] for f in filas]
    inventario = conn.execute(
        """
        SELECT medicamento_id, farmacia_id, precio, precio_anterior, stock
        FROM inventario
        WHERE medicamento_id = ANY(%s)
        ORDER BY medicamento_id, farmacia_id
        """,
        (ids,),
    ).fetchall()

    # Agrupamos el inventario por medicamento.
    por_medicamento = {i: [] for i in ids}
    for inv in inventario:
        item = {
            "farmaciaId": inv["farmacia_id"],
            "precio": float(inv["precio"]),  # NUMERIC llega como Decimal; lo pasamos a número normal
            "stock": inv["stock"],
        }
        if inv["precio_anterior"] is not None:  # solo se incluye si hay oferta (como en el mock)
            item["precioAnterior"] = float(inv["precio_anterior"])
        por_medicamento[inv["medicamento_id"]].append(item)

    return [
        {
            "id": f["id"],
            "imagen": f["imagen"],
            "nombre": f["nombre"],
            "marca": f["marca"],
            "principioActivo": f["principio_activo"],  # snake_case (SQL) -> camelCase (JS)
            "presentacion": f["presentacion"],
            "requiereReceta": f["requiere_receta"],
            "categoria": f["categoria_id"],
            "inventario": por_medicamento[f["id"]],
        }
        for f in filas
    ]


@app.get("/medicamentos")
def listar_medicamentos(
    # máx. 50 caracteres y sin el byte NUL (\x00), que PostgreSQL no acepta en un texto
    categoria: str | None = Query(None, max_length=50, pattern=r"^[^\x00]*$"),
):
    """Lista de medicamentos. Filtro opcional: /medicamentos?categoria=antiinflamatorio"""
    with obtener_conexion() as conn:
        return _armar_medicamentos(conn, categoria=categoria)


@app.get("/medicamentos/{medicamento_id}")
def obtener_medicamento(
    # el id debe caber en un int4 de PostgreSQL (1 a 2147483647); fuera de ese rango -> 422
    medicamento_id: int = Path(ge=1, le=2147483647),
):
    """Un solo medicamento por su id. Si no existe, responde 404."""
    with obtener_conexion() as conn:
        resultado = _armar_medicamentos(conn, medicamento_id=medicamento_id)
    if not resultado:
        raise HTTPException(status_code=404, detail=f"No existe el medicamento con id {medicamento_id}.")
    return resultado[0]
