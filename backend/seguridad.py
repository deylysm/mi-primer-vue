# backend/seguridad.py
# Todo lo relacionado con el LOGIN: guardar contraseñas de forma segura (hash), crear y revisar
# "tokens" (el pase que recibe el navegador al iniciar sesión) y la dependencia `exigir_admin`
# que protege los endpoints que modifican datos.
# Lo usan main.py (endpoints) y crear_admin.py (script que crea al administrador).

import os  # módulo estándar de Python: lee variables de entorno
import secrets  # módulo estándar de Python: genera números/textos aleatorios seguros (para claves)
from datetime import datetime, timedelta, timezone  # módulo estándar de Python: fechas y duraciones

import jwt  # paquete PyJWT instalado en backend/.venv: crea y verifica tokens JWT
from argon2 import PasswordHasher  # paquete argon2-cffi instalado en backend/.venv: hash de contraseñas
from argon2.exceptions import InvalidHashError, VerificationError  # errores de argon2 (la contraseña no coincide, hash dañado...)
from fastapi import Header, HTTPException  # paquete instalado en backend/.venv: Header lee una cabecera HTTP

from db import obtener_conexion  # archivo local backend/db.py (misma carpeta, por eso no lleva ruta)

# ---------------------------------------------------------------------------
# 1) Contraseñas: NUNCA se guardan tal cual. Se guarda su "hash": una huella que se calcula
#    en un solo sentido (de la contraseña sale el hash, pero del hash NO se puede volver a la
#    contraseña). Para comprobar un login se calcula el hash del texto escrito y se compara.
#    argon2 es el algoritmo recomendado hoy; es lento A PROPÓSITO para frenar a quien pruebe
#    millones de contraseñas. Cada hash lleva dentro su propia "sal" aleatoria (por eso dos
#    usuarios con la misma contraseña tienen hashes distintos).
# ---------------------------------------------------------------------------
_hasher = PasswordHasher()


def hashear_contrasena(contrasena: str) -> str:
    """Devuelve el hash argon2 de la contraseña (es lo único que se guarda en la base)."""
    return _hasher.hash(contrasena)


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    """True si la contraseña corresponde a ese hash; False en cualquier otro caso."""
    try:
        return _hasher.verify(hash_guardado, contrasena)
    except (VerificationError, InvalidHashError):
        # VerificationError (y su hija VerifyMismatchError) = contraseña incorrecta;
        # InvalidHashError = el texto guardado no es un hash válido. En ambos casos: no entra.
        return False


# Hash de una contraseña inventada, calculado una vez al arrancar. Sirve para el login con un
# usuario que NO existe: igual hacemos una verificación (que fallará) para tardar lo mismo que
# con un usuario real. Así, midiendo el tiempo de respuesta, nadie puede adivinar qué usuarios existen.
HASH_FALSO = _hasher.hash(secrets.token_hex(16))

# ---------------------------------------------------------------------------
# 2) Token JWT: al iniciar sesión, la API entrega un texto firmado con una clave secreta que
#    dice "este es el usuario X y vale hasta tal hora". El navegador lo manda en cada petición
#    protegida (cabecera Authorization: Bearer <token>). Nadie puede inventarlo ni modificarlo
#    sin conocer la clave. El contenido NO está cifrado (solo firmado): no pongas secretos dentro.
# ---------------------------------------------------------------------------
ALGORITMO = "HS256"  # algoritmo de firma con una clave compartida
DURACION_TOKEN = timedelta(hours=8)  # a las 8 horas el token caduca y hay que volver a entrar

# La clave secreta se lee de la variable de entorno FARMAAPP_JWT_SECRET, así ningún secreto
# vive en el código ni en git. Si la variable no existe, se genera una clave ALEATORIA cada vez
# que arranca la API. Consecuencia: al reiniciar la API (¡también cuando uvicorn con --reload
# la reinicia solo al guardar un archivo!) la clave cambia y todas las sesiones se cierran
# (hay que volver a hacer login). Para sesiones estables, define la variable antes de arrancar
# (con al menos 32 caracteres aleatorios), por ejemplo en PowerShell:
#   $env:FARMAAPP_JWT_SECRET = "<texto largo y aleatorio>"
_secreto_entorno = os.getenv("FARMAAPP_JWT_SECRET")
if _secreto_entorno is not None and len(_secreto_entorno) < 32:
    raise RuntimeError("FARMAAPP_JWT_SECRET es demasiado corta: usa al menos 32 caracteres.")
SECRETO_JWT = _secreto_entorno or secrets.token_hex(32)


def crear_token(nombre_usuario: str) -> str:
    """Crea un token firmado. `sub` ("subject") es el nombre estándar para "a quién pertenece"."""
    ahora = datetime.now(timezone.utc)
    carga = {"sub": nombre_usuario, "iat": ahora, "exp": ahora + DURACION_TOKEN}  # exp = expira
    return jwt.encode(carga, SECRETO_JWT, algorithm=ALGORITMO)


def leer_token(token: str) -> str | None:
    """Devuelve el nombre de usuario del token, o None si no es válido (firma falsa o caducado)."""
    try:
        carga = jwt.decode(
            token,
            SECRETO_JWT,
            algorithms=[ALGORITMO],  # solo aceptamos nuestro algoritmo (evita trucos con "alg: none")
            options={"require": ["exp", "sub"]},  # el token debe traer caducidad y usuario
        )
    except jwt.PyJWTError:  # clase madre de todos los errores de PyJWT (firma, caducidad, formato...)
        return None
    sub = carga.get("sub")
    return sub if isinstance(sub, str) else None


# ---------------------------------------------------------------------------
# 3) Dependencia de FastAPI: una función que FastAPI ejecuta ANTES del endpoint.
#    Si lanza un error, el endpoint ni se ejecuta. Se usa así:
#        @app.post("/algo", dependencies=[Depends(exigir_admin)])        (solo protege)
#        def yo(usuario: str = Depends(exigir_admin)): ...               (además da el nombre)
# ---------------------------------------------------------------------------
def _no_autorizado() -> HTTPException:
    # Mensaje genérico a propósito: no revelamos si falló la firma, si caducó o si el usuario ya no existe.
    # La cabecera WWW-Authenticate es parte del estándar HTTP: le dice al cliente qué tipo de login se espera.
    return HTTPException(
        status_code=401,
        detail="Sesión no válida. Inicia sesión de nuevo.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def exigir_admin(authorization: str | None = Header(None)) -> str:
    """Revisa la cabecera `Authorization: Bearer <token>`. Devuelve el nombre del usuario o responde 401."""
    if not authorization:
        raise _no_autorizado()
    esquema, _, token = authorization.partition(" ")  # "Bearer abc" -> ("Bearer", " ", "abc")
    if esquema.lower() != "bearer" or not token.strip():
        raise _no_autorizado()

    nombre = leer_token(token.strip())
    if nombre is None:
        raise _no_autorizado()

    # El token puede ser válido pero el usuario haber sido borrado después: lo comprobamos en la base.
    with obtener_conexion() as conn:
        fila = conn.execute(
            "SELECT 1 FROM usuarios WHERE nombre_usuario = %s", (nombre,)
        ).fetchone()
    if fila is None:
        raise _no_autorizado()
    return nombre
