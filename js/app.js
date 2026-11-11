// app.js — punto de entrada: navegación entre pantallas.

import { obtenerSesionActiva } from './almacen.js';
import { iniciarCrearSesion } from './pantallas/crear-sesion.js';
import { iniciarPantallaSesion, abrirSesion } from './pantallas/sesion.js';

const pantallas = {
  crear: document.querySelector('#pantalla-crear'),
  sesion: document.querySelector('#pantalla-sesion'),
};

function navegar(nombre) {
  for (const [clave, seccion] of Object.entries(pantallas)) {
    seccion.classList.toggle('oculto', clave !== nombre);
  }
}

iniciarCrearSesion({
  alCrear(sesion) {
    abrirSesion(sesion);
    navegar('sesion');
  },
});

iniciarPantallaSesion({
  alDescartar() {
    navegar('crear');
  },
});

// Si hay una sesión en curso, se retoma al abrir la app: así ninguna marca
// se pierde por recargar o cerrar el navegador sin querer (RNF-08).
const sesionActiva = obtenerSesionActiva();
if (sesionActiva) {
  abrirSesion(sesionActiva);
  navegar('sesion');
} else {
  navegar('crear');
}
