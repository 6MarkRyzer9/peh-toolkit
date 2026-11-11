// Pruebas del motor de cálculo (node --test, sin dependencias).
// Cubren las 16 combinaciones de 1 y 0 (RNF-07) y los casos «sin evaluar» (RN3).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularVeredicto, CRITERIOS } from '../js/motor.js';

test('las 16 combinaciones de 1 y 0 cumplen la regla conjuntiva', () => {
  for (let combinacion = 0; combinacion < 16; combinacion += 1) {
    const valores = {
      C1: (combinacion >> 3) & 1,
      C2: (combinacion >> 2) & 1,
      C3: (combinacion >> 1) & 1,
      C4: combinacion & 1,
    };
    const esperadoPeh = valores.C1 && valores.C2 && valores.C3 && valores.C4 ? 1 : 0;
    const esperadoFallidos = CRITERIOS.filter((c) => valores[c] === 0);

    const resultado = calcularVeredicto(valores);

    assert.deepEqual(
      resultado,
      { completo: true, faltan: [], peh: esperadoPeh, fallidos: esperadoFallidos },
      `falló la combinación C1=${valores.C1} C2=${valores.C2} C3=${valores.C3} C4=${valores.C4}`,
    );
  }
});

test('todos en 1 produce veredicto 1 sin fallidos', () => {
  assert.deepEqual(calcularVeredicto({ C1: 1, C2: 1, C3: 1, C4: 1 }), {
    completo: true,
    faltan: [],
    peh: 1,
    fallidos: [],
  });
});

test('un solo criterio en 0 reprueba la sesión y queda identificado', () => {
  assert.deepEqual(calcularVeredicto({ C1: 1, C2: 1, C3: 0, C4: 1 }), {
    completo: true,
    faltan: [],
    peh: 0,
    fallidos: ['C3'],
  });
});

test('varios criterios en 0 se listan todos, en orden', () => {
  assert.deepEqual(calcularVeredicto({ C1: 0, C2: 1, C3: 0, C4: 0 }), {
    completo: true,
    faltan: [],
    peh: 0,
    fallidos: ['C1', 'C3', 'C4'],
  });
});

test('un criterio en null deja el veredicto sin calcular (RN3)', () => {
  assert.deepEqual(calcularVeredicto({ C1: 1, C2: 1, C3: 1, C4: null }), {
    completo: false,
    faltan: ['C4'],
    peh: null,
    fallidos: [],
  });
});

test('sin evaluar no es 0: null con otros en 0 tampoco calcula el veredicto', () => {
  assert.deepEqual(calcularVeredicto({ C1: 0, C2: null, C3: 0, C4: 1 }), {
    completo: false,
    faltan: ['C2'],
    peh: null,
    fallidos: [],
  });
});

test('todos en null lista los cuatro criterios faltantes', () => {
  assert.deepEqual(calcularVeredicto({ C1: null, C2: null, C3: null, C4: null }), {
    completo: false,
    faltan: ['C1', 'C2', 'C3', 'C4'],
    peh: null,
    fallidos: [],
  });
});

test('un criterio ausente (undefined) cuenta como sin evaluar', () => {
  assert.deepEqual(calcularVeredicto({ C1: 1, C2: 1, C3: 1 }), {
    completo: false,
    faltan: ['C4'],
    peh: null,
    fallidos: [],
  });
});

test('el mismo resultado ante las mismas entradas (determinismo, RNF-07)', () => {
  const valores = { C1: 1, C2: 0, C3: 1, C4: 1 };
  assert.deepEqual(calcularVeredicto(valores), calcularVeredicto(valores));
});

test('un valor inválido lanza un error en vez de calcular mal', () => {
  assert.throws(() => calcularVeredicto({ C1: 2, C2: 1, C3: 1, C4: 1 }), TypeError);
  assert.throws(() => calcularVeredicto({ C1: '1', C2: 1, C3: 1, C4: 1 }), TypeError);
  assert.throws(() => calcularVeredicto({ C1: true, C2: 1, C3: 1, C4: 1 }), TypeError);
});
