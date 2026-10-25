-- db/01_tablas.sql
-- Crea las 5 tablas de la base de datos "farmaapp" (PostgreSQL).
-- Para qué sirve: define la ESTRUCTURA (las "carpetas" del archivero). Aún no guarda datos.
-- Quién lo usa: tú, ejecutándolo con psql (ver la guía paso a paso). Después, el backend FastAPI.
-- Es el equivalente en SQL de src/mocks/*.mock.js (categorias, farmacias y medicamentos).
--
-- Se puede ejecutar varias veces: empieza borrando las tablas (DROP) si ya existían.
-- OJO: eso borra también sus datos; por eso luego hay que volver a ejecutar 02_datos.sql.

DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS medicamentos;
DROP TABLE IF EXISTS subcategorias;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS farmacias;

-- ---------------------------------------------------------------------------
-- 1) categorias: tipos de medicamento (Analgésicos, Antibióticos...).
--    El id es un texto corto ("slug", p. ej. 'analgesico') igual que en categorias.mock.js.
-- ---------------------------------------------------------------------------
CREATE TABLE categorias (
    id      TEXT PRIMARY KEY,            -- PRIMARY KEY = identificador único de cada fila
    nombre  TEXT NOT NULL                -- NOT NULL = es obligatorio, no puede quedar vacío
);

-- ---------------------------------------------------------------------------
-- 2) subcategorias: cada categoría tiene varias (Dolor de cabeza, Fiebre...).
--    Un mismo slug puede repetirse en categorías distintas (p. ej. 'ojos'),
--    por eso el id es un número automático y lo único es la pareja (categoria_id, slug).
-- ---------------------------------------------------------------------------
CREATE TABLE subcategorias (
    id            SERIAL PRIMARY KEY,    -- SERIAL = número que sube solo: 1, 2, 3...
    categoria_id  TEXT NOT NULL REFERENCES categorias(id),  -- REFERENCES = debe existir en "categorias"
    slug          TEXT NOT NULL,
    nombre        TEXT NOT NULL,
    UNIQUE (categoria_id, slug)          -- UNIQUE = no se permite repetir esta combinación
);

-- ---------------------------------------------------------------------------
-- 3) farmacias: las tiendas donde se vende.
-- ---------------------------------------------------------------------------
CREATE TABLE farmacias (
    id         SERIAL PRIMARY KEY,
    nombre     TEXT NOT NULL,
    direccion  TEXT NOT NULL,
    ciudad     TEXT NOT NULL,
    telefono   TEXT
);

-- ---------------------------------------------------------------------------
-- 4) medicamentos: el catálogo general. Aquí NO van precio ni stock,
--    porque cambian según la farmacia (eso va en "inventario").
-- ---------------------------------------------------------------------------
CREATE TABLE medicamentos (
    id                SERIAL PRIMARY KEY,
    nombre            TEXT NOT NULL,
    marca             TEXT NOT NULL,
    principio_activo  TEXT NOT NULL,
    presentacion      TEXT NOT NULL,
    requiere_receta   BOOLEAN NOT NULL DEFAULT FALSE,   -- BOOLEAN = verdadero/falso
    imagen            TEXT,                              -- ruta de la foto; puede quedar vacía
    categoria_id      TEXT NOT NULL REFERENCES categorias(id)
);

-- ---------------------------------------------------------------------------
-- 5) inventario: "qué medicamento hay en qué farmacia, a qué precio y cuántas unidades".
--    Une farmacias con medicamentos (relación de muchos a muchos).
--    La clave primaria es la pareja (farmacia, medicamento): no puede haber dos filas iguales.
-- ---------------------------------------------------------------------------
CREATE TABLE inventario (
    farmacia_id      INTEGER NOT NULL REFERENCES farmacias(id),
    medicamento_id   INTEGER NOT NULL REFERENCES medicamentos(id),
    precio           NUMERIC(8,2) NOT NULL CHECK (precio >= 0),     -- NUMERIC(8,2) = dinero con 2 decimales
    precio_anterior  NUMERIC(8,2),                                   -- solo si está en oferta (si no, queda vacío)
    stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),  -- CHECK = regla: no se permite stock negativo
    PRIMARY KEY (farmacia_id, medicamento_id),
    CHECK (precio_anterior IS NULL OR precio_anterior > precio)      -- el precio de antes debe ser mayor que el actual
);
