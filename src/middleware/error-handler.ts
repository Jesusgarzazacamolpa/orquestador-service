import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiResponse } from '../types/common';
import config from '../config';
import logger from '../utils/logger';
import { AppError } from '../utils/app-error';

/**
 * Middleware final de errores. Si recibe un `AppError` responde con su `statusCode`
 * y `code` (log `warn`); cualquier otro error se responde como 500
 * `INTERNAL_SERVER_ERROR` (mensaje genérico en producción) y se loguea con stack.
 * @param err Error capturado por Express.
 * @param req Petición actual (se usan `x-request-id`, ruta y método).
 * @param res Respuesta HTTP.
 * @param _next No se usa; Express lo exige para reconocer el handler de errores.
 * @returns Respuesta JSON con el contrato de error.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`, {
      requestId,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      details: err.details,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        statusCode: err.statusCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path,
      },
    };

    return res.status(err.statusCode).json(response);
  }

  logger.error('Unhandled error', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
      statusCode: 500,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path,
    },
  };

  return res.status(500).json(response);
};

/**
 * Middleware de rutas no encontradas: responde 404 `NOT_FOUND` con el mensaje
 * `Route <METHOD> <path> not found`.
 * @param req Petición actual.
 * @param res Respuesta HTTP.
 * @returns Respuesta JSON 404 con el contrato de error.
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path,
    },
  };

  return res.status(404).json(response);
};