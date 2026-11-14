---
status: draft
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - CLAUDE.md
  - backend/main.py
  - db/01_tablas.sql
  - src/composables/useCarrito.js
  - src/views/CarritoView.vue
  - src/router/index.js
  - package.json
  - scripts/bmad-a-jira.mjs
---

# mi-primer-vue (FarmaApp) - Desglose de épicas

## Resumen

Este documento descompone en historias implementables los requisitos de tres carencias de FarmaApp elegidas por Deylu: (1) finalizar la compra, (2) gestionar el inventario desde el panel admin y (4) tests automáticos.

No existe PRD, documento de arquitectura ni de UX en el proyecto. Los requisitos se derivan del código actual del repositorio y de las tres carencias elegidas.

## Inventario de requisitos

### Requisitos funcionales

**Carencia 1: Finalizar la compra**

- FR1: El cliente **con sesión iniciada** puede finalizar la compra desde el carrito, lo que crea un pedido (reserva para recoger en farmacia, **sin pago real ni pasarela de pago**). Si no tiene sesión, se le lleva al login y después vuelve al carrito sin perder sus productos.
- FR1b: Un mismo pedido puede incluir productos de **varias farmacias**. Cada línea del pedido guarda la farmacia de la que se reserva, y el resumen agrupa las líneas por farmacia para saber dónde recoger cada una.
- FR2: El sistema valida en el servidor que hay stock suficiente de cada producto al confirmar, y rechaza el pedido con un mensaje claro si no lo hay.
- FR3: Al confirmar el pedido, el sistema descuenta el stock del inventario de la farmacia de cada línea, de forma atómica: o se reservan todas las líneas, o no se reserva ninguna.
- FR4: El cliente ve una pantalla de confirmación con el resumen y el número del pedido, y el carrito se vacía.
- FR5: El cliente con sesión iniciada puede ver su historial de pedidos y el detalle de cada uno.
- FR6: El administrador puede ver los pedidos (con filtro por farmacia, ya que un pedido puede tocar varias) y cambiar su estado (pendiente, listo, entregado, cancelado). El estado y el detalle son **por compra**: un único estado para todos los productos del pedido, sin importar de qué farmacia sean.
- FR7: Si un pedido se cancela, el stock reservado se devuelve al inventario.

**Carencia 2: Gestión de inventario (admin)**

- FR8: El administrador puede ver el inventario por farmacia (medicamento, stock, precio).
- FR9: El administrador puede ajustar el stock de un medicamento en una farmacia sin editar todo el formulario del medicamento.
- FR10: El sistema guarda un historial de movimientos de stock (ajuste manual, venta, cancelación), con fecha y usuario.
- FR11: El administrador puede filtrar el inventario por farmacia, stock bajo y agotado.
- FR12: El panel muestra alertas de stock bajo según un umbral configurable.

**Carencia 4: Tests automáticos**

- FR13: Existe un comando `npm test` que ejecuta los tests unitarios del frontend (`src/utils`, `src/composables`).
- FR14: Hay tests de componentes Vue clave (carrito, buscador, login).
- FR15: Hay tests del backend FastAPI: login, permisos de admin, validaciones de entrada y rutas de medicamentos y pedidos.
- FR16: Hay tests de extremo a extremo de los flujos críticos (buscar, agregar al carrito, login, panel admin, compra).
- FR17: Los tests se ejecutan automáticamente en cada Pull Request (integración continua).

### Requisitos no funcionales

- NFR1 (seguridad): las rutas nuevas de administración usan `exigir_admin`; los modelos de entrada usan `extra="forbid"`.
- NFR2 (integridad): el stock nunca puede ser negativo (ya existe `CHECK stock >= 0`); el descuento de stock debe ser seguro ante compras simultáneas.
- NFR3 (dinero): los importes se manejan con `Decimal` en el backend, nunca con `float`.
- NFR4 (privacidad): nunca se escriben contraseñas ni tokens en archivos del repo, informes ni capturas.
- NFR5 (aislamiento de pruebas): los tests nunca tocan la base de datos real; usan una base de datos de prueba.
- NFR6 (accesibilidad y móvil): las pantallas nuevas son adaptables a móviles y accesibles (WCAG).
- NFR7 (idioma): textos de interfaz y mensajes de error en español.

### Requisitos adicionales

- AR1: Hace falta un script SQL nuevo en `db/` (por ejemplo `04_pedidos.sql`) con las tablas `pedidos` (cliente, estado, fecha), `pedido_items` (pedido, medicamento, **farmacia**, cantidad, precio) y `movimientos_stock`. La farmacia va en cada línea, no en el pedido. No se modifican los scripts existentes.
- AR2: Las rutas nuevas se añaden a `backend/main.py`, siguiendo el estilo de las existentes.
- AR3: Instalar herramientas de test (por ejemplo Vitest, Pytest, Playwright) requiere la autorización explícita de Deylu, según las reglas del proyecto.
- AR4: `useCarrito.js` conserva el carrito en `localStorage` (`farmaapp-carrito`); el tope por stock del cliente es solo orientativo y la validación real es la del servidor.
- AR5: `/medicamentos` no tiene paginación; la vista de inventario debe tenerlo en cuenta.
- AR6: El formato de `epics.md` debe ser compatible con `scripts/bmad-a-jira.mjs` (encabezados `## Epic N:` y `### Story N.M:`, `**Acceptance Criteria:**`).
- AR7: BMAD solo planifica: no se implementa código ni se sube nada a Jira en este flujo.

### Requisitos de diseño UX

No existe documento de UX. Se asumen estos principios a partir del código actual:

- UX-DR1: Mantener el estilo visual actual (`farmaapp.css`, `admin.css`).
- UX-DR2: El botón "Finalizar compra" (hoy deshabilitado en `CarritoView.vue`) pasa a ser funcional y comunica sus estados (cargando, error, éxito).

### Mapa de cobertura de FR

FR1: Epic 2 - Reserva con sesión y sin pago desde el carrito
FR1b: Epic 2 - Un pedido puede mezclar productos de varias farmacias
FR2: Epic 2 - Validar el stock real en el servidor al confirmar
FR3: Epic 2 - Descontar el stock de forma atómica (todo o nada)
FR4: Epic 2 - Pantalla de confirmación con número de pedido y carrito vacío
FR5: Epic 3 - Historial y detalle de pedidos para el cliente
FR6: Epic 3 - Pedidos para el admin con filtro por farmacia y un estado por compra
FR7: Epic 3 - Devolver el stock al cancelar un pedido
FR8: Epic 1 - Ver el inventario por farmacia
FR9: Epic 1 - Ajuste rápido de stock sin abrir el formulario del medicamento
FR10: Epic 1 - Historial de movimientos de stock
FR11: Epic 1 - Filtros por farmacia, stock bajo y agotado
FR12: Epic 1 - Alertas de stock bajo con umbral configurable
FR13: Epic 4 - Comando `npm test` con tests unitarios del frontend
FR14: Epic 4 - Tests de componentes Vue clave
FR15: Epic 4 - Tests del backend FastAPI
FR16: Epic 4 - Tests de extremo a extremo de los flujos críticos
FR17: Epic 4 - Tests automáticos en cada Pull Request

## Lista de épicas

### Epic 1: Inventario administrable por farmacia

El administrador ve y corrige el stock de cada farmacia sin abrir el formulario completo del medicamento, y se entera de qué productos se están agotando.

**FRs cubiertos:** FR8, FR9, FR10, FR11, FR12

**Notas de dependencia:** Es independiente. Crea la tabla `movimientos_stock`, que luego usan las reservas (Epic 2) y las cancelaciones (Epic 3).

### Epic 2: Reservar productos desde el carrito

El cliente con sesión iniciada confirma su carrito y obtiene una reserva con número de pedido. El pedido puede mezclar productos de varias farmacias y el stock se descuenta de forma atómica, sin pago real.

**FRs cubiertos:** FR1, FR1b, FR2, FR3, FR4

**Notas de dependencia:** Usa `movimientos_stock` de la Epic 1 para registrar las ventas. Entrega valor por sí sola, sin las épicas 3 y 4.

### Epic 3: Seguimiento de pedidos

El cliente consulta su historial y el detalle de cada compra. El administrador gestiona los pedidos (un único estado por compra, filtro por farmacia) y, si cancela uno, el stock vuelve al inventario.

**FRs cubiertos:** FR5, FR6, FR7

**Notas de dependencia:** Necesita los pedidos de la Epic 2 y el registro de movimientos de la Epic 1.

### Epic 4: Confianza al cambiar el código (tests automáticos)

El equipo puede modificar FarmaApp sabiendo que las pruebas avisan si algo se rompe, y cada Pull Request las ejecuta automáticamente.

**FRs cubiertos:** FR13, FR14, FR15, FR16, FR17

**Notas de dependencia:** No depende de otras épicas. Se recomienda hacer su primera historia (preparar las herramientas de test) antes de la Epic 2. Instalar Vitest, Pytest o Playwright requiere la autorización explícita de Deylu (AR3).

---

## Epic 1: Inventario administrable por farmacia

El administrador ve y corrige el stock de cada farmacia sin abrir el formulario completo del medicamento, y se entera de qué productos se están agotando.

### Story 1.1: Ver el inventario por farmacia

Como administrador de FarmaApp, quiero ver en el panel el inventario de cada farmacia (medicamento, stock y precio), para saber cuánto stock hay sin abrir los medicamentos uno por uno.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR8, NFR1, NFR6, NFR7, AR5

**Criterios de aceptación:**

**Dado** que soy administrador con sesión iniciada, **cuando** abro la sección "Inventario" del panel, **entonces** veo una tabla con medicamento, farmacia, stock y precio de cada registro.

**Dado** que hay muchos registros, **cuando** se carga la pantalla, **entonces** se muestran por páginas y puedo pasar de una a otra.

**Dado** que no tengo sesión o no soy administrador, **cuando** intento abrir la pantalla o llamar al endpoint, **entonces** se me niega el acceso y no se muestran datos.

**Dado** que todavía no hay inventario, **cuando** abro la pantalla, **entonces** veo el mensaje "Aún no hay inventario registrado".

**Dado** que falla la carga de datos, **cuando** ocurre el error, **entonces** veo un mensaje en español y un botón para reintentar.

**Dado** que uso un celular de 360 px de ancho, **cuando** abro la pantalla, **entonces** la página no tiene scroll horizontal y el texto se lee bien.

### Story 1.2: Filtrar el inventario

Como administrador de FarmaApp, quiero filtrar el inventario por farmacia, por agotados y por stock bajo, para encontrar rápido qué productos necesitan reposición.

**Prioridad:** Alta · **Estimación:** 3 puntos · **Requisitos:** FR11, NFR6, NFR7

**Criterios de aceptación:**

**Dado** que estoy en la pantalla de inventario, **cuando** elijo una farmacia en el filtro, **entonces** la tabla muestra solo los registros de esa farmacia.

**Dado** que estoy en la pantalla de inventario, **cuando** activo "Agotados", **entonces** veo solo los registros con stock igual a 0.

**Dado** que estoy en la pantalla de inventario, **cuando** activo "Stock bajo", **entonces** veo solo los registros con stock mayor que 0 y menor o igual a 5 (umbral fijo por ahora; la historia 1.5 lo vuelve configurable).

**Dado** que combino varios filtros, **cuando** se aplican, **entonces** la tabla muestra solo los registros que cumplen todos.

**Dado** que ningún registro cumple los filtros, **cuando** se aplican, **entonces** veo "No hay resultados con estos filtros" y un botón "Limpiar filtros".

**Dado** que hay filtros activos, **cuando** pulso "Limpiar filtros", **entonces** vuelve a verse todo el inventario.

**Dado** que uso un celular de 360 px de ancho, **cuando** uso los filtros, **entonces** se ven y se pueden usar sin scroll horizontal.

### Story 1.3: Ajustar el stock rápidamente

Como administrador de FarmaApp, quiero corregir el stock de un medicamento en una farmacia directamente desde la tabla de inventario, para no tener que abrir el formulario completo del medicamento cada vez.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR9, NFR1, NFR2, NFR6, NFR7

**Alcance:** esta historia no guarda historial; la historia 1.4 crea `movimientos_stock` y amplía esta misma ruta para registrar quién y cuándo ajustó. El ajuste se hace con el valor absoluto (el stock nuevo), no con sumas y restas.

**Criterios de aceptación:**

**Dado** que estoy en la pantalla de inventario, **cuando** pulso "Ajustar" en un registro, **entonces** puedo escribir el nuevo valor de stock de ese medicamento en esa farmacia (en la misma fila o en una ventana pequeña), sin salir de la pantalla.

**Dado** que escribo un stock válido (entero igual o mayor que 0), **cuando** confirmo, **entonces** el stock se guarda y la fila muestra el valor nuevo sin recargar la página.

**Dado** que escribo un valor negativo, decimal o vacío, **cuando** intento confirmar, **entonces** veo el mensaje "Ingresa un número entero igual o mayor que 0" y no se guarda nada; el servidor también rechaza el valor (modelo de entrada con `extra="forbid"`).

**Dado** que cancelo el ajuste (botón "Cancelar" o tecla Esc), **cuando** vuelvo a la tabla, **entonces** el stock sigue como estaba.

**Dado** que falla el guardado (red o servidor), **cuando** ocurre el error, **entonces** veo un mensaje en español, el valor anterior se conserva y puedo reintentar.

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a la ruta de ajuste, **entonces** se me niega el acceso (`exigir_admin`) y el stock no cambia.

**Dado** que el registro de inventario ya no existe, **cuando** intento ajustarlo, **entonces** veo "Este registro ya no existe" y la tabla se refresca.

**Dado** que uso un celular de 360 px de ancho, **cuando** ajusto el stock, **entonces** el control se ve y se usa sin scroll horizontal, y se puede manejar con teclado y lector de pantalla (campo con etiqueta accesible).

### Story 1.4: Historial de movimientos de stock

Como administrador de FarmaApp, quiero que cada ajuste de stock quede registrado con su fecha, su autor y el cambio realizado, para saber quién tocó el inventario y poder revisar cualquier corrección.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR10, NFR1, NFR2, NFR6, NFR7, AR1

**Alcance:** esta historia crea la tabla `movimientos_stock` en un script SQL nuevo en `db/` (por ejemplo `04_movimientos_stock.sql`; no se modifican los scripts existentes) y amplía la ruta de ajuste de la historia 1.3 para que registre cada cambio. Los tipos "venta" y "cancelación" los usarán las épicas 2 y 3; aquí solo se registra el tipo "ajuste manual". El historial se consulta por registro (farmacia + medicamento); un historial global queda fuera de alcance.

**Criterios de aceptación:**

**Dado** que ajusto el stock de un registro (historia 1.3), **cuando** el cambio se guarda, **entonces** se crea un movimiento con farmacia, medicamento, stock anterior, stock nuevo, tipo "ajuste manual", fecha y hora, y el administrador que lo hizo.

**Dado** que el ajuste y el registro del movimiento forman una sola operación, **cuando** falla cualquiera de los dos, **entonces** no se guarda ninguno: el stock y el historial nunca quedan desincronizados.

**Dado** que ajusto el stock a un valor igual al actual, **cuando** confirmo, **entonces** no se crea ningún movimiento.

**Dado** que estoy en la pantalla de inventario, **cuando** abro el historial de un registro (botón "Ver historial"), **entonces** veo sus movimientos del más reciente al más antiguo, con fecha, usuario, stock anterior, stock nuevo y la diferencia (por ejemplo +10 o −3).

**Dado** que un registro todavía no tiene movimientos, **cuando** abro su historial, **entonces** veo "Aún no hay movimientos para este producto".

**Dado** que un registro tiene muchos movimientos, **cuando** abro su historial, **entonces** se muestran por páginas.

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a la ruta del historial, **entonces** se me niega el acceso y no se muestran datos (`exigir_admin`).

**Dado** que el historial no se puede editar ni borrar desde la aplicación, **cuando** reviso las rutas disponibles, **entonces** solo existen las de crear (al ajustar) y consultar movimientos.

**Dado** que uso un celular de 360 px de ancho, **cuando** abro el historial, **entonces** se lee sin scroll horizontal.

### Story 1.5: Alertas de stock bajo con umbral configurable

Como administrador de FarmaApp, quiero ver un aviso cuando hay productos con poco stock y poder cambiar a partir de cuántas unidades se considera "stock bajo", para reponer a tiempo sin revisar la tabla entera.

**Prioridad:** Media · **Estimación:** 5 puntos · **Requisitos:** FR11, FR12, NFR1, NFR6, NFR7

**Alcance:** el umbral es **uno solo para todo el sistema** (no uno por farmacia ni por medicamento), se guarda en la base de datos y vale 5 hasta que se configure. Reemplaza el umbral fijo de la historia 1.2. Se necesita un script SQL nuevo en `db/` para guardar esa configuración.

**Criterios de aceptación:**

**Dado** que soy administrador y hay registros con stock bajo o agotado, **cuando** abro el panel, **entonces** veo un aviso con cuántos productos están agotados y cuántos tienen stock bajo.

**Dado** que veo el aviso, **cuando** pulso "Ver productos con stock bajo", **entonces** voy al inventario con el filtro "Stock bajo" ya aplicado.

**Dado** que estoy en la configuración de alertas, **cuando** escribo un umbral entero entre 1 y 999 y guardo, **entonces** el nuevo umbral se guarda y el aviso y el filtro "Stock bajo" lo usan de inmediato.

**Dado** que escribo un umbral inválido (vacío, 0, negativo, decimal o mayor que 999), **cuando** intento guardar, **entonces** veo un mensaje en español y no se guarda nada; el servidor también lo rechaza (`extra="forbid"`).

**Dado** que nunca se configuró el umbral, **cuando** abro el panel, **entonces** se usa el valor por defecto 5.

**Dado** que ningún producto está bajo el umbral, **cuando** abro el panel, **entonces** veo "Todo el inventario está por encima del umbral" en lugar de una alerta.

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a las rutas de alertas o de configuración, **entonces** se me niega el acceso (`exigir_admin`).

**Dado** que el aviso comunica urgencia, **cuando** lo veo, **entonces** el estado se entiende por texto o icono y no solo por color, y se lee bien en un celular de 360 px sin scroll horizontal.

## Epic 2: Reservar productos desde el carrito

El cliente con sesión iniciada confirma su carrito y obtiene una reserva con número de pedido. El pedido puede mezclar productos de varias farmacias y el stock se descuenta de forma atómica, sin pago real.

### Story 2.1: Crear el pedido en el servidor

Como cliente de FarmaApp, quiero que mi carrito se convierta en un pedido guardado en el servidor, para tener una reserva con número que la farmacia pueda atender.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR1, FR1b, NFR1, NFR3, NFR7, AR1, AR2

**Alcance:** crea las tablas `pedidos` (cliente, estado, fecha) y `pedido_items` (pedido, medicamento, **farmacia**, cantidad, precio) en un script SQL nuevo en `db/` (por ejemplo `05_pedidos.sql`) y la ruta `POST /pedidos` en `backend/main.py`. Esta historia todavía **no valida ni descuenta stock** (lo hace la 2.2), por lo que no debe publicarse a clientes reales sin la 2.2.

**Criterios de aceptación:**

**Dado** que soy cliente con sesión y envío un carrito válido (líneas con medicamento, farmacia y cantidad), **cuando** llamo a `POST /pedidos`, **entonces** se crea un pedido en estado "pendiente", con mi usuario y la fecha, y recibo su número.

**Dado** que el carrito mezcla productos de varias farmacias, **cuando** se crea el pedido, **entonces** cada línea guarda su propia farmacia y todas pertenecen a un único pedido.

**Dado** que el navegador no es de fiar, **cuando** se crea el pedido, **entonces** el servidor no acepta precios del cliente: toma el precio actual del inventario, lo guarda en cada línea y calcula los importes con `Decimal`.

**Dado** que envío datos inválidos (carrito vacío, cantidad 0, negativa o decimal, medicamento o farmacia inexistente, producto que esa farmacia no tiene, campos desconocidos), **cuando** llamo a la ruta, **entonces** recibo un error con mensaje en español y no se crea nada (`extra="forbid"`).

**Dado** que no tengo sesión o mi token no es válido, **cuando** llamo a la ruta, **entonces** recibo 401 y no se crea nada.

**Dado** que falla la creación de cualquier línea, **cuando** ocurre el error, **entonces** no queda ningún pedido a medias (todo en una sola transacción).

### Story 2.2: Validar y descontar el stock al confirmar

Como cliente de FarmaApp, quiero que al confirmar mi pedido se compruebe que hay stock y se reserve, para no recibir una reserva de algo que ya no existe.

**Prioridad:** Alta · **Estimación:** 8 puntos · **Requisitos:** FR2, FR3, NFR2, NFR7

**Alcance:** amplía `POST /pedidos` de la historia 2.1. Registra cada reserva como movimiento de tipo "venta" en `movimientos_stock` (historia 1.4). El stock del carrito en el navegador es solo orientativo (AR4); la validación real es la del servidor.

**Criterios de aceptación:**

**Dado** que hay stock suficiente en todas las líneas, **cuando** confirmo el pedido, **entonces** el stock de cada farmacia baja en la cantidad pedida y el pedido se crea.

**Dado** que una línea pide más unidades de las que hay, **cuando** confirmo, **entonces** recibo un error 409 con un mensaje claro (producto, farmacia y stock disponible), y no se descuenta nada ni se crea el pedido.

**Dado** que el pedido tiene varias líneas, **cuando** falla el descuento de cualquiera, **entonces** ninguna línea queda reservada: o se reserva todo o nada.

**Dado** que dos clientes compran a la vez la última unidad, **cuando** ambas peticiones llegan juntas, **entonces** solo una tiene éxito y el stock nunca queda negativo (se bloquean las filas de inventario durante la operación).

**Dado** que el mismo producto de la misma farmacia aparece dos veces en el pedido, **cuando** se valida, **entonces** las cantidades se suman antes de comprobar el stock.

**Dado** que pido exactamente el stock disponible, **cuando** confirmo, **entonces** el pedido se acepta y el stock queda en 0.

**Dado** que se reserva una línea, **cuando** el pedido se crea, **entonces** se registra un movimiento "venta" con stock anterior, stock nuevo, cliente y número de pedido.

### Story 2.3: Finalizar la compra desde el carrito

Como cliente con sesión iniciada, quiero pulsar "Finalizar compra" en mi carrito y ver qué está pasando, para reservar mis productos con confianza.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR1, FR4, UX-DR1, UX-DR2, NFR6, NFR7

**Alcance:** el botón "Finalizar compra" de `CarritoView.vue` hoy está deshabilitado y pasa a ser funcional. Solo se envían medicamento, farmacia y cantidad de cada línea (nunca precios). La pantalla de confirmación es la historia 2.5 y el caso sin sesión es la 2.4.

**Criterios de aceptación:**

**Dado** que tengo sesión y productos en el carrito, **cuando** abro el carrito, **entonces** el botón "Finalizar compra" está activo; con el carrito vacío está deshabilitado.

**Dado** que pulso "Finalizar compra", **cuando** se envía el pedido, **entonces** el botón muestra "Procesando…" y se deshabilita para evitar pedidos duplicados por doble clic.

**Dado** que el servidor responde que no hay stock suficiente, **cuando** vuelve la respuesta, **entonces** veo un mensaje en español con los productos afectados, el carrito se conserva y puedo ajustar las cantidades.

**Dado** que falla la red o el servidor, **cuando** ocurre el error, **entonces** veo un mensaje en español, el botón vuelve a estar activo y el carrito queda intacto.

**Dado** que el pedido se creó con éxito, **cuando** el servidor lo confirma, **entonces** voy a la pantalla de confirmación y solo entonces se vacía el carrito.

**Dado** que uso un celular de 360 px de ancho o solo el teclado, **cuando** uso el botón y sus mensajes, **entonces** se ven y se usan sin scroll horizontal, y los estados (cargando, error, éxito) se anuncian a lectores de pantalla (`aria-live`).

### Story 2.4: Iniciar sesión al finalizar y volver al carrito

Como cliente sin sesión, quiero que al finalizar la compra se me pida iniciar sesión y luego volver a mi carrito, para no perder los productos que elegí.

**Prioridad:** Alta · **Estimación:** 3 puntos · **Requisitos:** FR1, NFR6, NFR7

**Criterios de aceptación:**

**Dado** que no tengo sesión y hay productos en mi carrito, **cuando** pulso "Finalizar compra", **entonces** voy al login con el aviso "Inicia sesión para finalizar tu compra".

**Dado** que inicio sesión correctamente desde ese aviso, **cuando** el login termina, **entonces** vuelvo automáticamente al carrito con los mismos productos y cantidades.

**Dado** que salgo del login sin iniciar sesión, **cuando** vuelvo al carrito, **entonces** mis productos siguen ahí.

**Dado** que mi sesión expira mientras confirmo (respuesta 401), **cuando** ocurre, **entonces** voy al login y, tras entrar, vuelvo al carrito sin perder nada.

**Dado** que ya tengo sesión, **cuando** pulso "Finalizar compra", **entonces** no paso por el login.

**Dado** que la dirección de retorno se guarda en la URL, **cuando** se usa tras el login, **entonces** solo se aceptan rutas internas de la aplicación (nunca una dirección externa).

**Dado** que uso un celular de 360 px de ancho, **cuando** paso por el login y regreso, **entonces** el flujo se ve y se usa sin scroll horizontal.

### Story 2.5: Pantalla de confirmación del pedido

Como cliente que acaba de reservar, quiero ver el resumen de mi pedido con su número y dónde recoger cada producto, para saber qué hacer a continuación.

**Prioridad:** Alta · **Estimación:** 3 puntos · **Requisitos:** FR1b, FR4, UX-DR1, NFR6, NFR7

**Criterios de aceptación:**

**Dado** que mi pedido se creó, **cuando** llego a la confirmación, **entonces** veo el número de pedido, la fecha y el estado "Pendiente".

**Dado** que el pedido incluye varias farmacias, **cuando** veo el resumen, **entonces** las líneas aparecen agrupadas por farmacia, con medicamento, cantidad, precio, subtotal por farmacia y total general.

**Dado** que la compra es una reserva, **cuando** veo la pantalla, **entonces** un texto aclara que se recoge en la farmacia y que no se paga en línea.

**Dado** que acabo de confirmar, **cuando** salgo de la pantalla, **entonces** el carrito está vacío.

**Dado** que recargo la página de confirmación o entro sin un pedido reciente, **cuando** se carga, **entonces** no se crea ningún pedido nuevo y veo un enlace para volver al buscador.

**Dado** que uso un celular de 360 px de ancho o lector de pantalla, **cuando** llego a la pantalla, **entonces** se lee sin scroll horizontal y el foco se coloca en el título de confirmación.

## Epic 3: Seguimiento de pedidos

El cliente consulta su historial y el detalle de cada compra. El administrador gestiona los pedidos (un único estado por compra, filtro por farmacia) y, si cancela uno, el stock vuelve al inventario.

### Story 3.1: Ver mi historial de pedidos

Como cliente con sesión iniciada, quiero ver la lista de mis pedidos, para saber qué reservé y en qué estado está cada uno.

**Prioridad:** Media · **Estimación:** 3 puntos · **Requisitos:** FR5, NFR6, NFR7

**Criterios de aceptación:**

**Dado** que tengo sesión, **cuando** abro "Mis pedidos", **entonces** veo mis pedidos del más reciente al más antiguo, con número, fecha, estado y total.

**Dado** que otros clientes tienen pedidos, **cuando** abro la lista, **entonces** solo veo los míos.

**Dado** que todavía no hice pedidos, **cuando** abro la lista, **entonces** veo "Aún no tienes pedidos" y un enlace al buscador.

**Dado** que no tengo sesión, **cuando** intento abrir "Mis pedidos", **entonces** voy al login y, tras entrar, vuelvo a la lista.

**Dado** que tengo muchos pedidos, **cuando** abro la lista, **entonces** se muestran por páginas.

**Dado** que falla la carga, **cuando** ocurre el error, **entonces** veo un mensaje en español y un botón para reintentar.

**Dado** que uso un celular de 360 px de ancho, **cuando** abro la lista, **entonces** se lee sin scroll horizontal.

### Story 3.2: Ver el detalle de mi pedido

Como cliente con sesión iniciada, quiero abrir un pedido y ver todo su detalle, para saber qué recoger y en qué farmacia.

**Prioridad:** Media · **Estimación:** 3 puntos · **Requisitos:** FR1b, FR5, NFR6, NFR7

**Criterios de aceptación:**

**Dado** que estoy en mi lista de pedidos, **cuando** abro uno, **entonces** veo número, fecha, estado y las líneas agrupadas por farmacia, con subtotal por farmacia y total.

**Dado** que el precio de un medicamento cambió después de mi compra, **cuando** abro el pedido, **entonces** veo los precios de cuando compré.

**Dado** que intento abrir un pedido de otro cliente o uno que no existe, **cuando** llamo a la ruta, **entonces** recibo "Pedido no encontrado" en ambos casos, sin revelar si existe.

**Dado** que el pedido tiene un estado, **cuando** lo veo, **entonces** el estado se entiende por texto y no solo por color.

**Dado** que el pedido está cancelado, **cuando** lo abro, **entonces** veo claramente "Este pedido fue cancelado".

**Dado** que uso un celular de 360 px de ancho, **cuando** abro el detalle, **entonces** se lee sin scroll horizontal y puedo volver a la lista.

### Story 3.3: Ver y filtrar pedidos como administrador

Como administrador de FarmaApp, quiero ver los pedidos y filtrarlos por farmacia y estado, para saber qué tengo que preparar en cada farmacia.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR1b, FR6, NFR1, NFR6, NFR7

**Alcance:** el estado es **uno por pedido**, aunque este incluya varias farmacias. Filtrar por farmacia muestra los pedidos que tienen al menos una línea de esa farmacia, y cada pedido se ve completo.

**Criterios de aceptación:**

**Dado** que soy administrador, **cuando** abro la sección "Pedidos" del panel, **entonces** veo una tabla con número, cliente, fecha, estado, total y las farmacias implicadas.

**Dado** que elijo una farmacia en el filtro, **cuando** se aplica, **entonces** veo solo los pedidos con al menos una línea de esa farmacia.

**Dado** que elijo un estado, **cuando** se aplica, **entonces** veo solo los pedidos en ese estado; si combino farmacia y estado, se cumplen ambos.

**Dado** que abro un pedido desde la lista, **cuando** se muestra el detalle, **entonces** veo sus líneas agrupadas por farmacia.

**Dado** que hay muchos pedidos, **cuando** abro la sección, **entonces** se muestran por páginas.

**Dado** que ningún pedido cumple los filtros, **cuando** se aplican, **entonces** veo "No hay pedidos con estos filtros" y un botón "Limpiar filtros".

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a las rutas de pedidos de administración, **entonces** se me niega el acceso (`exigir_admin`).

**Dado** que uso un celular de 360 px de ancho, **cuando** uso la lista y los filtros, **entonces** se ven sin scroll horizontal.

### Story 3.4: Cambiar el estado de un pedido

Como administrador de FarmaApp, quiero marcar un pedido como listo o entregado, para que el cliente sepa cuándo recoger y quede constancia de la entrega.

**Prioridad:** Alta · **Estimación:** 3 puntos · **Requisitos:** FR6, NFR1, NFR7

**Alcance:** transiciones permitidas: pendiente → listo → entregado. "Entregado" es final. La cancelación y la devolución del stock son la historia 3.5.

**Criterios de aceptación:**

**Dado** que un pedido está "pendiente", **cuando** pulso "Marcar como listo", **entonces** pasa a "listo" y la tabla lo muestra sin recargar la página.

**Dado** que un pedido está "listo", **cuando** pulso "Marcar como entregado", **entonces** pasa a "entregado" y ya no ofrece más acciones.

**Dado** que intento una transición no permitida (por ejemplo, de "entregado" a "pendiente", o saltar de "pendiente" a "entregado"), **cuando** llamo a la ruta, **entonces** recibo un error 409 con mensaje en español y el estado no cambia.

**Dado** que otro administrador cambió el estado mientras yo tenía la pantalla abierta, **cuando** intento cambiarlo, **entonces** veo "El pedido ya cambió de estado" y la pantalla se refresca.

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a la ruta, **entonces** se me niega el acceso (`exigir_admin`); el modelo de entrada usa `extra="forbid"`.

**Dado** que el estado cambió, **cuando** el cliente abre su pedido (historia 3.2), **entonces** ve el estado nuevo.

### Story 3.5: Cancelar un pedido y devolver el stock

Como administrador de FarmaApp, quiero cancelar un pedido y que el stock reservado vuelva al inventario, para que esos productos puedan reservarse de nuevo.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR7, NFR1, NFR2, NFR7

**Alcance:** solo se cancelan pedidos "pendiente" o "listo". Cada devolución se registra como movimiento "cancelación" en `movimientos_stock` (historia 1.4).

**Criterios de aceptación:**

**Dado** que un pedido está "pendiente" o "listo", **cuando** pulso "Cancelar pedido", **entonces** se me pide confirmar y se me avisa de que el stock volverá al inventario.

**Dado** que confirmo la cancelación, **cuando** se procesa, **entonces** el pedido pasa a "cancelado" y el stock de cada línea vuelve a su farmacia, todo en una sola operación atómica.

**Dado** que se devuelve el stock, **cuando** termina la cancelación, **entonces** se registra por cada línea un movimiento "cancelación" con stock anterior, stock nuevo, administrador y número de pedido.

**Dado** que cancelo el mismo pedido dos veces (doble clic o dos administradores), **cuando** llega la segunda petición, **entonces** no se devuelve el stock por segunda vez y recibo un mensaje claro.

**Dado** que un pedido está "entregado" o ya "cancelado", **cuando** intento cancelarlo, **entonces** recibo un error 409 con mensaje en español y nada cambia.

**Dado** que no se puede devolver el stock de alguna línea (por ejemplo, su registro de inventario ya no existe), **cuando** cancelo, **entonces** no se cancela nada, veo el motivo y no se pierde stock en silencio.

**Dado** que no tengo sesión o no soy administrador, **cuando** llamo a la ruta, **entonces** se me niega el acceso (`exigir_admin`).

**Dado** que el pedido fue cancelado, **cuando** el cliente abre su pedido, **entonces** ve "Este pedido fue cancelado".

## Epic 4: Confianza al cambiar el código (tests automáticos)

El equipo puede modificar FarmaApp sabiendo que las pruebas avisan si algo se rompe, y cada Pull Request las ejecuta automáticamente.

### Story 4.1: Preparar las herramientas de test del frontend

Como desarrolladora de FarmaApp, quiero un comando `npm test` que ejecute tests unitarios, para comprobar en segundos que las funciones auxiliares siguen funcionando.

**Prioridad:** Alta · **Estimación:** 3 puntos · **Requisitos:** FR13, AR3

**Alcance:** instalar Vitest (u otra herramienta equivalente) **requiere la autorización explícita de Deylu** (AR3); no se instala nada sin su "sí". Incluye los primeros tests de `src/utils`.

**Criterios de aceptación:**

**Dado** que Deylu autorizó la instalación, **cuando** se agrega la herramienta como dependencia de desarrollo, **entonces** existe el script `npm test` en `package.json`.

**Dado** que ejecuto `npm test` en un proyecto limpio, **cuando** termina, **entonces** muestra los tests pasados y sale con éxito.

**Dado** que existen funciones en `src/utils` (formato de precios, stock, errores de la API), **cuando** corro los tests, **entonces** cada una tiene al menos un test con un caso normal y un caso límite.

**Dado** que cambio a propósito un valor esperado, **cuando** corro `npm test`, **entonces** el test falla y el comando termina con error (así se comprueba que los tests detectan fallos).

**Dado** que son tests unitarios, **cuando** se ejecutan, **entonces** no abren el navegador ni llaman al backend real.

**Dado** que alguien nuevo llega al proyecto, **cuando** lee la documentación, **entonces** encuentra cómo ejecutar los tests en una línea.

### Story 4.2: Tests de los composables

Como desarrolladora de FarmaApp, quiero tests de la lógica de `src/composables`, para cambiar el carrito o la sesión sin romperlos sin darme cuenta.

**Prioridad:** Media · **Estimación:** 3 puntos · **Requisitos:** FR13

**Alcance:** depende de la historia 4.1. Se prueba al menos `useCarrito` y `useSesion`; los demás composables según su complejidad.

**Criterios de aceptación:**

**Dado** que agrego al carrito un producto que ya estaba (mismo medicamento y misma farmacia), **cuando** corro el test, **entonces** las cantidades se suman sin pasar del stock.

**Dado** que cambio la cantidad o quito un producto, **cuando** corro el test, **entonces** el carrito y el total reflejan el cambio.

**Dado** que el carrito se guarda en `localStorage`, **cuando** se carga con datos rotos o inválidos, **entonces** el test comprueba que no falla y arranca vacío.

**Dado** que inicio y cierro sesión, **cuando** corro el test de `useSesion`, **entonces** el estado de sesión cambia como se espera y se limpia al salir.

**Dado** que los tests usan un `localStorage` y servicios simulados, **cuando** se ejecutan, **entonces** no dependen de la red ni de datos reales.

### Story 4.3: Tests de los componentes clave

Como desarrolladora de FarmaApp, quiero tests de las pantallas del carrito, el buscador y el login, para detectar si un cambio de interfaz rompe lo más usado.

**Prioridad:** Media · **Estimación:** 5 puntos · **Requisitos:** FR14, AR3

**Alcance:** depende de la historia 4.1. Puede requerir instalar una librería de pruebas de componentes (por ejemplo `@vue/test-utils`), lo que necesita la autorización explícita de Deylu.

**Criterios de aceptación:**

**Dado** que pruebo el carrito, **cuando** hay productos, **entonces** el test comprueba que se muestran, que cambiar la cantidad actualiza el total y que el carrito vacío muestra su mensaje.

**Dado** que pruebo el buscador, **cuando** escribo un término con un servicio simulado, **entonces** el test comprueba que aparecen los resultados y que sin coincidencias se ve el mensaje de "sin resultados".

**Dado** que pruebo el login, **cuando** envío datos vacíos, credenciales incorrectas y credenciales correctas, **entonces** el test comprueba el mensaje de error o el éxito en cada caso.

**Dado** que cada componente tiene estados de carga y de error, **cuando** corro los tests, **entonces** se cubre al menos uno de esos estados por componente.

**Dado** que los tests usan servicios simulados, **cuando** se ejecutan, **entonces** no llaman al backend real y no contienen contraseñas ni tokens reales.

### Story 4.4: Preparar los tests del backend y una base de datos de prueba

Como desarrolladora de FarmaApp, quiero poder probar el backend contra una base de datos de prueba, para comprobar la API sin arriesgar los datos reales.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR15, NFR4, NFR5, AR3

**Alcance:** instalar Pytest y el cliente de pruebas de FastAPI **requiere la autorización explícita de Deylu** (AR3). La base de datos de prueba es distinta de la real y se crea con los scripts de `db/`.

**Criterios de aceptación:**

**Dado** que Deylu autorizó la instalación, **cuando** se prepara el entorno, **entonces** existe un comando documentado (por ejemplo `pytest`) que ejecuta los tests del backend.

**Dado** que corro los tests, **cuando** se conectan a la base de datos, **entonces** usan una base de datos de prueba con un nombre distinto de la real, creada a partir de los scripts de `db/`.

**Dado** que la configuración apunta por error a la base de datos real, **cuando** intento correr los tests, **entonces** se niegan a ejecutarse y lo explican.

**Dado** que un test modifica datos, **cuando** termina, **entonces** la base de datos de prueba vuelve a su estado inicial y los tests no se afectan entre sí.

**Dado** que los tests necesitan una cuenta de administrador de prueba, **cuando** se configuran, **entonces** las credenciales vienen de variables de entorno y no aparecen en archivos del repositorio, informes ni capturas.

**Dado** que el entorno está listo, **cuando** corro un primer test de la ruta `/salud`, **entonces** pasa.

### Story 4.5: Tests del backend: login, permisos, validaciones y medicamentos

Como desarrolladora de FarmaApp, quiero tests de las rutas existentes del backend, para detectar fallos de seguridad y de validación antes de que lleguen a producción.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR15, NFR1, NFR5

**Alcance:** depende de la historia 4.4.

**Criterios de aceptación:**

**Dado** que pruebo `/login`, **cuando** envío credenciales correctas, incorrectas y datos inválidos, **entonces** recibo respectivamente un token, un error de credenciales y un error de validación.

**Dado** que pruebo las rutas de administración (crear, editar y borrar medicamentos y farmacias), **cuando** llamo sin token o con un usuario que no es administrador, **entonces** recibo 401 o 403 y no cambia ningún dato.

**Dado** que envío campos desconocidos o faltantes a una ruta con modelo de entrada, **cuando** llamo a la ruta, **entonces** se rechaza por validación (`extra="forbid"`).

**Dado** que pruebo las rutas de medicamentos, **cuando** listo, busco y abro el detalle, **entonces** las respuestas tienen la forma y los datos esperados, y un medicamento inexistente da 404.

**Dado** que pruebo crear, editar y borrar un medicamento como administrador, **cuando** termino, **entonces** el cambio se refleja en la consulta y la base de prueba queda limpia.

### Story 4.6: Tests del backend: inventario y pedidos

Como desarrolladora de FarmaApp, quiero tests de las rutas de inventario y de pedidos, para asegurar que el stock nunca se corrompe.

**Prioridad:** Alta · **Estimación:** 5 puntos · **Requisitos:** FR15, NFR2, NFR5

**Alcance:** depende de las historias 4.4, 1.3, 1.4, 2.1, 2.2, 3.4 y 3.5, que crean las rutas que se prueban. Se puede escribir por partes a medida que esas rutas existan.

**Criterios de aceptación:**

**Dado** que pruebo el ajuste de stock, **cuando** envío valores válidos e inválidos, **entonces** solo los válidos se guardan, y cada cambio crea su movimiento.

**Dado** que pruebo crear un pedido con stock suficiente, **cuando** lo confirmo, **entonces** el stock baja, el pedido queda "pendiente" y existe el movimiento "venta".

**Dado** que pruebo un pedido con stock insuficiente en una línea, **cuando** lo confirmo, **entonces** recibo 409 y ni el stock ni los pedidos cambian (todo o nada).

**Dado** que pruebo dos compras simultáneas de la última unidad, **cuando** llegan a la vez, **entonces** solo una tiene éxito y el stock no queda negativo.

**Dado** que pruebo cancelar un pedido, **cuando** se cancela una vez y se intenta otra vez, **entonces** el stock se devuelve solo la primera vez.

**Dado** que pruebo los permisos, **cuando** un cliente intenta ver pedidos ajenos o usar rutas de administración, **entonces** recibe "no encontrado" o acceso denegado.

### Story 4.7: Tests de extremo a extremo de los flujos críticos

Como desarrolladora de FarmaApp, quiero tests que recorran la aplicación como lo haría una persona, para saber que los flujos principales funcionan de punta a punta.

**Prioridad:** Media · **Estimación:** 8 puntos · **Requisitos:** FR16, NFR4, NFR5, AR3

**Alcance:** instalar Playwright (o equivalente) y sus navegadores **requiere la autorización explícita de Deylu** (AR3). Usan la base de datos de prueba de la historia 4.4 y cuentas de prueba que vienen de variables de entorno. El flujo de compra depende de la Epic 2.

**Criterios de aceptación:**

**Dado** que busco un medicamento, **cuando** ejecuto el test, **entonces** comprueba que aparecen resultados y que se puede abrir el detalle.

**Dado** que agrego un producto al carrito, **cuando** ejecuto el test, **entonces** comprueba que el carrito muestra el producto y el total correcto.

**Dado** que inicio sesión con la cuenta de prueba, **cuando** ejecuto el test, **entonces** comprueba el acceso correcto y el mensaje de error con una contraseña incorrecta.

**Dado** que entro al panel de administración con la cuenta de prueba, **cuando** ejecuto el test, **entonces** comprueba que puedo ver y ajustar el inventario.

**Dado** que finalizo una compra, **cuando** ejecuto el test, **entonces** comprueba el número de pedido, el carrito vacío y el stock descontado.

**Dado** que los tests terminan, **cuando** reviso el repositorio, **entonces** no hay contraseñas ni tokens en archivos, capturas ni informes.

### Story 4.8: Ejecutar los tests automáticamente en cada Pull Request

Como equipo de FarmaApp, queremos que cada Pull Request ejecute los tests solos, para no fusionar cambios que rompen algo.

**Prioridad:** Media · **Estimación:** 5 puntos · **Requisitos:** FR17, NFR4, NFR5

**Alcance:** usa GitHub Actions (u otra integración continua equivalente) y depende de las historias 4.1 a 4.5, como mínimo. Subir el flujo de trabajo al repositorio y abrir PRs sigue requiriendo la autorización de Deylu por tarea.

**Criterios de aceptación:**

**Dado** que se abre o se actualiza un Pull Request, **cuando** se dispara la integración continua, **entonces** se ejecutan la compilación (`npm run build`), los tests del frontend y los tests del backend.

**Dado** que algún test o la compilación falla, **cuando** termina la ejecución, **entonces** el PR muestra el estado en rojo con el motivo, y si todo pasa lo muestra en verde.

**Dado** que los tests del backend necesitan PostgreSQL, **cuando** corren en la integración continua, **entonces** usan una base de datos temporal de prueba y nunca la real.

**Dado** que las pruebas necesitan credenciales de prueba, **cuando** se configuran, **entonces** se guardan como secretos de GitHub y no aparecen en el repositorio ni en los registros.

**Dado** que la ejecución tarda más de lo razonable, **cuando** se revisa el tiempo, **entonces** se documenta cuánto dura y se aprovecha la caché de dependencias.