// almacen.js — guardar y leer sesiones. Todo acceso al almacenamiento pasa
// por este módulo, para poder cambiar localStorage por IndexedDB sin tocar
// el resto de la aplicación.
// RNF-08: cada cambio se guarda al instante y sobrevive a recargar la página.
// RN4: una sesión cerrada es inmutable.

import { CRITERIOS } from './motor.js';

const CLAVE_SESIONES = 'peh.sesiones';
const CLAVE_ACTIVA = 'peh.sesionActiva';
const CLAVE_BANCO = 'peh.bancoImportado';

export const CONTEXTOS = ['aula', 'catedra', 'rrhh'];
export const PATRON_CODIGO = /^[A-Za-z0-9]{3,12}$/;

let almacenamiento = globalThis.localStorage ?? null;

// Permite inyectar un almacenamiento falso en las pruebas,
// porque node --test no tiene localStorage.
export function usarAlmacenamiento(nuevo) {
  almacenamiento = nuevo;
}

// Se lanza cuando el navegador no deja guardar (almacenamiento lleno o
// bloqueado). Como cada cambio reescribe la lista completa, si la escritura
// falla queda intacto lo que ya estaba guardado: la sesión no se pierde
// (CU-07, flujo 6a). La pantalla muestra el mensaje y ofrece respaldar.
export class ErrorAlmacenamiento extends Error {
  constructor(causa) {
    super(
      'No se pudo guardar en este dispositivo: el almacenamiento del navegador está lleno o bloqueado.',
    );
    this.name = 'ErrorAlmacenamiento';
    this.cause = causa;
  }
}

function escribir(clave, valor) {
  try {
    almacenamiento.setItem(clave, valor);
  } catch (error) {
    throw new ErrorAlmacenamiento(error);
  }
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
  escribir(CLAVE_SESIONES, JSON.stringify(sesiones));
}

// Deja la sesión como «en curso» y luego guarda la lista. En ese orden, si
// la lista no se puede guardar, basta con quitar la marca de «en curso»:
// nunca queda una sesión abierta guardada que no aparezca en pantalla.
function guardarComoActiva(sesiones, idSesion) {
  escribir(CLAVE_ACTIVA, idSesion);
  try {
    escribirSesiones(sesiones);
  } catch (error) {
    almacenamiento.removeItem(CLAVE_ACTIVA);
    throw error;
  }
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
  guardarComoActiva(sesiones, sesion.id);
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

  if (sesion.estado !== 'abierta') {
    throw new Error('Las marcas se corrigen solo con la sesión abierta: retómala primero');
  }

  sesion.marcas[criterio] = valor;
  escribirSesiones(sesiones);
  return copiar(sesion);
}

// Pausa una sesión abierta para retomarla después. Deja de ser la sesión
// en curso, así que al recargar la app se vuelve a «Crear sesión».
export function pausarSesion(idSesion) {
  const sesiones = leerSesiones();
  const sesion = buscarSesion(sesiones, idSesion);
  if (sesion.estado !== 'abierta') {
    throw new Error('Solo se puede pausar una sesión abierta');
  }

  sesion.estado = 'pausada';
  escribirSesiones(sesiones);
  if (almacenamiento.getItem(CLAVE_ACTIVA) === idSesion) {
    almacenamiento.removeItem(CLAVE_ACTIVA);
  }
  return copiar(sesion);
}

// Retoma una sesión pausada: vuelve a estar abierta y en curso,
// con todas sus marcas tal como quedaron.
export function retomarSesion(idSesion) {
  const sesiones = leerSesiones();
  const sesion = buscarSesion(sesiones, idSesion);
  if (sesion.estado !== 'pausada') {
    throw new Error('Solo se puede retomar una sesión pausada');
  }

  sesion.estado = 'abierta';
  guardarComoActiva(sesiones, sesion.id);
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

// Elimina una sesión abierta o pausada que no se va a evaluar.
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

// Banco de preguntas importado (RF-13). Se guarda solo en este dispositivo;
// mientras no haya uno, la app usa el banco incluido (data/banco.json).
// banco.js revisa las preguntas antes de guardarlas.
export function guardarBancoImportado({ preguntas, nombreArchivo }) {
  const banco = { preguntas, nombreArchivo, importadoEl: new Date().toISOString() };
  escribir(CLAVE_BANCO, JSON.stringify(banco));
  return copiar(banco);
}

export function leerBancoImportado() {
  try {
    const crudo = almacenamiento.getItem(CLAVE_BANCO);
    const banco = crudo ? JSON.parse(crudo) : null;
    return banco && Array.isArray(banco.preguntas) ? banco : null;
  } catch {
    return null;
  }
}

export function borrarBancoImportado() {
  almacenamiento.removeItem(CLAVE_BANCO);
}

// Fecha local (AAAA-MM-DD) de un instante ISO, para que los filtros del
// historial coincidan con la fecha que la persona ve en pantalla.
function fechaLocal(iso) {
  const fecha = new Date(iso);
  const relleno = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${relleno(fecha.getMonth() + 1)}-${relleno(fecha.getDate())}`;
}

// Filtra el historial (RF-10): solo sesiones cerradas, por rango de fechas
// de cierre (inclusive), contexto exacto y código (contiene, sin distinguir
// mayúsculas). Función pura: recibe la lista y no toca el almacenamiento.
export function filtrarHistorial(sesiones, { desde, hasta, contexto, codigo } = {}) {
  const codigoBuscado = codigo?.trim().toUpperCase() ?? '';
  return sesiones.filter((sesion) => {
    if (sesion.estado !== 'cerrada') {
      return false;
    }
    const fecha = fechaLocal(sesion.fechaCierre);
    if (desde && fecha < desde) {
      return false;
    }
    if (hasta && fecha > hasta) {
      return false;
    }
    if (contexto && sesion.contexto !== contexto) {
      return false;
    }
    if (codigoBuscado && !sesion.codigoEvaluado.includes(codigoBuscado)) {
      return false;
    }
    return true;
  });
}
