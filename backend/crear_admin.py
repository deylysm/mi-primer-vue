# backend/crear_admin.py
# Script de consola (no es parte de la API): crea un usuario administrador en la tabla "usuarios".
# Se ejecuta UNA vez, a mano, desde la carpeta backend:
#     .venv\Scripts\python.exe crear_admin.py
# Te pregunta el nombre de usuario y la contraseña (dos veces). La contraseña NO se muestra al
# escribirla, NO se guarda en ningún archivo: en la base solo queda su hash (ver seguridad.py).

import getpass  # módulo estándar de Python: pide un texto sin mostrarlo en pantalla (para contraseñas)
import sys  # módulo estándar de Python: aquí solo para terminar el programa con un código de error

import psycopg  # paquete instalado en backend/.venv: driver de PostgreSQL (para capturar sus errores)
from fastapi import HTTPException  # paquete instalado en backend/.venv: db.py lo lanza si no hay conexión

from db import obtener_conexion  # archivo local backend/db.py (misma carpeta)
from seguridad import hashear_contrasena  # archivo local backend/seguridad.py (misma carpeta)

# Mismos límites que usa el login de main.py: si permitiéramos crear una contraseña más larga,
# luego el login la rechazaría y nadie podría entrar con ella.
LARGO_MAX_USUARIO = 50
LARGO_MIN_CONTRASENA = 10
LARGO_MAX_CONTRASENA = 200


def salir_con_error(mensaje: str):
    print(f"Error: {mensaje}")
    sys.exit(1)  # código 1 = "terminó mal" (0 sería éxito)


def main():
    usuario = input("Nombre de usuario: ").strip()
    if not usuario or len(usuario) > LARGO_MAX_USUARIO or "\x00" in usuario:
        salir_con_error(f"El usuario debe tener entre 1 y {LARGO_MAX_USUARIO} caracteres.")

    contrasena = getpass.getpass("Contraseña (no se verá al escribir): ")
    if len(contrasena) < LARGO_MIN_CONTRASENA:
        salir_con_error(f"La contraseña debe tener al menos {LARGO_MIN_CONTRASENA} caracteres.")
    if len(contrasena) > LARGO_MAX_CONTRASENA:
        salir_con_error(f"La contraseña no puede pasar de {LARGO_MAX_CONTRASENA} caracteres.")
    if getpass.getpass("Repite la contraseña: ") != contrasena:
        salir_con_error("Las dos contraseñas no coinciden.")

    try:
        with obtener_conexion() as conn:  # confirma (commit) al salir bien del with
            existe = conn.execute(
                "SELECT 1 FROM usuarios WHERE nombre_usuario = %s", (usuario,)
            ).fetchone()
            if existe:
                salir_con_error("Ese usuario ya existe.")
            # Parámetros %s (nunca pegar texto dentro del SQL). Solo se guarda el HASH.
            conn.execute(
                "INSERT INTO usuarios (nombre_usuario, contrasena_hash) VALUES (%s, %s)",
                (usuario, hashear_contrasena(contrasena)),
            )
    except HTTPException as e:  # obtener_conexion() avisa así de que la base no responde
        salir_con_error(str(e.detail))
    except psycopg.errors.UniqueViolation:  # por si alguien crea el mismo usuario justo a la vez
        salir_con_error("Ese usuario ya existe.")
    except psycopg.errors.UndefinedTable:
        salir_con_error("Falta la tabla usuarios: ejecuta primero db/03_usuarios.sql (ver backend/README.md).")

    print(f"Administrador '{usuario}' creado correctamente.")


# Este "if" hace que main() solo corra cuando ejecutas el archivo directamente (python crear_admin.py)
# y NO cuando otro archivo lo importa.
if __name__ == "__main__":
    main()
