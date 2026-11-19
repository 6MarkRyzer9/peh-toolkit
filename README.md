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

- Funciona en el navegador, sin internet y sin servidores: los datos viven solo en el dispositivo del evaluador. Se puede instalar como app (PWA).
- El evaluado se identifica únicamente con un código alfanumérico (sin nombre, RUT ni contacto).
- Preguntas sugeridas por contexto y tipo Lipman, que se pueden editar o agregar durante la sesión sin tocar el banco.
- Micro-guía de cada criterio, pausar y retomar sesiones, y cierre con confirmación.
- Sesiones cerradas inmutables, historial con filtros y exportación a CSV (compatible con Excel) y JSON.
- Importación de un banco de preguntas propio desde un archivo JSON.
- Si el navegador no deja guardar, la app avisa y ofrece un respaldo: nunca pierde la sesión.
- Móvil primero (desde 360 px), botones grandes y atajos de teclado.
- Respuesta táctil inspirada en Liquid Glass de Apple: las tarjetas y botones se comprimen y rebotan con resortes físicos, y un brillo sigue el dedo. El diseño no cambia en reposo, y con «reducir movimiento» activado no hay animaciones.

## Tecnología

HTML, CSS y JavaScript con módulos ES, sin frameworks ni paso de build. Datos en `localStorage`. PWA para uso sin conexión.

## Probar la app

- Versión publicada (GitHub Pages): <https://6markryzer9.github.io/peh-toolkit/>
- En tu computador, desde la carpeta del proyecto, levanta un servidor estático y abre <http://localhost:8000>:

```bash
python -m http.server 8000
```

Si después de un cambio el navegador muestra una versión vieja, recarga con Ctrl+Shift+R.

## Pruebas

```bash
node --test
```

Requiere Node 18 o superior y no usa dependencias. Cubren el motor (las 16 combinaciones y los casos «sin evaluar»), el almacenamiento, la exportación, la validación del banco y el resorte de las animaciones.

## Banco de preguntas

El banco incluido está en `data/banco.json`. Para probar otro banco sin tocar el código, en la app entra a **Banco de preguntas → Importar banco (JSON)**. El archivo debe tener este formato:

```json
{
  "preguntas": [
    {
      "id": "catedra-contrafactual-1",
      "contexto": "catedra",
      "tipo": "contrafactual",
      "texto": "¿Qué cambiaría en tu solución si el supuesto principal fuera falso?",
      "activa": true
    }
  ]
}
```

- `contexto`: `aula`, `catedra` o `rrhh`.
- `tipo`: `proceso`, `contrafactual`, `justificacion` o `clarificacion`.
- `id` único; `activa` en `false` oculta la pregunta sin borrarla.

La app revisa el archivo antes de aceptarlo y explica qué corregir. El banco importado queda solo en ese dispositivo. **Descargar banco en uso** entrega una plantilla con el formato correcto.

## Equipo

Vicente Álvarez, Katalina Cossio, Marving Ponce y Renzo Rodríguez.
Proyecto del ramo Ingeniería de Software, Universidad Alberto Hurtado, 2026.

## Cómo colaborar (equipo)

1. Clonar el repositorio: `git clone https://github.com/6MarkRyzer9/peh-toolkit.git`
2. Crear una rama por tarea: `git checkout -b nombre-de-la-tarea`
3. Hacer commits pequeños y abrir un *pull request* hacia `main` para que otra persona lo revise.
4. Antes de subir, correr las pruebas: `node --test`
5. El estado del proyecto (lo hecho, lo pendiente y el siguiente paso) está en [PROGRESO.md](PROGRESO.md).

Los requisitos viven en `docs/Hito2_SRS_PEH_Toolkit_v2.1.pdf` y las reglas de trabajo en [CLAUDE.md](CLAUDE.md).

## Licencia

[MIT](LICENSE) © 2026 Equipo PEH Toolkit, con atribución a Fabrizzio Fatoruzzo como autor del marco teórico y del protocolo original.
