// Pruebas del banco de preguntas: validación al importar (RF-13), resumen
// por contexto y tipo, y elección del banco en uso (node --test).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validarBanco,
  resumirBanco,
  obtenerBancoEnUso,
  cargarPreguntas,
  LARGO_MAXIMO_TEXTO,
} from '../js/banco.js';
import {
  usarAlmacenamiento,
  guardarBancoImportado,
  leerBancoImportado,
  borrarBancoImportado,
} from '../js/almacen.js';

const BANCO_INCLUIDO = JSON.parse(
  readFileSync(new URL('../data/banco.json', import.meta.url), 'utf8'),
);

class AlmacenamientoFalso {
  constructor() {
    this.datos = new Map();
  }
  getItem(clave) {
    return this.datos.has(clave) ? this.datos.get(clave) : null;
  }
  setItem(clave, valor) {
    this.datos.set(clave, String(valor));
  }
  removeItem(clave) {
    this.datos.delete(clave);
  }
}

// Node no puede pedir 'data/banco.json' por red: se sirve el archivo real.
globalThis.fetch = async () => ({ ok: true, json: async () => BANCO_INCLUIDO });

beforeEach(() => {
  usarAlmacenamiento(new AlmacenamientoFalso());
});

function pregunta(cambios = {}) {
  return {
    id: 'p1',
    contexto: 'aula',
    tipo: 'proceso',
    texto: '¿Cómo lo hiciste?',
    activa: true,
    ...cambios,
  };
}

test('el banco incluido en la app pasa la validación', () => {
  const revision = validarBanco(BANCO_INCLUIDO);
  assert.equal(revision.ok, true);
  assert.deepEqual(revision.errores, []);
  assert.equal(revision.preguntas.length, BANCO_INCLUIDO.preguntas.length);
});

test('rechaza un archivo sin la lista «preguntas» o con la lista vacía', () => {
  assert.equal(validarBanco([pregunta()]).ok, false);
  assert.equal(validarBanco({ otra: [] }).ok, false);
  assert.equal(validarBanco(null).ok, false);
  assert.deepEqual(validarBanco({ preguntas: [] }).errores, ['El banco no tiene preguntas.']);
});

test('informa cada problema indicando el número de la pregunta', () => {
  const revision = validarBanco({
    preguntas: [
      pregunta({ id: 'a' }),
      pregunta({ id: 'b', contexto: 'oficina' }),
      pregunta({ id: 'c', tipo: 'opinion' }),
      pregunta({ id: 'd', texto: '   ' }),
      pregunta({ id: 'a' }),
      pregunta({ id: 'e', activa: 'si' }),
      'no soy un objeto',
      pregunta({ id: 'f', texto: 'x'.repeat(LARGO_MAXIMO_TEXTO + 1) }),
    ],
  });

  assert.equal(revision.ok, false);
  assert.deepEqual(revision.preguntas, []);
  assert.equal(revision.errores.length, 7);
  assert.match(revision.errores[0], /^Pregunta 2: contexto «oficina» no válido/);
  assert.match(revision.errores[1], /^Pregunta 3: tipo «opinion» no válido/);
  assert.match(revision.errores[2], /^Pregunta 4: falta el «texto»/);
  assert.match(revision.errores[3], /^Pregunta 5: el id «a» está repetido/);
  assert.match(revision.errores[4], /^Pregunta 6: «activa» debe ser true o false/);
  assert.match(revision.errores[5], /^Pregunta 7: debe ser un objeto/);
  assert.match(revision.errores[6], /^Pregunta 8: el texto supera/);
});

test('normaliza las preguntas: recorta el texto, activa por defecto y sin campos extra', () => {
  const sinActiva = pregunta({ texto: '  ¿Por qué?  ', extra: 'se descarta' });
  delete sinActiva.activa;

  const revision = validarBanco({ preguntas: [sinActiva] });

  assert.equal(revision.ok, true);
  assert.deepEqual(revision.preguntas, [
    { id: 'p1', contexto: 'aula', tipo: 'proceso', texto: '¿Por qué?', activa: true },
  ]);
});

test('avisa (sin rechazar) los contextos que quedan sin preguntas activas', () => {
  const revision = validarBanco({
    preguntas: [
      pregunta({ id: 'a', contexto: 'aula' }),
      pregunta({ id: 'b', contexto: 'catedra', activa: false }),
    ],
  });

  assert.equal(revision.ok, true);
  assert.equal(revision.avisos.length, 2);
  assert.match(revision.avisos[0], /«catedra»/);
  assert.match(revision.avisos[1], /«rrhh»/);
});

test('resumirBanco cuenta solo las preguntas activas, por contexto y tipo', () => {
  const resumen = resumirBanco([
    pregunta({ id: 'a', contexto: 'aula', tipo: 'proceso' }),
    pregunta({ id: 'b', contexto: 'aula', tipo: 'proceso' }),
    pregunta({ id: 'c', contexto: 'aula', tipo: 'contrafactual', activa: false }),
    pregunta({ id: 'd', contexto: 'rrhh', tipo: 'clarificacion' }),
  ]);

  assert.equal(resumen.aula.total, 2);
  assert.equal(resumen.aula.porTipo.proceso, 2);
  assert.equal(resumen.aula.porTipo.contrafactual, 0);
  assert.equal(resumen.catedra.total, 0);
  assert.equal(resumen.rrhh.porTipo.clarificacion, 1);
});

test('sin banco importado se usa el banco incluido en la app', async () => {
  const banco = await obtenerBancoEnUso();
  assert.equal(banco.origen, 'incluido');
  assert.equal(banco.preguntas.length, BANCO_INCLUIDO.preguntas.length);
});

test('con un banco importado, las sesiones toman sus preguntas', async () => {
  guardarBancoImportado({
    preguntas: [pregunta({ id: 'nueva', contexto: 'rrhh', texto: 'Pregunta importada' })],
    nombreArchivo: 'banco-final.json',
  });

  const banco = await obtenerBancoEnUso();
  assert.equal(banco.origen, 'importado');
  assert.equal(banco.nombreArchivo, 'banco-final.json');
  assert.deepEqual(
    (await cargarPreguntas('rrhh')).map((p) => p.texto),
    ['Pregunta importada'],
  );
  assert.deepEqual(await cargarPreguntas('aula'), []);
});

test('volver al banco incluido borra el importado de este dispositivo', async () => {
  guardarBancoImportado({ preguntas: [pregunta()], nombreArchivo: 'x.json' });
  borrarBancoImportado();

  assert.equal(leerBancoImportado(), null);
  assert.equal((await obtenerBancoEnUso()).origen, 'incluido');
});

test('un banco importado dañado en el almacenamiento no rompe la app', async () => {
  const falso = new AlmacenamientoFalso();
  falso.setItem('peh.bancoImportado', JSON.stringify({ preguntas: [{ id: 1 }] }));
  usarAlmacenamiento(falso);

  assert.equal((await obtenerBancoEnUso()).origen, 'incluido');
});
