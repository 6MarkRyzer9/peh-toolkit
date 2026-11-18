// pantallas/banco-preguntas.js — pantalla «Banco de preguntas» (RF-13):
// muestra qué banco se está usando y cuántas preguntas activas tiene por
// contexto y tipo, permite importar uno nuevo desde un archivo JSON,
// descargar el banco en uso como plantilla y volver al banco incluido.
// El banco importado se guarda solo en este dispositivo (RNF-11) y se lee
// desde un archivo local, sin conexión (RNF-04).

import {
  CONTEXTOS,
  guardarBancoImportado,
  borrarBancoImportado,
  ErrorAlmacenamiento,
} from '../almacen.js';
import { obtenerBancoEnUso, validarBanco, resumirBanco, TIPOS_LIPMAN } from '../banco.js';
import { descargarArchivo } from '../exportar.js';
import { NOMBRES_CONTEXTO } from './crear-sesion.js';

const TAMANO_MAXIMO = 1024 * 1024; // 1 MB: un banco de cientos de preguntas pesa mucho menos
const ERRORES_VISIBLES = 8;

export function iniciarPantallaBanco({ alVolver }) {
  document.querySelector('#boton-volver-banco').addEventListener('click', alVolver);

  const selector = document.querySelector('#archivo-banco');
  document.querySelector('#boton-importar-banco').addEventListener('click', () => {
    selector.click();
  });
  selector.addEventListener('change', async () => {
    const archivo = selector.files[0];
    selector.value = ''; // permite volver a elegir el mismo archivo después de corregirlo
    if (archivo) {
      await importar(archivo);
    }
  });

  document.querySelector('#boton-descargar-banco').addEventListener('click', descargarBancoEnUso);
  document.querySelector('#boton-restaurar-banco').addEventListener('click', restaurar);
}

export async function abrirBanco() {
  mostrarMensaje(null);
  await pintarBanco();
}

async function importar(archivo) {
  if (archivo.size > TAMANO_MAXIMO) {
    mostrarMensaje('error', 'No se importó el banco.', [
      `«${archivo.name}» pesa más de 1 MB: no parece un banco de preguntas.`,
    ]);
    return;
  }

  let datos;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    mostrarMensaje('error', 'No se importó el banco.', [
      `«${archivo.name}» no es un archivo JSON válido.`,
    ]);
    return;
  }

  const revision = validarBanco(datos);
  if (!revision.ok) {
    mostrarMensaje(
      'error',
      'No se importó el banco. Corrige estos problemas y vuelve a intentarlo:',
      revision.errores,
    );
    return;
  }

  try {
    guardarBancoImportado({ preguntas: revision.preguntas, nombreArchivo: archivo.name });
  } catch (error) {
    if (!(error instanceof ErrorAlmacenamiento)) {
      throw error;
    }
    mostrarMensaje('error', 'No se importó el banco.', [error.message]);
    return;
  }

  mostrarMensaje(
    'ok',
    `Banco importado: ${revision.preguntas.length} preguntas. Se usa desde la próxima sesión.`,
    revision.avisos,
  );
  await pintarBanco();
}

async function descargarBancoEnUso() {
  const { preguntas } = await obtenerBancoEnUso();
  descargarArchivo(
    'peh-banco-preguntas.json',
    JSON.stringify({ preguntas }, null, 2),
    'application/json;charset=utf-8',
  );
}

async function restaurar() {
  const seguro = window.confirm(
    '¿Volver al banco incluido en la app? El banco importado se borrará de este dispositivo.',
  );
  if (!seguro) {
    return;
  }
  borrarBancoImportado();
  mostrarMensaje('ok', 'Se volvió al banco incluido en la app.', []);
  await pintarBanco();
}

async function pintarBanco() {
  const origen = document.querySelector('#banco-origen');
  const lista = document.querySelector('#banco-resumen');
  let banco;
  try {
    banco = await obtenerBancoEnUso();
  } catch (error) {
    console.warn(error);
    origen.textContent = 'No se pudo cargar el banco incluido en la app.';
    lista.replaceChildren();
    return;
  }

  // Los textos que vienen del archivo importado se insertan siempre como
  // texto (textContent), nunca como HTML.
  if (banco.origen === 'importado') {
    const fecha = new Date(banco.importadoEl).toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    origen.textContent = `Importado desde «${banco.nombreArchivo}» · ${fecha}`;
  } else {
    origen.textContent = 'Banco incluido en la app (data/banco.json).';
  }

  const resumen = resumirBanco(banco.preguntas);
  lista.replaceChildren(
    ...CONTEXTOS.map((contexto) => {
      const { total, porTipo } = resumen[contexto];
      const item = document.createElement('li');
      const nombre = document.createElement('strong');
      nombre.textContent = `${NOMBRES_CONTEXTO[contexto]}: ${total} ${total === 1 ? 'activa' : 'activas'}`;
      const detalle = document.createElement('span');
      detalle.className = 'resumen-detalle';
      detalle.textContent = Object.entries(TIPOS_LIPMAN)
        .map(([tipo, nombreTipo]) => `${nombreTipo} ${porTipo[tipo]}`)
        .join(' · ');
      item.append(nombre, detalle);
      return item;
    }),
  );

  document
    .querySelector('#boton-restaurar-banco')
    .classList.toggle('oculto', banco.origen !== 'importado');
}

// tipo: 'ok' | 'error' | null (oculta el mensaje).
function mostrarMensaje(tipo, titulo, lineas = []) {
  const caja = document.querySelector('#banco-mensaje');
  caja.classList.toggle('oculto', tipo === null);
  caja.classList.toggle('mensaje-error', tipo === 'error');
  caja.classList.toggle('mensaje-ok', tipo === 'ok');
  if (tipo === null) {
    caja.replaceChildren();
    return;
  }

  const encabezado = document.createElement('strong');
  encabezado.textContent = titulo;
  const partes = [encabezado];
  if (lineas.length > 0) {
    const lista = document.createElement('ul');
    for (const linea of lineas.slice(0, ERRORES_VISIBLES)) {
      const item = document.createElement('li');
      item.textContent = linea;
      lista.append(item);
    }
    if (lineas.length > ERRORES_VISIBLES) {
      const resto = document.createElement('li');
      resto.textContent = `… y ${lineas.length - ERRORES_VISIBLES} más.`;
      lista.append(resto);
    }
    partes.push(lista);
  }
  caja.replaceChildren(...partes);
}
