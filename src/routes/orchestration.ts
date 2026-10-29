import { Router } from 'express';
import { orchestrationController } from '../controllers/orchestration.controller';
import { validate } from '../middleware/validate';
import { orchestrationValidators } from '../controllers/orchestration.controller';

const router = Router();

/**
 * @swagger
 * /api/orchestration/vehicle/{id}:
 *   get:
 *     summary: Get vehicle with details (assigned agent, available services)
 *     tags: [Orchestration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle with details
 *       404:
 *         description: Vehicle not found
 */
router.get('/vehicle/:id', orchestrationValidators.vehicleIdParam, validate, orchestrationController.getVehicleWithDetails);

/**
 * @swagger
 * /api/orchestration/customer/{id}:
 *   get:
 *     summary: Get customer with details (assigned agent, available vehicles, services)
 *     tags: [Orchestration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer with details
 *       404:
 *         description: Customer not found
 */
router.get('/customer/:id', orchestrationValidators.customerIdParam, validate, orchestrationController.getCustomerWithDetails);

/**
 * @swagger
 * /api/orchestration/sales/prepare:
 *   post:
 *     summary: Prepare sales process with customer, vehicle, agent, and services
 *     tags: [Orchestration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - vehicleId
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Sales process data prepared
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or vehicle not found
 */
router.post('/sales/prepare', orchestrationValidators.prepareSales, validate, orchestrationController.prepareSalesProcess);

/**
 * @swagger
 * /api/orchestration/dashboard:
 *   get:
 *     summary: Get dashboard data with summary statistics
 *     tags: [Orchestration]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', orchestrationController.getDashboardData);

/**
 * @swagger
 * /api/orchestration/health:
 *   get:
 *     summary: Health check of all downstream services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services healthy
 *       503:
 *         description: One or more services down
 */
router.get('/health', orchestrationController.healthCheck);

export default router;