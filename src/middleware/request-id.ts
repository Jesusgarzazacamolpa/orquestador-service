import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Propaga el `x-request-id` entrante o genera un UUID si no existe, dejándolo en
 * `req.headers` para que logs y respuestas lo reutilicen.
 * @param req Petición actual.
 * @param _res Respuesta HTTP (no se modifica).
 * @param next Continúa con el siguiente middleware.
 * @returns No retorna valor; siempre invoca `next()`.
 */
export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  req.headers['x-request-id'] = requestId;
  next();
};