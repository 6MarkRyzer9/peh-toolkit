// banco.js — carga de datos desde data/: por ahora las micro-guías
// (data/microguias.json). Las preguntas (data/banco.json) llegan con la
// pantalla de pregunta sugerida (RF-02).

let microguias = null;

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
