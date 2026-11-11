// pantallas/sesion.js — pantalla de sesión: marcas C1-C4 con botones 1 y 0,
// corrección mientras la sesión está abierta, estado del veredicto (RF-04,
// RF-05, RN3) y cierre con confirmación (CU-07). Cada marca se guarda al
// instante (RNF-08). Incluye la pregunta sugerida con «Otra», «Editar» y
// «Agregar» (RF-02, RF-03): ediciones solo para la sesión, sin tocar el
// banco (RN7).
// Pendiente: micro-guías con el botón «?» dentro de la sesión (RF-06).

import { CRITERIOS, calcularVeredicto } from '../motor.js';
import { guardarMarca, cerrarSesion, descartarSesion } from '../almacen.js';
import { cargarPreguntas, TIPOS_LIPMAN } from '../banco.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';

export const NOMBRES_CRITERIOS = {
  C1: 'Apropiación del Lenguaje',
  C2: 'Reconstrucción Lógica',
  C3: 'Adecuación Disciplinar',
  C4: 'Responsabilidad Agéntica',
};

let sesion = null;
let avisarDescarte = () => {};
let avisarCierre = () => {};

// Estado de la pregunta sugerida. Vive solo en memoria: la sesión no guarda
// qué se preguntó (requisito futuro) y las ediciones no tocan el banco (RN7).
let preguntas = [];
let indicePregunta = 0;
let textoPersonalizado = null;
let preguntaAgregada = false;
let modoEditor = null; // 'editar' | 'agregar' | null

export function iniciarPantallaSesion({ alDescartar, alCerrar }) {
  avisarDescarte = alDescartar;
  avisarCierre = alCerrar;
  construirCriterios();

  document.querySelector('#lista-criterios').addEventListener('click', (evento) => {
    const boton = evento.target.closest('.boton-marca');
    if (!boton || !sesion) {
      return;
    }
    const criterio = boton.closest('.criterio').dataset.criterio;
    marcar(criterio, Number(boton.dataset.valor));
  });

  // Atajos de teclado (RNF-14): 1-4 marcan «cumple», Shift+1-4 «no cumple»
  // y C intenta cerrar la sesión.
  document.addEventListener('keydown', (evento) => {
    if (!sesion || pantallaOculta() || evento.target.matches('input, textarea')) {
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
    textoPersonalizado = texto;
    preguntaAgregada = modoEditor === 'agregar';
    cerrarEditor();
    mostrarPregunta();
  });

  document.querySelector('#boton-cancelar-edicion').addEventListener('click', cerrarEditor);

  document.querySelector('#boton-descartar').addEventListener('click', () => {
    if (!sesion) {
      return;
    }
    const seguro = window.confirm('¿Descartar esta sesión y todas sus marcas?');
    if (!seguro) {
      return;
    }
    descartarSesion(sesion.id);
    sesion = null;
    avisarDescarte();
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
    tipo.textContent = preguntaAgregada
      ? 'Pregunta propia · solo esta sesión'
      : 'Pregunta editada · solo esta sesión';
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

function abrirEditor(modo, textoInicial) {
  modoEditor = modo;
  const campo = document.querySelector('#pregunta-campo');
  campo.value = textoInicial;
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
      <div class="criterio-info">
        <span class="criterio-codigo">${criterio}</span>
        <span class="criterio-nombre">${NOMBRES_CRITERIOS[criterio]}</span>
        <span class="criterio-estado" data-estado>sin evaluar</span>
      </div>
      <div class="botones-marca" role="group" aria-label="Marca de ${criterio}">
        <button type="button" class="boton-marca" data-valor="1"
          aria-pressed="false" aria-label="${criterio} cumple">1</button>
        <button type="button" class="boton-marca" data-valor="0"
          aria-pressed="false" aria-label="${criterio} no cumple">0</button>
      </div>
    </div>`,
  ).join('');
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
