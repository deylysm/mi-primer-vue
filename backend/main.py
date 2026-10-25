# backend/main.py
# Archivo principal de la API de FarmaApp (FastAPI). Aquí se definen los "endpoints":
# direcciones (URL) que el frontend Vue puede visitar para pedir datos.
# Los GET (leer) son públicos. Crear, editar y borrar medicamentos y farmacias (POST/PUT/DELETE)
# exige haber iniciado sesión con POST /login (ver seguridad.py y README.md).
# Se arranca con:  python -m uvicorn main:app --reload --port 8000   (ver README.md)

import threading  # módulo estándar de Python: "candado" para que varias peticiones no pisen el limitador de intentos
import time  # módulo estándar de Python: medir el paso del tiempo
from decimal import Decimal  # módulo estándar de Python: números decimales exactos (para el dinero, sin errores de redondeo)
from typing import Annotated  # módulo estándar de Python: añade reglas a un tipo (p. ej. "texto de máx. 100 letras")

import psycopg  # paquete instalado en backend/.venv: driver de PostgreSQL (aquí solo para capturar sus errores)
from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, Response  # paquete instalado en backend/.venv: el framework web (Path/Query validan lo que llega por la URL; Depends ejecuta una función antes del endpoint; Request da datos de la petición, como la IP)
from fastapi.exception_handlers import request_validation_exception_handler  # viene dentro de fastapi: la respuesta 422 que FastAPI da por defecto
from fastapi.exceptions import RequestValidationError  # viene dentro de fastapi: el error que se lanza cuando los datos recibidos no cumplen las reglas
from fastapi.middleware.cors import CORSMiddleware  # viene dentro de fastapi: permite el CORS (explicado abajo)
from fastapi.responses import JSONResponse  # viene dentro de fastapi: para devolver una respuesta JSON a mano
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator  # paquete instalado en backend/.venv (lo usa FastAPI): describe y valida el JSON que llega en el cuerpo de la petición

from db import obtener_conexion  # archivo local backend/db.py (misma carpeta, por eso no lleva ruta)
from seguridad import (  # archivo local backend/seguridad.py (misma carpeta): todo lo del login
    HASH_FALSO,
    crear_token,
    exigir_admin,
    verificar_contrasena,
)

# La "aplicación": uvicorn busca esta variable `app` (de ahí el "main:app" del comando).
app = FastAPI(title="FarmaApp API")

# CORS: por seguridad, el navegador NO deja que una página (Vue en localhost:5173) llame a otro
# servidor (esta API en localhost:8000) a menos que la API lo permita. Aquí solo permitimos
# el origen de Vite (el servidor de desarrollo de Vue); cualquier otro sitio será rechazado.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # leer, crear, editar y borrar (los tres últimos exigen login)
    allow_headers=["Authorization", "Content-Type"],  # Authorization lleva el token del login; Content-Type indica que el cuerpo es JSON
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


@app.exception_handler(RequestValidationError)
async def cuerpo_invalido(request, exc):
    # FastAPI responde 422 con la lista de errores (incluye el valor enviado en "input"). Si ese valor
    # es NaN o Infinity (JSON no los admite) la respuesta fallaría con un 500. Probamos primero la
    # respuesta normal de FastAPI (sin cambios para los demás casos) y, solo si falla, la damos sin "input".
    try:
        return await request_validation_exception_handler(request, exc)
    except ValueError:
        errores = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
        return JSONResponse(status_code=422, content={"detail": errores})


@app.exception_handler(psycopg.IntegrityError)
async def conflicto_de_datos(request, exc):
    # Red de seguridad: si PostgreSQL rechaza un cambio por chocar con otros datos (p. ej. alguien
    # borró una farmacia justo mientras la usábamos), respondemos 409 claro en vez de un 500.
    return JSONResponse(
        status_code=409,
        content={"detail": "La operación entra en conflicto con otros datos. Revisa e intenta de nuevo."},
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


# Para comparar sin mayúsculas ni tildes: pasamos a minúsculas y cambiamos las vocales con tilde
# por la vocal simple (translate reemplaza letra a letra). La ñ NO se toca (igual que normalizar.js).
# Es texto fijo escrito por nosotros, no viene del usuario, así que es seguro dentro del SQL.
_NORMALIZAR_SQL = "lower(translate({}, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu'))"


def _armar_medicamentos(
    conn, categoria=None, medicamento_id=None, q=None, marca=None, receta=None
):
    """Devuelve medicamentos con la MISMA forma que src/mocks/medicamentos.mock.js (camelCase).

    Hace solo 2 consultas: una para los medicamentos y otra para TODO su inventario
    (así evitamos el problema "N+1": una consulta extra por cada medicamento).
    Todos los filtros son opcionales (None = sin filtro) y se combinan con AND.
    """
    # Texto buscado: quitamos espacios sobrantes; vacío = sin filtro.
    q = " ".join(q.split()) if q else None
    q = q or None
    marca = marca or None

    # 1) Medicamentos (con filtros opcionales). Los %s son parámetros: psycopg los escapa por seguridad
    #    (nunca pegues texto del usuario directamente dentro del SQL).
    #    Búsqueda de texto con strpos(): busca el trozo literal dentro del texto, así que % y _
    #    del usuario NO actúan como comodines (no hace falta escapar nada, a diferencia de LIKE).
    nombre_norm = _NORMALIZAR_SQL.format("nombre")
    activo_norm = _NORMALIZAR_SQL.format("coalesce(principio_activo, '')")
    q_norm = _NORMALIZAR_SQL.format("%s::text")
    sql = f"""
        SELECT id, imagen, nombre, marca, principio_activo, presentacion,
               requiere_receta, categoria_id
        FROM medicamentos
        WHERE (%s::text IS NULL OR categoria_id = %s::text)
          AND (%s::int IS NULL OR id = %s::int)
          AND (%s::text IS NULL
               OR strpos({nombre_norm}, {q_norm}) > 0
               OR strpos({activo_norm}, {q_norm}) > 0)
          AND (%s::text IS NULL OR marca = %s::text)
          AND (%s::text IS NULL
               OR (%s::text = 'sin-receta' AND NOT requiere_receta)
               OR (%s::text = 'con-receta' AND requiere_receta))
        ORDER BY id
    """
    # Los f-strings de arriba solo insertan fragmentos fijos nuestros; los datos del usuario van en %s.
    parametros = (
        categoria, categoria,
        medicamento_id, medicamento_id,
        q, q, q,
        marca, marca,
        receta, receta, receta,
    )
    filas = conn.execute(sql, parametros).fetchall()
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
    # q: texto que debe aparecer en el nombre o en el principio activo (sin importar mayúsculas ni tildes)
    q: str | None = Query(None, max_length=50, pattern=r"^[^\x00]*$"),
    # marca: nombre exacto de la marca
    marca: str | None = Query(None, max_length=50, pattern=r"^[^\x00]*$"),
    # receta: solo dos valores permitidos; cualquier otro -> 422
    receta: str | None = Query(None, max_length=50, pattern=r"^(sin-receta|con-receta)$"),
):
    """Lista de medicamentos. Filtros opcionales y combinables (AND):
    /medicamentos?q=ibu&categoria=antiinflamatorio&marca=Genfar&receta=sin-receta"""
    with obtener_conexion() as conn:
        return _armar_medicamentos(conn, categoria=categoria, q=q, marca=marca, receta=receta)


@app.get("/marcas")
def listar_marcas():
    """Marcas distintas (sin nulos), ordenadas A-Z: ["Bayer", "Genfar", ...]."""
    with obtener_conexion() as conn:
        filas = conn.execute(
            "SELECT DISTINCT marca FROM medicamentos WHERE marca IS NOT NULL ORDER BY marca"
        ).fetchall()
    return [f["marca"] for f in filas]


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


# ===========================================================================
# LOGIN
# ===========================================================================

# Texto sin el byte NUL (\x00): PostgreSQL no lo acepta dentro de un texto.
_SIN_NUL = r"^[^\x00]*$"


class LoginEntrada(BaseModel):
    """Cuerpo de POST /login: {"usuario": "...", "contrasena": "..."}. Pydantic valida estas reglas
    por nosotros y, si algo no cumple, FastAPI responde 422 sin llegar a ejecutar el endpoint."""

    usuario: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50, pattern=_SIN_NUL)]
    # La contraseña NO se recorta (strip): los espacios pueden ser parte de ella.
    contrasena: Annotated[str, StringConstraints(min_length=1, max_length=200, pattern=_SIN_NUL)]


# --- Limitador de intentos fallidos (en memoria) ----------------------------
# Frena a quien pruebe contraseñas una y otra vez: tras 5 fallos de la misma pareja
# (usuario, IP) en 60 segundos, los siguientes intentos reciben 429 "Demasiados intentos"
# hasta que pasen esos 60 segundos. Un login correcto borra los fallos de esa pareja.
# Límites: vive en la memoria de este proceso, así que se borra al reiniciar la API y no se
# comparte entre varios procesos; y si la API está detrás de un proxy, la IP vista sería la del proxy.
# Para una app con muchos usuarios se usaría algo compartido (p. ej. Redis).
MAX_FALLOS = 5
VENTANA_SEGUNDOS = 60
_fallos: dict[tuple[str, str], list[float]] = {}  # (usuario, ip) -> momentos de cada fallo
_candado = threading.Lock()  # los endpoints normales (def) corren en varios hilos: el candado evita choques


def _fallos_vigentes(clave, ahora):
    """Fallos de esa pareja dentro de la ventana de 60 s (descarta los viejos). Usar con el candado puesto."""
    vigentes = [t for t in _fallos.get(clave, []) if ahora - t < VENTANA_SEGUNDOS]
    if vigentes:
        _fallos[clave] = vigentes
    else:
        _fallos.pop(clave, None)
    return vigentes


def _esta_bloqueado(clave) -> bool:
    with _candado:
        return len(_fallos_vigentes(clave, time.monotonic())) >= MAX_FALLOS


def _anotar_fallo(clave):
    ahora = time.monotonic()  # reloj que solo avanza (no se altera si cambian la hora del sistema)
    with _candado:
        if len(_fallos) > 10000:  # para que la memoria no crezca sin límite: limpiamos parejas ya vencidas
            for k in list(_fallos):
                _fallos_vigentes(k, ahora)
        _fallos.setdefault(clave, []).append(ahora)


def _olvidar_fallos(clave):
    with _candado:
        _fallos.pop(clave, None)


@app.post("/login")
def login(datos: LoginEntrada, request: Request):
    """Inicia sesión. Si usuario y contraseña son correctos devuelve {"token": "...", "tipo": "bearer"}.
    El frontend guarda el token y lo manda después en la cabecera  Authorization: Bearer <token>."""
    ip = request.client.host if request.client else "desconocida"
    clave = (datos.usuario.lower(), ip)

    if _esta_bloqueado(clave):
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
            headers={"Retry-After": str(VENTANA_SEGUNDOS)},  # cabecera estándar: segundos que debe esperar
        )

    with obtener_conexion() as conn:
        fila = conn.execute(
            "SELECT contrasena_hash FROM usuarios WHERE nombre_usuario = %s", (datos.usuario,)
        ).fetchone()

    # Si el usuario no existe, igualmente verificamos contra un hash falso: tardamos lo mismo que con
    # un usuario real y nadie puede descubrir, por el tiempo de respuesta, qué usuarios existen.
    hash_a_comprobar = fila["contrasena_hash"] if fila else HASH_FALSO
    contrasena_ok = verificar_contrasena(datos.contrasena, hash_a_comprobar)

    if fila is None or not contrasena_ok:
        _anotar_fallo(clave)
        # MISMO mensaje exista o no el usuario (para no revelar cuáles existen).
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    _olvidar_fallos(clave)
    return {"token": crear_token(datos.usuario), "tipo": "bearer"}


@app.get("/yo")
def quien_soy(usuario: str = Depends(exigir_admin)):
    """Requiere login. Devuelve {"usuario": nombre}; el frontend lo usa para saber si su token sigue válido."""
    return {"usuario": usuario}


# ===========================================================================
# MEDICAMENTOS: crear, editar y borrar (todos exigen login)
# ===========================================================================
# Los cuerpos llegan en camelCase (igual que lo que devuelve GET /medicamentos).
# Reglas de texto: se recortan los espacios de los extremos, no pueden quedar vacíos
# y no pueden llevar el byte NUL. `Annotated[str, StringConstraints(...)]` = "un str con estas reglas".
def _texto(maximo: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=maximo, pattern=_SIN_NUL)]


# Dinero: de 0 a 999999.99, máximo 8 dígitos en total y 2 decimales (igual que NUMERIC(8,2) en la base).
# Se usa Decimal (no float) porque los float no guardan bien los decimales (0.1 + 0.2 != 0.3).
_Dinero = Annotated[Decimal, Field(ge=0, le=Decimal("999999.99"), max_digits=8, decimal_places=2)]


class ItemInventarioEntrada(BaseModel):
    """Una línea del inventario: qué precio y cuánto stock hay de este medicamento en una farmacia."""

    model_config = ConfigDict(extra="forbid")  # un campo desconocido (p. ej. por una errata) da 422 en vez de ignorarse

    farmaciaId: int = Field(strict=True, ge=1, le=2147483647)  # strict: solo enteros de verdad (no "5" ni true)
    precio: _Dinero
    precioAnterior: _Dinero | None = None  # solo si está en oferta
    stock: int = Field(strict=True, ge=0, le=1000000)

    @model_validator(mode="after")  # "after" = se ejecuta cuando los campos sueltos ya pasaron sus reglas
    def _precio_anterior_mayor(self):
        if self.precioAnterior is not None and self.precioAnterior <= self.precio:
            raise ValueError("precioAnterior debe ser mayor que precio")
        return self


class MedicamentoEntrada(BaseModel):
    """Cuerpo de POST y PUT /medicamentos."""

    model_config = ConfigDict(extra="forbid")

    nombre: _texto(100)
    marca: _texto(100)
    principioActivo: _texto(100)
    presentacion: _texto(100)
    requiereReceta: bool = Field(strict=True)
    categoria: _texto(50)  # id de una categoría que ya exista (se comprueba contra la base)
    imagen: Annotated[str, StringConstraints(strip_whitespace=True, max_length=300, pattern=_SIN_NUL)] | None = None
    inventario: list[ItemInventarioEntrada] = Field(max_length=100)

    @field_validator("imagen")  # revisa solo ese campo, después de sus reglas básicas
    @classmethod
    def _imagen_segura(cls, valor):
        if not valor:
            return None  # '' o null = sin imagen (en la base queda NULL, igual que "puede quedar vacía")
        # Solo rutas del propio sitio (/imagenes/x.png) o direcciones http(s). Así no se cuelan
        # cosas como "javascript:..." ni "//otro-sitio.com/x.png" (que apuntaría a otro servidor).
        if valor.startswith("/") and not valor.startswith("//"):
            return valor
        if valor.lower().startswith(("http://", "https://")):
            return valor
        raise ValueError("imagen debe empezar por '/', 'http://' o 'https://'")

    @model_validator(mode="after")
    def _farmacias_sin_repetir(self):
        ids = [item.farmaciaId for item in self.inventario]
        if len(ids) != len(set(ids)):  # un set no admite repetidos: si es más corto, había alguno
            raise ValueError("una misma farmacia no puede aparecer dos veces en el inventario")
        return self


def _validar_referencias(conn, datos: MedicamentoEntrada):
    """Comprueba que la categoría y las farmacias existan; si no, 422 con un mensaje claro
    (así no llega un error 500 de clave foránea desde PostgreSQL)."""
    categoria = conn.execute("SELECT 1 FROM categorias WHERE id = %s", (datos.categoria,)).fetchone()
    if categoria is None:
        raise HTTPException(status_code=422, detail="La categoría indicada no existe.")

    pedidas = {item.farmaciaId for item in datos.inventario}
    if pedidas:
        existentes = {
            f["id"]
            for f in conn.execute(
                "SELECT id FROM farmacias WHERE id = ANY(%s)", (list(pedidas),)
            ).fetchall()
        }
        faltan = sorted(pedidas - existentes)
        if faltan:
            raise HTTPException(
                status_code=422,
                detail="No existen las farmacias con id: " + ", ".join(str(i) for i in faltan) + ".",
            )


def _guardar_inventario(conn, medicamento_id: int, items):
    """Inserta las líneas de inventario de un medicamento (consulta parametrizada, una por línea)."""
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO inventario (farmacia_id, medicamento_id, precio, precio_anterior, stock)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [(i.farmaciaId, medicamento_id, i.precio, i.precioAnterior, i.stock) for i in items],
        )


def _no_existe_medicamento(medicamento_id: int):
    return HTTPException(status_code=404, detail=f"No existe el medicamento con id {medicamento_id}.")


@app.post("/medicamentos", status_code=201, dependencies=[Depends(exigir_admin)])
def crear_medicamento(datos: MedicamentoEntrada):
    """Requiere login. Crea un medicamento con su inventario y lo devuelve (201) con la misma forma
    que GET /medicamentos/{id}.
    `dependencies=[Depends(exigir_admin)]` hace que FastAPI compruebe el token ANTES de ejecutar esto."""
    # `with` = una transacción: si algo falla (HTTPException incluida) se deshace todo (rollback);
    # solo se confirma (commit) si llegamos al final sin errores.
    with obtener_conexion() as conn:
        _validar_referencias(conn, datos)
        nuevo_id = conn.execute(
            """
            INSERT INTO medicamentos
                (nombre, marca, principio_activo, presentacion, requiere_receta, imagen, categoria_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                datos.nombre, datos.marca, datos.principioActivo, datos.presentacion,
                datos.requiereReceta, datos.imagen, datos.categoria,
            ),
        ).fetchone()["id"]  # RETURNING id = PostgreSQL nos devuelve el id que acaba de asignar
        _guardar_inventario(conn, nuevo_id, datos.inventario)
        return _armar_medicamentos(conn, medicamento_id=nuevo_id)[0]


@app.put("/medicamentos/{medicamento_id}", dependencies=[Depends(exigir_admin)])
def editar_medicamento(
    datos: MedicamentoEntrada,
    medicamento_id: int = Path(ge=1, le=2147483647),
):
    """Requiere login. Reemplaza los datos del medicamento Y todo su inventario, en una sola
    transacción (o se cambia todo o no se cambia nada). 404 si no existe."""
    with obtener_conexion() as conn:
        # FOR UPDATE bloquea esa fila hasta terminar: nadie más puede modificarla a la vez.
        existe = conn.execute(
            "SELECT 1 FROM medicamentos WHERE id = %s FOR UPDATE", (medicamento_id,)
        ).fetchone()
        if existe is None:
            raise _no_existe_medicamento(medicamento_id)
        _validar_referencias(conn, datos)
        conn.execute(
            """
            UPDATE medicamentos
            SET nombre = %s, marca = %s, principio_activo = %s, presentacion = %s,
                requiere_receta = %s, imagen = %s, categoria_id = %s
            WHERE id = %s
            """,
            (
                datos.nombre, datos.marca, datos.principioActivo, datos.presentacion,
                datos.requiereReceta, datos.imagen, datos.categoria, medicamento_id,
            ),
        )
        conn.execute("DELETE FROM inventario WHERE medicamento_id = %s", (medicamento_id,))
        _guardar_inventario(conn, medicamento_id, datos.inventario)
        return _armar_medicamentos(conn, medicamento_id=medicamento_id)[0]


@app.delete("/medicamentos/{medicamento_id}", status_code=204, dependencies=[Depends(exigir_admin)])
def borrar_medicamento(medicamento_id: int = Path(ge=1, le=2147483647)):
    """Requiere login. Borra el medicamento y antes su inventario (misma transacción). 404 si no existe;
    204 = "hecho, sin contenido que devolver"."""
    with obtener_conexion() as conn:
        # Primero el inventario (apunta al medicamento); si no, la clave foránea impediría borrarlo.
        conn.execute("DELETE FROM inventario WHERE medicamento_id = %s", (medicamento_id,))
        borrado = conn.execute(
            "DELETE FROM medicamentos WHERE id = %s RETURNING id", (medicamento_id,)
        ).fetchone()
        if borrado is None:
            raise _no_existe_medicamento(medicamento_id)  # el rollback deshace también el DELETE del inventario
    return Response(status_code=204)


# ===========================================================================
# FARMACIAS: crear, editar y borrar (todos exigen login)
# ===========================================================================
class FarmaciaEntrada(BaseModel):
    """Cuerpo de POST y PUT /farmacias."""

    model_config = ConfigDict(extra="forbid")

    nombre: _texto(100)
    direccion: _texto(200)
    ciudad: _texto(100)
    # Teléfono opcional: solo dígitos, espacios y + - ( ). '' o null = sin teléfono.
    telefono: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30, pattern=r"^[0-9 +\-()]*$")] | None = None

    @field_validator("telefono")
    @classmethod
    def _telefono_vacio_es_nulo(cls, valor):
        return valor or None


@app.post("/farmacias", status_code=201, dependencies=[Depends(exigir_admin)])
def crear_farmacia(datos: FarmaciaEntrada):
    """Requiere login. Crea una farmacia y la devuelve (201): {id, nombre, direccion, ciudad, telefono}."""
    with obtener_conexion() as conn:
        return conn.execute(
            "INSERT INTO farmacias (nombre, direccion, ciudad, telefono) VALUES (%s, %s, %s, %s) "
            "RETURNING id, nombre, direccion, ciudad, telefono",  # mismas columnas que GET /farmacias
            (datos.nombre, datos.direccion, datos.ciudad, datos.telefono),
        ).fetchone()


@app.put("/farmacias/{farmacia_id}", dependencies=[Depends(exigir_admin)])
def editar_farmacia(datos: FarmaciaEntrada, farmacia_id: int = Path(ge=1, le=2147483647)):
    """Requiere login. Reemplaza los datos de la farmacia y la devuelve. 404 si no existe."""
    with obtener_conexion() as conn:
        farmacia = conn.execute(
            "UPDATE farmacias SET nombre = %s, direccion = %s, ciudad = %s, telefono = %s WHERE id = %s "
            "RETURNING id, nombre, direccion, ciudad, telefono",
            (datos.nombre, datos.direccion, datos.ciudad, datos.telefono, farmacia_id),
        ).fetchone()
        if farmacia is None:
            raise HTTPException(status_code=404, detail=f"No existe la farmacia con id {farmacia_id}.")
        return farmacia


@app.delete("/farmacias/{farmacia_id}", status_code=204, dependencies=[Depends(exigir_admin)])
def borrar_farmacia(farmacia_id: int = Path(ge=1, le=2147483647)):
    """Requiere login. Borra una farmacia. 404 si no existe; 409 si todavía tiene medicamentos en su inventario."""
    with obtener_conexion() as conn:
        # Bloqueamos la fila de la farmacia mientras decidimos (así nadie le agrega inventario justo ahora).
        existe = conn.execute(
            "SELECT 1 FROM farmacias WHERE id = %s FOR UPDATE", (farmacia_id,)
        ).fetchone()
        if existe is None:
            raise HTTPException(status_code=404, detail=f"No existe la farmacia con id {farmacia_id}.")
        en_uso = conn.execute(
            "SELECT 1 FROM inventario WHERE farmacia_id = %s LIMIT 1", (farmacia_id,)
        ).fetchone()
        if en_uso is not None:
            raise HTTPException(
                status_code=409,
                detail="La farmacia tiene medicamentos en su inventario; quítalos primero.",
            )
        conn.execute("DELETE FROM farmacias WHERE id = %s", (farmacia_id,))
    return Response(status_code=204)
