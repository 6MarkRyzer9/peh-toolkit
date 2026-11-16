// Pruebas del módulo de almacenamiento (node --test, sin dependencias).
// Se usa un almacenamiento falso en memoria porque Node no tiene localStorage.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  usarAlmacenamiento,
  crearSesion,
  obtenerSesionActiva,
  guardarMarca,
  cerrarSesion,
  pausarSesion,
  retomarSesion,
  descartarSesion,
  listarSesiones,
  filtrarHistorial,
} from '../js/almacen.js';

// Imita la interfaz de localStorage que usa almacen.js.
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

beforeEach(() => {
  usarAlmacenamiento(new AlmacenamientoFalso());
});

test('crearSesion guarda la sesión abierta, activa y con los criterios sin evaluar', () => {
  const sesion = crearSesion({ contexto: 'catedra', codigoEvaluado: 'a7k2' });

  assert.equal(sesion.estado, 'abierta');
  assert.equal(sesion.codigoEvaluado, 'A7K2'); // se normaliza a mayúsculas
  assert.deepEqual(sesion.marcas, { C1: null, C2: null, C3: null, C4: null });
  assert.equal(sesion.peh, null);
  assert.equal(obtenerSesionActiva().id, sesion.id);
  assert.equal(listarSesiones().length, 1);
});

test('crearSesion rechaza contexto o código inválidos', () => {
  assert.throws(() => crearSesion({ contexto: 'oficina', codigoEvaluado: 'A7K2' }), /Contexto/);
  assert.throws(() => crearSesion({ contexto: 'aula', codigoEvaluado: 'ab' }), /Código/);
  assert.throws(() => crearSesion({ contexto: 'aula', codigoEvaluado: 'con espacio' }), /Código/);
});

test('guardarMarca persiste: la marca sigue ahí al volver a leer (RNF-08)', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });

  guardarMarca(id, 'C2', 0);
  guardarMarca(id, 'C4', 1);

  // Simula una recarga: se vuelve a leer todo desde el almacenamiento.
  const recargada = obtenerSesionActiva();
  assert.deepEqual(recargada.marcas, { C1: null, C2: 0, C3: null, C4: 1 });
});

test('guardarMarca permite corregir una marca mientras la sesión está abierta (RF-05)', () => {
  const { id } = crearSesion({ contexto: 'rrhh', codigoEvaluado: 'XK21' });

  guardarMarca(id, 'C1', 0);
  const corregida = guardarMarca(id, 'C1', 1);

  assert.equal(corregida.marcas.C1, 1);
});

test('guardarMarca rechaza criterios o valores inválidos', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });

  assert.throws(() => guardarMarca(id, 'C5', 1), /Criterio inválido/);
  assert.throws(() => guardarMarca(id, 'C1', 2), /Valor inválido/);
  assert.throws(() => guardarMarca('no-existe', 'C1', 1), /No existe/);
});

test('cerrarSesion guarda veredicto y fecha, y la sesión deja de estar activa', () => {
  const { id } = crearSesion({ contexto: 'catedra', codigoEvaluado: 'A7K2' });
  for (const criterio of ['C1', 'C2', 'C4']) {
    guardarMarca(id, criterio, 1);
  }
  guardarMarca(id, 'C3', 0);

  const cerrada = cerrarSesion(id, { peh: 0, criteriosFallidos: ['C3'] });

  assert.equal(cerrada.estado, 'cerrada');
  assert.equal(cerrada.peh, 0);
  assert.deepEqual(cerrada.criteriosFallidos, ['C3']);
  assert.ok(cerrada.fechaCierre);
  assert.equal(obtenerSesionActiva(), null);
});

test('cerrarSesion exige los cuatro criterios con valor (RN3)', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });
  guardarMarca(id, 'C1', 1);

  assert.throws(() => cerrarSesion(id, { peh: 1, criteriosFallidos: [] }), /RN3/);
});

test('una sesión cerrada es inmutable (RN4)', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });
  for (const criterio of ['C1', 'C2', 'C3', 'C4']) {
    guardarMarca(id, criterio, 1);
  }
  cerrarSesion(id, { peh: 1, criteriosFallidos: [] });

  assert.throws(() => guardarMarca(id, 'C1', 0), /RN4/);
  assert.throws(() => cerrarSesion(id, { peh: 1, criteriosFallidos: [] }), /RN4/);
  assert.throws(() => descartarSesion(id), /RN4/);
});

test('pausarSesion conserva las marcas y la sesión deja de estar en curso', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });
  guardarMarca(id, 'C1', 1);

  const pausada = pausarSesion(id);

  assert.equal(pausada.estado, 'pausada');
  assert.equal(pausada.marcas.C1, 1);
  // Al recargar la app no se retoma sola: se vuelve a «Crear sesión».
  assert.equal(obtenerSesionActiva(), null);
});

test('retomarSesion reabre la sesión pausada y vuelve a estar en curso', () => {
  const { id } = crearSesion({ contexto: 'rrhh', codigoEvaluado: 'XK21' });
  guardarMarca(id, 'C2', 0);
  pausarSesion(id);

  const retomada = retomarSesion(id);

  assert.equal(retomada.estado, 'abierta');
  assert.equal(retomada.marcas.C2, 0);
  assert.equal(obtenerSesionActiva().id, id);
});

test('una sesión pausada no se marca ni se pausa de nuevo; retomar exige pausada', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });
  pausarSesion(id);

  assert.throws(() => guardarMarca(id, 'C1', 1), /retómala/);
  assert.throws(() => pausarSesion(id), /abierta/);

  retomarSesion(id);
  assert.throws(() => retomarSesion(id), /pausada/);
});

test('una sesión cerrada no se puede pausar ni retomar', () => {
  const { id } = crearSesion({ contexto: 'aula', codigoEvaluado: 'B1Z9' });
  for (const criterio of ['C1', 'C2', 'C3', 'C4']) {
    guardarMarca(id, criterio, 1);
  }
  cerrarSesion(id, { peh: 1, criteriosFallidos: [] });

  assert.throws(() => pausarSesion(id), /abierta/);
  assert.throws(() => retomarSesion(id), /pausada/);
});

test('descartarSesion también elimina una sesión pausada', () => {
  const { id } = crearSesion({ contexto: 'catedra', codigoEvaluado: 'A7K2' });
  pausarSesion(id);

  descartarSesion(id);

  assert.equal(listarSesiones().length, 0);
});

test('descartarSesion elimina una sesión abierta y deja de estar activa', () => {
  const { id } = crearSesion({ contexto: 'rrhh', codigoEvaluado: 'XK21' });

  descartarSesion(id);

  assert.equal(obtenerSesionActiva(), null);
  assert.equal(listarSesiones().length, 0);
});

// Sesiones de ejemplo para los filtros del historial (RF-10).
// Mediodía UTC para que la fecha local coincida en cualquier zona horaria.
function sesionCerrada(codigo, contexto, fechaCierre, peh = 1) {
  return {
    id: `id-${codigo}-${fechaCierre}`,
    codigoEvaluado: codigo,
    contexto,
    estado: 'cerrada',
    fechaInicio: `${fechaCierre}T11:50:00.000Z`,
    fechaCierre: `${fechaCierre}T12:00:00.000Z`,
    marcas: { C1: 1, C2: 1, C3: peh, C4: 1 },
    peh,
    criteriosFallidos: peh === 1 ? [] : ['C3'],
  };
}

const HISTORIAL = [
  sesionCerrada('A7K2', 'catedra', '2026-11-10'),
  sesionCerrada('B1Z9', 'aula', '2026-11-12', 0),
  sesionCerrada('XK21', 'rrhh', '2026-11-14'),
  { ...sesionCerrada('ZZ99', 'aula', '2026-11-14'), estado: 'abierta' },
];

test('filtrarHistorial solo incluye sesiones cerradas', () => {
  const resultado = filtrarHistorial(HISTORIAL);
  assert.deepEqual(resultado.map((s) => s.codigoEvaluado), ['A7K2', 'B1Z9', 'XK21']);
});

test('filtrarHistorial por rango de fechas de cierre, inclusive', () => {
  const resultado = filtrarHistorial(HISTORIAL, { desde: '2026-11-12', hasta: '2026-11-14' });
  assert.deepEqual(resultado.map((s) => s.codigoEvaluado), ['B1Z9', 'XK21']);
});

test('filtrarHistorial por contexto exacto', () => {
  const resultado = filtrarHistorial(HISTORIAL, { contexto: 'aula' });
  assert.deepEqual(resultado.map((s) => s.codigoEvaluado), ['B1Z9']);
});

test('filtrarHistorial por código: contiene y sin distinguir mayúsculas', () => {
  const resultado = filtrarHistorial(HISTORIAL, { codigo: ' k2' });
  assert.deepEqual(resultado.map((s) => s.codigoEvaluado), ['A7K2', 'XK21']);
});

test('filtrarHistorial combina filtros', () => {
  const resultado = filtrarHistorial(HISTORIAL, {
    desde: '2026-11-11',
    contexto: 'rrhh',
    codigo: 'XK',
  });
  assert.deepEqual(resultado.map((s) => s.codigoEvaluado), ['XK21']);
});

test('datos corruptos en el almacenamiento no rompen la lectura', () => {
  const falso = new AlmacenamientoFalso();
  falso.setItem('peh.sesiones', '{esto no es JSON válido');
  usarAlmacenamiento(falso);

  assert.deepEqual(listarSesiones(), []);
  assert.equal(obtenerSesionActiva(), null);
});
