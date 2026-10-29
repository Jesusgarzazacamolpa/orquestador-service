# Documentación técnica — Orchestrator Service

Referencia de clases, métodos, contratos y flujo interno del servicio orquestador (Node.js 20 + Express 4 + TypeScript).

---

## 1. Descripción general

`orchestrator-service` es un **BFF / orquestador** que expone una API REST unificada para el frontend y compone información de dos servicios downstream:

| Servicio downstream | URL por defecto | Responsabilidad |
|---|---|---|
| Vehicle Domain Service | `http://localhost:8083` | Catálogo de vehículos |
| Catalog Service | `http://localhost:8082` | Agentes, clientes y catálogo de servicios |

El orquestador **no tiene persistencia propia**: toda la lógica consiste en validar, transformar y combinar respuestas HTTP de esos dos servicios.

> El código fuente está anotado con **TSDoc** (`/** ... */`) en clases, métodos, middlewares y constantes. Este documento consolida esa información junto con los contratos HTTP y el catálogo de errores.

- Puerto por defecto: `8084`
- Documentación interactiva: `/api-docs` (Swagger UI)
- Health propio: `GET /health`
- Health de dependencias: `GET /api/orchestration/health`

---

## 2. Arquitectura y flujo de una petición

```
Cliente
  │
  ▼
index.ts (helmet → cors → body parsers → morgan → requestId)
  │
  ▼
routes/*.ts  ──► validators (express-validator) ──► validate (middleware)
  │
  ▼
controllers/*.ts   (parsea req, arma ApiResponse, delega en next(error))
  │
  ▼
services/*.ts      (reglas de negocio, composición, traducción de errores)
  │
  ▼
HttpClient (axios) ──► Vehicle Service / Catalog Service
```

Convenciones transversales:

- Toda respuesta exitosa usa el sobre `ApiResponse<T>` (`success`, `data`, `meta`).
- Todo error se normaliza a `AppError` y lo serializa `errorHandler` con el mismo sobre.
- Cada petición recibe un `X-Request-ID` (se respeta el entrante o se genera uno) que se propaga a downstream y se devuelve en `meta.requestId`.
- Los servicios se exportan como **singletons** (`vehicleService`, `agentService`, etc.), igual que controladores y clientes HTTP.

---

## 3. Mapa de archivos

| Ruta | Contenido |
|---|---|
| `src/index.ts` | Bootstrap de Express, middlewares globales, montaje de rutas, arranque y apagado |
| `src/config/index.ts` | Objeto `config` con variables de entorno |
| `src/config/swagger.ts` | Definición OpenAPI + `swaggerSpec` |
| `src/utils/logger.ts` | Logger Winston (consola + archivos) |
| `src/utils/http-client.ts` | Clase `HttpClient` y sus dos instancias |
| `src/utils/app-error.ts` | Clase `AppError` y helper `toAppError` |
| `src/middleware/request-id.ts` | `requestIdMiddleware` |
| `src/middleware/validate.ts` | `validate` (express-validator) |
| `src/middleware/error-handler.ts` | `AppError`, `errorHandler`, `notFoundHandler` |
| `src/types/*.ts` | Interfaces de dominio y de contrato |
| `src/services/*.service.ts` | Lógica de negocio y acceso a downstream |
| `src/controllers/*.controller.ts` | Handlers HTTP + validadores por recurso |
| `src/routes/*.ts` | Routers de Express + anotaciones Swagger |
| `src/tests/unit/*.test.ts` | Pruebas unitarias (Jest + ts-jest) |

---

## 4. Infraestructura

### 4.1 `config` — `src/config/index.ts`

Objeto constante (no clase) construido a partir de `process.env` tras cargar `dotenv`.

| Propiedad | Variable de entorno | Default |
|---|---|---|
| `port` | `PORT` | `8084` |
| `nodeEnv` | `NODE_ENV` | `development` |
| `vehicleService.baseUrl` | `VEHICLE_SERVICE_URL` | `http://localhost:8083` |
| `vehicleService.timeout` | `VEHICLE_SERVICE_TIMEOUT` | `5000` ms |
| `catalogService.baseUrl` | `CATALOG_SERVICE_URL` | `http://localhost:8082` |
| `catalogService.timeout` | `CATALOG_SERVICE_TIMEOUT` | `5000` ms |
| `cors.origin` | `CORS_ORIGIN` | `http://localhost:4200` |
| `cors.credentials` | — | `true` |
| `logging.level` | `LOG_LEVEL` | `info` |
| `swagger.enabled` | `SWAGGER_ENABLED` | `true` (solo `"false"` lo desactiva) |
| `swagger.path` | `SWAGGER_PATH` | `/api-docs` |

Exporta `config` (named) y `default`.

### 4.2 `logger` — `src/utils/logger.ts`

Instancia de Winston con `defaultMeta = { service: 'orchestrator-service' }`.

| Transporte | Nivel | Detalle |
|---|---|---|
| Console | `config.logging.level` | Formato coloreado con timestamp |
| File `logs/error.log` | `error` | Rotación a 5 MB, 5 archivos |
| File `logs/combined.log` | Todos | Rotación a 5 MB, 5 archivos |

Métodos usados en el resto del código: `logger.info`, `logger.warn`, `logger.error`.

### 4.3 Clase `HttpClient` — `src/utils/http-client.ts`

Envoltorio tipado sobre `axios` para hablar con un servicio downstream.

**Constructor** `new HttpClient(baseUrl: string, timeout: number)`

- Crea la instancia de axios con `Content-Type: application/json`.
- **Interceptor de request**: inyecta un `X-Request-ID` nuevo (`randomUUID()` de `node:crypto`).
- **Interceptor de response**: traduce fallos de axios a `AppError`, conservando el status real del downstream:
  - Con respuesta HTTP → `DOWNSTREAM_ERROR` con `statusCode = <status downstream>` y `details.downstream = <body>`
  - Sin respuesta (red/timeout) → `DOWNSTREAM_UNAVAILABLE` con `statusCode 503`
  - Otros → `REQUEST_ERROR` con `statusCode 500`

| Método | Firma | Comportamiento |
|---|---|---|
| `get` | `<T>(url, params?) => Promise<T>` | `GET`, devuelve `response.data` |
| `post` | `<T>(url, data) => Promise<T>` | `POST`, devuelve `response.data` |
| `put` | `<T>(url, data) => Promise<T>` | `PUT`, devuelve `response.data` |
| `patch` | `<T>(url, data) => Promise<T>` | `PATCH`, devuelve `response.data` |
| `delete` | `<T>(url) => Promise<T>` | `DELETE`, devuelve `response.data` |

**Instancias exportadas**

- `vehicleHttpClient` → `config.vehicleService`
- `catalogHttpClient` → `config.catalogService`

### 4.4 Clase `AppError` y helper `toAppError` — `src/utils/app-error.ts`

Extiende `Error` y añade metadatos para la respuesta HTTP.

```ts
new AppError(code: string, message: string, statusCode: number, details?: Record<string, unknown>)
```

| Campo | Tipo | Uso |
|---|---|---|
| `name` | `'AppError'` | Discriminador en `errorHandler` |
| `code` | `string` | Código de negocio (p. ej. `VEHICLE_NOT_FOUND`) |
| `statusCode` | `number` | Status HTTP a devolver |
| `details` | `Record<string, unknown>?` | Información adicional (p. ej. errores de validación) |

**`toAppError(error, fallback, notFound?)`**

Normaliza cualquier error dentro de un `catch` y **siempre lanza**:

- Si `error` ya es `AppError`, lo relanza tal cual (conserva status y código del downstream).
- Si se pasa `notFound` y el `statusCode` es `404`, lo remapea al código de dominio (`VEHICLE_NOT_FOUND`, `AGENT_NOT_FOUND`, etc.).
- Si no es `AppError`, lanza uno nuevo con el `fallback` (por defecto `502`).

### 4.5 Middlewares

| Export | Archivo | Descripción |
|---|---|---|
| `requestIdMiddleware(req, _res, next)` | `src/middleware/request-id.ts` | Si no existe `x-request-id`, genera un UUID y lo deja en `req.headers`; siempre llama `next()`. |
| `validate(req, _res, next)` | `src/middleware/validate.ts` | Ejecuta `validationResult(req)`; si hay errores lanza `AppError('VALIDATION_ERROR', ..., 400, { errors })`. Cada error se normaliza a `{ field, message, value }`. |
| `errorHandler(err, req, res, _next)` | `src/middleware/error-handler.ts` | Si es `AppError` responde con su `statusCode` y `code` (log `warn`). Si no, responde `500 INTERNAL_SERVER_ERROR` (oculta el mensaje en producción) y loguea `error` con stack. |
| `notFoundHandler(req, res)` | `src/middleware/error-handler.ts` | Responde `404 NOT_FOUND` con `Route <METHOD> <path> not found`. |

### 4.6 Swagger — `src/config/swagger.ts`

- `swaggerDefinition`: OpenAPI 3.0.0, servidor `http://localhost:<port>`. El servicio **no implementa autenticación**, por lo que no se declara esquema de seguridad.
- Esquemas: `Vehicle`, `VehicleListResponse`, `Agent`, `AgentListResponse`, `Customer`, `CustomerListResponse`, `Service`, `ServiceListResponse`, `Error`.
- Tags declarados: `Vehicles`, `Agents`, `Customers`, `Services`, `Orchestration`, `Health`.
- `options.apis` escanea `src/routes/*.ts` y `src/controllers/*.ts` (las anotaciones viven en las rutas).
- Exporta `swaggerSpec`, `generateSwaggerSpec()` (imprime el JSON en consola; usado por `npm run swagger`) y `default`.

### 4.7 Bootstrap — `src/index.ts`

Orden de middlewares y montaje:

1. `helmet` (con `crossOriginResourcePolicy: cross-origin`)
2. `cors` (origen configurado, credenciales, métodos `GET/POST/PUT/PATCH/DELETE/OPTIONS`, headers `Content-Type`, `Authorization`, `X-Request-ID`)
3. `express.json()` y `express.urlencoded()`
4. `morgan('combined')` redirigido a Winston
5. `requestIdMiddleware`
6. `GET /health` → `{ status: 'OK', service, timestamp }` (solo valida el proceso del orquestador)
7. Swagger UI en `config.swagger.path` + `GET /swagger.json` (solo si `swagger.enabled`)
8. Routers: `/api/vehicles`, `/api/agents`, `/api/customers`, `/api/services`, `/api/orchestration`
9. `notFoundHandler` y `errorHandler`
10. `startServer()`

**Funciones internas**

| Función | Descripción |
|---|---|
| `startServer()` | Levanta `app.listen(config.port)` y registra `SIGTERM`/`SIGINT`. |
| `gracefulShutdown(signal)` | Cierra el servidor y hace `process.exit(0)`; fuerza `exit(1)` tras 10 s. |

Exporta `default app` (útil para pruebas de integración con supertest).

---

## 5. Capa de servicios

Todas las clases siguen el mismo patrón: construyen la llamada al `HttpClient` correspondiente, transforman la respuesta al contrato interno y, ante cualquier fallo, loguean y lanzan `AppError` con código propio y status `502` (salvo "not found", que es `404`).

### 5.1 `VehicleService` — `src/services/vehicle.service.ts`

Downstream: `vehicleHttpClient`.

| Método | Firma | Descripción | Error |
|---|---|---|---|
| `getVehicles` | `(params: VehicleQueryParams = {}) => Promise<PaginatedResponse<Vehicle>>` | `GET /vehicles`. Defaults `page=1`, `pageSize=20`. Añade `page`, `size` y, si existen, `brand`, `model`, `status`, `minPrice`, `maxPrice`, `year`. Mapea `vehicles → items` y calcula `totalPages`. | `VEHICLE_FETCH_FAILED` 502 |
| `getVehicleById` | `(id: string) => Promise<Vehicle>` | `GET /vehicles/:id`. | `VEHICLE_NOT_FOUND` 404 |
| `getVehicleByVin` | `(vin: string) => Promise<Vehicle>` | Recorre todas las páginas (100 por página) hasta encontrar el VIN. | `VEHICLE_NOT_FOUND` 404 / `VEHICLE_FETCH_FAILED` 502 |
| `getAvailableVehicles` | `() => Promise<Vehicle[]>` | `getVehicles({ status:'AVAILABLE', pageSize:100 })` → `items`. | heredado |
| `getVehiclesByBrand` | `(brand: string) => Promise<Vehicle[]>` | `getVehicles({ brand, pageSize:100 })` → `items`. | heredado |
| `getVehiclesByPriceRange` | `(minPrice: number, maxPrice: number) => Promise<Vehicle[]>` | `getVehicles({ minPrice, maxPrice, pageSize:100 })` → `items`. | heredado |

`export const vehicleService = new VehicleService()`

### 5.2 `AgentService` — `src/services/agent.service.ts`

Downstream: `catalogHttpClient` (prefijo `/api/agents`).

| Método | Firma | Descripción | Error |
|---|---|---|---|
| `getAgents` | `(params: AgentQueryParams = {}) => Promise<PaginatedResponse<Agent>>` | `GET /api/agents` con `page`, `size`, `specialization`, `isActive`, `search`. Usa `totalPages` del downstream o lo calcula. | `AGENT_FETCH_FAILED` 502 |
| `getAgentById` | `(id) => Promise<Agent>` | `GET /api/agents/:id`. | `AGENT_NOT_FOUND` 404 |
| `getAgentByEmail` | `(email) => Promise<Agent>` | `GET /api/agents/email/:email`. | `AGENT_NOT_FOUND` 404 |
| `createAgent` | `(data: CreateAgentRequest) => Promise<Agent>` | `POST /api/agents`. | `AGENT_CREATE_FAILED` 502 |
| `updateAgent` | `(id, data: UpdateAgentRequest) => Promise<Agent>` | `PUT /api/agents/:id`. | `AGENT_UPDATE_FAILED` 502 |
| `deleteAgent` | `(id) => Promise<void>` | `DELETE /api/agents/:id`. | `AGENT_DELETE_FAILED` 502 |
| `deactivateAgent` | `(id) => Promise<Agent>` | `PATCH /api/agents/:id/deactivate` con body `{}`. | `AGENT_DEACTIVATE_FAILED` 502 |
| `getAgentsBySpecialization` | `(specialization) => Promise<Agent[]>` | `getAgents({ specialization, pageSize:100 })` → `items`. | heredado |
| `getActiveAgents` | `() => Promise<Agent[]>` | `getAgents({ isActive:true, pageSize:100 })` → `items`. | heredado |

`export const agentService = new AgentService()`

### 5.3 `CustomerService` — `src/services/customer.service.ts`

Downstream: `catalogHttpClient` (prefijo `/api/customers`).

| Método | Firma | Descripción | Error |
|---|---|---|---|
| `getCustomers` | `(params: CustomerQueryParams = {}) => Promise<PaginatedResponse<Customer>>` | `GET /api/customers` con `page`, `size`, `isActive`, `search`. | `CUSTOMER_FETCH_FAILED` 502 |
| `getCustomerById` | `(id) => Promise<Customer>` | `GET /api/customers/:id`. | `CUSTOMER_NOT_FOUND` 404 |
| `getCustomerByEmail` | `(email) => Promise<Customer>` | `GET /api/customers/email/:email`. | `CUSTOMER_NOT_FOUND` 404 |
| `createCustomer` | `(data: CreateCustomerRequest) => Promise<Customer>` | `POST /api/customers`. | `CUSTOMER_CREATE_FAILED` 502 |
| `updateCustomer` | `(id, data: UpdateCustomerRequest) => Promise<Customer>` | `PUT /api/customers/:id`. | `CUSTOMER_UPDATE_FAILED` 502 |
| `deleteCustomer` | `(id) => Promise<void>` | `DELETE /api/customers/:id`. | `CUSTOMER_DELETE_FAILED` 502 |
| `deactivateCustomer` | `(id) => Promise<Customer>` | `PATCH /api/customers/:id/deactivate`. | `CUSTOMER_DEACTIVATE_FAILED` 502 |
| `searchCustomers` | `(name) => Promise<Customer[]>` | `getCustomers({ search:name, pageSize:100 })` → `items`. | heredado |
| `getActiveCustomers` | `() => Promise<Customer[]>` | `getCustomers({ isActive:true, pageSize:100 })` → `items`. | heredado |

`export const customerService = new CustomerService()`

### 5.4 `ServiceCatalogService` — `src/services/service-catalog.service.ts`

Downstream: `catalogHttpClient` (prefijo `/api/services`).

| Método | Firma | Descripción | Error |
|---|---|---|---|
| `getServices` | `(params: ServiceQueryParams = {}) => Promise<PaginatedResponse<Service>>` | `GET /api/services` con `page`, `size`, `category`, `isActive`, `search`. | `SERVICE_FETCH_FAILED` 502 |
| `getServiceById` | `(id) => Promise<Service>` | `GET /api/services/:id`. | `SERVICE_NOT_FOUND` 404 |
| `getServiceByCode` | `(code) => Promise<Service>` | `GET /api/services/code/:code`. | `SERVICE_NOT_FOUND` 404 |
| `createService` | `(data: CreateServiceRequest) => Promise<Service>` | `POST /api/services`. | `SERVICE_CREATE_FAILED` 502 |
| `updateService` | `(id, data: UpdateServiceRequest) => Promise<Service>` | `PUT /api/services/:id`. | `SERVICE_UPDATE_FAILED` 502 |
| `deleteService` | `(id) => Promise<void>` | `DELETE /api/services/:id`. | `SERVICE_DELETE_FAILED` 502 |
| `deactivateService` | `(id) => Promise<Service>` | `PATCH /api/services/:id/deactivate`. | `SERVICE_DEACTIVATE_FAILED` 502 |
| `getServicesByCategory` | `(category) => Promise<Service[]>` | `getServices({ category, pageSize:100 })` → `items`. | heredado |
| `getActiveServices` | `() => Promise<Service[]>` | `getServices({ isActive:true, pageSize:100 })` → `items`. | heredado |
| `getSalesServices` | `() => Promise<Service[]>` | Categoría `VENTAS`. | heredado |
| `getFinanceServices` | `() => Promise<Service[]>` | Categoría `FINANZAS`. | heredado |
| `getInsuranceServices` | `() => Promise<Service[]>` | Categoría `SEGUROS`. | heredado |
| `getPostSaleServices` | `() => Promise<Service[]>` | Categoría `POSTVENTA`. | heredado |

`export const serviceCatalogService = new ServiceCatalogService()`

### 5.5 `OrchestrationService` — `src/services/orchestration.service.ts`

Orquesta los cuatro servicios anteriores. Usa `Promise.all` para paralelizar llamadas independientes.

**Interfaces exportadas**

```ts
VehicleWithDetails  extends Vehicle  { assignedAgent?: Agent; availableServices?: Service[] }
CustomerWithDetails extends Customer { assignedAgent?: Agent; availableVehicles?: Vehicle[]; availableServices?: Service[] }
SalesProcessData    { customer: Customer; vehicle: Vehicle; agent: Agent; services: Service[] }
```

| Método | Firma | Lógica |
|---|---|---|
| `getVehicleWithDetails` | `(vehicleId) => Promise<VehicleWithDetails>` | Vehículo por ID + agentes activos + servicios activos en paralelo. `assignedAgent` = primer agente con especialización `VENTAS_NUEVOS` o `VENTAS_USADOS`. `availableServices` = servicios de `VENTAS`, `FINANZAS` o `SEGUROS`. |
| `getCustomerWithDetails` | `(customerId) => Promise<CustomerWithDetails>` | Cliente + agentes activos + vehículos disponibles + servicios activos. `assignedAgent` = primer agente `VENTAS_NUEVOS`. `availableVehicles` = vehículos con status `AVAILABLE`. `availableServices` = `VENTAS`/`FINANZAS`/`SEGUROS`. |
| `prepareSalesProcess` | `(customerId, vehicleId) => Promise<SalesProcessData>` | Valida cliente, vehículo, agentes y servicios. Si `vehicle.status !== 'AVAILABLE'` → `VEHICLE_NOT_AVAILABLE` 400. Si no hay agente activo de ventas → `NO_SALES_AGENT` 404. Devuelve cliente, vehículo, agente y servicios activos de venta/finanzas/seguros. |
| `getDashboardData` | `() => Promise<DashboardData>` | Ocho conteos en paralelo más desgloses por status de vehículo, especialización de agente y categoría de servicio. Devuelve `{ summary, vehiclesByStatus, agentsBySpecialization, servicesByCategory }`. |
| `healthCheck` | `() => Promise<{ vehicleService, catalogService, timestamp }>` | `Promise.allSettled` contra `GET /actuator/health` de ambos servicios (endpoint de Spring Boot Actuator). `UP` = respuesta 2xx; `DOWN` = error HTTP, timeout o red. |

`export const orchestrationService = new OrchestrationService()`

---

## 6. Capa de controladores

Patrón común de todos los métodos:

1. Leer `req.params`, `req.query` o `req.body`.
2. Llamar al servicio correspondiente.
3. Envolver el resultado en `ApiResponse<T>` con `meta: { timestamp, requestId, path }`.
4. Responder con `res.json` (o `201`/`204`).
5. En `catch`, delegar en `next(error)`.

### 6.1 `VehicleController` — `src/controllers/vehicle.controller.ts`

| Método | Fuente | Servicio | Descripción |
|---|---|---|---|
| `getVehicles` | query | `vehicleService.getVehicles` | Parsea `page`, `pageSize`, `brand`, `model`, `status`, `minPrice`, `maxPrice`, `year`. |
| `getVehicleById` | params `id` | `getVehicleById` | Detalle de vehículo. |
| `getAvailableVehicles` | — | `getAvailableVehicles` | Vehículos con status `AVAILABLE`. |
| `getVehiclesByBrand` | params `brand` | `getVehiclesByBrand` | Filtro por marca. |
| `getVehiclesByPriceRange` | query `minPrice`, `maxPrice` | `getVehiclesByPriceRange` | Si alguno no es numérico lanza `VALIDATION_ERROR` 400. |

`export const vehicleController = new VehicleController()`

### 6.2 `AgentController` — `src/controllers/agent.controller.ts`

| Método | Fuente | Servicio | Status |
|---|---|---|---|
| `getAgents` | query | `getAgents` | 200 |
| `getAgentById` | params `id` | `getAgentById` | 200 |
| `getAgentByEmail` | params `email` | `getAgentByEmail` | 200 |
| `createAgent` | body | `createAgent` | 201 |
| `updateAgent` | params `id`, body | `updateAgent` | 200 |
| `deleteAgent` | params `id` | `deleteAgent` | 204 sin body |
| `deactivateAgent` | params `id` | `deactivateAgent` | 200 |
| `getAgentsBySpecialization` | params `specialization` | `getAgentsBySpecialization` | 200 |
| `getActiveAgents` | — | `getActiveAgents` | 200 |

**`agentValidators`** (express-validator)

| Grupo | Reglas |
|---|---|
| `create` | `fullName` requerido, `email` válido, `licenseNumber` requerido, `specialization` requerido |
| `update` | `fullName`, `email`, `specialization` opcionales (si vienen, no vacíos / email válido) |
| `idParam` | `id` debe ser UUID |
| `emailParam` | `email` válido |
| `specializationParam` | `specialization` requerido |

### 6.3 `CustomerController` — `src/controllers/customer.controller.ts`

| Método | Fuente | Servicio | Status / nota |
|---|---|---|---|
| `getCustomers` | query | `getCustomers` | 200 |
| `getCustomerById` | params `id` | `getCustomerById` | 200 |
| `getCustomerByEmail` | params `email` | `getCustomerByEmail` | 200 |
| `createCustomer` | body | `createCustomer` | 201 |
| `updateCustomer` | params `id`, body | `updateCustomer` | 200 |
| `deleteCustomer` | params `id` | `deleteCustomer` | 204 sin body |
| `deactivateCustomer` | params `id` | `deactivateCustomer` | 200 |
| `searchCustomers` | query `name` | `searchCustomers` | 400 `VALIDATION_ERROR` si falta `name` |
| `getActiveCustomers` | — | `getActiveCustomers` | 200 |

**`customerValidators`**

| Grupo | Reglas |
|---|---|
| `create` | `fullName` requerido, `email` válido |
| `update` | `fullName` no vacío y `email` válido, ambos opcionales |
| `idParam` | `id` UUID |
| `emailParam` | `email` válido |

### 6.4 `ServiceCatalogController` — `src/controllers/service-catalog.controller.ts`

| Método | Fuente | Servicio | Status |
|---|---|---|---|
| `getServices` | query | `getServices` | 200 |
| `getServiceById` | params `id` | `getServiceById` | 200 |
| `getServiceByCode` | params `code` | `getServiceByCode` | 200 |
| `createService` | body | `createService` | 201 |
| `updateService` | params `id`, body | `updateService` | 200 |
| `deleteService` | params `id` | `deleteService` | 204 sin body |
| `deactivateService` | params `id` | `deactivateService` | 200 |
| `getServicesByCategory` | params `category` | `getServicesByCategory` | 200 |
| `getActiveServices` | — | `getActiveServices` | 200 |
| `getSalesServices` | — | `getSalesServices` | 200 |
| `getFinanceServices` | — | `getFinanceServices` | 200 |
| `getInsuranceServices` | — | `getInsuranceServices` | 200 |
| `getPostSaleServices` | — | `getPostSaleServices` | 200 |

**`serviceValidators`**

| Grupo | Reglas |
|---|---|
| `create` | `code`, `name`, `category` requeridos; `basePrice` numérico |
| `update` | `code`, `name`, `category` no vacíos y `basePrice` numérico, todos opcionales |
| `idParam` | `id` UUID |
| `codeParam` | `code` requerido |
| `categoryParam` | `category` requerido |

### 6.5 `OrchestrationController` — `src/controllers/orchestration.controller.ts`

| Método | Fuente | Servicio | Status |
|---|---|---|---|
| `getVehicleWithDetails` | params `id` | `getVehicleWithDetails` | 200 |
| `getCustomerWithDetails` | params `id` | `getCustomerWithDetails` | 200 |
| `prepareSalesProcess` | body `customerId`, `vehicleId` | `prepareSalesProcess` | 200; 400 si faltan IDs |
| `getDashboardData` | — | `getDashboardData` | 200 |
| `healthCheck` | — | `healthCheck` | 200 si ambos `UP`, 503 en caso contrario |

**`orchestrationValidators`**

| Grupo | Reglas |
|---|---|
| `vehicleIdParam` | `id` UUID |
| `customerIdParam` | `id` UUID |
| `prepareSales` | `customerId` y `vehicleId` UUID |

---

## 7. Rutas

| Router | Endpoint | Método controller |
|---|---|---|
| `vehicles.ts` | `GET /api/vehicles` | `getVehicles` |
| | `GET /api/vehicles/available` | `getAvailableVehicles` |
| | `GET /api/vehicles/brand/:brand` | `getVehiclesByBrand` |
| | `GET /api/vehicles/price-range` | `getVehiclesByPriceRange` |
| | `GET /api/vehicles/:id` | `getVehicleById` |
| `agents.ts` | `GET /api/agents` | `getAgents` |
| | `GET /api/agents/active` | `getActiveAgents` |
| | `GET /api/agents/specialization/:specialization` | `getAgentsBySpecialization` |
| | `GET /api/agents/:id` | `getAgentById` (+UUID) |
| | `GET /api/agents/email/:email` | `getAgentByEmail` (+email) |
| | `POST /api/agents` | `createAgent` (+validación) |
| | `PUT /api/agents/:id` | `updateAgent` (+UUID) |
| | `DELETE /api/agents/:id` | `deleteAgent` (+UUID) |
| | `PATCH /api/agents/:id/deactivate` | `deactivateAgent` (+UUID) |
| `customers.ts` | `GET /api/customers` | `getCustomers` |
| | `GET /api/customers/active` | `getActiveCustomers` |
| | `GET /api/customers/search` | `searchCustomers` |
| | `GET /api/customers/:id` | `getCustomerById` (+UUID) |
| | `GET /api/customers/email/:email` | `getCustomerByEmail` (+email) |
| | `POST /api/customers` | `createCustomer` (+validación) |
| | `PUT /api/customers/:id` | `updateCustomer` (+UUID) |
| | `DELETE /api/customers/:id` | `deleteCustomer` (+UUID) |
| | `PATCH /api/customers/:id/deactivate` | `deactivateCustomer` (+UUID) |
| `services.ts` | `GET /api/services` | `getServices` |
| | `GET /api/services/active` | `getActiveServices` |
| | `GET /api/services/category/:category` | `getServicesByCategory` |
| | `GET /api/services/sales` | `getSalesServices` |
| | `GET /api/services/finance` | `getFinanceServices` |
| | `GET /api/services/insurance` | `getInsuranceServices` |
| | `GET /api/services/post-sale` | `getPostSaleServices` |
| | `GET /api/services/:id` | `getServiceById` (+UUID) |
| | `GET /api/services/code/:code` | `getServiceByCode` (+code) |
| | `POST /api/services` | `createService` (+validación) |
| | `PUT /api/services/:id` | `updateService` (+UUID) |
| | `DELETE /api/services/:id` | `deleteService` (+UUID) |
| | `PATCH /api/services/:id/deactivate` | `deactivateService` (+UUID) |
| `orchestration.ts` | `GET /api/orchestration/vehicle/:id` | `getVehicleWithDetails` (+UUID) |
| | `GET /api/orchestration/customer/:id` | `getCustomerWithDetails` (+UUID) |
| | `POST /api/orchestration/sales/prepare` | `prepareSalesProcess` (+validación) |
| | `GET /api/orchestration/dashboard` | `getDashboardData` |
| | `GET /api/orchestration/health` | `healthCheck` |

> El orden de declaración importa: rutas literales (`/active`, `/available`, `/sales`, `/price-range`, etc.) se registran antes de `/:id` para no ser capturadas por el parámetro.

---

## 8. Tipos e interfaces

### 8.1 Comunes — `src/types/common.ts`

| Interfaz | Campos |
|---|---|
| `ApiResponse<T>` | `success: boolean`, `data?: T`, `error?: ApiError`, `meta?: ResponseMeta` |
| `ApiError` | `code`, `message`, `details?`, `statusCode` |
| `ResponseMeta` | `timestamp`, `requestId`, `path` |
| `PaginationParams` | `page?`, `pageSize?` |
| `PaginatedResponse<T>` | `items: T[]`, `total`, `page`, `pageSize`, `totalPages` |

### 8.2 Vehículos — `src/types/vehicle.ts`

- `Vehicle`: `id`, `brand`, `model`, `year`, `color`, `price`, `status` (`AVAILABLE | SOLD | RESERVED | MAINTENANCE`), `vin`, `mileage`, `fuelType` (`GASOLINE | DIESEL | ELECTRIC | HYBRID`), `transmission` (`MANUAL | AUTOMATIC`), `createdAt`, `updatedAt`.
- `VehicleListResponse`: `{ vehicles: Vehicle[], total, page, pageSize }` — nótese que el downstream usa la clave `vehicles`, no `items`.
- `VehicleQueryParams`: `page`, `pageSize`, `brand`, `model`, `status`, `minPrice`, `maxPrice`, `year`.

### 8.3 Agentes — `src/types/agent.ts`

- `Agent`: `id`, `fullName`, `email`, `phone?`, `licenseNumber`, `isActive`, `specialization`, `createdAt`, `updatedAt`.
- `AgentListResponse`: `{ items, total, page, pageSize, totalPages }`.
- `AgentQueryParams`: `page`, `pageSize`, `specialization`, `isActive`, `search`.
- `CreateAgentRequest`: `fullName`, `email`, `phone?`, `licenseNumber`, `specialization`.
- `UpdateAgentRequest`: todos opcionales + `isActive?`.

### 8.4 Clientes — `src/types/customer.ts`

- `Customer`: `id`, `fullName`, `email`, `phone?`, `identificationNumber?`, `isActive`, `createdAt`, `updatedAt`.
- `CustomerListResponse`, `CustomerQueryParams` (`page`, `pageSize`, `isActive`, `search`), `CreateCustomerRequest`, `UpdateCustomerRequest`.

### 8.5 Servicios — `src/types/service.ts`

- `Service`: `id`, `code`, `name`, `description?`, `basePrice`, `isActive`, `category`, `createdAt`, `updatedAt`.
- `ServiceListResponse`, `ServiceQueryParams` (`page`, `pageSize`, `category`, `isActive`, `search`), `CreateServiceRequest`, `UpdateServiceRequest`.

### 8.6 Interfaces de orquestación

Definidas en `src/services/orchestration.service.ts`: `VehicleWithDetails`, `CustomerWithDetails`, `SalesProcessData` (§5.5).

---

## 9. Contrato de respuesta y catálogo de errores

### Respuesta exitosa

```json
{
  "success": true,
  "data": { },
  "meta": { "timestamp": "2026-10-29T12:00:00.000Z", "requestId": "uuid", "path": "/api/..." }
}
```

### Respuesta de error

```json
{
  "success": false,
  "error": { "code": "VEHICLE_NOT_FOUND", "message": "Vehicle not found", "statusCode": 404 },
  "meta": { "timestamp": "...", "requestId": "uuid", "path": "/api/..." }
}
```

### Códigos de error

| Código | Status | Origen |
|---|---|---|
| `VALIDATION_ERROR` | 400 | `validate` o validaciones manuales en controladores |
| `VEHICLE_NOT_AVAILABLE` | 400 | `prepareSalesProcess` |
| `VEHICLE_NOT_FOUND` | 404 | `VehicleService` |
| `AGENT_NOT_FOUND` | 404 | `AgentService` |
| `CUSTOMER_NOT_FOUND` | 404 | `CustomerService` |
| `SERVICE_NOT_FOUND` | 404 | `ServiceCatalogService` |
| `NO_SALES_AGENT` | 404 | `prepareSalesProcess` |
| `NOT_FOUND` | 404 | `notFoundHandler` |
| `INTERNAL_SERVER_ERROR` | 500 | `errorHandler` (error no controlado) |
| `REQUEST_ERROR` | 500 | `HttpClient` (fallo no HTTP) |
| `*_FETCH_FAILED` / `*_CREATE_FAILED` / `*_UPDATE_FAILED` / `*_DELETE_FAILED` / `*_DEACTIVATE_FAILED` | 502 | Fallback de `toAppError` cuando el fallo no viene del downstream |
| `DOWNSTREAM_ERROR` | status downstream | `HttpClient` (`AppError` con el status HTTP real) |
| `DOWNSTREAM_UNAVAILABLE` | 503 | `HttpClient` (sin respuesta / timeout) |

> Los errores HTTP del downstream se propagan como `AppError`: un `404` se remapea al código de dominio correspondiente (`VEHICLE_NOT_FOUND`, `AGENT_NOT_FOUND`, ...); el resto de `4xx/5xx` conserva su status original con código `DOWNSTREAM_ERROR`.

---

## 10. Pruebas

- Runner: **Jest** con `ts-jest`, entorno `node`.
- `jest.config.js`: cobertura sobre `src/**/*.ts`, excluyendo tests, `src/index.ts` y `src/config/swagger.ts`; reportes `text`, `lcov`, `html` en `coverage/`.
- `src/tests/setup.ts`: timeout de 10 s, define variables de entorno de prueba y limpia mocks al final.
- Suites unitarias: `vehicle.service`, `agent.service`, `customer.service`, `service-catalog.service`, `orchestration.service`, `validate`, `error-handler`.
- Estrategia: se mockean los servicios, `HttpClient` y `logger` con `jest.mock`; los mocks replican el contrato real del Catalog Service (`items`, `totalPages`). Se cubren composición de datos, errores de negocio (`VEHICLE_NOT_AVAILABLE`, `NO_SALES_AGENT`), búsqueda por VIN paginada y health check (`/actuator/health`).

Comandos: `npm test` (cobertura), `npm run test:unit`, `npm run test:watch`.

---

## 11. Correcciones aplicadas

1. **Health check real**: `healthCheck` consulta `/actuator/health` en ambos servicios (Spring Boot Actuator) y usa el resultado de `allSettled`: una respuesta 2xx es `UP`, cualquier error es `DOWN`. `GET /api/orchestration/health` responde 503 si alguno está caído.
2. **Búsqueda por VIN completa**: `getVehicleByVin` pagina de 100 en 100 hasta encontrar el VIN.
3. **Status downstream preservado**: `HttpClient` lanza `AppError`; `toAppError` relanza el error tal cual y solo remapea `404` a códigos de dominio. Un `409` del downstream llega como `409`, no como `502`.
4. **DELETE sin body**: los endpoints de borrado responden `204` con `res.status(204).end()`.
5. **Sin logs de depuración**: se eliminó el `console.log` de `AgentService`.
6. **Imports limpios**: se retiraron los `query` sin uso y los imports de `AppError` innecesarios.
7. **Swagger coherente**: se agregó el tag `Orchestration` y se retiró `bearerAuth` mientras el servicio no valide tokens.
8. **Contrato honesto**: `CustomerWithDetails.purchasedVehicles` se renombró a `availableVehicles`, que es lo que realmente devuelve.
9. **Autenticación**: no se implementa en este servicio; la documentación ya no declara seguridad inexistente.
10. **`node:crypto` explícito**: `randomUUID` se importa en `http-client.ts`, `request-id.ts` y `error-handler.ts`.
11. **Health operativo documentado**: `GET /health` verifica el proceso del orquestador; `GET /api/orchestration/health` verifica las dependencias vía Actuator.
