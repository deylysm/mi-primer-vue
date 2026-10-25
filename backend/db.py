# backend/db.py
# Se encarga de UNA sola cosa: conectarse a la base de datos PostgreSQL.
# Lo usa main.py cada vez que un endpoint necesita leer datos.

import os  # módulo estándar de Python (viene con Python): sirve para leer variables de entorno

import psycopg  # paquete instalado en backend/.venv: el "driver" que habla con PostgreSQL
from psycopg.rows import dict_row  # hace que cada fila llegue como diccionario {"columna": valor}
from fastapi import HTTPException  # paquete instalado en backend/.venv: permite responder con un error HTTP

# ATENCIÓN: estos valores por defecto son SOLO DE PRÁCTICA (base local en Docker).
# En un proyecto real las credenciales nunca se escriben en el código: se leen de variables
# de entorno (os.getenv) o de un archivo .env que no se sube a git.
# os.getenv("NOMBRE", "valor_por_defecto") = usa la variable si existe, si no, el valor por defecto.
DB_HOST = os.getenv("FARMAAPP_DB_HOST", "localhost")
DB_PORT = os.getenv("FARMAAPP_DB_PORT", "5432")
DB_NAME = os.getenv("FARMAAPP_DB_NAME", "farmaapp")
DB_USER = os.getenv("FARMAAPP_DB_USER", "farmaapp")
DB_PASSWORD = os.getenv("FARMAAPP_DB_PASSWORD", "123456")  # contraseña de práctica


def obtener_conexion():
    """Abre una conexión nueva a PostgreSQL.

    Se usa así (el `with` cierra la conexión solo al terminar):
        with obtener_conexion() as conn:
            conn.execute("SELECT 1")
    Si la base no responde, devuelve un error 503 (servicio no disponible) con un mensaje claro
    en lugar de un error 500 con una traza larga.
    """
    try:
        return psycopg.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            row_factory=dict_row,  # filas como diccionarios
            client_encoding="UTF8",  # así las tildes y la ñ llegan bien
            connect_timeout=3,  # no esperar más de 3 segundos si la base no contesta
        )
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar a la base de datos. Verifica que el contenedor farmaapp-db esté encendido.",
        )
