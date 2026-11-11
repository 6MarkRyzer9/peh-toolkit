// app.js — punto de entrada: navegación entre pantallas.
// Por ahora solo maneja la pantalla «Crear sesión» (RF-01), sin guardar datos.

const CODIGO_VALIDO = /^[A-Za-z0-9]{3,12}$/;

const formulario = document.querySelector('#form-crear-sesion');
const campoCodigo = document.querySelector('#codigo-evaluado');
const botonCrear = document.querySelector('#boton-crear');
const mensaje = document.querySelector('#mensaje');

const NOMBRES_CONTEXTO = {
  aula: 'Aula escolar',
  catedra: 'Cátedra universitaria',
  rrhh: 'Entrevista técnica de RRHH',
};

function leerContexto() {
  const marcado = formulario.querySelector('input[name="contexto"]:checked');
  return marcado ? marcado.value : null;
}

function actualizarEstado() {
  const codigoOk = CODIGO_VALIDO.test(campoCodigo.value.trim());
  botonCrear.disabled = !(leerContexto() && codigoOk);
}

formulario.addEventListener('input', actualizarEstado);

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const contexto = leerContexto();
  const codigo = campoCodigo.value.trim().toUpperCase();
  // Todavía sin guardar: solo confirma que la pantalla funciona.
  mensaje.textContent =
    `Sesión lista para crear: contexto «${NOMBRES_CONTEXTO[contexto]}», ` +
    `evaluado ${codigo}. (El guardado local llega en el siguiente paso.)`;
  mensaje.classList.remove('oculto');
});

actualizarEstado();
