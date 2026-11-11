# PEH Toolkit

Aplicación web (MVP) que asiste a quien evalúa una defensa oral o una entrevista técnica aplicando el **Protocolo de Explicabilidad Humana (PEH)**: sugiere preguntas de fricción cognitiva (metodología Lipman), registra los criterios C1 a C4 con 1 o 0 y calcula el veredicto con la regla conjuntiva `PEH = C1 ∧ C2 ∧ C3 ∧ C4`, indicando qué criterio falló.

La decisión siempre es humana: el software **no usa inteligencia artificial** para juzgar; solo registra y calcula (principio *Human-in-the-Loop*).

## Atribución

El **marco teórico del PEH, los criterios C1–C4 y el protocolo original son autoría de Fabrizzio Fatoruzzo** (Investigador en Filosofía de la Tecnología, Universidad Alberto Hurtado), cliente de este proyecto.

## Criterios del protocolo

| Criterio | Nombre |
|---|---|
| C1 | Apropiación del Lenguaje |
| C2 | Reconstrucción Lógica |
| C3 | Adecuación Disciplinar |
| C4 | Responsabilidad Agéntica |

El veredicto vale 1 solo si los cuatro criterios valen 1. Un criterio «sin evaluar» no equivale a 0: el veredicto no se calcula hasta que los cuatro tengan valor.

## Características

- Funciona en el navegador, sin internet y sin servidores: los datos viven solo en el dispositivo del evaluador.
- El evaluado se identifica únicamente con un código alfanumérico (sin nombre, RUT ni contacto).
- Sesiones cerradas inmutables, historial con filtros y exportación a CSV (compatible con Excel) y JSON.
- Móvil primero (desde 360 px), botones grandes y atajos de teclado.

## Tecnología

HTML, CSS y JavaScript con módulos ES, sin frameworks ni paso de build. Datos en `localStorage`. PWA para uso sin conexión.

## Desarrollo

```bash
# Ejecutar las pruebas del motor de cálculo (Node 18 o superior)
node --test tests/motor.test.js
```

Para probar la app basta abrir `index.html` con un servidor estático, por ejemplo `npx serve .`.

## Equipo

Vicente Álvarez, Katalina Cossio, Marving Ponce y Renzo Rodríguez.
Proyecto del ramo Ingeniería de Software, Universidad Alberto Hurtado, 2026.

## Cómo colaborar (equipo)

1. Clonar el repositorio: `git clone https://github.com/<usuario>/peh-toolkit.git`
2. Crear una rama por tarea: `git checkout -b nombre-de-la-tarea`
3. Hacer commits pequeños y abrir un *pull request* hacia `main` para que otra persona lo revise.
4. Antes de subir, correr las pruebas: `node --test tests/motor.test.js`
5. El estado del proyecto (lo hecho, lo pendiente y el siguiente paso) está en [PROGRESO.md](PROGRESO.md).

Los requisitos viven en `docs/Hito2_SRS_PEH_Toolkit_v2.1.pdf` y las reglas de trabajo en [CLAUDE.md](CLAUDE.md).

## Licencia

[MIT](LICENSE) © 2026 Equipo PEH Toolkit, con atribución a Fabrizzio Fatoruzzo como autor del marco teórico y del protocolo original.
