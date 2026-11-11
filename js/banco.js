// banco.js — carga de datos desde data/: las preguntas del banco
// (data/banco.json, RF-02) y las micro-guías (data/microguias.json, RF-06).
// El banco se amplía editando el JSON, sin tocar código (RNF-09).

export const TIPOS_LIPMAN = {
  proceso: 'Proceso',
  contrafactual: 'Contrafactual',
  justificacion: 'Justificación',
  clarificacion: 'Clarificación semántica',
};

let preguntas = null;
let microguias = null;

// Devuelve las preguntas activas del contexto pedido.
// Se descargan una sola vez y quedan en memoria.
export async function cargarPreguntas(contexto) {
  if (!preguntas) {
    const respuesta = await fetch('data/banco.json');
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar el banco de preguntas (HTTP ${respuesta.status})`);
    }
    preguntas = (await respuesta.json()).preguntas;
  }
  return preguntas.filter((p) => p.activa && p.contexto === contexto);
}

// Devuelve { C1: { nombre, cumple, noCumple }, ... }.
// Se descarga una sola vez y queda en memoria.
export async function cargarMicroguias() {
  if (!microguias) {
    const respuesta = await fetch('data/microguias.json');
    if (!respuesta.ok) {
      throw new Error(`No se pudieron cargar las micro-guías (HTTP ${respuesta.status})`);
    }
    microguias = (await respuesta.json()).criterios;
  }
  return microguias;
}
