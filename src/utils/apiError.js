/**
 * apiError
 * Helpers para leer errores de axios provenientes del BFF de forma consistente.
 * El BFF reenvía el cuerpo de error del microservicio downstream para los 4xx
 * (incluye `message`, `error` y códigos propios como `code`).
 */

/** Código de error de negocio, si el backend lo envió (ej. 'NO_COLEGIO_ASSIGNED'). */
export const getApiErrorCode = (err) => err?.response?.data?.code ?? null;

/** Mensaje legible: prioriza el `message` del backend sobre el genérico de axios. */
export const getApiErrorMessage = (err, fallback = 'Ocurrió un error inesperado.') => {
  const data = err?.response?.data;
  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message;
  }
  if (err?.message && !/^Request failed with status code/i.test(err.message)) {
    return err.message;
  }
  return fallback;
};

/**
 * Docente autenticado pero sin colegio asignado: el backend responde 403 con
 * `code: 'NO_COLEGIO_ASSIGNED'`. Se incluye un fallback por si el `code` no
 * llega (backend/BFF sin actualizar): 403 + mención de "colegio" en el mensaje.
 */
export const isNoColegioError = (err) =>
  getApiErrorCode(err) === 'NO_COLEGIO_ASSIGNED' ||
  (err?.response?.status === 403 &&
    typeof err?.response?.data?.message === 'string' &&
    /colegio/i.test(err.response.data.message));
