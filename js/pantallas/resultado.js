// pantallas/resultado.js — pantalla de resultado: veredicto, criterio o
// criterios fallidos con su micro-guía y las cuatro marcas (RF-08, CU-09).
// Pendiente: exportar CSV y JSON (RF-11).

import { CRITERIOS } from '../motor.js';
import { cargarMicroguias } from '../banco.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';
import { NOMBRES_CRITERIOS } from './sesion.js';

export function iniciarPantallaResultado({ alNuevaSesion }) {
  document.querySelector('#boton-nueva-sesion').addEventListener('click', alNuevaSesion);
}

export async function mostrarResultado(sesion) {
  const fecha = new Date(sesion.fechaCierre).toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  document.querySelector('#resultado-info').textContent =
    `${NOMBRES_CONTEXTO[sesion.contexto]} · Evaluado ${sesion.codigoEvaluado} · Cerrada ${fecha}`;

  const tarjeta = document.querySelector('#veredicto-tarjeta');
  const aprobada = sesion.peh === 1;
  tarjeta.classList.toggle('veredicto-aprobado', aprobada);
  tarjeta.classList.toggle('veredicto-rechazado', !aprobada);
  tarjeta.querySelector('.veredicto-titulo').textContent = `Veredicto PEH = ${sesion.peh}`;
  tarjeta.querySelector('.veredicto-detalle').textContent = aprobada
    ? 'Explicabilidad demostrada'
    : 'No se demuestra explicabilidad';

  document.querySelector('#resultado-marcas').textContent = CRITERIOS.map(
    (criterio) => `${criterio} = ${sesion.marcas[criterio]}`,
  ).join('  ·  ');

  // Micro-guía de cada criterio fallido (CU-09). Si el archivo no carga,
  // se muestran igual los criterios, solo sin la guía.
  let microguias = null;
  try {
    microguias = await cargarMicroguias();
  } catch (error) {
    console.warn(error);
  }

  document.querySelector('#lista-fallidos').innerHTML = sesion.criteriosFallidos
    .map((criterio) => {
      const guia = microguias?.[criterio];
      const detalle = guia
        ? `<p class="microguia">Micro-guía · Vale 1: ${guia.cumple} Vale 0: ${guia.noCumple}</p>`
        : '';
      return `
      <div class="tarjeta fallido">
        <strong>Falló: ${criterio} · ${NOMBRES_CRITERIOS[criterio]}</strong>
        ${detalle}
      </div>`;
    })
    .join('');
}
