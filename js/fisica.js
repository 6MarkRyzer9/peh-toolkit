// fisica.js — resorte amortiguado para que la interfaz responda con
// sensación física (comportamiento inspirado en Liquid Glass de Apple).
// Función pura, sin DOM, para probarla con node --test igual que el motor.
//
// Modelo: un resorte tira del valor hacia el objetivo y un amortiguador
// frena la velocidad (oscilador armónico amortiguado):
//
//   aceleración = (−rigidez · (valor − objetivo) − amortiguación · velocidad) / masa
//
// Se integra con Euler semi-implícito (primero la velocidad, después el
// valor) en subpasos de 1/120 s, que es estable aunque un cuadro tarde más.
// Como el estado guarda la velocidad, una animación se puede interrumpir con
// un objetivo nuevo sin saltos: sigue desde donde está y con la velocidad
// que lleva, como un objeto real.

// Rigidez 420 y amortiguación 25: dentro de los rangos pedidos (380-450 y
// 22-28). Con estos valores el resorte sobrepasa el objetivo cerca de un 9 %
// del recorrido (rebote sutil) y se asienta en menos de medio segundo.
export const RESORTE_TACTIL = Object.freeze({ rigidez: 420, amortiguacion: 25, masa: 1 });

const SUBPASO = 1 / 120; // segundos
const PASO_MAXIMO = 1 / 15; // si la pestaña estuvo oculta, no se integra todo el tiempo perdido
const PRECISION = 0.001; // bajo esta distancia y velocidad, el resorte se da por detenido

export function crearResorte(valor) {
  return { valor, velocidad: 0, enReposo: true };
}

// Avanza el resorte «segundos» hacia el objetivo y devuelve el estado nuevo
// (no modifica el que recibe). Al detenerse, el valor queda exactamente en
// el objetivo y enReposo vale true.
export function avanzarResorte(estado, objetivo, segundos, config = RESORTE_TACTIL) {
  const { rigidez, amortiguacion, masa = 1, precision = PRECISION } = config;
  let { valor, velocidad } = estado;
  let restante = Math.min(Math.max(segundos, 0), PASO_MAXIMO);

  while (restante > 0) {
    const dt = Math.min(restante, SUBPASO);
    const aceleracion = (-rigidez * (valor - objetivo) - amortiguacion * velocidad) / masa;
    velocidad += aceleracion * dt;
    valor += velocidad * dt;
    restante -= dt;
  }

  if (Math.abs(valor - objetivo) < precision && Math.abs(velocidad) < precision) {
    return { valor: objetivo, velocidad: 0, enReposo: true };
  }
  return { valor, velocidad, enReposo: false };
}
