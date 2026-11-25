// banco.js — carga de datos desde data/: las preguntas del banco
// (data/banco.json, RF-02) y las micro-guías (data/microguias.json, RF-06).
// No toca la pantalla: así se puede probar con node --test.
// El banco se amplía editando el JSON, sin tocar código (RNF-09), o
// importando un archivo con el mismo formato desde la app (RF-13).

import { CONTEXTOS, leerBancoImportado } from './almacen.js';

export const TIPOS_LIPMAN = {
  proceso: 'Proceso',
  contrafactual: 'Contrafactual',
  justificacion: 'Justificación',
  clarificacion: 'Clarificación semántica',
};

export const LARGO_MAXIMO_TEXTO = 500;

let bancoIncluido = null;
let microguias = null;

// Banco incluido en la app. Se descarga una sola vez y queda en memoria.
async function cargarBancoIncluido() {
  if (!bancoIncluido) {
    const respuesta = await fetch('data/banco.json');
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar el banco de preguntas (HTTP ${respuesta.status})`);
    }
    bancoIncluido = (await respuesta.json()).preguntas;
  }
  return bancoIncluido;
}

// Banco en uso: el importado en este dispositivo (RF-13) o, si no hay
// ninguno o está dañado, el incluido en la app.
export async function obtenerBancoEnUso() {
  const importado = leerBancoImportado();
  const revision = importado ? validarBanco(importado) : null;
  if (revision?.ok) {
    return {
      origen: 'importado',
      preguntas: revision.preguntas,
      nombreArchivo: importado.nombreArchivo,
      importadoEl: importado.importadoEl,
    };
  }
  return { origen: 'incluido', preguntas: await cargarBancoIncluido() };
}

// Devuelve las preguntas activas del contexto pedido.
export async function cargarPreguntas(contexto) {
  const { preguntas } = await obtenerBancoEnUso();
  return preguntas.filter((p) => p.activa && p.contexto === contexto);
}

// Revisa un banco antes de importarlo (RF-13). Acepta el mismo formato que
// data/banco.json: { "preguntas": [ { id, contexto, tipo, texto, activa } ] }.
// Función pura: devuelve los errores encontrados, numerados por pregunta, o
// las preguntas listas para usar (texto recortado; «activa» vale true si
// falta) junto con avisos que no impiden importar.
export function validarBanco(datos) {
  const lista = datos?.preguntas;
  if (!Array.isArray(lista)) {
    return rechazo([
      'El archivo debe tener la forma { "preguntas": [ … ] }, igual que data/banco.json.',
    ]);
  }
  if (lista.length === 0) {
    return rechazo(['El banco no tiene preguntas.']);
  }

  const errores = [];
  const ids = new Set();
  const preguntas = lista.map((pregunta, indice) => {
    const n = `Pregunta ${indice + 1}`;
    if (typeof pregunta !== 'object' || pregunta === null || Array.isArray(pregunta)) {
      errores.push(`${n}: debe ser un objeto con id, contexto, tipo, texto y activa.`);
      return null;
    }
    const { contexto, tipo, activa } = pregunta;
    const id = typeof pregunta.id === 'string' ? pregunta.id.trim() : '';
    const texto = typeof pregunta.texto === 'string' ? pregunta.texto.trim() : '';

    if (!id) {
      errores.push(`${n}: falta el «id».`);
    } else if (ids.has(id)) {
      errores.push(`${n}: el id «${id}» está repetido.`);
    }
    ids.add(id);
    if (!CONTEXTOS.includes(contexto)) {
      errores.push(`${n}: contexto «${String(contexto)}» no válido (usa aula, catedra o rrhh).`);
    }
    if (!Object.hasOwn(TIPOS_LIPMAN, tipo)) {
      errores.push(
        `${n}: tipo «${String(tipo)}» no válido ` +
          '(usa proceso, contrafactual, justificacion o clarificacion).',
      );
    }
    if (!texto) {
      errores.push(`${n}: falta el «texto».`);
    } else if (texto.length > LARGO_MAXIMO_TEXTO) {
      errores.push(`${n}: el texto supera los ${LARGO_MAXIMO_TEXTO} caracteres.`);
    }
    if (activa !== undefined && typeof activa !== 'boolean') {
      errores.push(`${n}: «activa» debe ser true o false.`);
    }
    return { id, contexto, tipo, texto, activa: activa ?? true };
  });

  if (errores.length > 0) {
    return rechazo(errores);
  }

  const avisos = CONTEXTOS.filter(
    (contexto) => !preguntas.some((p) => p.activa && p.contexto === contexto),
  ).map(
    (contexto) =>
      `No hay preguntas activas para «${contexto}»: ahí la sesión empezará sin pregunta sugerida.`,
  );
  return { ok: true, errores: [], avisos, preguntas };
}

function rechazo(errores) {
  return { ok: false, errores, avisos: [], preguntas: [] };
}

// Cuenta las preguntas activas por contexto y tipo Lipman, para mostrar
// qué tiene el banco en uso (por ejemplo, 3 contextos × 4 tipos × 3).
export function resumirBanco(preguntas) {
  const resumen = {};
  for (const contexto of CONTEXTOS) {
    const porTipo = Object.fromEntries(Object.keys(TIPOS_LIPMAN).map((tipo) => [tipo, 0]));
    resumen[contexto] = { total: 0, porTipo };
  }
  for (const pregunta of preguntas) {
    const grupo = resumen[pregunta.contexto];
    if (pregunta.activa && grupo && Object.hasOwn(grupo.porTipo, pregunta.tipo)) {
      grupo.total += 1;
      grupo.porTipo[pregunta.tipo] += 1;
    }
  }
  return resumen;
}

// Devuelve { C1: { nombre, parrafos, ampliada }, ... }: cada párrafo es
// { etiqueta, texto }, con etiqueta opcional, y «ampliada» solo existe en
// los criterios que tienen versión ampliada (hoy, C3).
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

// Junta los párrafos de una micro-guía en una sola línea, para la pantalla
// de resultado: «Vale 1: … Vale 0: …» o, en C3, la pregunta guía seguida
// de «Contenido: …» y «Forma: …».
export function microguiaEnLinea(parrafos) {
  return parrafos
    .map(({ etiqueta, texto }) => (etiqueta ? `${etiqueta}: ${texto}` : texto))
    .join(' ');
}
