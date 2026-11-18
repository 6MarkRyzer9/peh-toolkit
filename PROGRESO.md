# Progreso del PEH Toolkit

Última actualización: 18 de noviembre de 2026.

## Hecho

- Estructura del repositorio según CLAUDE.md, con esqueletos comentados de cada módulo.
- `LICENSE` (MIT, 2026, equipo PEH Toolkit) y `README.md` con la atribución a Fabrizzio Fatoruzzo (RNF-05).
- Repositorio público en GitHub: <https://github.com/6MarkRyzer9/peh-toolkit>.
- `js/motor.js`: `calcularVeredicto` según el contrato (regla conjuntiva RN1, «sin evaluar» RN3, validación de valores).
- `tests/motor.test.js`: 10 pruebas que pasan (16 combinaciones de 1/0, casos con null/undefined, determinismo, valores inválidos). Correr con `node --test tests/motor.test.js`.
- `index.html` + `js/app.js`: pantalla «Crear sesión» (contexto + código del evaluado) funcionando en el navegador, verificada a 360–375 px.
- `js/almacen.js`: sesiones en `localStorage` (crear, marcar, cerrar, descartar), con 10 pruebas propias. Las sesiones cerradas son inmutables (RN4) y los datos corruptos no rompen la lectura.
- Pantalla de sesión (`js/pantallas/sesion.js`): marcas C1–C4 con botones 1/0 (corregibles, RF-05), estado por texto además de color (RNF-14), atajos de teclado 1–4, Shift+1–4 y C para cerrar, estado del veredicto («Falta: C4», RN3) y «Cerrar sesión» deshabilitado mientras falte un criterio. Cada marca se guarda al instante y sobrevive a recargar la página (RNF-08, verificado en el navegador).
- Cierre de sesión (CU-07): confirmación «no se podrá modificar», veredicto calculado con el motor, registro inmutable guardado.
- Pregunta sugerida en la sesión (RF-02, RF-03): preguntas del contexto desde `data/banco.json`, «Otra» pasa a la siguiente, «Editar» y «Agregar» usan la pregunta solo en esa sesión sin tocar el banco (RN7) ni las marcas (verificado: editar con C1 marcado conserva la marca).
- Micro-guías en la sesión (RF-06, CU-05): botón «?» en cada criterio que abre las condiciones de 1 y 0 dentro de la misma tarjeta, sin tapar los botones de marca; se puede marcar con el panel abierto (verificado en el navegador).
- Exportación (RF-11): `js/exportar.js` genera CSV (UTF-8 con BOM, separador «;», fechas ISO 8601, una fila por sesión con los campos de la tabla 1) y JSON con los mismos campos; 5 pruebas propias. Botones habilitados en la pantalla de resultado (verificado en el navegador con una sesión real).
- Historial (RF-10): pantalla con las sesiones cerradas (más recientes primero), filtros por rango de fechas de cierre, contexto y código (parcial, sin distinguir mayúsculas) y exportación de lo filtrado a CSV/JSON. El filtro es una función pura en `almacen.js` con 5 pruebas. Verificado en el navegador a 375 px, sin desplazamiento horizontal.
- Pantalla de resultado (`js/pantallas/resultado.js`): veredicto PEH, criterio(s) fallido(s) con su micro-guía cargada desde `data/microguias.json` (CU-09), las cuatro marcas y «Nueva sesión». Verificada en el navegador: cerrar con C3=0 muestra «Falló: C3» con la micro-guía, y al recargar la app vuelve a «Crear sesión» con el registro cerrado intacto.
- Pantalla «Acerca de» (RNF-05): qué es la app, autoría del protocolo (Fabrizzio Fatoruzzo), equipo, licencia MIT y enlace al código fuente. Contenido estático en `index.html`; `js/pantallas/acerca.js` solo conecta el botón de volver. Verificada en el navegador a 375 px, sin desplazamiento horizontal.
- `data/banco.json` con 12 preguntas de ejemplo y `data/microguias.json` con las micro-guías del Hito 1.
- GitHub Pages activado desde `main`: <https://6markryzer9.github.io/peh-toolkit/>.
- Pausar y retomar (Could del plan, adelantado): «Pausar» en la pantalla de sesión guarda la sesión tal como va (sin confirmación, porque es reversible); la pantalla «Crear sesión» lista las sesiones en pausa con código, contexto, fecha de inicio y cuántos criterios llevan marcados, con «Retomar» y «Descartar» (este sí confirma). Al recargar, una sesión pausada no se retoma sola. El botón provisional «Descartar» de la pantalla de sesión se eliminó. En `almacen.js`: `pausarSesion` y `retomarSesion` con 5 pruebas nuevas (35 en total); las marcas solo se corrigen con la sesión abierta.
- PWA (RNF-06, RNF-08): `service-worker.js` implementado y registrado desde `app.js`. Estrategia «primero la red, si falla la caché»: con internet la app siempre está al día; sin internet funciona completa con la última versión descargada. Ícono en `iconos/icono.svg` y manifest con ícono para poder instalarla. Verificado en el navegador: con el servidor apagado la app carga entera y se puede crear una sesión.

- Tipo Lipman opcional al agregar una pregunta (CU-03, flujo 1a): selector con los cuatro tipos; al editar, la pregunta conserva su tipo. Verificado en el navegador.
- Almacenamiento lleno o bloqueado (CU-07, flujo 6a): `almacen.js` lanza `ErrorAlmacenamiento` y nunca deja una sesión a medias. Si el cierre no se puede guardar, la sesión sigue abierta y se ofrece descargar un respaldo JSON con las marcas y el veredicto. Crear, marcar, pausar, retomar y descartar avisan en vez de romperse. 4 pruebas nuevas con un almacenamiento que simula estar lleno.
- Advertencia de respaldo (ERS, sección 2.5): resultado e historial avisan que borrar los datos del navegador pierde las sesiones no exportadas.
- Importar banco de preguntas (RF-13, Could adelantado): pantalla «Banco de preguntas» con el banco en uso y su resumen por contexto y tipo, importar un JSON con el formato de `data/banco.json` (se revisa pregunta por pregunta y se explican los errores), descargar el banco en uso como plantilla y volver al incluido. El banco importado vive solo en el dispositivo. 10 pruebas nuevas en `tests/banco.test.js` (49 en total). Verificado en el navegador, incluido que el texto del archivo nunca se interpreta como HTML.
- Rediseño Liquid Glass (decisión del 18 de noviembre, reemplaza Neumorphism): vidrio translúcido sobre fondo de color, modo claro y oscuro, títulos grandes por pantalla, «Volver» arriba, lista agrupada en el inicio, barra flotante con «Pausar» y «Cerrar sesión», control segmentado 1 | 0, ícono nuevo. Colores verificados con contraste AA sobre el vidrio en su peor caso; botones de 44 × 44 px o más; sin desborde a 360 px; atajos y foco de teclado verificados. Con «Reducir transparencia» o sin desenfoque, el vidrio pasa a casi opaco.
- «Acerca de» corregido: decía «Evaluación de Explicabilidad Humana»; ahora dice «PEH (Protocolo de Explicabilidad Humana)».
- README actualizado: funciones, cómo probar la app con `python -m http.server` y formato para importar el banco.

## Pendiente

- Banco definitivo de 36 preguntas (Katalina y Renzo; valida Fabrizzio). Se puede probar desde la app con «Importar banco» antes de reemplazar `data/banco.json`.
- Probar el diseño en celulares reales (Safari en iPhone y Chrome en Android): fluidez del desenfoque y aspecto con «Reducir transparencia» activado, que el navegador integrado no puede simular.
- Ícono PNG `apple-touch-icon` para que el iPhone muestre el ícono al agregar la app a la pantalla de inicio (Safari no usa el SVG).
- README final y congelar la 1.0 el 29 de noviembre.

## Siguiente paso

Que el equipo pruebe la beta en sus celulares y anote detalles. Cuando el banco de 36 preguntas esté listo, importarlo desde la app para revisarlo y, con el visto bueno de Fabrizzio, reemplazar `data/banco.json`.

Nota técnica: la primera vez que se abre la app (cuando el service worker todavía no controla la página), el navegador puede usar módulos JS viejos de su caché y mostrar un error tipo «does not provide an export named …». Se resuelve recargando con Ctrl+Shift+R. Desde la segunda carga, el service worker pide cada archivo con revalidación («no-cache»).
