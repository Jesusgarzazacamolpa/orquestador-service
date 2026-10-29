import swaggerJSDoc from 'swagger-jsdoc';
import config from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Orchestrator Service API',
    version: '1.0.0',
    description: 'API documentation for the Orchestrator Service managing vehicle catalogs, agents, and customer services',
    contact: {
      name: 'Flow Orchestrator Team',
      email: 'support@floworchestrator.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          brand: { type: 'string' },
          model: { type: 'string' },
          year: { type: 'integer' },
          color: { type: 'string' },
          price: { type: 'number', format: 'float' },
          status: { type: 'string', enum: ['AVAILABLE', 'SOLD', 'RESERVED', 'MAINTENANCE'] },
          vin: { type: 'string' },
          mileage: { type: 'integer' },
          fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'] },
          transmission: { type: 'string', enum: ['MANUAL', 'AUTOMATIC'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      VehicleListResponse: {
        type: 'object',
        properties: {
          vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
      Agent: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          licenseNumber: { type: 'string' },
          isActive: { type: 'boolean' },
          specialization: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AgentListResponse: {
        type: 'object',
        properties: {
          agents: { type: 'array', items: { $ref: '#/components/schemas/Agent' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          identificationNumber: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CustomerListResponse: {
        type: 'object',
        properties: {
          customers: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          basePrice: { type: 'number', format: 'float' },
          isActive: { type: 'boolean' },
          category: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ServiceListResponse: {
        type: 'object',
        properties: {
          services: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
              statusCode: { type: 'integer' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string' },
              path: { type: 'string' },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Vehicles', description: 'Vehicle catalog management' },
    { name: 'Agents', description: 'Agent catalog management' },
    { name: 'Customers', description: 'Customer management' },
    { name: 'Services', description: 'Service catalog management' },
    { name: 'Orchestration', description: 'Cross-service orchestration endpoints' },
    { name: 'Health', description: 'Health check endpoints' },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

/**
 * Especificación OpenAPI 3.0.0 generada por `swagger-jsdoc` a partir de
 * `swaggerDefinition` y de las anotaciones en `src/routes/*.ts` y `src/controllers/*.ts`.
 */
export const swaggerSpec = swaggerJSDoc(options);

/**
 * Imprime la especificación OpenAPI en consola como JSON; la usa `npm run swagger`.
 * @returns No retorna valor.
 */
export const generateSwaggerSpec = () => {
  console.log(JSON.stringify(swaggerSpec, null, 2));
};

export default swaggerSpec;