import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';

const router = Router();

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles with pagination and filters
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, SOLD, RESERVED, MAINTENANCE]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleListResponse'
 */
router.get('/', vehicleController.getVehicles);

/**
 * @swagger
 * /api/vehicles/available:
 *   get:
 *     summary: Get all available vehicles
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of available vehicles
 */
router.get('/available', vehicleController.getAvailableVehicles);

/**
 * @swagger
 * /api/vehicles/brand/{brand}:
 *   get:
 *     summary: Get vehicles by brand
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: brand
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vehicles by brand
 */
router.get('/brand/:brand', vehicleController.getVehiclesByBrand);

/**
 * @swagger
 * /api/vehicles/price-range:
 *   get:
 *     summary: Get vehicles by price range
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of vehicles in price range
 */
router.get('/price-range', vehicleController.getVehiclesByPriceRange);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 */
router.get('/:id', vehicleController.getVehicleById);

export default router;