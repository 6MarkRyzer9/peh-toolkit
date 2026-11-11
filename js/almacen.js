// almacen.js — guardar y leer sesiones. Todo acceso al almacenamiento pasa
// por este módulo, para poder cambiar localStorage por IndexedDB sin tocar
// el resto de la aplicación.
// RNF-08: cada cambio se guarda al instante y sobrevive a recargar la página.
// RN4: una sesión cerrada es inmutable.

import { CRITERIOS } from './motor.js';

const CLAVE_SESIONES = 'peh.sesiones';
const CLAVE_ACTIVA = 'peh.sesionActiva';

export const CONTEXTOS = ['aula', 'catedra', 'rrhh'];
export const PATRON_CODIGO = /^[A-Za-z0-9]{3,12}$/;

let almacenamiento = globalThis.localStorage ?? null;

// Permite inyectar un almacenamiento falso en las pruebas,
// porque node --test no tiene localStorage.
export function usarAlmacenamiento(nuevo) {
  almacenamiento = nuevo;
}

function leerSesiones() {
  try {
    const crudo = almacenamiento.getItem(CLAVE_SESIONES);
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    // Datos corruptos o almacenamiento bloqueado: se parte de cero.
    return [];
  }
}

function escribirSesiones(sesiones) {
  almacenamiento.setItem(CLAVE_SESIONES, JSON.stringify(sesiones));
}

function buscarSesion(sesiones, id) {
  const sesion = sesiones.find((s) => s.id === id);
  if (!sesion) {
    throw new Error(`No existe la sesión ${id}`);
  }
  return sesion;
}

function copiar(sesion) {
  return structuredClone(sesion);
}

export function crearSesion({ contexto, codigoEvaluado }) {
  if (!CONTEXTOS.includes(contexto)) {
    throw new Error(`Contexto inválido: ${String(contexto)}`);
  }
  if (typeof codigoEvaluado !== 'string' || !PATRON_CODIGO.test(codigoEvaluado.trim())) {
    throw new Error('Código inválido: solo letras y números, 3 a 12 caracteres (RN5)');
  }

  const sesion = {
    id: crypto.randomUUID(),
    codigoEvaluado: codigoEvaluado.trim().toUpperCase(),
    contexto,
    estado: 'abierta',
    fechaInicio: new Date().toISOString(),
    fechaCierre: null,
    marcas: { C1: null, C2: null, C3: null, C4: null },
    peh: null,
    criteriosFallidos: [],
  };

  const sesiones = leerSesiones();
  sesiones.push(sesion);
  escribirSesiones(sesiones);
  almacenamiento.setItem(CLAVE_ACTIVA, sesion.id);
  return copiar(sesion);
}

// Devuelve la sesión abierta o pausada en curso, o null si no hay ninguna.
export function obtenerSesionActiva() {
  const id = almacenamiento.getItem(CLAVE_ACTIVA);
  if (!id) {
    return null;
  }
  const sesion = leerSesiones().find((s) => s.id === id);
  return sesion && sesion.estado !== 'cerrada' ? copiar(sesion) : null;
}

export function guardarMarca(idSesion, criterio, valor) {
  if (!CRITERIOS.includes(criterio)) {
    throw new Error(`Criterio inválido: ${String(criterio)}`);
  }
  if (valor !== 1 && valor !== 0 && valor !== null) {
    throw new Error(`Valor inválido para ${criterio}: se espera 1, 0 o null`);
  }

  const sesiones = leerSesiones();
  const sesion = buscarSesion(sesiones, idSesion);
  if (sesion.estado === 'cerrada') {
    throw new Error('La sesión está cerrada y no se puede modificar (RN4)');
  }

  sesion.marcas[criterio] = valor;
  escribirSesiones(sesiones);
  return copiar(sesion);
}

// Guarda el veredicto ya calculado por el motor y vuelve inmutable la sesión.
export function cerrarSesion(idSesion, { peh, criteriosFallidos }) {
  const sesiones = leerSesiones();
  const sesion = buscarSesion(sesiones, idSesion);
  if (sesion.estado === 'cerrada') {
    throw new Error('La sesión ya está cerrada (RN4)');
  }
  if (CRITERIOS.some((c) => sesion.marcas[c] !== 1 && sesion.marcas[c] !== 0)) {
    throw new Error('No se puede cerrar: falta evaluar algún criterio (RN3)');
  }

  sesion.estado = 'cerrada';
  sesion.fechaCierre = new Date().toISOString();
  sesion.peh = peh;
  sesion.criteriosFallidos = [...criteriosFallidos];
  escribirSesiones(sesiones);

  if (almacenamiento.getItem(CLAVE_ACTIVA) === idSesion) {
    almacenamiento.removeItem(CLAVE_ACTIVA);
  }
  return copiar(sesion);
}

// Provisional para el desarrollo: elimina una sesión que sigue abierta.
// Una sesión cerrada nunca se descarta (RN4).
export function descartarSesion(idSesion) {
  const sesiones = leerSesiones();
  const sesion = buscarSesion(sesiones, idSesion);
  if (sesion.estado === 'cerrada') {
    throw new Error('Una sesión cerrada no se puede descartar (RN4)');
  }
  escribirSesiones(sesiones.filter((s) => s.id !== idSesion));
  if (almacenamiento.getItem(CLAVE_ACTIVA) === idSesion) {
    almacenamiento.removeItem(CLAVE_ACTIVA);
  }
}

export function listarSesiones() {
  return leerSesiones().map(copiar);
}
