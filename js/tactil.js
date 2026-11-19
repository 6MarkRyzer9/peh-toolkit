// tactil.js — comportamiento táctil inspirado en Liquid Glass de Apple, sin
// cambiar el aspecto en reposo:
// - superficieTactil: al presionar, la superficie se comprime y su sombra se
//   acerca; al soltar, rebota. Un brillo especular sigue el dedo y se apaga.
// - gota y halo: respuesta elástica al elegir una opción.
// - campoVivo: el contorno de foco se cierra con un resorte y el campo
//   responde levemente al escribir.
// - entradaEscalonada: los elementos de una pantalla aparecen uno tras otro.
//
// Cómo respeta el diseño: solo escribe estilos en línea mientras algo se
// mueve (transform, opacity y las variables --profundidad, --brillo, --halo
// y --foco que usa estilos.css). Cuando cada resorte vuelve a su valor de
// reposo, borra ese estilo y el elemento queda exactamente como lo dibuja
// estilos.css. Con «reducir movimiento» activado no anima nada.

import { avanzarResorte, RESORTE_TACTIL } from './fisica.js';

// Resortes de cada efecto, dentro de los rangos pedidos (rigidez 380-450,
// amortiguación 22-28). «precision» va en las mismas unidades del valor y
// decide cuándo se da por detenido: para píxeles basta con una centésima, y
// para opacidades medio punto porcentual ya no se nota.
export const RESORTE_BOTON = Object.freeze({ rigidez: 450, amortiguacion: 24 }); // rebote limpio
const RESORTE_GOTA = { rigidez: 450, amortiguacion: 22, precision: 0.002 }; // la más elástica
const RESORTE_BRILLO = { rigidez: 380, amortiguacion: 28, precision: 0.005 }; // casi sin rebote
const RESORTE_ENTRADA = { rigidez: 380, amortiguacion: 28, precision: 0.01 }; // suave
const RESORTE_FOCO = { rigidez: 420, amortiguacion: 25, precision: 0.01 };

// Valores de reposo: con ellos el elemento se ve tal como lo dibuja estilos.css.
const REPOSO = Object.freeze({
  escala: 1, // transform: scale
  desplazamiento: 0, // transform: translateY, en píxeles
  opacidad: 1, // opacity
  profundidad: 1, // --profundidad: multiplica la sombra (1 = la sombra original)
  brillo: 0, // --brillo: opacidad del brillo especular
  halo: 0, // --halo: opacidad del brillo del borde
  foco: 0, // --foco: píxeles extra del contorno de foco (0 = el original)
});

const VARIABLES_CSS = ['profundidad', 'brillo', 'halo', 'foco'];
const OPACIDADES = new Set(['opacidad', 'brillo', 'halo']);

const consultaMovimiento = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

// Se consulta en cada gesto, así que si la persona cambia la preferencia
// del sistema, la app la respeta de inmediato.
export function movimientoReducido() {
  return consultaMovimiento?.matches ?? false;
}

// Vibración corta donde el dispositivo la permite (Android). En iPhone la web
// no puede vibrar y no pasa nada.
function vibrar() {
  try {
    navigator.vibrate?.(8);
  } catch {
    // Algunos navegadores la bloquean: se ignora.
  }
}

// Un animador por elemento: guarda los resortes en movimiento y en cada
// cuadro escribe sus valores en el estilo del elemento.
const animadores = new WeakMap();

function animador(elemento) {
  let existente = animadores.get(elemento);
  if (!existente) {
    existente = crearAnimador(elemento);
    animadores.set(elemento, existente);
  }
  return existente;
}

function crearAnimador(elemento) {
  const resortes = new Map(); // propiedad → { valor, velocidad, enReposo, objetivo, config }
  let cuadro = null;
  let anterior = null;

  function leer(propiedad) {
    const valor = resortes.get(propiedad)?.valor ?? REPOSO[propiedad];
    return OPACIDADES.has(propiedad) ? Math.min(Math.max(valor, 0), 1) : valor;
  }

  function escribir() {
    const escala = leer('escala');
    const desplazamiento = leer('desplazamiento');
    elemento.style.transform =
      escala === 1 && desplazamiento === 0
        ? ''
        : `translateY(${desplazamiento.toFixed(2)}px) scale(${escala.toFixed(4)})`;

    const opacidad = leer('opacidad');
    elemento.style.opacity = opacidad >= 1 ? '' : opacidad.toFixed(3);

    for (const variable of VARIABLES_CSS) {
      if (resortes.has(variable)) {
        elemento.style.setProperty(`--${variable}`, leer(variable).toFixed(4));
      } else {
        elemento.style.removeProperty(`--${variable}`);
      }
    }
    if (!resortes.has('brillo')) {
      elemento.style.removeProperty('--brillo-x');
      elemento.style.removeProperty('--brillo-y');
    }
    // Si no queda ningún estilo en línea, se quita también el atributo vacío.
    // (Los estilos que ya traía el HTML, como los del fieldset, no se tocan.)
    if (elemento.style.length === 0) {
      elemento.removeAttribute('style');
    }
  }

  function paso(ahora) {
    const segundos = anterior === null ? 1 / 60 : (ahora - anterior) / 1000;
    anterior = ahora;
    let enMovimiento = false;

    for (const [propiedad, resorte] of resortes) {
      const siguiente = avanzarResorte(resorte, resorte.objetivo, segundos, resorte.config);
      if (siguiente.enReposo && siguiente.valor === REPOSO[propiedad]) {
        resortes.delete(propiedad); // volvió al reposo: su estilo en línea se borra
      } else {
        resortes.set(propiedad, { ...resorte, ...siguiente });
        enMovimiento ||= !siguiente.enReposo;
      }
    }

    escribir();
    if (enMovimiento) {
      cuadro = requestAnimationFrame(paso);
    } else {
      cuadro = null;
      anterior = null;
    }
  }

  function arrancar() {
    if (cuadro === null) {
      anterior = null;
      cuadro = requestAnimationFrame(paso);
    }
  }

  return {
    // Lleva la propiedad hacia el objetivo. Si ya se movía, sigue desde donde
    // está y con su velocidad: por eso se puede interrumpir sin saltos.
    ir(propiedad, objetivo, config = RESORTE_TACTIL) {
      const actual = resortes.get(propiedad) ?? { valor: REPOSO[propiedad], velocidad: 0 };
      resortes.set(propiedad, { ...actual, enReposo: false, objetivo, config });
      arrancar();
    },
    // Pone la propiedad en un valor de inmediato, sin animar (por ejemplo,
    // el punto de partida de la entrada).
    fijar(propiedad, valor) {
      resortes.set(propiedad, {
        valor,
        velocidad: 0,
        enReposo: true,
        objetivo: valor,
        config: RESORTE_TACTIL,
      });
      escribir();
    },
    // Da un empujón (velocidad) sin cambiar el objetivo: el valor se aleja
    // un poco y vuelve.
    empujar(propiedad, velocidad, config = RESORTE_TACTIL) {
      const actual = resortes.get(propiedad) ?? {
        valor: REPOSO[propiedad],
        velocidad: 0,
        objetivo: REPOSO[propiedad],
      };
      resortes.set(propiedad, {
        ...actual,
        velocidad: actual.velocidad + velocidad,
        enReposo: false,
        config,
      });
      arrancar();
    },
  };
}

// Superficie que responde al tacto: se comprime y acerca su sombra al
// presionar, rebota al soltar, y un brillo sigue el dedo mientras se toca.
// La clase «superficie-tactil» activa en estilos.css el brillo (invisible en
// reposo) y la sombra que depende de --profundidad.
export function superficieTactil(
  elemento,
  { compresion = 0.975, profundidad = 0.5, resorte = RESORTE_TACTIL } = {},
) {
  elemento.classList.add('superficie-tactil');
  const animacion = animador(elemento);
  let presionado = false;

  function moverBrillo(evento) {
    const caja = elemento.getBoundingClientRect();
    elemento.style.setProperty('--brillo-x', `${(evento.clientX - caja.left).toFixed(1)}px`);
    elemento.style.setProperty('--brillo-y', `${(evento.clientY - caja.top).toFixed(1)}px`);
  }

  elemento.addEventListener('pointerdown', (evento) => {
    if (movimientoReducido() || elemento.matches(':disabled') || evento.button !== 0) {
      return;
    }
    presionado = true;
    moverBrillo(evento);
    animacion.ir('escala', compresion, resorte);
    animacion.ir('profundidad', profundidad, resorte);
    animacion.ir('brillo', 1, RESORTE_BRILLO);
    if (evento.pointerType !== 'mouse') {
      vibrar();
    }
  });

  elemento.addEventListener('pointermove', (evento) => {
    if (presionado) {
      moverBrillo(evento);
    }
  });

  function soltar() {
    if (!presionado) {
      return;
    }
    presionado = false;
    animacion.ir('escala', 1, resorte);
    animacion.ir('profundidad', 1, resorte);
    animacion.ir('brillo', 0, RESORTE_BRILLO);
  }

  // pointercancel llega, por ejemplo, cuando el dedo empieza a desplazar la página.
  for (const tipo of ['pointerup', 'pointercancel', 'pointerleave']) {
    elemento.addEventListener(tipo, soltar);
  }
}

// «Gota»: el botón de radio aparece pequeño y crece con un rebote elástico.
export function gota(elemento) {
  if (movimientoReducido()) {
    return;
  }
  const animacion = animador(elemento);
  animacion.fijar('escala', 0.6);
  animacion.ir('escala', 1, RESORTE_GOTA);
}

// Brillo sutil en el borde de la opción elegida: se enciende y se apaga solo.
export function halo(elemento) {
  if (movimientoReducido()) {
    return;
  }
  const animacion = animador(elemento);
  animacion.ir('halo', 1, RESORTE_BRILLO);
  setTimeout(() => animacion.ir('halo', 0, RESORTE_BRILLO), 220);
}

// Campo de texto vivo: al enfocarlo, el contorno de foco se cierra con un
// resorte; al escribir, el campo se hincha apenas y vuelve.
export function campoVivo(campo) {
  campo.classList.add('campo-vivo');
  const animacion = animador(campo);

  campo.addEventListener('focus', () => {
    if (movimientoReducido()) {
      return;
    }
    animacion.fijar('foco', 6);
    animacion.ir('foco', 0, RESORTE_FOCO);
  });

  campo.addEventListener('input', () => {
    if (movimientoReducido()) {
      return;
    }
    animacion.empujar('escala', 0.18);
  });
}

// Aparición escalonada: cada elemento parte 8 px más abajo y transparente,
// y sube con un resorte suave, 40 ms después del anterior.
export function entradaEscalonada(elementos, { retraso = 40, recorrido = 8 } = {}) {
  if (movimientoReducido()) {
    return;
  }
  elementos.forEach((elemento, indice) => {
    const animacion = animador(elemento);
    animacion.fijar('desplazamiento', recorrido);
    animacion.fijar('opacidad', 0);
    setTimeout(() => {
      animacion.ir('desplazamiento', 0, RESORTE_ENTRADA);
      animacion.ir('opacidad', 1, RESORTE_ENTRADA);
    }, indice * retraso);
  });
}
