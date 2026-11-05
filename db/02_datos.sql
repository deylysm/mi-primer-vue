-- db/02_datos.sql
-- Inserta los datos de prueba en las tablas creadas por 01_tablas.sql.
-- Son los mismos datos de src/mocks/ (categorias, farmacias y medicamentos), pasados a SQL.
-- Ejecutar DESPUÉS de 01_tablas.sql. Si lo ejecutas dos veces dará error de "clave duplicada":
-- para repetir, ejecuta primero 01_tablas.sql (recrea las tablas vacías).
-- Los precios están en soles (S/). Un precio_anterior NULL significa "sin oferta".

BEGIN;  -- todo o nada: si algo falla, no se guarda nada a medias

-- ---------------------------------------------------------------------------
-- categorias (10)
-- ---------------------------------------------------------------------------
INSERT INTO categorias (id, nombre) VALUES
    ('analgesico',       'Analgésicos'),
    ('antiinflamatorio', 'Antiinflamatorios'),
    ('antibiotico',      'Antibióticos'),
    ('antialergico',     'Antialérgicos'),
    ('gastrico',         'Gástricos'),
    ('antidiabetico',    'Antidiabéticos'),
    ('cardiovascular',   'Cardiovasculares'),
    ('respiratorio',     'Respiratorios'),
    ('vitaminas',        'Vitaminas y suplementos'),
    ('hidratacion',      'Hidratación');

-- ---------------------------------------------------------------------------
-- subcategorias (44). El id numérico se genera solo.
-- ---------------------------------------------------------------------------
INSERT INTO subcategorias (categoria_id, slug, nombre) VALUES
    ('analgesico', 'dolor-de-cabeza', 'Dolor de cabeza'),
    ('analgesico', 'dolor-muscular',  'Dolor muscular'),
    ('analgesico', 'fiebre',          'Fiebre'),
    ('analgesico', 'dolor-dental',    'Dolor dental'),
    ('analgesico', 'dolor-menstrual', 'Dolor menstrual'),

    ('antiinflamatorio', 'articulaciones',      'Articulaciones'),
    ('antiinflamatorio', 'golpes-y-torceduras', 'Golpes y torceduras'),
    ('antiinflamatorio', 'gel-y-cremas',        'Gel y cremas'),
    ('antiinflamatorio', 'uso-oral',            'Uso oral'),

    ('antibiotico', 'garganta', 'Garganta'),
    ('antibiotico', 'piel',     'Piel'),
    ('antibiotico', 'urinarias','Urinarias'),
    ('antibiotico', 'oido',     'Oído'),
    ('antibiotico', 'ojos',     'Ojos'),

    ('antialergico', 'rinitis',            'Rinitis'),
    ('antialergico', 'piel-y-picazon',     'Piel y picazón'),
    ('antialergico', 'ojos',               'Ojos'),
    ('antialergico', 'jarabes-infantiles', 'Jarabes infantiles'),

    ('gastrico', 'acidez',        'Acidez'),
    ('gastrico', 'gastritis',     'Gastritis'),
    ('gastrico', 'diarrea',       'Diarrea'),
    ('gastrico', 'estrenimiento', 'Estreñimiento'),
    ('gastrico', 'nauseas',       'Náuseas'),

    ('antidiabetico', 'control-de-glucosa', 'Control de glucosa'),
    ('antidiabetico', 'tiras-y-lancetas',   'Tiras y lancetas'),
    ('antidiabetico', 'insulinas',          'Insulinas'),
    ('antidiabetico', 'cuidado-del-pie',    'Cuidado del pie'),

    ('cardiovascular', 'presion-arterial', 'Presión arterial'),
    ('cardiovascular', 'colesterol',       'Colesterol'),
    ('cardiovascular', 'circulacion',      'Circulación'),
    ('cardiovascular', 'anticoagulantes',  'Anticoagulantes'),

    ('respiratorio', 'tos',              'Tos'),
    ('respiratorio', 'gripe-y-resfrio',  'Gripe y resfrío'),
    ('respiratorio', 'asma',             'Asma'),
    ('respiratorio', 'congestion-nasal', 'Congestión nasal'),

    ('vitaminas', 'vitamina-c',       'Vitamina C'),
    ('vitaminas', 'multivitaminicos', 'Multivitamínicos'),
    ('vitaminas', 'calcio-y-huesos',  'Calcio y huesos'),
    ('vitaminas', 'energia',          'Energía'),
    ('vitaminas', 'infantiles',       'Infantiles'),

    ('hidratacion', 'sueros-orales',           'Sueros orales'),
    ('hidratacion', 'bebidas-isotonicas',      'Bebidas isotónicas'),
    ('hidratacion', 'electrolitos',            'Electrolitos'),
    ('hidratacion', 'rehidratacion-infantil',  'Rehidratación infantil');

-- ---------------------------------------------------------------------------
-- farmacias (4). Se indica el id a mano para que coincida con farmaciaId de los mocks.
-- ---------------------------------------------------------------------------
INSERT INTO farmacias (id, nombre, direccion, ciudad, telefono) VALUES
    (1, 'Farmacia San Miguel', 'Av. La Marina 1234',   'Lima', '01 555 0101'),
    (2, 'Botica Salud Total',  'Jr. de la Unión 456',  'Lima', '01 555 0202'),
    (3, 'Farmacia Vida Sana',  'Av. Arequipa 2890',    'Lima', '01 555 0303'),
    (4, 'Botica del Pueblo',   'Av. Brasil 750',       'Lima', '01 555 0404');

-- ---------------------------------------------------------------------------
-- medicamentos (15). Mismo id que en medicamentos.mock.js.
-- ---------------------------------------------------------------------------
INSERT INTO medicamentos (id, nombre, marca, principio_activo, presentacion, requiere_receta, imagen, categoria_id) VALUES
    (1,  'Ibuprofeno 400 mg',                'Genfar',    'Ibuprofeno',                  'Caja x 20 tabletas',        FALSE, '/medicamentos/ibuprofeno-400.jpg',            'antiinflamatorio'),
    (2,  'Ácido acetilsalicílico 100 mg',    'Bayer',     'Ácido acetilsalicílico',      'Caja x 30 tabletas',        FALSE, '/medicamentos/acido-acetilsalicilico-100.jpg','cardiovascular'),
    (3,  'Paracetamol 500 mg',               'MK',        'Paracetamol',                 'Caja x 100 tabletas',       FALSE, '/medicamentos/paracetamol-500.jpg',           'analgesico'),
    (4,  'Amoxicilina 500 mg',               'Medifarma', 'Amoxicilina',                 'Caja x 21 cápsulas',        TRUE,  '/medicamentos/amoxicilina-500.jpg',           'antibiotico'),
    (5,  'Loratadina 10 mg',                 'Genfar',    'Loratadina',                  'Caja x 10 tabletas',        FALSE, '/medicamentos/loratadina-10.svg',             'antialergico'),
    (6,  'Omeprazol 20 mg',                  'MK',        'Omeprazol',                   'Caja x 14 cápsulas',        FALSE, '/medicamentos/omeprazol-20.jpg',              'gastrico'),
    (7,  'Diclofenaco 50 mg',                'Medifarma', 'Diclofenaco sódico',          'Caja x 20 grageas',         FALSE, '/medicamentos/diclofenaco-50.jpg',            'antiinflamatorio'),
    (8,  'Metformina 850 mg',                'Teva',      'Metformina',                  'Caja x 60 tabletas',        TRUE,  '/medicamentos/metformina-850.jpg',            'antidiabetico'),
    (9,  'Losartán 50 mg',                   'MK',        'Losartán potásico',           'Caja x 30 tabletas',        TRUE,  '/medicamentos/losartan-50.jpg',               'cardiovascular'),
    (10, 'Jarabe para la tos de ñandú y miel','Bayer',    'Dextrometorfano',             'Frasco 120 ml',             FALSE, '/medicamentos/jarabe-tos-nandu-miel.jpg',     'respiratorio'),
    (11, 'Vitamina C 1 g',                   'Naturvita', 'Ácido ascórbico',             'Tubo x 10 efervescentes',   FALSE, '/medicamentos/vitamina-c-1g.jpg',             'vitaminas'),
    (12, 'Salbutamol inhalador 100 mcg',     'Teva',      'Salbutamol',                  'Inhalador 200 dosis',       TRUE,  '/medicamentos/salbutamol-inhalador.jpg',      'respiratorio'),
    (13, 'Naproxeno 550 mg',                 'Genfar',    'Naproxeno sódico',            'Caja x 10 tabletas',        FALSE, '/medicamentos/naproxeno-550.jpg',             'antiinflamatorio'),
    (14, 'Suero de rehidratación oral sabor naranja','Medifarma','Sales de rehidratación oral','Sobre x 27.9 g',       FALSE, '/medicamentos/suero-oral-naranja.svg',        'hidratacion'),
    (15, 'Complejo multivitamínico y multimineral con hierro, zinc, calcio, magnesio y vitamina D3 para adultos mayores de cincuenta años',
                                              'Naturvita', 'Multivitaminas y minerales',  'Frasco x 120 tabletas recubiertas', FALSE, '/medicamentos/multivitaminico-adultos-50.jpg', 'vitaminas');

-- ---------------------------------------------------------------------------
-- inventario (33 filas): (farmacia_id, medicamento_id, precio, precio_anterior, stock)
-- ---------------------------------------------------------------------------
INSERT INTO inventario (farmacia_id, medicamento_id, precio, precio_anterior, stock) VALUES
    -- 1 Ibuprofeno
    (1, 1,  8.50, 10.00, 40),
    (2, 1,  7.90, 13.20, 12),
    (3, 1,  9.20, NULL,   3),
    (4, 1,  8.00, NULL,   0),
    -- 2 Ácido acetilsalicílico
    (1, 2,  6.00, NULL,  25),
    (3, 2,  5.50,  6.50, 18),
    -- 3 Paracetamol
    (1, 3, 12.00, NULL,  60),
    (2, 3, 10.50, 14.00, 35),
    (4, 3, 11.00, NULL,   5),
    -- 4 Amoxicilina
    (2, 4, 18.90, 24.00, 10),
    (3, 4, 20.00, NULL,   2),
    -- 5 Loratadina
    (1, 5,  4.50, NULL,  50),
    (4, 5,  4.20,  7.00, 20),
    -- 6 Omeprazol
    (2, 6,  9.90, NULL,   0),
    (3, 6, 10.50, NULL,   8),
    -- 7 Diclofenaco
    (1, 7,  7.00, NULL,   1),
    (4, 7,  6.50, 10.80, 15),
    -- 8 Metformina
    (1, 8, 15.00, NULL,  22),
    (2, 8, 14.20, NULL,   9),
    -- 9 Losartán
    (3, 9, 16.80, 21.00, 14),
    (4, 9, 17.50, NULL,   4),
    -- 10 Jarabe para la tos
    (2, 10, 13.50, NULL,  7),
    -- 11 Vitamina C
    (1, 11, 11.00, NULL, 30),
    (3, 11, 10.00, 12.50, 16),
    (4, 11, 12.50, NULL,  6),
    -- 12 Salbutamol
    (1, 12, 22.00, NULL,  0),
    (2, 12, 21.50, NULL,  0),
    -- 13 Naproxeno
    (2, 13,  9.00, NULL, 11),
    (4, 13,  8.70, 11.60, 2),
    -- 14 Suero oral
    (1, 14,  2.50, NULL, 100),
    (3, 14,  2.80, NULL,  45),
    -- 15 Multivitamínico
    (3, 15, 59.90, 99.80, 5),
    (4, 15, 62.00, NULL,  9);

-- ---------------------------------------------------------------------------
-- Como pusimos los id a mano (farmacias y medicamentos), hay que avisarle al contador
-- automático (SERIAL) dónde se quedó. Si no, el próximo INSERT sin id chocaría con el 1.
-- ---------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('farmacias', 'id'),    (SELECT MAX(id) FROM farmacias));
SELECT setval(pg_get_serial_sequence('medicamentos', 'id'), (SELECT MAX(id) FROM medicamentos));

COMMIT;  -- recién aquí se guarda todo
