// pantallas/sesion.js — pantalla de sesión: marcas C1-C4 con botones 1 y 0,
// corrección mientras la sesión está abierta y estado del veredicto (RF-04,
// RF-05, RN3). Cada marca se guarda al instante (RNF-08).
// Pendiente: pregunta sugerida, micro-guías y cierre de sesión.

import { CRITERIOS, calcularVeredicto } from '../motor.js';
import { guardarMarca, descartarSesion } from '../almacen.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';

export const NOMBRES_CRITERIOS = {
  C1: 'Apropiación del Lenguaje',
  C2: 'Reconstrucción Lógica',
  C3: 'Adecuación Disciplinar',
  C4: 'Responsabilidad Agéntica',
};

let sesion = null;
let avisarDescarte = () => {};

export function iniciarPantallaSesion({ alDescartar }) {
  avisarDescarte = alDescartar;
  construirCriterios();

  document.querySelector('#lista-criterios').addEventListener('click', (evento) => {
    const boton = evento.target.closest('.boton-marca');
    if (!boton || !sesion) {
      return;
    }
    const criterio = boton.closest('.criterio').dataset.criterio;
    marcar(criterio, Number(boton.dataset.valor));
  });

  // Atajos de teclado (RNF-14): 1-4 marcan «cumple», Shift+1-4 «no cumple».
  document.addEventListener('keydown', (evento) => {
    if (!sesion || pantallaOculta() || evento.target.matches('input, textarea')) {
      return;
    }
    const digito = /^(?:Digit|Numpad)([1-4])$/.exec(evento.code);
    if (!digito) {
      return;
    }
    evento.preventDefault();
    marcar(`C${digito[1]}`, evento.shiftKey ? 0 : 1);
  });

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
}

function pantallaOculta() {
  return document.querySelector('#pantalla-sesion').classList.contains('oculto');
}

function marcar(criterio, valor) {
  sesion = guardarMarca(sesion.id, criterio, valor);
  pintar();
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
    estado.textContent =
      'Los cuatro criterios tienen valor. «Cerrar sesión» calculará el veredicto (siguiente paso).';
  } else {
    const plural = resultado.faltan.length > 1 ? 'Faltan' : 'Falta';
    estado.textContent = `Veredicto pendiente. ${plural}: ${resultado.faltan.join(', ')}.`;
  }
}
