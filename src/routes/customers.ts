import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { validate } from '../middleware/validate';
import { customerValidators } from '../controllers/customer.controller';

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with pagination and filters
 *     tags: [Customers]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerListResponse'
 */
router.get('/', customerController.getCustomers);

/**
 * @swagger
 * /api/customers/active:
 *   get:
 *     summary: Get all active customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of active customers
 */
router.get('/active', customerController.getActiveCustomers);

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Search customers by name
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customers matching search
 */
router.get('/search', customerController.searchCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get('/:id', customerValidators.idParam, validate, customerController.getCustomerById);

/**
 * @swagger
 * /api/customers/email/{email}:
 *   get:
 *     summary: Get customer by email
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get('/email/:email', customerValidators.emailParam, validate, customerController.getCustomerByEmail);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               identificationNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */
router.post('/', customerValidators.create, validate, customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
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
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               identificationNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.put('/:id', customerValidators.idParam, validate, customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', customerValidators.idParam, validate, customerController.deleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.patch('/:id/deactivate', customerValidators.idParam, validate, customerController.deactivateCustomer);

export default router;