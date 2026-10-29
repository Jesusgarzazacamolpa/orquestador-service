/**
 * Punto de entrada del Orchestrator Service. Orden de middlewares:
 * 1. `helmet` y `cors` (origen, credenciales, headers `Content-Type`, `Authorization`, `X-Request-ID`).
 * 2. Parsers `express.json` / `express.urlencoded`, luego `morgan('combined')` hacia Winston.
 * 3. `requestIdMiddleware`.
 * 4. Rutas: `GET /health`, Swagger UI, `GET /swagger.json` y routers `/api/*`.
 * 5. `notFoundHandler` y, al final, `errorHandler`.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { swaggerSpec } from './config/swagger';
import { requestIdMiddleware } from './middleware/request-id';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import vehicleRoutes from './routes/vehicles';
import agentRoutes from './routes/agents';
import customerRoutes from './routes/customers';
import serviceRoutes from './routes/services';
import orchestrationRoutes from './routes/orchestration';
import logger from './utils/logger';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use(requestIdMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'orchestrator-service', timestamp: new Date().toISOString() });
});

if (config.swagger.enabled) {
  app.use(config.swagger.path, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Orchestrator Service API',
  }));
  
  app.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orchestration', orchestrationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Levanta el servidor HTTP en `config.port` y registra los manejadores de
 * `SIGTERM`/`SIGINT` para un apagado ordenado.
 * @returns No retorna valor; el servidor queda escuchando.
 */
const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`🚀 Orchestrator Service running on port ${config.port}`);
    logger.info(`📚 Swagger UI available at http://localhost:${config.port}${config.swagger.path}`);
    logger.info(`🏥 Health check at http://localhost:${config.port}/health`);
  });

  /**
   * Cierra el servidor y finaliza el proceso con código 0; si el cierre no concluye,
   * fuerza `process.exit(1)` tras 10 segundos.
   * @param signal Señal recibida (`SIGTERM` o `SIGINT`).
   * @returns No retorna valor.
   */
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('Server closed. Process terminated.');
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();

export default app;