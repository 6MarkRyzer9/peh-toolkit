// Pruebas de la exportación a CSV y JSON (node --test, sin dependencias).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarCsv, generarJson, COLUMNAS_CSV } from '../js/exportar.js';

const SESION_RECHAZADA = {
  id: 'abc-123',
  codigoEvaluado: 'A7K2',
  contexto: 'catedra',
  estado: 'cerrada',
  fechaInicio: '2026-11-14T14:00:00.000Z',
  fechaCierre: '2026-11-14T14:12:30.000Z',
  marcas: { C1: 1, C2: 1, C3: 0, C4: 0 },
  peh: 0,
  criteriosFallidos: ['C3', 'C4'],
};

const SESION_APROBADA = {
  id: 'def-456',
  codigoEvaluado: 'B1Z9',
  contexto: 'aula',
  estado: 'cerrada',
  fechaInicio: '2026-11-14T15:00:00.000Z',
  fechaCierre: '2026-11-14T15:10:00.000Z',
  marcas: { C1: 1, C2: 1, C3: 1, C4: 1 },
  peh: 1,
  criteriosFallidos: [],
};

test('el CSV empieza con BOM y trae el encabezado con separador «;»', () => {
  const csv = generarCsv([SESION_APROBADA]);

  assert.ok(csv.startsWith('﻿'), 'debe empezar con el BOM de UTF-8');
  const [encabezado] = csv.slice(1).split('\r\n');
  assert.equal(encabezado, COLUMNAS_CSV.join(';'));
});

test('el CSV tiene una fila por sesión con los campos en orden (tabla 1)', () => {
  const csv = generarCsv([SESION_RECHAZADA, SESION_APROBADA]);
  const filas = csv.slice(1).split('\r\n');

  assert.equal(filas.length, 3); // encabezado + 2 sesiones
  assert.equal(
    filas[1],
    'abc-123;A7K2;catedra;2026-11-14T14:00:00.000Z;2026-11-14T14:12:30.000Z;1;1;0;0;0;C3,C4',
  );
  assert.equal(
    filas[2],
    'def-456;B1Z9;aula;2026-11-14T15:00:00.000Z;2026-11-14T15:10:00.000Z;1;1;1;1;1;',
  );
});

test('un valor con punto y coma o comillas queda escapado según CSV', () => {
  const rara = { ...SESION_APROBADA, codigoEvaluado: 'A;B"C' };

  const fila = generarCsv([rara]).slice(1).split('\r\n')[1];

  assert.ok(fila.includes('"A;B""C"'));
});

test('el JSON trae los mismos campos y vuelve a leerse sin pérdida', () => {
  const datos = JSON.parse(generarJson([SESION_RECHAZADA]));

  assert.deepEqual(datos, [
    {
      id_sesion: 'abc-123',
      codigo_evaluado: 'A7K2',
      contexto: 'catedra',
      fecha_inicio: '2026-11-14T14:00:00.000Z',
      fecha_cierre: '2026-11-14T14:12:30.000Z',
      c1: 1,
      c2: 1,
      c3: 0,
      c4: 0,
      peh: 0,
      criterios_fallidos: ['C3', 'C4'],
    },
  ]);
});

test('sin sesiones: CSV solo con encabezado y JSON con lista vacía', () => {
  assert.equal(generarCsv([]), `﻿${COLUMNAS_CSV.join(';')}`);
  assert.equal(generarJson([]), '[]');
});
