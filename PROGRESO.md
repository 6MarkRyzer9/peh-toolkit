# Progreso del PEH Toolkit

Última actualización: 11 de noviembre de 2026.

## Hecho

- Estructura del repositorio según CLAUDE.md, con esqueletos comentados de cada módulo.
- `LICENSE` (MIT, 2026, equipo PEH Toolkit) y `README.md` con la atribución a Fabrizzio Fatoruzzo (RNF-05).
- Repositorio público en GitHub: <https://github.com/6MarkRyzer9/peh-toolkit>.
- `js/motor.js`: `calcularVeredicto` según el contrato (regla conjuntiva RN1, «sin evaluar» RN3, validación de valores).
- `tests/motor.test.js`: 10 pruebas que pasan (16 combinaciones de 1/0, casos con null/undefined, determinismo, valores inválidos). Correr con `node --test tests/motor.test.js`.
- `index.html` + `js/app.js`: pantalla «Crear sesión» (contexto + código del evaluado) funcionando en el navegador, verificada a 360–375 px. Todavía **no guarda datos**.
- `data/banco.json` con 12 preguntas de ejemplo y `data/microguias.json` con las micro-guías del Hito 1.
- GitHub Pages activado desde `main`: <https://6markryzer9.github.io/peh-toolkit/>.

## Pendiente

- `js/almacen.js`: guardar la sesión en `localStorage` al crearla y tras cada marca (RNF-08).
- Pantalla de sesión: pregunta sugerida con «Otra», «Editar», «Agregar»; botones 1/0 por criterio; micro-guías; estado del veredicto; «Cerrar sesión» deshabilitado mientras falte un criterio (RN3).
- Pantalla de resultado, historial con filtros, exportar CSV/JSON.
- PWA real (`service-worker.js` aún es un esqueleto sin registrar).
- Pantalla «Acerca de» con la atribución (RNF-05).
- Banco definitivo de 36 preguntas (Katalina y Renzo; valida Fabrizzio).
- Pausar y retomar e importar banco, si hay tiempo (Could).

## Siguiente paso

Implementar `js/almacen.js` (guardar y leer sesiones en `localStorage`) y conectar «Crear sesión» para que cree la sesión de verdad y navegue a la pantalla de sesión.
