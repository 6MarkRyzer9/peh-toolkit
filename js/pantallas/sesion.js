// pantallas/sesion.js — pantalla de sesión: marcas C1-C4 con botones 1 y 0,
// corrección mientras la sesión está abierta, estado del veredicto (RF-04,
// RF-05, RN3) y cierre con confirmación (CU-07). Cada marca se guarda al
// instante (RNF-08). Incluye la pregunta sugerida con «Otra», «Editar» y
// «Agregar» (RF-02, RF-03): ediciones solo para la sesión, sin tocar el
// banco (RN7), las micro-guías con el botón «?» (RF-06) y «Pausar» para
// retomar la sesión más tarde desde la pantalla «Crear sesión».

import { CRITERIOS, calcularVeredicto } from '../motor.js';
import { guardarMarca, cerrarSesion, pausarSesion } from '../almacen.js';
import { cargarPreguntas, cargarMicroguias, TIPOS_LIPMAN } from '../banco.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';

export const NOMBRES_CRITERIOS = {
  C1: 'Apropiación del Lenguaje',
  C2: 'Reconstrucción Lógica',
  C3: 'Adecuación Disciplinar',
  C4: 'Responsabilidad Agéntica',
};

let sesion = null;
let avisarPausa = () => {};
let avisarCierre = () => {};

// Estado de la pregunta sugerida. Vive solo en memoria: la sesión no guarda
// qué se preguntó (requisito futuro) y las ediciones no tocan el banco (RN7).
let preguntas = [];
let indicePregunta = 0;
let textoPersonalizado = null;
let tipoPersonalizado = null; // tipo Lipman de la pregunta editada o agregada
let preguntaAgregada = false;
let modoEditor = null; // 'editar' | 'agregar' | null
let microguias = null; // micro-guías de los criterios (RF-06)

export function iniciarPantallaSesion({ alPausar, alCerrar }) {
  avisarPausa = alPausar;
  avisarCierre = alCerrar;
  construirCriterios();

  // Opciones del tipo Lipman para «Agregar», tomadas de banco.js para no
  // repetir la lista en el HTML.
  document.querySelector('#pregunta-tipo-campo').insertAdjacentHTML(
    'beforeend',
    Object.entries(TIPOS_LIPMAN)
      .map(([clave, nombre]) => `<option value="${clave}">${nombre}</option>`)
      .join(''),
  );

  document.querySelector('#lista-criterios').addEventListener('click', (evento) => {
    if (!sesion) {
      return;
    }
    const criterio = evento.target.closest('.criterio')?.dataset.criterio;
    const botonGuia = evento.target.closest('.boton-guia');
    if (botonGuia) {
      alternarGuia(criterio, botonGuia);
      return;
    }
    const botonMarca = evento.target.closest('.boton-marca');
    if (botonMarca) {
      marcar(criterio, Number(botonMarca.dataset.valor));
    }
  });

  // Las micro-guías se cargan una vez al entrar a la pantalla (RF-06).
  cargarMicroguias()
    .then((guias) => {
      microguias = guias;
    })
    .catch((error) => console.warn(error));

  // Atajos de teclado (RNF-14): 1-4 marcan «cumple», Shift+1-4 «no cumple»
  // y C intenta cerrar la sesión.
  document.addEventListener('keydown', (evento) => {
    if (!sesion || pantallaOculta() || evento.target.matches('input, textarea, select')) {
      return;
    }
    if (evento.code === 'KeyC') {
      evento.preventDefault();
      intentarCerrar();
      return;
    }
    const digito = /^(?:Digit|Numpad)([1-4])$/.exec(evento.code);
    if (!digito) {
      return;
    }
    evento.preventDefault();
    marcar(`C${digito[1]}`, evento.shiftKey ? 0 : 1);
  });

  document.querySelector('#boton-cerrar').addEventListener('click', intentarCerrar);

  // Pregunta sugerida (RF-02, RF-03).
  document.querySelector('#boton-otra').addEventListener('click', () => {
    textoPersonalizado = null;
    tipoPersonalizado = null;
    preguntaAgregada = false;
    if (preguntas.length > 0) {
      indicePregunta = (indicePregunta + 1) % preguntas.length;
    }
    cerrarEditor();
    mostrarPregunta();
  });

  document.querySelector('#boton-editar').addEventListener('click', () => {
    abrirEditor('editar', document.querySelector('#pregunta-texto').textContent);
  });

  document.querySelector('#boton-agregar').addEventListener('click', () => {
    abrirEditor('agregar', '');
  });

  document.querySelector('#boton-usar').addEventListener('click', () => {
    const texto = document.querySelector('#pregunta-campo').value.trim();
    if (!texto) {
      return;
    }
    // Al agregar, el tipo es el que se eligió (o ninguno); al editar, la
    // pregunta conserva el tipo que tenía.
    tipoPersonalizado =
      modoEditor === 'agregar'
        ? document.querySelector('#pregunta-tipo-campo').value || null
        : tipoMostrado();
    textoPersonalizado = texto;
    preguntaAgregada = modoEditor === 'agregar';
    cerrarEditor();
    mostrarPregunta();
  });

  document.querySelector('#boton-cancelar-edicion').addEventListener('click', cerrarEditor);

  // Pausar guarda la sesión tal como va para retomarla después. Es
  // reversible, así que no pide confirmación.
  document.querySelector('#boton-pausar').addEventListener('click', () => {
    if (!sesion) {
      return;
    }
    pausarSesion(sesion.id);
    sesion = null;
    avisarPausa();
  });
}

export function abrirSesion(nueva) {
  sesion = nueva;
  pintar();
  prepararPreguntas();
}

async function prepararPreguntas() {
  preguntas = [];
  indicePregunta = 0;
  textoPersonalizado = null;
  tipoPersonalizado = null;
  preguntaAgregada = false;
  cerrarEditor();
  try {
    preguntas = await cargarPreguntas(sesion.contexto);
  } catch (error) {
    console.warn(error);
  }
  mostrarPregunta();
}

function mostrarPregunta() {
  const tipo = document.querySelector('#pregunta-tipo');
  const texto = document.querySelector('#pregunta-texto');

  if (textoPersonalizado) {
    const origen = preguntaAgregada ? 'Pregunta propia' : 'Pregunta editada';
    const nombreTipo = tipoPersonalizado ? ` · ${TIPOS_LIPMAN[tipoPersonalizado]}` : '';
    tipo.textContent = `${origen}${nombreTipo} · solo esta sesión`;
    texto.textContent = textoPersonalizado;
  } else if (preguntas.length > 0) {
    const pregunta = preguntas[indicePregunta];
    tipo.textContent = `Pregunta sugerida · ${TIPOS_LIPMAN[pregunta.tipo]}`;
    texto.textContent = pregunta.texto;
  } else {
    tipo.textContent = 'Banco de preguntas';
    texto.textContent =
      'No hay preguntas para este contexto. Puedes agregar una con «Agregar».';
  }
}

// Tipo Lipman de la pregunta que está en pantalla, o null si no tiene.
function tipoMostrado() {
  if (textoPersonalizado) {
    return tipoPersonalizado;
  }
  return preguntas[indicePregunta]?.tipo ?? null;
}

function abrirEditor(modo, textoInicial) {
  modoEditor = modo;
  const campo = document.querySelector('#pregunta-campo');
  campo.value = textoInicial;
  // El selector de tipo aparece solo al agregar (CU-03, flujo 1a).
  document.querySelector('#pregunta-tipo-elegir').classList.toggle('oculto', modo !== 'agregar');
  document.querySelector('#pregunta-tipo-campo').value = '';
  document.querySelector('#pregunta-editor').classList.remove('oculto');
  document.querySelector('#pregunta-acciones').classList.add('oculto');
  campo.focus();
}

function cerrarEditor() {
  modoEditor = null;
  document.querySelector('#pregunta-editor').classList.add('oculto');
  document.querySelector('#pregunta-acciones').classList.remove('oculto');
}

function pantallaOculta() {
  return document.querySelector('#pantalla-sesion').classList.contains('oculto');
}

function marcar(criterio, valor) {
  sesion = guardarMarca(sesion.id, criterio, valor);
  pintar();
}

// CU-07: pide confirmar, calcula el veredicto con el motor y guarda la
// sesión como registro inmutable. Solo procede con los cuatro criterios
// marcados (RN3): antes de eso el botón está deshabilitado.
function intentarCerrar() {
  const resultado = calcularVeredicto(sesion.marcas);
  if (!resultado.completo) {
    return;
  }
  const seguro = window.confirm(
    'Se calculará el veredicto y el registro no se podrá modificar. ¿Cerrar la sesión?',
  );
  if (!seguro) {
    return;
  }
  const cerrada = cerrarSesion(sesion.id, {
    peh: resultado.peh,
    criteriosFallidos: resultado.fallidos,
  });
  sesion = null;
  avisarCierre(cerrada);
}

function construirCriterios() {
  const contenedor = document.querySelector('#lista-criterios');
  contenedor.innerHTML = CRITERIOS.map(
    (criterio) => `
    <div class="tarjeta criterio" data-criterio="${criterio}">
      <div class="criterio-fila">
        <div class="criterio-info">
          <span class="criterio-codigo">${criterio}</span>
          <span class="criterio-nombre">${NOMBRES_CRITERIOS[criterio]}</span>
          <span class="criterio-estado" data-estado>sin evaluar</span>
        </div>
        <div class="botones-marca" role="group" aria-label="Marca de ${criterio}">
          <button type="button" class="boton-guia boton-suave" aria-expanded="false"
            aria-controls="guia-${criterio}" aria-label="Micro-guía de ${criterio}">?</button>
          <button type="button" class="boton-marca" data-valor="1"
            aria-pressed="false" aria-label="${criterio} cumple">1</button>
          <button type="button" class="boton-marca" data-valor="0"
            aria-pressed="false" aria-label="${criterio} no cumple">0</button>
        </div>
      </div>
      <div class="microguia-panel oculto" id="guia-${criterio}"></div>
    </div>`,
  ).join('');
}

// Muestra u oculta la micro-guía del criterio sin tapar los botones de
// marca (CU-05): el panel se abre dentro de la misma tarjeta.
function alternarGuia(criterio, boton) {
  const panel = document.querySelector(`#guia-${criterio}`);
  const abrir = panel.classList.contains('oculto');
  if (abrir && panel.childElementCount === 0) {
    const guia = microguias?.[criterio];
    panel.innerHTML = guia
      ? `<p><strong>Vale 1:</strong> ${guia.cumple}</p>
         <p><strong>Vale 0:</strong> ${guia.noCumple}</p>`
      : '<p>Micro-guía no disponible.</p>';
  }
  panel.classList.toggle('oculto', !abrir);
  boton.setAttribute('aria-expanded', String(abrir));
}

function pintar() {
  document.querySelector('#sesion-info').textContent =
    `${NOMBRES_CONTEXTO[sesion.contexto]} · Evaluado ${sesion.codigoEvaluado} · En curso`;

  for (const criterio of CRITERIOS) {
    const valor = sesion.marcas[criterio];
    const fila = document.querySelector(`.criterio[data-criterio="${criterio}"]`);

    // El estado se indica con texto además del color (RNF-14).
    fila.querySelector('[data-estado]').textContent =
      valor === 1 ? 'cumple (1)' : valor === 0 ? 'no cumple (0)' : 'sin evaluar';

    for (const boton of fila.querySelectorAll('.boton-marca')) {
      boton.setAttribute('aria-pressed', String(Number(boton.dataset.valor) === valor));
    }
  }

  const resultado = calcularVeredicto(sesion.marcas);
  const estado = document.querySelector('#estado-veredicto');
  if (resultado.completo) {
    estado.textContent = 'Los cuatro criterios tienen valor. Puedes cerrar la sesión.';
  } else {
    const plural = resultado.faltan.length > 1 ? 'Faltan' : 'Falta';
    estado.textContent = `Veredicto pendiente. ${plural}: ${resultado.faltan.join(', ')}.`;
  }

  // «Cerrar sesión» se habilita solo con los cuatro criterios marcados (RN3).
  document.querySelector('#boton-cerrar').disabled = !resultado.completo;
}
