// pantallas/acerca.js — pantalla «Acerca de»: qué es la app, autoría del
// protocolo (Fabrizzio Fatoruzzo), equipo y licencia MIT (RNF-05).
// El contenido es estático y vive en index.html; este módulo solo conecta
// el botón de volver, igual que el resto de las pantallas.

export function iniciarPantallaAcerca({ alVolver }) {
  document.querySelector('#boton-volver-acerca').addEventListener('click', alVolver);
}
