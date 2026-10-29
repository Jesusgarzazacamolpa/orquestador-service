# Orchestrator Service

Servicio orquestador en Node.js/Express para gestionar catálogos de vehículos, agentes y servicios de clientes. Se integra con:
- **Vehicle Domain Service** (puerto 8083) - Gestión del catálogo de vehículos
- **Catalog Service** (puerto 8082) - Catálogo de agentes, clientes y servicios

## Características

- 🚗 **Gestión de vehículos** - Listado, filtrado y búsqueda de vehículos
- 👥 **Gestión de agentes** - Operaciones CRUD para agentes de ventas
- 👤 **Gestión de clientes** - Operaciones CRUD para clientes
- 🔧 **Catálogo de servicios** - Administración de servicios por categoría (Ventas, Finanzas, Seguros, Postventa)
- 🔄 **Orquestación** - Operaciones complejas que combinan varios servicios
- 📚 **Swagger/OpenAPI** - Documentación interactiva de la API
- 🧪 **Pruebas** - Pruebas unitarias con Jest
- 🐳 **Docker** - Despliegue en contenedores
- 🔒 **Seguridad** - Helmet, CORS y validación de entrada

## Documentación técnica

Consulta [DOCUMENTACION.md](DOCUMENTACION.md) para una referencia detallada de cada clase, método, código de error y flujo de petición.

## Inicio rápido

### Requisitos previos
- Node.js 20+
- Vehicle Domain Service ejecutándose en el puerto 8083
- Catalog Service ejecutándose en el puerto 8082

### Instalación

```bash
cd services/orchestrator-service
npm install
cp .env.example .env
npm run dev
```

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| PORT | 8084 | Puerto del servidor |
| NODE_ENV | development | Entorno de ejecución |
| VEHICLE_SERVICE_URL | http://localhost:8083 | URL del servicio de vehículos |
| CATALOG_SERVICE_URL | http://localhost:8082 | URL del servicio de catálogo |
| CORS_ORIGIN | http://localhost:4200 | Origen permitido por CORS |
| LOG_LEVEL | info | Nivel de logging |

## Endpoints de la API

### Vehículos (`/api/vehicles`)
- `GET /` - Lista vehículos con paginación y filtros
- `GET /available` - Obtiene los vehículos disponibles
- `GET /brand/:brand` - Obtiene vehículos por marca
- `GET /price-range` - Obtiene vehículos por rango de precio
- `GET /:id` - Obtiene un vehículo por su ID

### Agentes (`/api/agents`)
- `GET /` - Lista agentes con paginación y filtros
- `GET /active` - Obtiene los agentes activos
- `GET /specialization/:specialization` - Obtiene agentes por especialidad
- `GET /:id` - Obtiene un agente por su ID
- `GET /email/:email` - Obtiene un agente por su correo electrónico
- `POST /` - Crea un agente
- `PUT /:id` - Actualiza un agente
- `DELETE /:id` - Elimina un agente
- `PATCH /:id/deactivate` - Desactiva un agente

### Clientes (`/api/customers`)
- `GET /` - Lista clientes con paginación y filtros
- `GET /active` - Obtiene los clientes activos
- `GET /search` - Busca clientes por nombre
- `GET /:id` - Obtiene un cliente por su ID
- `GET /email/:email` - Obtiene un cliente por su correo electrónico
- `POST /` - Crea un cliente
- `PUT /:id` - Actualiza un cliente
- `DELETE /:id` - Elimina un cliente
- `PATCH /:id/deactivate` - Desactiva un cliente

### Servicios (`/api/services`)
- `GET /` - Lista servicios con paginación y filtros
- `GET /active` - Obtiene los servicios activos
- `GET /category/:category` - Obtiene servicios por categoría
- `GET /sales` - Obtiene servicios de ventas
- `GET /finance` - Obtiene servicios de finanzas
- `GET /insurance` - Obtiene servicios de seguros
- `GET /post-sale` - Obtiene servicios de postventa
- `GET /:id` - Obtiene un servicio por su ID
- `GET /code/:code` - Obtiene un servicio por su código
- `POST /` - Crea un servicio
- `PUT /:id` - Actualiza un servicio
- `DELETE /:id` - Elimina un servicio
- `PATCH /:id/deactivate` - Desactiva un servicio

### Orquestación (`/api/orchestration`)
- `GET /vehicle/:id` - Obtiene un vehículo con su agente y servicios
- `GET /customer/:id` - Obtiene un cliente con su agente, vehículos y servicios
- `POST /sales/prepare` - Prepara el proceso de venta
- `GET /dashboard` - Obtiene las estadísticas del panel
- `GET /health` - Comprueba la salud de los servicios dependientes (vía `/actuator/health`)

> **Dos endpoints de salud:** `GET /health` reporta el estado del propio proceso orquestador; `GET /api/orchestration/health` comprueba los servicios Vehicle y Catalog mediante Spring Boot Actuator y devuelve `503` si alguno está caído.

## Documentación Swagger

Accede a la documentación interactiva de la API en: `http://localhost:8084/api-docs`

## Pruebas

```bash
# Ejecuta todas las pruebas con cobertura
npm test

# Ejecuta solo las pruebas unitarias
npm run test:unit

# Ejecuta solo las pruebas de integración
npm run test:integration

# Modo watch
npm run test:watch
```

## Compilación

```bash
npm run build
npm start
```

## Docker

```bash
# Construye la imagen
docker build -t orchestrator-service .

# Ejecuta el contenedor
docker run -p 8084:8084 \
  -e VEHICLE_SERVICE_URL=http://host.docker.internal:8083 \
  -e CATALOG_SERVICE_URL=http://host.docker.internal:8082 \
  orchestrator-service
```

## Estructura del proyecto

```
src/
├── config/           # Archivos de configuración
├── controllers/      # Manejadores de peticiones
├── middleware/       # Middleware de Express
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── types/            # Tipos de TypeScript
├── utils/            # Utilidades (cliente HTTP, logger)
├── tests/            # Archivos de pruebas
│   ├── unit/         # Pruebas unitarias
│   └── integration/  # Pruebas de integración
└── index.ts          # Punto de entrada de la aplicación
```

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│  Orchestrator    │
│   (Angular)     │     │  Service (8084)  │
└─────────────────┘     └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
       │  Vehicle    │   │   Catalog    │   │  Catalog    │
       │  Service    │   │   Service    │   │   Service   │
       │  (8083)     │   │  (8082)      │   │  (8082)     │
       │  Vehicles   │   │  Agents      │   │  Services   │
       └─────────────┘   └──────────────┘   └─────────────┘
```

## Licencia

MIT
