// pantallas/historial.js — historial de sesiones cerradas con filtros por
// fecha, contexto y código, y exportación de lo filtrado (RF-10, RF-11).

import { listarSesiones, filtrarHistorial } from '../almacen.js';
import { generarCsv, generarJson, descargarArchivo } from '../exportar.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';

let filtradas = [];

export function iniciarPantallaHistorial({ alVolver }) {
  document.querySelector('#boton-volver-historial').addEventListener('click', alVolver);

  const filtros = document.querySelector('#filtros-historial');
  filtros.addEventListener('submit', (evento) => evento.preventDefault());
  filtros.addEventListener('input', pintarHistorial);

  document.querySelector('#boton-historial-csv').addEventListener('click', () => {
    descargarArchivo(nombreArchivo('csv'), generarCsv(filtradas), 'text/csv;charset=utf-8');
  });
  document.querySelector('#boton-historial-json').addEventListener('click', () => {
    descargarArchivo(
      nombreArchivo('json'),
      generarJson(filtradas),
      'application/json;charset=utf-8',
    );
  });
}

export function abrirHistorial() {
  pintarHistorial();
}

function nombreArchivo(extension) {
  const hoy = new Date().toISOString().slice(0, 10);
  return `peh-sesiones-${hoy}.${extension}`;
}

function leerFiltros() {
  return {
    desde: document.querySelector('#filtro-desde').value,
    hasta: document.querySelector('#filtro-hasta').value,
    contexto: document.querySelector('#filtro-contexto').value,
    codigo: document.querySelector('#filtro-codigo').value,
  };
}

function pintarHistorial() {
  filtradas = filtrarHistorial(listarSesiones(), leerFiltros())
    .sort((a, b) => b.fechaCierre.localeCompare(a.fechaCierre));

  const resumen = document.querySelector('#historial-resumen');
  resumen.textContent =
    filtradas.length === 0
      ? 'No hay sesiones cerradas que coincidan con los filtros.'
      : `${filtradas.length} ${filtradas.length === 1 ? 'sesión cerrada' : 'sesiones cerradas'}.`;

  document.querySelector('#lista-historial').innerHTML = filtradas
    .map((sesion) => {
      const fecha = new Date(sesion.fechaCierre).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const detalle =
        sesion.peh === 1
          ? 'Explicabilidad demostrada'
          : `Falló: ${sesion.criteriosFallidos.join(', ')}`;
      return `
      <div class="tarjeta sesion-item">
        <div class="sesion-item-info">
          <strong>${sesion.codigoEvaluado}</strong> · ${NOMBRES_CONTEXTO[sesion.contexto]}
          <span class="sesion-item-detalle">${fecha} · ${detalle}</span>
        </div>
        <span class="insignia ${sesion.peh === 1 ? 'insignia-1' : 'insignia-0'}">
          PEH = ${sesion.peh}
        </span>
      </div>`;
    })
    .join('');

  const sinDatos = filtradas.length === 0;
  document.querySelector('#boton-historial-csv').disabled = sinDatos;
  document.querySelector('#boton-historial-json').disabled = sinDatos;
}
