import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { validate } from '../middleware/validate';
import { agentValidators } from '../controllers/agent.controller';

const router = Router();

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Get all agents with pagination and filters
 *     tags: [Agents]
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
 *         name: specialization
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
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentListResponse'
 */
router.get('/', agentController.getAgents);

/**
 * @swagger
 * /api/agents/active:
 *   get:
 *     summary: Get all active agents
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: List of active agents
 */
router.get('/active', agentController.getActiveAgents);

/**
 * @swagger
 * /api/agents/specialization/{specialization}:
 *   get:
 *     summary: Get agents by specialization
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: specialization
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of agents by specialization
 */
router.get('/specialization/:specialization', agentController.getAgentsBySpecialization);

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Agent details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 */
router.get('/:id', agentValidators.idParam, validate, agentController.getAgentById);

/**
 * @swagger
 * /api/agents/email/{email}:
 *   get:
 *     summary: Get agent by email
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Agent details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 */
router.get('/email/:email', agentValidators.emailParam, validate, agentController.getAgentByEmail);

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - licenseNumber
 *               - specialization
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               specialization:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agent created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 */
router.post('/', agentValidators.create, validate, agentController.createAgent);

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
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
 *               licenseNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               specialization:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 */
router.put('/:id', agentValidators.idParam, validate, agentController.updateAgent);

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: Delete an agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Agent deleted
 *       404:
 *         description: Agent not found
 */
router.delete('/:id', agentValidators.idParam, validate, agentController.deleteAgent);

/**
 * @swagger
 * /api/agents/{id}/deactivate:
 *   patch:
 *     summary: Deactivate an agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Agent deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 */
router.patch('/:id/deactivate', agentValidators.idParam, validate, agentController.deactivateAgent);

export default router;