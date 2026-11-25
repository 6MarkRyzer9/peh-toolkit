# PEH Toolkit: instrucciones del proyecto

## Qué es
App web (MVP) que asiste a quien evalúa una defensa oral o una entrevista técnica. Sugiere preguntas de fricción cognitiva (metodología Lipman), registra los criterios C1 a C4 con 1 o 0 y calcula el veredicto `PEH = C1 ∧ C2 ∧ C3 ∧ C4`, mostrando qué criterio falló.

- Ramo: Ingeniería de Software, Universidad Alberto Hurtado, 2026.
- Cliente y autor del protocolo: Fabrizzio Fatoruzzo.
- Equipo: Vicente Álvarez, Katalina Cossio, Marving Ponce y Renzo Rodríguez.
- Fuente de verdad de los requisitos: `docs/Hito2_SRS_PEH_Toolkit_v2.1.pdf` (RF, RNF, RN, casos de uso, historias de usuario, modelo de datos y prototipo).
- Plan y fechas: `docs/Plan_de_trabajo_PEH_Toolkit.xlsx`. Entrega final: 10 de diciembre de 2026.

## Reglas que no se rompen
1. **Sin IA para juzgar.** Ningún modelo, API de IA ni heurística decide C1 a C4. Los valores los ingresa la persona que evalúa (RN2, RNF-04).
2. **Regla conjuntiva.** PEH vale 1 solo si los cuatro criterios valen 1. Sin promedios ni puntajes parciales (RN1).
3. **«Sin evaluar» no es 0.** Mientras un criterio no tenga valor, no se calcula el veredicto y «Cerrar sesión» queda deshabilitado, indicando cuál falta (RN3).
4. **Sesión cerrada, sesión inmutable.** Las marcas se corrigen solo mientras la sesión está abierta (RN4).
5. **Identificación mínima.** El evaluado se identifica solo con un código alfanumérico; nunca nombre, RUT ni contacto (RN5, RNF-11).
6. **Todo local y sin internet.** Los datos viven en el navegador; ninguna llamada de red durante una sesión (RNF-04, RNF-08).
7. **Licencia MIT con atribución.** Archivo `LICENSE` (MIT). El `README.md` y la pantalla «Acerca de» citan a Fabrizzio Fatoruzzo como autor del marco teórico y del protocolo original (RNF-05). Esto lo pidió el cliente como condición.
8. **Fuera de alcance:** detección de IA o plagio, cuentas y login, integración con LMS, audio, video, biometría e Índice de Dependencia.

## Tecnología
- HTML, CSS y JavaScript con módulos ES. Sin framework ni paso de build.
- Datos en `localStorage`, siempre a través de `js/almacen.js` (para poder cambiar a IndexedDB sin tocar el resto).
- PWA: `manifest.webmanifest` y `service-worker.js` para funcionar sin internet.
- Pruebas con `node --test` (Node 18 o superior), sin dependencias. Por eso `js/motor.js` no toca el DOM.
- Publicación en GitHub Pages desde la rama `main`.

## Estructura
```
peh-toolkit/
├── index.html
├── css/estilos.css
├── js/
│   ├── app.js            navegación entre pantallas
│   ├── motor.js          cálculo del veredicto (función pura)
│   ├── almacen.js        guardar y leer sesiones
│   ├── banco.js          cargar preguntas y micro-guías
│   ├── exportar.js       CSV y JSON
│   ├── fisica.js         resorte amortiguado (función pura)
│   ├── tactil.js         respuesta táctil con resortes (Liquid Glass)
│   └── pantallas/        crear-sesion.js, sesion.js, resultado.js, historial.js, acerca.js, banco-preguntas.js
├── data/banco.json       preguntas por contexto y tipo Lipman
├── data/microguias.json  condiciones de 1 y 0 por criterio
├── iconos/icono.svg      ícono de la PWA
├── tests/                motor, almacen, exportar, banco y fisica (*.test.js)
├── manifest.webmanifest
├── service-worker.js
├── docs/                 ERS y plan (no se publican en la app)
├── PROGRESO.md           lo hecho, lo pendiente y el siguiente paso
├── LICENSE
└── README.md
```

## Contrato del motor
```js
// valores: { C1: 1 | 0 | null, C2: …, C3: …, C4: … }   null = sin evaluar
calcularVeredicto(valores)
// → { completo: boolean, faltan: string[], peh: 1 | 0 | null, fallidos: string[] }
```
- Si falta algún criterio: `completo = false`, `peh = null`, `fallidos = []` y `faltan` lista los criterios en null.
- Las pruebas cubren las 16 combinaciones de 1 y 0 y los casos con null.

## Datos
- **Sesión:** `{ id, codigoEvaluado, contexto: 'aula' | 'catedra' | 'rrhh', estado: 'abierta' | 'pausada' | 'cerrada', fechaInicio, fechaCierre, marcas: { C1, C2, C3, C4 }, peh, criteriosFallidos }`
- **Plantilla de pregunta:** `{ id, contexto, tipo: 'proceso' | 'contrafactual' | 'justificacion' | 'clarificacion', texto, activa }`
- Una pregunta editada o agregada durante la sesión no se guarda en el banco (RN7).

## Exportación
- CSV en UTF-8 con BOM y separador `;` (abre directo en Excel con configuración chilena). Una fila por sesión: `id_sesion; codigo_evaluado; contexto; fecha_inicio; fecha_cierre; c1; c2; c3; c4; peh; criterios_fallidos`.
- Fechas en ISO 8601. JSON con los mismos campos.

## Pantallas
Base visual: el prototipo de Claude Design del equipo, versión móvil (Neumorphism). No se cambia su aspecto en reposo (colores, tipografía, espaciados, bordes ni sombras).
Comportamiento: respuesta táctil inspirada en Liquid Glass (`js/tactil.js` con los resortes de `js/fisica.js`): compresión y rebote al tocar, brillo que sigue el dedo, «gota» al elegir y entrada escalonada. Solo actúa mientras algo se mueve y respeta «reducir movimiento». Hoy está en «Crear sesión»; para otro botón basta `superficieTactil(elemento)`.
1. **Crear sesión:** contexto (aula escolar, cátedra universitaria, entrevista técnica de RRHH) y código del evaluado.
2. **Sesión:** pregunta sugerida con «Otra», «Editar» y «Agregar»; C1 a C4 con botones 1 y 0 y un botón «?» para la micro-guía; estado del veredicto («Pendiente: falta C4»); «Pausar» y «Cerrar sesión».
3. **Resultado:** veredicto, criterio o criterios fallidos con su micro-guía, las cuatro marcas, «Exportar CSV», «Exportar JSON» y «Nueva sesión».
4. **Historial:** sesiones cerradas con filtros por fecha, contexto y código; exportar.
5. **Acerca de:** qué es la app, autor del protocolo (Fabrizzio Fatoruzzo), equipo, licencia MIT.
6. **Banco de preguntas:** banco en uso con su resumen por contexto y tipo, importar un JSON con el formato de `data/banco.json`, descargar el banco en uso y volver al incluido (RF-13).

Nombres de los criterios: C1 Apropiación del Lenguaje · C2 Reconstrucción Lógica · C3 Adecuación Disciplinar · C4 Responsabilidad Agéntica.

## Micro-guías (en `data/microguias.json`; el cliente puede ajustarlas)
C1, C2 y C4 vienen de la presentación del Hito 1:

| Criterio | Vale 1 | Vale 0 |
|---|---|---|
| C1 | Traduce los conceptos a palabras propias. | Repite mecánicamente la formulación recibida. |
| C2 | Explica causalmente premisas y conclusiones. | Exhibe saltos lógicos ciegos entre ambas. |
| C4 | Defiende su producto y asume autoría y límites. | Evade la responsabilidad delegando en la IA. |

C3 la ajustó el cliente el 24-11-2026 (retroalimentación, punto 2.2), porque el PEH distingue dos regímenes (nota 4, p. 18). Muestra una pregunta guía («¿Lo evaluado es un hecho, procedimiento o concepto con respuesta aceptada, o una argumentación?») y dos condiciones:
- **Contenido:** se cumple si la explicación coincide, con otras palabras, con lo aceptado por la disciplina o el currículo enseñado.
- **Forma:** no se busca consenso sobre la opinión; se cumple si las premisas sostienen la conclusión y la postura resiste objeciones.

C3 tiene además una «Versión ampliada» que se abre con un toque. Se armó con el texto del mismo documento del cliente y está pendiente de su validación.

## Banco de preguntas
Katalina y Renzo redactan el banco (36 preguntas: 3 contextos × 4 tipos × 3) y Fabrizzio lo valida. Mientras no esté listo, usa pocas preguntas marcadas como ejemplo en `data/banco.json`, con el mismo formato.

## Calidad mínima
- Móvil primero desde 360 px de ancho, sin desplazamiento horizontal (RNF-10).
- Botones de al menos 44 × 44 px; los cuatro criterios se marcan con cuatro toques (RNF-13).
- Atajos de teclado para C1 a C4 y para cerrar; el estado no se indica solo con color (RNF-14).
- Veredicto en menos de 100 ms (RNF-01). Cada marca se guarda al instante y sobrevive a recargar la página (RNF-08).

## Orden de trabajo
1. **9 al 15 de noviembre:** estructura del repositorio y LICENSE, motor con pruebas, crear sesión, pantalla de sesión, guardado local.
2. **16 al 22 de noviembre:** preguntas sugeridas, editar y agregar, micro-guías, cerrar sesión, historial, exportar, PWA, «Acerca de» y beta publicada.
3. **23 al 29 de noviembre:** correcciones, pausar y retomar (si hay tiempo), importar banco (si hay tiempo), README final. Versión 1.0 congelada el 29.

## Cómo trabajar
- Avanza en pasos pequeños: una función a la vez, con su prueba, y espera el visto bueno antes de seguir.
- Después de cada paso explica en palabras simples qué hiciste y por qué. El equipo tiene que poder defender el código en la presentación final.
- No agregues dependencias ni funciones fuera de alcance sin preguntar.
- Código, comentarios y textos de la app en español.
- Al cerrar cada sesión de trabajo, actualiza `PROGRESO.md` con lo hecho, lo pendiente y el siguiente paso.
