import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración central del servicio, leída de `process.env` tras cargar `dotenv`.
 * - `port` ← `PORT` (8084); `nodeEnv` ← `NODE_ENV` (development).
 * - `vehicleService` ← `VEHICLE_SERVICE_URL` / `VEHICLE_SERVICE_TIMEOUT`.
 * - `catalogService` ← `CATALOG_SERVICE_URL` / `CATALOG_SERVICE_TIMEOUT`.
 * - `cors` ← `CORS_ORIGIN` (credenciales siempre activas).
 * - `logging.level` ← `LOG_LEVEL`; `swagger` ← `SWAGGER_ENABLED` / `SWAGGER_PATH`.
 */
export const config = {
  port: parseInt(process.env.PORT || '8084', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  vehicleService: {
    baseUrl: process.env.VEHICLE_SERVICE_URL || 'http://localhost:8083',
    timeout: parseInt(process.env.VEHICLE_SERVICE_TIMEOUT || '5000', 10),
  },
  
  catalogService: {
    baseUrl: process.env.CATALOG_SERVICE_URL || 'http://localhost:8082',
    timeout: parseInt(process.env.CATALOG_SERVICE_TIMEOUT || '5000', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || '/api-docs',
  },
};

/** Alias por defecto del objeto de configuración para `import config from '../config'`. */
export default config;