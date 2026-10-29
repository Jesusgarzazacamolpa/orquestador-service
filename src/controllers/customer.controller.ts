import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { AppError } from '../utils/app-error';
import { ApiResponse } from '../types/common';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer';
import { body, param } from 'express-validator';

/**
 * Controlador del recurso de clientes.
 * Parsea la petición, delega en `customerService` y responde con un sobre `ApiResponse`;
 * los errores se envían a `next`.
 */
export class CustomerController {
  /**
   * `GET /api/customers`
   * Lee `page`, `pageSize`, `isActive` y `search` de `req.query`.
   * Invoca `customerService.getCustomers` y responde `200`.
   */
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await customerService.getCustomers(params);

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
   * `GET /api/customers/:id`
   * Toma `id` de `req.params`, invoca `customerService.getCustomerById` y responde `200`.
   */
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);

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
   * `GET /api/customers/email/:email`
   * Toma `email` de `req.params`, invoca `customerService.getCustomerByEmail` y responde `200`.
   */
  async getCustomerByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;
      const customer = await customerService.getCustomerByEmail(email);

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
   * `POST /api/customers`
   * Lee el cuerpo tipado `CreateCustomerRequest` de `req.body`, invoca `customerService.createCustomer`
   * y responde `201`.
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateCustomerRequest = req.body;
      const customer = await customerService.createCustomer(data);

      const response: ApiResponse<typeof customer> = {
        success: true,
        data: customer,
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
   * `PUT /api/customers/:id`
   * Toma `id` de `req.params` y `UpdateCustomerRequest` de `req.body`;
   * invoca `customerService.updateCustomer` y responde `200`.
   */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateCustomerRequest = req.body;
      const customer = await customerService.updateCustomer(id, data);

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
   * `DELETE /api/customers/:id`
   * Toma `id` de `req.params`, invoca `customerService.deleteCustomer` y responde `204` sin body.
   */
  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await customerService.deleteCustomer(id);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * `PATCH /api/customers/:id/deactivate`
   * Toma `id` de `req.params`, invoca `customerService.deactivateCustomer` y responde `200`.
   */
  async deactivateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customerService.deactivateCustomer(id);

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
   * `GET /api/customers/search`
   * Lee `name` de `req.query`; si falta lanza `VALIDATION_ERROR` 400.
   * Invoca `customerService.searchCustomers` y responde `200`.
   */
  async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query;
      if (!name) {
        throw new AppError('VALIDATION_ERROR', 'Search name is required', 400);
      }
      const customers = await customerService.searchCustomers(name as string);

      const response: ApiResponse<typeof customers> = {
        success: true,
        data: customers,
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
   * `GET /api/customers/active`
   * No recibe datos de entrada; invoca `customerService.getActiveCustomers` y responde `200`.
   */
  async getActiveCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await customerService.getActiveCustomers();

      const response: ApiResponse<typeof customers> = {
        success: true,
        data: customers,
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

export const customerController = new CustomerController();

/**
 * Grupos de validación (express-validator) para las rutas de clientes.
 * `create` valida el body, `update` lo hace con campos opcionales, `idParam` exige UUID
 * y `emailParam` un email válido.
 * Se aplican con el middleware `validate` antes de cada handler.
 */
export const customerValidators = {
  create: [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  update: [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  idParam: [
    param('id').isUUID().withMessage('Valid UUID is required'),
  ],
  emailParam: [
    param('email').isEmail().withMessage('Valid email is required'),
  ],
};