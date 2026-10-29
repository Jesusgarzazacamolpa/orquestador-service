import { Request, Response, NextFunction } from 'express';
import { serviceCatalogService } from '../services/service-catalog.service';
import { ApiResponse } from '../types/common';
import { CreateServiceRequest, UpdateServiceRequest } from '../types/service';
import { body, param } from 'express-validator';

/**
 * Controlador del catálogo de servicios.
 * Parsea la petición, delega en `serviceCatalogService` y responde con un sobre `ApiResponse`;
 * los errores se envían a `next`.
 */
export class ServiceCatalogController {
  /**
   * `GET /api/services`
   * Lee `page`, `pageSize`, `category`, `isActive` y `search` de `req.query`.
   * Invoca `serviceCatalogService.getServices` y responde `200`.
   */
  async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        category: req.query.category as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await serviceCatalogService.getServices(params);

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
   * `GET /api/services/:id`
   * Toma `id` de `req.params`, invoca `serviceCatalogService.getServiceById` y responde `200`.
   */
  async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await serviceCatalogService.getServiceById(id);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
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
   * `GET /api/services/code/:code`
   * Toma `code` de `req.params`, invoca `serviceCatalogService.getServiceByCode` y responde `200`.
   */
  async getServiceByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const service = await serviceCatalogService.getServiceByCode(code);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
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
   * `POST /api/services`
   * Lee el cuerpo tipado `CreateServiceRequest` de `req.body`, invoca
   * `serviceCatalogService.createService` y responde `201`.
   */
  async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateServiceRequest = req.body;
      const service = await serviceCatalogService.createService(data);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
          path: req.path,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * `PUT /api/services/:id`
   * Toma `id` de `req.params` y `UpdateServiceRequest` de `req.body`;
   * invoca `serviceCatalogService.updateService` y responde `200`.
   */
  async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateServiceRequest = req.body;
      const service = await serviceCatalogService.updateService(id, data);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
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
   * `DELETE /api/services/:id`
   * Toma `id` de `req.params`, invoca `serviceCatalogService.deleteService` y responde `204` sin body.
   */
  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await serviceCatalogService.deleteService(id);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * `PATCH /api/services/:id/deactivate`
   * Toma `id` de `req.params`, invoca `serviceCatalogService.deactivateService` y responde `200`.
   */
  async deactivateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await serviceCatalogService.deactivateService(id);

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
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
   * `GET /api/services/category/:category`
   * Toma `category` de `req.params`, invoca `serviceCatalogService.getServicesByCategory`
   * y responde `200`.
   */
  async getServicesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const services = await serviceCatalogService.getServicesByCategory(category);

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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
   * `GET /api/services/active`
   * No recibe datos de entrada; invoca `serviceCatalogService.getActiveServices` y responde `200`.
   */
  async getActiveServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await serviceCatalogService.getActiveServices();

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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
   * `GET /api/services/sales`
   * No recibe datos de entrada; invoca `serviceCatalogService.getSalesServices` y responde `200`.
   */
  async getSalesServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await serviceCatalogService.getSalesServices();

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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
   * `GET /api/services/finance`
   * No recibe datos de entrada; invoca `serviceCatalogService.getFinanceServices` y responde `200`.
   */
  async getFinanceServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await serviceCatalogService.getFinanceServices();

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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
   * `GET /api/services/insurance`
   * No recibe datos de entrada; invoca `serviceCatalogService.getInsuranceServices` y responde `200`.
   */
  async getInsuranceServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await serviceCatalogService.getInsuranceServices();

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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
   * `GET /api/services/post-sale`
   * No recibe datos de entrada; invoca `serviceCatalogService.getPostSaleServices` y responde `200`.
   */
  async getPostSaleServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await serviceCatalogService.getPostSaleServices();

      const response: ApiResponse<typeof services> = {
        success: true,
        data: services,
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

export const serviceCatalogController = new ServiceCatalogController();

/**
 * Grupos de validación (express-validator) para las rutas del catálogo de servicios.
 * `create` y `update` validan el body (con campos opcionales en `update`); `idParam` exige UUID,
 * `codeParam` y `categoryParam` exigen valores no vacíos.
 * Se aplican con el middleware `validate` antes de cada handler.
 */
export const serviceValidators = {
  create: [
    body('code').notEmpty().withMessage('Code is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('basePrice').isNumeric().withMessage('Base price must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  update: [
    body('code').optional().notEmpty().withMessage('Code cannot be empty'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('basePrice').optional().isNumeric().withMessage('Base price must be a number'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  ],
  idParam: [
    param('id').isUUID().withMessage('Valid UUID is required'),
  ],
  codeParam: [
    param('code').notEmpty().withMessage('Code is required'),
  ],
  categoryParam: [
    param('category').notEmpty().withMessage('Category is required'),
  ],
};