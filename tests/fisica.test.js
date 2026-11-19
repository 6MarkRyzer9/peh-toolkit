// Pruebas del resorte amortiguado de js/fisica.js (node --test).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearResorte, avanzarResorte, RESORTE_TACTIL } from '../js/fisica.js';

const CUADRO = 1 / 60; // un cuadro de pantalla a 60 Hz

// Simula el resorte cuadro a cuadro y registra el recorrido.
function simular(desde, objetivo, config = RESORTE_TACTIL, segundos = 2) {
  let estado = crearResorte(desde);
  let maximo = desde;
  let minimo = desde;
  let cuadros = 0;
  while (cuadros < segundos / CUADRO) {
    estado = avanzarResorte(estado, objetivo, CUADRO, config);
    maximo = Math.max(maximo, estado.valor);
    minimo = Math.min(minimo, estado.valor);
    cuadros += 1;
    if (estado.enReposo) {
      break;
    }
  }
  return { estado, maximo, minimo, cuadros };
}

test('llega al objetivo, se detiene y queda exactamente en él', () => {
  const { estado, cuadros } = simular(1, 0.975);
  assert.equal(estado.enReposo, true);
  assert.equal(estado.valor, 0.975);
  assert.equal(estado.velocidad, 0);
  assert.ok(cuadros < 60, `tardó ${cuadros} cuadros; debería asentarse en menos de 1 s`);
});

test('con la configuración táctil el rebote es sutil (menos del 15 % del recorrido)', () => {
  // Al soltar: de 0,975 vuelve a 1 y lo sobrepasa un poco antes de asentarse.
  const { maximo } = simular(0.975, 1);
  const sobrepaso = (maximo - 1) / (1 - 0.975);
  assert.ok(sobrepaso > 0, 'debería rebotar un poco');
  assert.ok(sobrepaso < 0.15, `rebotó ${(sobrepaso * 100).toFixed(1)} %`);
});

test('con amortiguación suficiente no hay rebote', () => {
  // Amortiguación crítica = 2 · √(rigidez · masa) ≈ 41: sin oscilar.
  const { maximo } = simular(0.975, 1, { rigidez: 420, amortiguacion: 45 });
  assert.ok(maximo <= 1);
});

test('se puede interrumpir: conserva la velocidad al cambiar de objetivo', () => {
  // Va bajando hacia 0,975; a mitad de camino el objetivo vuelve a 1.
  let estado = crearResorte(1);
  estado = avanzarResorte(estado, 0.975, CUADRO);
  estado = avanzarResorte(estado, 0.975, CUADRO);
  const antes = estado.valor;
  assert.ok(estado.velocidad < 0, 'debería ir bajando');

  // Por inercia sigue bajando un poco antes de dar la vuelta: no salta.
  const despues = avanzarResorte(estado, 1, CUADRO);
  assert.ok(despues.valor < antes, 'sin inercia habría saltado hacia arriba');
  assert.ok(antes - despues.valor < 0.01, 'el cambio entre cuadros es pequeño');
});

test('un salto de tiempo enorme (pestaña oculta) no descontrola el resorte', () => {
  const estado = avanzarResorte(crearResorte(1), 0.975, 30);
  assert.ok(Number.isFinite(estado.valor));
  assert.ok(estado.valor >= 0.97 && estado.valor <= 1);
});

test('mismas entradas, mismo resultado (determinismo)', () => {
  const inicial = { valor: 0.99, velocidad: -0.4, enReposo: false };
  assert.deepEqual(
    avanzarResorte(inicial, 1, CUADRO),
    avanzarResorte(inicial, 1, CUADRO),
  );
});

test('un resorte detenido en su objetivo no se mueve', () => {
  const estado = avanzarResorte(crearResorte(1), 1, CUADRO);
  assert.deepEqual(estado, { valor: 1, velocidad: 0, enReposo: true });
});
