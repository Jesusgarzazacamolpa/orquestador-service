import { Router } from 'express';
import { serviceCatalogController } from '../controllers/service-catalog.controller';
import { validate } from '../middleware/validate';
import { serviceValidators } from '../controllers/service-catalog.controller';

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services with pagination and filters
 *     tags: [Services]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceListResponse'
 */
router.get('/', serviceCatalogController.getServices);

/**
 * @swagger
 * /api/services/active:
 *   get:
 *     summary: Get all active services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of active services
 */
router.get('/active', serviceCatalogController.getActiveServices);

/**
 * @swagger
 * /api/services/category/{category}:
 *   get:
 *     summary: Get services by category
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services by category
 */
router.get('/category/:category', serviceValidators.categoryParam, validate, serviceCatalogController.getServicesByCategory);

/**
 * @swagger
 * /api/services/sales:
 *   get:
 *     summary: Get sales services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of sales services
 */
router.get('/sales', serviceCatalogController.getSalesServices);

/**
 * @swagger
 * /api/services/finance:
 *   get:
 *     summary: Get finance services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of finance services
 */
router.get('/finance', serviceCatalogController.getFinanceServices);

/**
 * @swagger
 * /api/services/insurance:
 *   get:
 *     summary: Get insurance services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of insurance services
 */
router.get('/insurance', serviceCatalogController.getInsuranceServices);

/**
 * @swagger
 * /api/services/post-sale:
 *   get:
 *     summary: Get post-sale services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of post-sale services
 */
router.get('/post-sale', serviceCatalogController.getPostSaleServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.get('/:id', serviceValidators.idParam, validate, serviceCatalogController.getServiceById);

/**
 * @swagger
 * /api/services/code/{code}:
 *   get:
 *     summary: Get service by code
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.get('/code/:code', serviceValidators.codeParam, validate, serviceCatalogController.getServiceByCode);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - basePrice
 *               - category
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 */
router.post('/', serviceValidators.create, validate, serviceCatalogController.createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update a service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.put('/:id', serviceValidators.idParam, validate, serviceCatalogController.updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Service deleted
 *       404:
 *         description: Service not found
 */
router.delete('/:id', serviceValidators.idParam, validate, serviceCatalogController.deleteService);

/**
 * @swagger
 * /api/services/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.patch('/:id/deactivate', serviceValidators.idParam, validate, serviceCatalogController.deactivateService);

export default router;