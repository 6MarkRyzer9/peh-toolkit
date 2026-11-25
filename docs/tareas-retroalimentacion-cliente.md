# Tareas a partir de la retroalimentación del cliente

Origen: «Retroalimentación del cliente al MVP PEH Toolkit», de Fabrizzio Fatoruzzo, fechada el 24 de noviembre de 2026 (9 páginas, puntos 2.1 a 2.7).

El cliente declaró que aprobaría el MVP tal como está: **nada de esto condiciona el Hito 3** (1 al 3 de diciembre). El equipo integra lo que alcance; lo demás queda como backlog del cliente, sin deuda para el equipo. Todo cambio aceptado se registra en el control de cambios de la ERS (§4.3.3).

## Cómo trabajar estas tareas

- Una tarea a la vez: se implementa, se prueba, se explica en palabras simples y se espera el visto bueno antes de seguir.
- Cada tarea con código trae su prueba en `tests/` y deja `node --test` en verde.
- Si una tarea agrega un archivo (JSON o JS), se suma a la lista de `service-worker.js` y se sube su `VERSION`. Si no, la app deja de funcionar sin internet.
- Se revisa a 360 px de ancho, sin desplazamiento horizontal, con botones de 44 × 44 px y el estado indicado con texto además de color.
- El diseño neumórfico no cambia (ver `CLAUDE.md`). El motor (`js/motor.js`) no se toca: ninguna propuesta lo necesita.
- Al terminar cada tarea se actualiza `PROGRESO.md` y se marca aquí como hecha.

## Resumen

| # | Tarea | Punto | Estimación | Cuándo (propuesta) | Estado |
|---|---|---|---|---|---|
| 0 | Responder al cliente y registrar los cambios | §4.3.3 | 1 h (equipo) | Ya | Pendiente |
| 1 | Micro-guía de C3 con sus dos regímenes | 2.2 | 0,5 h | Antes del 29-11 | Hecha (25-11) |
| 2 | Cierre a prueba de doble toque | 2.6 a | 0,25 h | Antes del 29-11 | Pendiente |
| 3 | Fechas con la zona horaria local | 2.6 b | 0,5 h | Antes del 29-11 | Pendiente |
| 4 | Código del evaluado generado solo | 2.4 y parte de 2.5 | 1–1,5 h | Antes del 29-11 | Pendiente |
| 5 | Textos: datos, RN7 y pausas | 2.7, 2.3 y 2.6 c | 0,75–1 h | Antes del 29-11 | Pendiente |
| 6 | Sesiones retomables con lo que les falta | 2.1, paso 7 | 0,25–0,5 h | Antes del 29-11 | Pendiente |
| 7 | Justificación opcional al marcar 0 | 2.1, pasos 4 y 6 | 1,5–2 h | Hito 3 o entrega final | Pendiente |
| 8 | «No evaluable» | 2.1, pasos 1 a 3 | 1–1,5 h | Hito 3 o entrega final | Pendiente |
| 9 | Marco de la pregunta | 2.3 | 1–1,5 h | Entrega final (10-12) | Pendiente |
| 10 | Etiqueta contextual (nueva RN8) | 2.5 | 1,5–2 h | Backlog del cliente | Pendiente |
| 11 | «Otro (escribir)» en las justificaciones | 2.1, paso 5 | 1 h | Backlog del cliente | Pendiente |

Tareas 1 a 6: unas 3,5 a 4,5 horas. Tareas 7 a 9: 3,5 a 5 horas. Las estimaciones incluyen pruebas y revisión en el navegador; por eso algunas superan las del cliente.

---

## Tarea 0 · Responder al cliente y registrar los cambios (equipo, sin código)

- Responder por escrito, punto por punto: qué entra en la 1.0 (29-11), qué entra en la entrega final (10-12), qué queda en backlog y qué ya estaba hecho (ver «Lo que ya está resuelto», al final).
- Hacerle las preguntas de «Por aclarar con el cliente», al final de este documento.
- Registrar cada cambio aceptado en el control de cambios (ERS §4.3.3, versión 2.2): cambio, motivo y elementos afectados. Incluye el supuesto de la §2.5 («el evaluador posee la competencia disciplinar mínima para juzgar C3»), que la tarea 8 deja de dar por hecho.
- Avisar ya a Katalina y Renzo: el banco de 36 preguntas debería traer el campo `marco` (tarea 9), para no reescribirlo después.

**Listo cuando:** el cliente confirma qué entra y la ERS tiene sus filas de cambio.

## Tarea 1 · Micro-guía de C3 con sus dos regímenes (2.2)

- **Problema:** hoy la micro-guía de C3 dice «Su justificación calza con el consenso de la disciplina». Es justo lo que advierte el cliente: en un ensayo o una opinión no hay consenso que buscar, y un 0 por «no coincidir» sería injusto.
- **Qué hacer:**
  - En `data/microguias.json`, cambiar C3 por el texto del cliente: la pregunta guía («¿hecho, procedimiento o concepto con respuesta aceptada, o argumentación?»), el régimen de **contenido** y el de **forma**.
  - Agregar una versión ampliada que se abra con un toque («Ver más») en la pantalla de sesión y en la de resultado.
  - C3 deja de seguir el formato «Vale 1 / Vale 0»: hay que mostrarlo con su propia estructura.
  - Actualizar la tabla de micro-guías de `CLAUDE.md`.
- **Archivos:** `data/microguias.json`, `js/pantallas/sesion.js`, `js/pantallas/resultado.js`, `CLAUDE.md`.

**Listo cuando:** el «?» de C3 muestra los dos regímenes, «Ver más» abre el texto completo y nada se desborda a 360 px.

## Tarea 2 · Cierre a prueba de doble toque (2.6 a)

- **Lo que ya está:**
  - Cerrar actualiza el mismo registro, buscado por su `id`; nunca crea uno nuevo.
  - El almacén rechaza un segundo cierre, y ya hay una prueba que lo verifica (RN4).
  - La confirmación es el diálogo nativo del navegador, que bloquea la pantalla mientras está abierto.
- **Lo que falta:**
  - Que `intentarCerrar` no haga nada si ya no hay sesión. Hoy un segundo llamado lanzaría un error en la consola.
  - Deshabilitar «Cerrar sesión» apenas se confirma.
  - Una prueba que cierre dos veces y compruebe que queda un solo registro.
- **Archivos:** `js/pantallas/sesion.js`, `tests/almacen.test.js`.

**Listo cuando:** la prueba pasa y un doble clic no deja errores en la consola. La protección sigue sirviendo si algún día el diálogo nativo se cambia por uno animado.

## Tarea 3 · Fechas con la zona horaria local (2.6 b)

- **Situación actual:** las fechas se guardan en UTC con «Z» (por ejemplo, `2026-11-25T01:30:00.000Z`). Eso ya es ISO 8601 con desfase explícito, no «hora local sin offset». Aun así, hay dos problemas:
  - Quien abre el CSV en Chile ve la hora 3 horas adelantada.
  - Error real: el nombre del archivo exportado usa la fecha UTC (`js/pantallas/resultado.js:34`). Una sesión cerrada después de las 21:00 sale con la fecha del día siguiente.
- **Qué hacer:**
  - Una función pura que escriba la hora local con su desfase (`2026-11-24T22:30:00-03:00`), usada al crear y al cerrar sesiones, y al importar un banco.
  - Ordenar el historial por instante (`Date.parse`) y no comparando texto (`js/pantallas/historial.js:49`). Van a convivir fechas viejas con «Z» y nuevas con «-03:00».
  - Usar la fecha local en el nombre del archivo exportado.
- **Archivos:** `js/almacen.js` (o un módulo nuevo `js/fechas.js`), `js/pantallas/historial.js`, `js/pantallas/resultado.js` y sus pruebas.

**Listo cuando:**
- Las pruebas comprueban el formato y que la fecha representa el mismo instante, sin depender de la zona horaria del computador que corre `node --test`.
- Las sesiones viejas se siguen ordenando bien.

## Tarea 4 · Código del evaluado generado solo (2.4 y el «copiar» de 2.5)

- **Generador:** una función pura `generarCodigo` en `js/codigo.js`:
  - Códigos de 4 caracteres, con un alfabeto de 30 símbolos (sin I, L, O, U, 0 ni 1).
  - Usa `crypto.getRandomValues`, que funciona sin internet.
  - Nunca repite un código ya guardado en el dispositivo. Sin esa verificación, con 500 sesiones la probabilidad de un choque ronda el 14 %.
- **En «Crear sesión»:**
  - Al elegir el contexto, el campo del código se llena solo.
  - «Otro código» lo cambia con un toque.
  - Se puede seguir escribiendo uno a mano, con el formato actual.
- **Ver y copiar el código:** destacado con «Copiar» en el resultado (lo pide el cliente) y también al empezar la sesión (sugerencia nuestra). Va con una línea que recuerde anotarlo en la pauta junto a la persona: con códigos al azar, esa anotación es la única forma de saber después quién era quién, por ejemplo ante una apelación.
- **Archivos:** `js/codigo.js` y `tests/codigo.test.js` (nuevos), `js/pantallas/crear-sesion.js`, `js/pantallas/sesion.js`, `js/pantallas/resultado.js`, `index.html`, `service-worker.js`.
- **Por decidir con el cliente:** qué pasa si a mano se escribe un código que ya existe (pregunta 1 del final).

**Listo cuando:**
- Crear una sesión toma dos toques: el contexto y «Crear sesión».
- Las pruebas muestran que los códigos usan solo el alfabeto, tienen 4 caracteres y no chocan con los existentes.

## Tarea 5 · Textos: datos, RN7 y pausas (2.7, 2.3 y 2.6 c, solo texto)

- **README y «Acerca de»:** el párrafo «Clasificación de los datos» propuesto por el cliente. Como él pide, sin afirmar fechas de vigencia de la Ley 21.719. Ojo: la ERS (§2.4) sí dice «entra en vigencia el 1 de diciembre de 2026», y eso se puede corregir en la versión 2.2.
- **README:** la aclaración de RN7: «Las preguntas no ponderan en el veredicto, pero condicionan la validez del juicio: una pregunta sin marco acotado no permite resolver C3». También va a la ERS (tarea 0).
- **README:** un diccionario de datos de la exportación (tabla 1), con la advertencia de que `fecha_inicio` → `fecha_cierre` incluye las pausas y no mide la duración de la evaluación.
- **Archivos:** `README.md`, `index.html`.

**Listo cuando:** los textos están en su lugar y «Acerca de» se ve bien a 360 px.

## Tarea 6 · Sesiones retomables con lo que les falta (2.1, paso 7)

- **Lo que ya está** (RF-12 se adelantó): «Crear sesión» lista las sesiones en pausa con «Retomar» y «Descartar», y la sesión abierta se retoma sola al recargar.
- **Lo que falta:**
  - Mostrar qué criterios faltan («Faltan: C3, C4») en vez de «2 de 4 criterios marcados».
  - Listar también cualquier sesión abierta que no sea la activa. Hoy no debería ocurrir, pero el resguardo no cuesta nada.
- **Archivos:** `js/pantallas/crear-sesion.js`.

**Listo cuando:** después de recargar, toda sesión sin cerrar se abre con un toque y dice qué le falta. Es la base de la tarea 8.

## Tarea 7 · Justificación opcional al marcar 0 (2.1, pasos 4 y 6)

- **Catálogo:** `data/justificaciones.json`, con número de versión y las opciones del cliente. Cada opción lleva un código estable (por ejemplo, `C3-I01` para incumplimiento y `C3-N05` para no evaluable).
- **Al marcar 0:** aparece, sin tapar nada, la lista de «incumplimiento demostrado».
  - Elegir es opcional (un toque) y no bloquea el cierre.
  - Marcar 1 después borra la justificación.
- **En el resultado:** se ve la causa, por ejemplo «Falló: C3 · Afirmó algo factualmente falso».
- **Exportación:** columnas `justificaciones` y `version_catalogo`, al final, para no mover las existentes.
- **Archivos:** `data/justificaciones.json`, `js/banco.js`, `js/almacen.js`, `js/exportar.js`, `js/pantallas/sesion.js`, `js/pantallas/resultado.js`, `service-worker.js`, y las pruebas de almacén, banco y exportación.

**Listo cuando:**
- Las pruebas cubren guardar, cambiar y borrar la justificación, que no se pueda cambiar con la sesión cerrada (RN4) y las columnas nuevas.
- Los cuatro criterios se siguen marcando con cuatro toques (RNF-13).

## Tarea 8 · «No evaluable» (2.1, pasos 1 a 3)

- **Qué hacer:** junto a 1 y 0, una acción secundaria «No evaluable» que abre la lista de «evidencia insuficiente». Al elegir una causa:
  - El criterio queda (o vuelve a quedar) «sin evaluar».
  - Se guarda la causa.
  - Aparece el aviso del cliente: «Este criterio no queda registrado como incumplimiento. Puede reinterrogar con otro formato presencial acorde a la disciplina, o pausar la sesión y derivar este criterio a quien tenga la competencia.»
  - El veredicto sigue pendiente (RN3), y la causa se ve en la sesión y en la lista de pausadas.
  - Si después de reinterrogar se marca 1 o 0, esa marca reemplaza la causa.
- **Cuidado con el espacio:** la fila de cada criterio ya tiene «?», «1» y «0». A 360 px probablemente no cabe un cuarto botón en la misma línea. «No evaluable» puede ir dentro del panel del «?» o en una línea propia, con el estilo existente.
- **Archivos:** `js/almacen.js`, `js/pantallas/sesion.js`, `js/pantallas/crear-sesion.js`, `index.html`, `css/estilos.css` y las pruebas de almacén.
- **Depende de:** la tarea 6 (para que una sesión pendiente no se pierda) y del catálogo de la tarea 7.

**Listo cuando:** las pruebas comprueban que «No evaluable» deja el criterio en `null`, guarda la causa y no permite cerrar, y que una marca posterior la reemplaza.

## Tarea 9 · Marco de la pregunta (2.3)

- **En el banco:** campo opcional `marco` en las plantillas (validación, importador, README y `data/banco.json`). Hoy el importador descarta en silencio los campos que no conoce (`js/banco.js:105`): un banco con `marco` se importaría, pero sin ese dato.
- **En la sesión:**
  - El marco se muestra destacado dentro de la pregunta sugerida.
  - «Editar» y «Agregar» tienen un campo «Marco».
- **Avisos y ayuda:**
  - Aviso no bloqueante si falta el marco, en el editor y en el importador (con la lista de preguntas afectadas).
  - Ayuda con el ejemplo del PEH: «¿Qué es la justicia?» no sirve; «¿Qué es la justicia, para Hegel?» sí. También la indicación de decir el marco en voz alta.
- **Ojo:** las preguntas del banco son genéricas («el concepto central de tu marco teórico»), así que el marco real depende de cada trabajo. En la plantilla, el marco es el hueco que se completa en voz alta; es lo que el cliente llama «x» e «y».
- **Archivos:** `js/banco.js`, `js/pantallas/sesion.js`, `js/pantallas/banco-preguntas.js`, `index.html`, `data/banco.json`, `README.md`, `tests/banco.test.js`.

**Listo cuando:** importar un banco sin `marco` sigue funcionando, pero avisa qué preguntas no lo tienen.

## Tarea 10 · Etiqueta contextual (2.5, nueva RN8). Backlog sugerido

- **Qué pide el cliente:**
  - Un texto libre de situación, como «Sección B · puesto 12».
  - Validación en el dispositivo: un RUT, correo o teléfono bloquea el guardado con un diálogo («Corregir» / «Confirmo que no contiene datos personales»). Algo con forma de nombre propio muestra un aviso, sin bloquear.
  - Si se confirma, se guarda `advertencia_omitida = true`.
  - La etiqueta se puede buscar en el historial y va en la exportación (columna `etiqueta`).
- **Por qué la dejaría para después:**
  - Abre un campo libre sobre la persona evaluada en un sistema cuya regla (RN5, RNF-11) dice «solo un código».
  - Con la confirmación, un RUT podría quedar guardado.
  - En «aula escolar» los evaluados pueden ser menores de edad, y algo como «Octavo básico · estudiante 2», junto con la fecha, puede bastar para reconocerlos.
  - Antes de programarla, hay que aprobar la RN8.
- **Si se hace:** además del entrecomillado, que el exportador ya hace, hay que neutralizar los textos que empiecen con `=`, `+`, `-` o `@`. Excel los ejecuta como fórmulas (inyección de fórmulas en CSV).

## Tarea 11 · «Otro (escribir)» en las justificaciones (2.1, paso 5). Backlog sugerido

- **Qué pide el cliente:**
  - Texto libre en las dos familias, con la misma validación de la tarea 10.
  - Ese texto se guarda en un registro local aparte, exportable en JSON.
  - En la exportación de la sesión solo viaja el código `OTRO`.
- **Por qué después:** suma un segundo almacenamiento, una segunda exportación y la validación de datos personales, y depende de la tarea 10.

---

## Lo que ya está resuelto (para decírselo al cliente)

- **Pausar y retomar (RF-12):** está hecho y probado, aunque era Could. La pantalla de inicio ya lista las sesiones en pausa; el paso 7 de 2.1 cuesta minutos, no media hora.
- **Doble toque al cerrar:** no puede crear dos registros. El cierre actualiza el mismo registro y el almacén rechaza un segundo cierre, con prueba incluida.
- **Fechas:** ya están en ISO 8601 con desfase explícito (UTC, «Z»). Igual conviene pasarlas a la hora local con su desfase (tarea 3).
- **CSV:** ya entrecomilla y escapa los campos que traen «;», comillas o saltos de línea.

## Por aclarar con el cliente

1. **Código repetido escrito a mano: ¿bloquear o avisar?** En el modelo de datos de la ERS (figura 5), un evaluado tiene un código único y puede participar en varias sesiones. Si se bloquea, no se podría reusar el código para volver a evaluar a la misma persona. Proponemos: los códigos generados nunca se repiten, y uno escrito a mano que ya existe muestra un aviso, sin bloquear.
2. **Derivar un criterio: ¿quién marca C3 después, y en qué dispositivo?** Si lo marca otra persona en la misma sesión, el registro no lo refleja: el MVP no guarda quién marca, y RN6 dice un evaluador por sesión.
3. **Causa de «no evaluable» al cerrar:** si después de reinterrogar se marca 1 o 0, ¿se conserva en el registro que antes fue «no evaluable», o se descarta?
4. **Versión ampliada de la micro-guía de C3:** ya hay un borrador en la app (tarea 1), armado solo con el texto de su documento: los dos regímenes con sus ejemplos de 0, el riesgo de buscar consenso donde no lo hay y la necesidad de un marco. Falta que el cliente lo valide o lo corrija en `data/microguias.json`.
5. **Plazos:** ¿qué entra en la 1.0 (29-11) y qué en la entrega final (10-12)?
