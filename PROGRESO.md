# Progreso del PEH Toolkit

Última actualización: 11 de noviembre de 2026.

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
- Pantalla de resultado (`js/pantallas/resultado.js`): veredicto PEH, criterio(s) fallido(s) con su micro-guía cargada desde `data/microguias.json` (CU-09), las cuatro marcas y «Nueva sesión». Verificada en el navegador: cerrar con C3=0 muestra «Falló: C3» con la micro-guía, y al recargar la app vuelve a «Crear sesión» con el registro cerrado intacto.
- `data/banco.json` con 12 preguntas de ejemplo y `data/microguias.json` con las micro-guías del Hito 1.
- GitHub Pages activado desde `main`: <https://6markryzer9.github.io/peh-toolkit/>.

## Pendiente

- Micro-guías con el botón «?» durante la sesión (RF-06).
- Elegir el tipo Lipman al agregar una pregunta (opcional según CU-03).
- Historial con filtros, exportar CSV/JSON (los botones de la pantalla de resultado existen pero están deshabilitados).
- El botón provisional «Descartar» de la pantalla de sesión se mantiene para que el equipo pruebe sin llenar el historial de sesiones basura; se quitará antes de la 1.0 (o se reemplazará por «Pausar»).
- PWA real (`service-worker.js` aún es un esqueleto sin registrar).
- Pantalla «Acerca de» con la atribución (RNF-05).
- Banco definitivo de 36 preguntas (Katalina y Renzo; valida Fabrizzio).
- Pausar y retomar e importar banco, si hay tiempo (Could).

## Siguiente paso

Micro-guías dentro de la sesión (RF-06): botón «?» en cada criterio que muestre las condiciones de 1 y 0 sin tapar los botones de marca. Después: historial con filtros y exportación CSV/JSON.
