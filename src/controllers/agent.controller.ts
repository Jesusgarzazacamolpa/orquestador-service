import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent.service';
import { ApiResponse } from '../types/common';
import { CreateAgentRequest, UpdateAgentRequest } from '../types/agent';
import { body, param } from 'express-validator';

/**
 * Controlador del recurso de agentes.
 * Parsea la petición, delega en `agentService` y responde con un sobre `ApiResponse`;
 * los errores se envían a `next`.
 */
export class AgentController {
  /**
   * `GET /api/agents`
   * Lee `page`, `pageSize`, `specialization`, `isActive` y `search` de `req.query`.
   * Invoca `agentService.getAgents` y responde `200`.
   */
  async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        specialization: req.query.specialization as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await agentService.getAgents(params);

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
   * `GET /api/agents/:id`
   * Toma `id` de `req.params`, invoca `agentService.getAgentById` y responde `200`.
   */
  async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agent = await agentService.getAgentById(id);

      const response: ApiResponse<typeof agent> = {
        success: true,
        data: agent,
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
   * `GET /api/agents/email/:email`
   * Toma `email` de `req.params`, invoca `agentService.getAgentByEmail` y responde `200`.
   */
  async getAgentByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;
      const agent = await agentService.getAgentByEmail(email);

      const response: ApiResponse<typeof agent> = {
        success: true,
        data: agent,
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
   * `POST /api/agents`
   * Lee el cuerpo tipado `CreateAgentRequest` de `req.body`, invoca `agentService.createAgent`
   * y responde `201`.
   */
  async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateAgentRequest = req.body;
      const agent = await agentService.createAgent(data);

      const response: ApiResponse<typeof agent> = {
        success: true,
        data: agent,
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
   * `PUT /api/agents/:id`
   * Toma `id` de `req.params` y `UpdateAgentRequest` de `req.body`;
   * invoca `agentService.updateAgent` y responde `200`.
   */
  async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateAgentRequest = req.body;
      const agent = await agentService.updateAgent(id, data);

      const response: ApiResponse<typeof agent> = {
        success: true,
        data: agent,
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
   * `DELETE /api/agents/:id`
   * Toma `id` de `req.params`, invoca `agentService.deleteAgent` y responde `204` sin body.
   */
  async deleteAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await agentService.deleteAgent(id);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * `PATCH /api/agents/:id/deactivate`
   * Toma `id` de `req.params`, invoca `agentService.deactivateAgent` y responde `200`.
   */
  async deactivateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agent = await agentService.deactivateAgent(id);

      const response: ApiResponse<typeof agent> = {
        success: true,
        data: agent,
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
   * `GET /api/agents/specialization/:specialization`
   * Toma `specialization` de `req.params`, invoca `agentService.getAgentsBySpecialization`
   * y responde `200`.
   */
  async getAgentsBySpecialization(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialization } = req.params;
      const agents = await agentService.getAgentsBySpecialization(specialization);

      const response: ApiResponse<typeof agents> = {
        success: true,
        data: agents,
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
   * `GET /api/agents/active`
   * No recibe datos de entrada; invoca `agentService.getActiveAgents` y responde `200`.
   */
  async getActiveAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await agentService.getActiveAgents();

      const response: ApiResponse<typeof agents> = {
        success: true,
        data: agents,
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

export const agentController = new AgentController();

/**
 * Grupos de validación (express-validator) para las rutas de agentes.
 * `create` y `update` validan el body; `idParam` exige UUID, `emailParam` un email válido
 * y `specializationParam` un valor no vacío.
 * Se aplican con el middleware `validate` antes de cada handler.
 */
export const agentValidators = {
  create: [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
  ],
  update: [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
  ],
  idParam: [
    param('id').isUUID().withMessage('Valid UUID is required'),
  ],
  emailParam: [
    param('email').isEmail().withMessage('Valid email is required'),
  ],
  specializationParam: [
    param('specialization').notEmpty().withMessage('Specialization is required'),
  ],
};