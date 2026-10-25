# Backend de FarmaApp (FastAPI)

API muy sencilla que **lee** los datos de la base PostgreSQL (la del contenedor Docker `farmaapp-db`)
y se los entrega al frontend Vue en formato JSON. Por ahora no guarda ni modifica nada.

## Antes de empezar

- El contenedor `farmaapp-db` debe estar encendido (`docker ps` lo muestra).
- El entorno virtual `backend\.venv` ya tiene instalado todo lo necesario
  (es una carpeta con sus propios paquetes de Python; no se sube a git).

## Cómo arrancar

Desde la raíz del proyecto (`mi-primer-vue`), en PowerShell:

```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Con eso basta: usar la ruta larga `.venv\Scripts\python.exe` ya usa los paquetes del entorno virtual,
**no hace falta activarlo**.

(Opcional) Activar el entorno virtual solo sirve para no escribir la ruta larga:
`.venv\Scripts\Activate.ps1` y luego `python -m uvicorn main:app --reload --port 8000`.
Ojo: en PowerShell la activación puede fallar con un error de "ejecución de scripts deshabilitada"
(política de ejecución de Windows). Si te pasa, simplemente usa la ruta larga de arriba.
Si de verdad quieres activarlo, **tú** puedes permitir scripts firmados/locales solo para tu usuario con
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (es un cambio de tu equipo, opcional, y lo
ejecutas tú, no el asistente).

El comando `deactivate` solo existe después de haber activado el entorno; si no lo activaste, no lo necesitas.

Para parar el servidor: `Ctrl + C`.

## Direcciones útiles

- Documentación interactiva (puedes probar los endpoints ahí): http://localhost:8000/docs
- `GET /salud` - comprueba que la API y la base responden
- `GET /categorias` - categorías con sus subcategorías
- `GET /farmacias` - farmacias
- `GET /medicamentos` - medicamentos con su inventario (`?categoria=antiinflamatorio` para filtrar)
- `GET /medicamentos/1` - un medicamento (404 si no existe; 422 si el id no es un entero entre 1 y 2147483647)

## Qué hace cada archivo

| Archivo | Para qué sirve |
|---------|----------------|
| `main.py` | La aplicación FastAPI: define los endpoints y el permiso CORS para Vue (`localhost:5173`). |
| `db.py` | Abre la conexión a PostgreSQL (host, puerto, usuario... con valores de práctica). |
| `requirements.txt` | Lista de paquetes con su versión exacta. Para recrear el entorno: `python -m venv .venv` y `.venv\Scripts\python.exe -m pip install -r requirements.txt`. |
| `.gitignore` | Le dice a git que ignore `.venv/` y `__pycache__/`. |
| `.venv/` | Entorno virtual con FastAPI, uvicorn y psycopg (no se edita a mano). |

## Nota sobre credenciales

Los datos de conexión de `db.py` (usuario `farmaapp`, contraseña `123456`) son **solo de práctica**.
Se pueden cambiar con las variables de entorno `FARMAAPP_DB_HOST`, `FARMAAPP_DB_PORT`,
`FARMAAPP_DB_NAME`, `FARMAAPP_DB_USER` y `FARMAAPP_DB_PASSWORD`.
