// pantallas/crear-sesion.js — pantalla «Crear sesión»: elegir contexto
// e ingresar el código del evaluado (RF-01).

import { crearSesion, PATRON_CODIGO } from '../almacen.js';

export const NOMBRES_CONTEXTO = {
  aula: 'Aula escolar',
  catedra: 'Cátedra universitaria',
  rrhh: 'Entrevista técnica de RRHH',
};

export function iniciarCrearSesion({ alCrear }) {
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

  actualizarEstado();
}
