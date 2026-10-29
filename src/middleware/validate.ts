import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/app-error';

/**
 * Middleware que evalúa el resultado de `express-validator` y, si hay errores,
 * lanza `VALIDATION_ERROR` (400) con la lista normalizada a `{ field, message, value }`.
 * @param req Petición actual con los resultados de validación.
 * @param _res Respuesta HTTP (no se modifica).
 * @param next Continúa con el siguiente middleware si no hay errores.
 * @returns No retorna valor; invoca `next()` o lanza.
 * @throws {AppError} Con código `VALIDATION_ERROR` y status 400.
 */
export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
      value: 'value' in err ? err.value : undefined,
    }));

    throw new AppError('VALIDATION_ERROR', 'Invalid request data', 400, { errors: errorDetails });
  }
  
  next();
};