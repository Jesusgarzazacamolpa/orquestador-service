import { Request, Response, NextFunction } from 'express';
import { orchestrationService } from '../services/orchestration.service';
import { AppError } from '../utils/app-error';
import { ApiResponse } from '../types/common';
import { body, param } from 'express-validator';

/**
 * Controlador de orquestación entre vehículos, clientes y catálogo.
 * Parsea la petición, delega en `orchestrationService` y responde con un sobre `ApiResponse`;
 * los errores se envían a `next`.
 */
export class OrchestrationController {
  /**
   * `GET /api/orchestration/vehicle/:id`
   * Toma `id` de `req.params`, invoca `orchestrationService.getVehicleWithDetails` y responde `200`.
   */
  async getVehicleWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await orchestrationService.getVehicleWithDetails(id);

      const response: ApiResponse<typeof vehicle> = {
        success: true,
        data: vehicle,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * `GET /api/orchestration/customer/:id`
   * Toma `id` de `req.params`, invoca `orchestrationService.getCustomerWithDetails` y responde `200`.
   */
  async getCustomerWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await orchestrationService.getCustomerWithDetails(id);

      const response: ApiResponse<typeof customer> = {
        success: true,
        data: customer,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * `POST /api/orchestration/sales/prepare`
   * Lee `customerId` y `vehicleId` de `req.body`; si falta alguno lanza `VALIDATION_ERROR` 400.
   * Invoca `orchestrationService.prepareSalesProcess` y responde `200`.
   */
  async prepareSalesProcess(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, vehicleId } = req.body;
      
      if (!customerId || !vehicleId) {
        throw new AppError('VALIDATION_ERROR', 'customerId and vehicleId are required', 400);
      }

      const salesData = await orchestrationService.prepareSalesProcess(customerId, vehicleId);

      const response: ApiResponse<typeof salesData> = {
        success: true,
        data: salesData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * `GET /api/orchestration/dashboard`
   * No recibe datos de entrada; invoca `orchestrationService.getDashboardData` y responde `200`.
   */
  async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orchestrationService.getDashboardData();

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * `GET /api/orchestration/health`
   * No recibe datos de entrada; invoca `orchestrationService.healthCheck`.
   * Responde `200` si `vehicleService` y `catalogService` están `UP`, o `503` en caso contrario.
   */
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await orchestrationService.healthCheck();

      const response: ApiResponse<typeof health> = {
        success: true,
        data: health,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      const statusCode = health.vehicleService === 'UP' && health.catalogService === 'UP' ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const orchestrationController = new OrchestrationController();

/**
 * Grupos de validación (express-validator) para las rutas de orquestación.
 * `vehicleIdParam` y `customerIdParam` exigen UUID en `:id`; `prepareSales` valida
 * `customerId` y `vehicleId` del body como UUID.
 * Se aplican con el middleware `validate` antes de cada handler.
 */
export const orchestrationValidators = {
  vehicleIdParam: [
    param('id').isUUID().withMessage('Valid UUID is required'),
  ],
  customerIdParam: [
    param('id').isUUID().withMessage('Valid UUID is required'),
  ],
  prepareSales: [
    body('customerId').isUUID().withMessage('Valid customer UUID is required'),
    body('vehicleId').isUUID().withMessage('Valid vehicle UUID is required'),
  ],
};