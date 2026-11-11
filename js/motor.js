// motor.js — cálculo del veredicto PEH (función pura, sin DOM ni almacenamiento).
// Regla de negocio RN1: PEH = C1 ∧ C2 ∧ C3 ∧ C4 (regla conjuntiva estricta).
// Regla de negocio RN3: «sin evaluar» (null) no es 0; sin los cuatro valores
// no se calcula el veredicto.

export const CRITERIOS = ['C1', 'C2', 'C3', 'C4'];

/**
 * Calcula el veredicto PEH a partir de las marcas del evaluador.
 *
 * @param {{ C1: 1|0|null, C2: 1|0|null, C3: 1|0|null, C4: 1|0|null }} valores
 *   Marcas de cada criterio: 1 (cumple), 0 (no cumple) o null (sin evaluar).
 * @returns {{ completo: boolean, faltan: string[], peh: 1|0|null, fallidos: string[] }}
 *   - completo: true solo si los cuatro criterios tienen valor.
 *   - faltan: criterios aún sin evaluar (vacío si está completo).
 *   - peh: 1 o 0 si está completo; null si falta algún criterio.
 *   - fallidos: criterios marcados con 0 cuando está completo; vacío si no.
 */
export function calcularVeredicto(valores) {
  for (const criterio of CRITERIOS) {
    const valor = valores?.[criterio];
    if (valor !== 1 && valor !== 0 && valor !== null && valor !== undefined) {
      throw new TypeError(
        `Valor inválido para ${criterio}: ${String(valor)} (se espera 1, 0 o null)`,
      );
    }
  }

  const faltan = CRITERIOS.filter(
    (criterio) => valores?.[criterio] === null || valores?.[criterio] === undefined,
  );

  if (faltan.length > 0) {
    return { completo: false, faltan, peh: null, fallidos: [] };
  }

  const fallidos = CRITERIOS.filter((criterio) => valores[criterio] === 0);

  return {
    completo: true,
    faltan: [],
    peh: fallidos.length === 0 ? 1 : 0,
    fallidos,
  };
}
