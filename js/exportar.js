// exportar.js — exportación de sesiones a CSV y JSON (RF-11).
// CSV en UTF-8 con BOM y separador «;», para que Excel con configuración
// regional chilena lo abra directo (HU-05). Fechas en ISO 8601.
// Las funciones que generan el contenido son puras, para probarlas con Node;
// solo descargarArchivo toca el navegador.

export const COLUMNAS_CSV = [
  'id_sesion',
  'codigo_evaluado',
  'contexto',
  'fecha_inicio',
  'fecha_cierre',
  'c1',
  'c2',
  'c3',
  'c4',
  'peh',
  'criterios_fallidos',
];

// Convierte una sesión del almacén a los campos de exportación (tabla 1 de
// la ERS). Nunca incluye nombre, RUT ni contacto: solo el código (RNF-11).
function aRegistro(sesion) {
  return {
    id_sesion: sesion.id,
    codigo_evaluado: sesion.codigoEvaluado,
    contexto: sesion.contexto,
    fecha_inicio: sesion.fechaInicio,
    fecha_cierre: sesion.fechaCierre,
    c1: sesion.marcas.C1,
    c2: sesion.marcas.C2,
    c3: sesion.marcas.C3,
    c4: sesion.marcas.C4,
    peh: sesion.peh,
    criterios_fallidos: sesion.criteriosFallidos,
  };
}

// Encierra el valor en comillas solo si contiene separador, comillas o
// saltos de línea (regla estándar de CSV).
function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function generarCsv(sesiones) {
  const filas = sesiones.map((sesion) => {
    const registro = aRegistro(sesion);
    registro.criterios_fallidos = registro.criterios_fallidos.join(',');
    return COLUMNAS_CSV.map((columna) => escaparCsv(registro[columna])).join(';');
  });
  // '﻿' es el BOM: le indica a Excel que el archivo viene en UTF-8.
  return `﻿${[COLUMNAS_CSV.join(';'), ...filas].join('\r\n')}`;
}

export function generarJson(sesiones) {
  return JSON.stringify(sesiones.map(aRegistro), null, 2);
}

// Descarga el contenido como archivo desde el navegador.
export function descargarArchivo(nombre, contenido, tipoMime) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipoMime }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
