# Backend de FarmaApp (FastAPI)

API muy sencilla que **lee** los datos de la base PostgreSQL (la del contenedor Docker `farmaapp-db`)
y se los entrega al frontend Vue en formato JSON. Con login, también permite crear, editar y borrar
medicamentos y farmacias (ver "Login y endpoints de escritura").

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

## Login y endpoints de escritura

Los `GET` siguen siendo públicos. Crear, editar y borrar medicamentos y farmacias exige **iniciar sesión**.

**Tabla `usuarios`** (`db/03_usuarios.sql`): guarda `nombre_usuario` y `contrasena_hash` (nunca la contraseña,
solo su "huella" argon2). Se crea una sola vez, sin tocar las otras tablas:

```powershell
docker exec -i farmaapp-db psql -U farmaapp -d farmaapp < db/03_usuarios.sql
```

**Crear el administrador** (una vez, desde la carpeta `backend`; el script te pide usuario y contraseña de
mínimo 10 caracteres, sin mostrarla en pantalla):

```powershell
cd backend
.venv\Scripts\python.exe crear_admin.py
```

**Variable `FARMAAPP_JWT_SECRET`**: es la clave con la que se firman los tokens del login (mínimo 32 caracteres).
Si no la defines, la API genera una aleatoria cada vez que arranca; entonces, al reiniciarse (también con `--reload`
cuando guardas un archivo) **las sesiones se cierran** y hay que volver a hacer login. Para sesiones estables,
defínela antes de arrancar: `$env:FARMAAPP_JWT_SECRET = "<texto largo y aleatorio>"` (no la escribas en archivos del proyecto).

Cómo se usa el token: `POST /login` devuelve `{"token": "...", "tipo": "bearer"}`; las peticiones protegidas lo mandan
en la cabecera `Authorization: Bearer <token>`. Dura 8 horas. Sin token válido: `401`.

| Método y ruta | ¿Login? | Qué hace |
|---------------|---------|----------|
| `POST /login` | No | Cuerpo `{"usuario", "contrasena"}`. 200 con el token; 401 si son incorrectos; 429 tras 5 fallos en 60 s (mismo usuario e IP). |
| `GET /yo` | Sí | Devuelve `{"usuario": nombre}` (sirve para saber si el token sigue válido). |
| `POST /medicamentos` | Sí | Crea un medicamento con su inventario. 201 con la misma forma que `GET /medicamentos/{id}`. |
| `PUT /medicamentos/{id}` | Sí | Reemplaza los datos y TODO el inventario. 404 si no existe. |
| `DELETE /medicamentos/{id}` | Sí | Borra el medicamento y su inventario. 204; 404 si no existe. |
| `POST /farmacias` | Sí | Crea una farmacia. 201 con `{id, nombre, direccion, ciudad, telefono}`. |
| `PUT /farmacias/{id}` | Sí | Reemplaza los datos. 404 si no existe. |
| `DELETE /farmacias/{id}` | Sí | 204; 404 si no existe; 409 si todavía tiene medicamentos en su inventario. |

Datos que no cumplan las reglas (textos vacíos o muy largos, precio fuera de rango, categoría o farmacia que no
existe, etc.) responden `422`. Puedes probar todo desde http://localhost:8000/docs (botón "Authorize" con el token).

## Qué hace cada archivo

| Archivo | Para qué sirve |
|---------|----------------|
| `main.py` | La aplicación FastAPI: define los endpoints y el permiso CORS para Vue (`localhost:5173`). |
| `db.py` | Abre la conexión a PostgreSQL (host, puerto, usuario... con valores de práctica). |
| `seguridad.py` | Hash de contraseñas (argon2), tokens JWT y `exigir_admin`, que protege los endpoints de escritura. |
| `crear_admin.py` | Script de consola para crear el usuario administrador (ver arriba). |
| `requirements.txt` | Lista de paquetes con su versión exacta. Para recrear el entorno: `python -m venv .venv` y `.venv\Scripts\python.exe -m pip install -r requirements.txt`. |
| `.gitignore` | Le dice a git que ignore `.venv/` y `__pycache__/`. |
| `.venv/` | Entorno virtual con FastAPI, uvicorn y psycopg (no se edita a mano). |

## Nota sobre credenciales

Los datos de conexión de `db.py` (usuario `farmaapp`, contraseña `123456`) son **solo de práctica**.
Se pueden cambiar con las variables de entorno `FARMAAPP_DB_HOST`, `FARMAAPP_DB_PORT`,
`FARMAAPP_DB_NAME`, `FARMAAPP_DB_USER` y `FARMAAPP_DB_PASSWORD`.
