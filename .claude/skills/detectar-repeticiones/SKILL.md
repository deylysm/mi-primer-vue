---
name: detectar-repeticiones
description: Detecta código duplicado, funciones repetidas y oportunidades de reutilización en frontend, estilos y backend de FarmaApp. Úsalo cuando se pida "buscar repeticiones", "código duplicado", "refactorizar", "reutilizar" o "mejorar la organización". Solo informa; no modifica archivos.
---

# Objetivo

Encontrar código repetido y proponer cómo reutilizarlo, **sin modificar nada**. El análisis lo
hace `qa` por encargo del líder.

# Áreas de análisis

- `src/views/` y `src/components/` (`admin/`, `busqueda/`, `comunes/`, `layout/`).
- `src/composables/`, `src/services/` y `src/utils/`.
- Estilos: `src/assets/*.css` **y** los bloques `<style>` de cada `.vue`.
- Backend: todos los `backend/*.py` (`main.py`, `db.py`, `seguridad.py`, `crear_admin.py`).

# Cómo buscar

1. Lee cada área y compara archivos “hermanos” (ej. `FormFarmacia` / `FormMedicamento`,
   `TablaFarmacias` / `TablaMedicamentos`, los componentes `Estado*`).
2. Usa `Grep` para patrones que se repiten (ej. `Path(ge=1, le=2147483647)`, bloques `try/except`
   iguales, el mismo `fetch`/encabezados, las mismas validaciones).
3. Compara los `<style>` entre componentes: mismos colores, espacios o clases definidos varias veces.
4. En el backend, compara las rutas CRUD (listar/crear/editar/borrar) de cada entidad.

# Regla de decisión

- **3 o más repeticiones con el mismo significado** → conviene unificar.
- **2 repeticiones** → evaluar caso por caso (puede ser mejor dejarlas).
- **Solo parecidas, con significado distinto** → no tocar.
- Nunca proponer una abstracción más difícil de entender que el código repetido.

# Restricciones

- No modificar archivos; no eliminar funcionalidades; no cambiar reglas de negocio.
- No alterar la base de datos ni tocar `.env`, credenciales, ni la lógica de login/seguridad.
- No crear abstracciones innecesarias.

# Informe (tabla)

| Archivos | Veces | Prioridad (🔴🟡🟢) | Propuesta | Riesgo | Prueba necesaria |
|----------|-------|--------------------|-----------|--------|------------------|

Debajo de la tabla, explica de forma didáctica (el usuario aprende Vue) qué es lo repetido, por
qué conviene (o no) reutilizarlo y cómo quedaría (ejemplo corto).

# Flujo

`qa` analiza → el usuario aprueba cada punto → `desarrollador` aplica solo lo aprobado →
`qa` verifica con la skill `evidencias-pr`. **Esperar aprobación antes de aplicar cambios.**
