// pantallas/crear-sesion.js — pantalla «Crear sesión»: elegir contexto
// e ingresar el código del evaluado (RF-01). También muestra las sesiones
// pausadas, con «Retomar» y «Descartar».

import {
  crearSesion,
  listarSesiones,
  retomarSesion,
  descartarSesion,
  PATRON_CODIGO,
} from '../almacen.js';

export const NOMBRES_CONTEXTO = {
  aula: 'Aula escolar',
  catedra: 'Cátedra universitaria',
  rrhh: 'Entrevista técnica de RRHH',
};

let avisarRetomar = () => {};

export function iniciarCrearSesion({ alCrear, alRetomar }) {
  avisarRetomar = alRetomar;
  const formulario = document.querySelector('#form-crear-sesion');
  const campoCodigo = document.querySelector('#codigo-evaluado');
  const botonCrear = document.querySelector('#boton-crear');

  function leerContexto() {
    const marcado = formulario.querySelector('input[name="contexto"]:checked');
    return marcado ? marcado.value : null;
  }

  function actualizarEstado() {
    const codigoOk = PATRON_CODIGO.test(campoCodigo.value.trim());
    botonCrear.disabled = !(leerContexto() && codigoOk);
  }

  formulario.addEventListener('input', actualizarEstado);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const sesion = crearSesion({
      contexto: leerContexto(),
      codigoEvaluado: campoCodigo.value,
    });
    formulario.reset();
    actualizarEstado();
    alCrear(sesion);
  });

  // «Retomar» y «Descartar» de las sesiones pausadas, por delegación.
  document.querySelector('#lista-pausadas').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) {
      return;
    }
    const id = boton.closest('[data-id]').dataset.id;
    if (boton.dataset.accion === 'retomar') {
      avisarRetomar(retomarSesion(id));
      return;
    }
    const seguro = window.confirm('¿Descartar esta sesión pausada y todas sus marcas?');
    if (seguro) {
      descartarSesion(id);
      pintarPausadas();
    }
  });

  actualizarEstado();
}

// Se llama cada vez que se vuelve a esta pantalla, para que la lista
// de pausadas esté siempre al día.
export function abrirCrearSesion() {
  pintarPausadas();
}

function pintarPausadas() {
  const pausadas = listarSesiones().filter((sesion) => sesion.estado === 'pausada');
  const contenedor = document.querySelector('#lista-pausadas');

  if (pausadas.length === 0) {
    contenedor.innerHTML = '';
    return;
  }

  const items = pausadas
    .map((sesion) => {
      const inicio = new Date(sesion.fechaInicio).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const marcados = Object.values(sesion.marcas).filter(
        (valor) => valor === 1 || valor === 0,
      ).length;
      return `
      <div class="tarjeta sesion-item" data-id="${sesion.id}">
        <div class="sesion-item-info">
          <strong>${sesion.codigoEvaluado}</strong> · ${NOMBRES_CONTEXTO[sesion.contexto]}
          <span class="sesion-item-detalle">Iniciada ${inicio} · ${marcados} de 4 criterios marcados</span>
        </div>
        <div class="pausada-acciones">
          <button type="button" data-accion="retomar">Retomar</button>
          <button type="button" data-accion="descartar" class="boton-enlace enlace-en-tarjeta">
            Descartar
          </button>
        </div>
      </div>`;
    })
    .join('');

  contenedor.innerHTML = `<h2 class="titulo-pausadas">Sesiones en pausa</h2>${items}`;
}
