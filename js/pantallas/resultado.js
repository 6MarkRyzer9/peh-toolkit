// pantallas/resultado.js — pantalla de resultado: veredicto, criterio o
// criterios fallidos con su micro-guía, las cuatro marcas y exportación a
// CSV y JSON (RF-08, RF-11, CU-09).

import { CRITERIOS } from '../motor.js';
import { cargarMicroguias, microguiaEnLinea } from '../banco.js';
import { generarCsv, generarJson, descargarArchivo } from '../exportar.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';
import { NOMBRES_CRITERIOS, crearVersionAmpliada } from './sesion.js';

let sesionMostrada = null;

export function iniciarPantallaResultado({ alNuevaSesion }) {
  document.querySelector('#boton-nueva-sesion').addEventListener('click', alNuevaSesion);

  document.querySelector('#boton-exportar-csv').addEventListener('click', () => {
    descargarArchivo(
      nombreArchivo('csv'),
      generarCsv([sesionMostrada]),
      'text/csv;charset=utf-8',
    );
  });

  document.querySelector('#boton-exportar-json').addEventListener('click', () => {
    descargarArchivo(
      nombreArchivo('json'),
      generarJson([sesionMostrada]),
      'application/json;charset=utf-8',
    );
  });
}

function nombreArchivo(extension) {
  const fecha = sesionMostrada.fechaCierre.slice(0, 10);
  return `peh-sesion-${sesionMostrada.codigoEvaluado}-${fecha}.${extension}`;
}

export async function mostrarResultado(sesion) {
  sesionMostrada = sesion;
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

  const tarjetas = sesion.criteriosFallidos.map((criterio) => tarjetaFallido(criterio, microguias));
  document.querySelector('#lista-fallidos').replaceChildren(...tarjetas);
}

// Tarjeta de un criterio fallido: su nombre, la micro-guía en una línea y,
// si la tiene (hoy C3), la versión ampliada que se abre con un toque.
function tarjetaFallido(criterio, microguias) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta fallido';
  const titulo = document.createElement('strong');
  titulo.textContent = `Falló: ${criterio} · ${NOMBRES_CRITERIOS[criterio]}`;
  tarjeta.append(titulo);

  const guia = microguias?.[criterio];
  if (guia) {
    const detalle = document.createElement('p');
    detalle.className = 'microguia';
    detalle.textContent = `Micro-guía · ${microguiaEnLinea(guia.parrafos)}`;
    tarjeta.append(detalle);
    if (guia.ampliada) {
      tarjeta.append(crearVersionAmpliada(guia));
    }
  }
  return tarjeta;
}
