/**
 * stripMetadatos
 * Elimina el bloque de metadatos de máquina que los agentes anexan al final de su salida
 * (`---METADATOS---` … `---FIN_METADATOS---`). Ese bloque es para el workflow, no para el
 * profesor, así que se quita antes de renderizar el contenido.
 *
 * @param {string} text - Texto del agente (posible Markdown con bloque de metadatos).
 * @returns {string} Texto sin el bloque, recortado. Cadena vacía si la entrada no es texto.
 */
export default function stripMetadatos(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[ \t]*---METADATOS---[\s\S]*?---FIN_METADATOS---[ \t]*/g, '')
    .trim();
}
