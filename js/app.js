// app.js — punto de entrada: navegación entre pantallas.

import { obtenerSesionActiva } from './almacen.js';
import { iniciarCrearSesion } from './pantallas/crear-sesion.js';
import { iniciarPantallaSesion, abrirSesion } from './pantallas/sesion.js';
import { iniciarPantallaResultado, mostrarResultado } from './pantallas/resultado.js';
import { iniciarPantallaHistorial, abrirHistorial } from './pantallas/historial.js';
import { iniciarPantallaAcerca } from './pantallas/acerca.js';

const pantallas = {
  crear: document.querySelector('#pantalla-crear'),
  sesion: document.querySelector('#pantalla-sesion'),
  resultado: document.querySelector('#pantalla-resultado'),
  historial: document.querySelector('#pantalla-historial'),
  acerca: document.querySelector('#pantalla-acerca'),
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
  alCerrar(sesionCerrada) {
    mostrarResultado(sesionCerrada);
    navegar('resultado');
  },
});

iniciarPantallaResultado({
  alNuevaSesion() {
    navegar('crear');
  },
});

iniciarPantallaHistorial({
  alVolver() {
    navegar('crear');
  },
});

iniciarPantallaAcerca({
  alVolver() {
    navegar('crear');
  },
});

document.querySelector('#boton-ver-historial').addEventListener('click', () => {
  abrirHistorial();
  navegar('historial');
});

document.querySelector('#boton-ver-acerca').addEventListener('click', () => {
  navegar('acerca');
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

// PWA: el service worker guarda una copia de la app para funcionar sin
// internet (RNF-06, RNF-08). Si el navegador no lo soporta o el registro
// falla, la app sigue funcionando igual, solo que necesita conexión.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
