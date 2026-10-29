import { Request, Response, NextFunction } from 'express';
import { vehicleService } from '../services/vehicle.service';
import { AppError } from '../utils/app-error';
import { ApiResponse } from '../types/common';

/**
 * Controlador del recurso de vehículos.
 * Parsea la petición, delega en `vehicleService` y responde con un sobre `ApiResponse`;
 * cualquier error se propaga a `next`.
 */
export class VehicleController {
  /**
   * `GET /api/vehicles`
   * Lee `page`, `pageSize`, `brand`, `model`, `status`, `minPrice`, `maxPrice` y `year` de `req.query`.
   * Invoca `vehicleService.getVehicles` y responde `200`.
   */
  async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        brand: req.query.brand as string,
        model: req.query.model as string,
        status: req.query.status as 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'MAINTENANCE' | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
      };

      const result = await vehicleService.getVehicles(params);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
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
   * `GET /api/vehicles/:id`
   * Toma `id` de `req.params`, invoca `vehicleService.getVehicleById` y responde `200`.
   */
  async getVehicleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);

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
   * `GET /api/vehicles/available`
   * No recibe datos de entrada; invoca `vehicleService.getAvailableVehicles` y responde `200`.
   */
  async getAvailableVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = await vehicleService.getAvailableVehicles();

      const response: ApiResponse<typeof vehicles> = {
        success: true,
        data: vehicles,
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
   * `GET /api/vehicles/brand/:brand`
   * Toma `brand` de `req.params`, invoca `vehicleService.getVehiclesByBrand` y responde `200`.
   */
  async getVehiclesByBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { brand } = req.params;
      const vehicles = await vehicleService.getVehiclesByBrand(brand);

      const response: ApiResponse<typeof vehicles> = {
        success: true,
        data: vehicles,
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
   * `GET /api/vehicles/price-range`
   * Lee `minPrice` y `maxPrice` de `req.query`; si alguno no es numérico lanza `VALIDATION_ERROR` 400.
   * Invoca `vehicleService.getVehiclesByPriceRange` y responde `200`.
   */
  async getVehiclesByPriceRange(req: Request, res: Response, next: NextFunction) {
    try {
      const minPrice = parseFloat(req.query.minPrice as string);
      const maxPrice = parseFloat(req.query.maxPrice as string);

      if (isNaN(minPrice) || isNaN(maxPrice)) {
        throw new AppError('VALIDATION_ERROR', 'minPrice and maxPrice are required', 400);
      }

      const vehicles = await vehicleService.getVehiclesByPriceRange(minPrice, maxPrice);

      const response: ApiResponse<typeof vehicles> = {
        success: true,
        data: vehicles,
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
}

export const vehicleController = new VehicleController();