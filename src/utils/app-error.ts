/**
 * Error de dominio con metadatos para la respuesta HTTP.
 * Extiende `Error` y añade `code`, `statusCode` y `details`, que `errorHandler`
 * traduce al contrato `{ success: false, error, meta }`.
 */
export class AppError extends Error {
  /** Código de negocio (por ejemplo, `VEHICLE_NOT_FOUND`). */
  public readonly code: string;
  /** Status HTTP que debe devolver el `errorHandler`. */
  public readonly statusCode: number;
  /** Información adicional, como errores de validación o el body del downstream. */
  public readonly details?: Record<string, unknown>;

  /**
   * Construye el error y fija `name = 'AppError'` para el discriminador del handler.
   * @param code Código de negocio.
   * @param message Mensaje legible para el cliente.
   * @param statusCode Status HTTP asociado.
   * @param details Detalle opcional (validaciones, body downstream, etc.).
   */
  constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface FallbackError {
  code: string;
  message: string;
  statusCode?: number;
}

interface NotFoundError {
  code: string;
  message: string;
}

/**
 * Normaliza cualquier error capturado en un `catch` y siempre lanza un `AppError`.
 * Si ya es `AppError` lo relanza tal cual; si se indica `notFound` y el status es 404,
 * lo remapea al código de dominio correspondiente. En cualquier otro caso lanza uno
 * nuevo con los datos de `fallback` (status 502 por defecto).
 * @param error Error original capturado.
 * @param fallback Código, mensaje y status a usar cuando el error no es de dominio.
 * @param notFound Código y mensaje de dominio para remapear un 404.
 * @returns Nunca retorna: siempre lanza.
 * @throws {AppError} Siempre.
 */
export const toAppError = (
  error: unknown,
  fallback: FallbackError,
  notFound?: NotFoundError
): never => {
  if (error instanceof AppError) {
    if (notFound && error.statusCode === 404) {
      throw new AppError(notFound.code, notFound.message, 404, error.details);
    }
    throw error;
  }

  throw new AppError(fallback.code, fallback.message, fallback.statusCode ?? 502);
};
