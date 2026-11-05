-- db/03_usuarios.sql
-- Crea la tabla "usuarios": las personas que pueden iniciar sesión en la API (administradores).
-- Para qué sirve: guardar el nombre de usuario y el HASH de la contraseña (nunca la contraseña en sí).
-- Quién lo usa: tú, ejecutándolo con psql; después backend/seguridad.py y backend/crear_admin.py.
--
-- A diferencia de 01_tablas.sql, este archivo NO borra nada: "IF NOT EXISTS" significa
-- "créala solo si todavía no existe", así que se puede ejecutar varias veces sin perder datos
-- y no toca las otras tablas (categorias, farmacias, medicamentos...).
--
-- Para ejecutarlo (desde la raíz del proyecto):
--   docker exec -i farmaapp-db psql -U farmaapp -d farmaapp < db/03_usuarios.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id               SERIAL PRIMARY KEY,                    -- número automático que identifica a cada usuario
    nombre_usuario   TEXT NOT NULL UNIQUE,                  -- UNIQUE = no puede haber dos usuarios con el mismo nombre
    contrasena_hash  TEXT NOT NULL,                         -- el "hash" (huella irreversible) de la contraseña, no la contraseña
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()     -- fecha y hora de creación; se rellena sola con la hora actual
);
