# Orchestrator Service

Node.js/Express orchestrator service for managing vehicle catalogs, agents, and customer services. Integrates with:
- **Vehicle Domain Service** (port 8083) - Vehicle catalog management
- **Catalog Service** (port 8082) - Agents, customers, and services catalog

## Features

- 🚗 **Vehicle Management** - List, filter, and search vehicles
- 👥 **Agent Management** - CRUD operations for sales agents
- 👤 **Customer Management** - CRUD operations for customers
- 🔧 **Service Catalog** - Manage services by category (Sales, Finance, Insurance, Post-sale)
- 🔄 **Orchestration** - Complex operations combining multiple services
- 📚 **Swagger/OpenAPI** - Interactive API documentation
- 🧪 **Tests** - Unit tests with Jest
- 🐳 **Docker** - Containerized deployment
- 🔒 **Security** - Helmet, CORS, input validation

## Technical Documentation

See [DOCUMENTACION.md](DOCUMENTACION.md) for a detailed reference of every class, method, error code, and request flow.

## Quick Start

### Prerequisites
- Node.js 20+
- Vehicle Domain Service running on port 8083
- Catalog Service running on port 8082

### Installation

```bash
cd services/orchestrator-service
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8084 | Server port |
| NODE_ENV | development | Environment |
| VEHICLE_SERVICE_URL | http://localhost:8083 | Vehicle service URL |
| CATALOG_SERVICE_URL | http://localhost:8082 | Catalog service URL |
| CORS_ORIGIN | http://localhost:4200 | CORS allowed origin |
| LOG_LEVEL | info | Logging level |

## API Endpoints

### Vehicles (`/api/vehicles`)
- `GET /` - List vehicles with pagination and filters
- `GET /available` - Get available vehicles
- `GET /brand/:brand` - Get vehicles by brand
- `GET /price-range` - Get vehicles by price range
- `GET /:id` - Get vehicle by ID

### Agents (`/api/agents`)
- `GET /` - List agents with pagination and filters
- `GET /active` - Get active agents
- `GET /specialization/:specialization` - Get agents by specialization
- `GET /:id` - Get agent by ID
- `GET /email/:email` - Get agent by email
- `POST /` - Create agent
- `PUT /:id` - Update agent
- `DELETE /:id` - Delete agent
- `PATCH /:id/deactivate` - Deactivate agent

### Customers (`/api/customers`)
- `GET /` - List customers with pagination and filters
- `GET /active` - Get active customers
- `GET /search` - Search customers by name
- `GET /:id` - Get customer by ID
- `GET /email/:email` - Get customer by email
- `POST /` - Create customer
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer
- `PATCH /:id/deactivate` - Deactivate customer

### Services (`/api/services`)
- `GET /` - List services with pagination and filters
- `GET /active` - Get active services
- `GET /category/:category` - Get services by category
- `GET /sales` - Get sales services
- `GET /finance` - Get finance services
- `GET /insurance` - Get insurance services
- `GET /post-sale` - Get post-sale services
- `GET /:id` - Get service by ID
- `GET /code/:code` - Get service by code
- `POST /` - Create service
- `PUT /:id` - Update service
- `DELETE /:id` - Delete service
- `PATCH /:id/deactivate` - Deactivate service

### Orchestration (`/api/orchestration`)
- `GET /vehicle/:id` - Get vehicle with agent and services
- `GET /customer/:id` - Get customer with agent, vehicles, services
- `POST /sales/prepare` - Prepare sales process
- `GET /dashboard` - Get dashboard statistics
- `GET /health` - Health check of downstream services (via `/actuator/health`)

> **Two health endpoints:** `GET /health` reports the orchestrator process itself; `GET /api/orchestration/health` checks the Vehicle and Catalog services through Spring Boot Actuator and returns `503` if either is down.

## Swagger Documentation

Access interactive API docs at: `http://localhost:8084/api-docs`

## Testing

```bash
# Run all tests with coverage
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

## Building

```bash
npm run build
npm start
```

## Docker

```bash
# Build image
docker build -t orchestrator-service .

# Run container
docker run -p 8084:8084 \
  -e VEHICLE_SERVICE_URL=http://host.docker.internal:8083 \
  -e CATALOG_SERVICE_URL=http://host.docker.internal:8082 \
  orchestrator-service
```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── routes/           # Route definitions
├── services/         # Business logic
├── types/            # TypeScript types
├── utils/            # Utilities (HTTP client, logger)
├── tests/            # Test files
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
└── index.ts          # Application entry point
```

## Architecture

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

## License

MIT