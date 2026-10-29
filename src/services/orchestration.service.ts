import { vehicleService } from './vehicle.service';
import { agentService } from './agent.service';
import { customerService } from './customer.service';
import { serviceCatalogService } from './service-catalog.service';
import { Vehicle } from '../types/vehicle';
import { Agent } from '../types/agent';
import { Customer } from '../types/customer';
import { Service } from '../types/service';
import { AppError } from '../utils/app-error';
import logger from '../utils/logger';
import { vehicleHttpClient, catalogHttpClient } from '../utils/http-client';

/** Vehículo enriquecido con el agente de ventas asignado y los servicios comercializables. */
export interface VehicleWithDetails extends Vehicle {
  assignedAgent?: Agent;
  availableServices?: Service[];
}

/** Cliente enriquecido con agente asignado, vehículos disponibles y servicios comercializables. */
export interface CustomerWithDetails extends Customer {
  assignedAgent?: Agent;
  availableVehicles?: Vehicle[];
  availableServices?: Service[];
}

/** Datos consolidados para iniciar una venta: cliente, vehículo, agente y servicios. */
export interface SalesProcessData {
  customer: Customer;
  vehicle: Vehicle;
  agent: Agent;
  services: Service[];
}

/**
 * Orquesta los servicios de vehículos, agentes, clientes y catálogo para componer
 * vistas de negocio y métricas; paraleliza llamadas con `Promise.all`.
 * No traduce errores: propaga los `AppError` lanzados por los servicios de dominio.
 */
export class OrchestrationService {
  /**
   * Compone el detalle de un vehículo (`GET /vehicles/:id`) con agentes y servicios
   * activos del Catalog Service consultados en paralelo.
   * @param vehicleId Identificador UUID del vehículo.
   * @returns Vehículo con `assignedAgent` (primer agente de ventas) y `availableServices`.
   * @throws {AppError} `VEHICLE_NOT_FOUND` (404); `AGENT_FETCH_FAILED` o `SERVICE_FETCH_FAILED` (502).
   */
  async getVehicleWithDetails(vehicleId: string): Promise<VehicleWithDetails> {
    const vehicle = await vehicleService.getVehicleById(vehicleId);
    
    const [agents, services] = await Promise.all([
      agentService.getActiveAgents(),
      serviceCatalogService.getActiveServices(),
    ]);

    const assignedAgent = agents.find(a => a.specialization === 'VENTAS_NUEVOS' || a.specialization === 'VENTAS_USADOS');
    const availableServices = services.filter(s => s.category === 'VENTAS' || s.category === 'FINANZAS' || s.category === 'SEGUROS');

    return {
      ...vehicle,
      assignedAgent,
      availableServices,
    };
  }

  /**
   * Compone el detalle de un cliente (`GET /api/customers/:id`) con agentes, vehículos
   * disponibles y servicios activos consultados en paralelo.
   * @param customerId Identificador UUID del cliente.
   * @returns Cliente con `assignedAgent`, `availableVehicles` y `availableServices`.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404); `AGENT_FETCH_FAILED`, `VEHICLE_FETCH_FAILED` o `SERVICE_FETCH_FAILED` (502).
   */
  async getCustomerWithDetails(customerId: string): Promise<CustomerWithDetails> {
    const customer = await customerService.getCustomerById(customerId);
    
    const [agents, vehicles, services] = await Promise.all([
      agentService.getActiveAgents(),
      vehicleService.getAvailableVehicles(),
      serviceCatalogService.getActiveServices(),
    ]);

    const assignedAgent = agents.find(a => a.specialization === 'VENTAS_NUEVOS');
    const availableServices = services.filter(s => s.category === 'VENTAS' || s.category === 'FINANZAS' || s.category === 'SEGUROS');

    return {
      ...customer,
      assignedAgent,
      availableVehicles: vehicles,
      availableServices,
    };
  }

  /**
   * Prepara una venta validando cliente, vehículo, agentes y servicios en paralelo.
   * Exige `vehicle.status` igual a `AVAILABLE` y al menos un agente activo de ventas.
   * @param customerId Identificador UUID del cliente.
   * @param vehicleId Identificador UUID del vehículo.
   * @returns Cliente, vehículo, agente de ventas y servicios de venta, finanzas y seguros.
   * @throws {AppError} `CUSTOMER_NOT_FOUND`/`VEHICLE_NOT_FOUND` (404), `VEHICLE_NOT_AVAILABLE` (400), `NO_SALES_AGENT` (404) o `*_FETCH_FAILED` (502).
   */
  async prepareSalesProcess(customerId: string, vehicleId: string): Promise<SalesProcessData> {
    const [customer, vehicle, agents, services] = await Promise.all([
      customerService.getCustomerById(customerId),
      vehicleService.getVehicleById(vehicleId),
      agentService.getActiveAgents(),
      serviceCatalogService.getActiveServices(),
    ]);

    if (vehicle.status !== 'AVAILABLE') {
      throw new AppError('VEHICLE_NOT_AVAILABLE', 'Vehicle is not available for sale', 400);
    }

    const salesAgent = agents.find(a => 
      a.isActive && (a.specialization === 'VENTAS_NUEVOS' || a.specialization === 'VENTAS_USADOS')
    );

    if (!salesAgent) {
      throw new AppError('NO_SALES_AGENT', 'No sales agent available', 404);
    }

    const salesServices = services.filter(s => 
      s.isActive && (s.category === 'VENTAS' || s.category === 'FINANZAS' || s.category === 'SEGUROS')
    );

    return {
      customer,
      vehicle,
      agent: salesAgent,
      services: salesServices,
    };
  }

  /**
   * Agrega métricas del negocio consultando vehículos, agentes, clientes y servicios
   * en paralelo, incluidos desgloses por status, especialización y categoría.
   * @returns Resumen con totales y activos más `vehiclesByStatus`,
   * `agentsBySpecialization` y `servicesByCategory`.
   * @throws {AppError} `VEHICLE_FETCH_FAILED`, `AGENT_FETCH_FAILED`, `CUSTOMER_FETCH_FAILED` o `SERVICE_FETCH_FAILED` (502).
   */
  async getDashboardData() {
    const [
      totalVehicles,
      availableVehicles,
      totalAgents,
      activeAgents,
      totalCustomers,
      activeCustomers,
      totalServices,
      activeServices,
    ] = await Promise.all([
      vehicleService.getVehicles({ pageSize: 1 }).then(r => r.total),
      vehicleService.getAvailableVehicles().then(r => r.length),
      agentService.getAgents({ pageSize: 1 }).then(r => r.total),
      agentService.getActiveAgents().then(r => r.length),
      customerService.getCustomers({ pageSize: 1 }).then(r => r.total),
      customerService.getActiveCustomers().then(r => r.length),
      serviceCatalogService.getServices({ pageSize: 1 }).then(r => r.total),
      serviceCatalogService.getActiveServices().then(r => r.length),
    ]);

    const vehiclesByStatus = await Promise.all([
      vehicleService.getVehicles({ status: 'AVAILABLE', pageSize: 1 }).then(r => r.total),
      vehicleService.getVehicles({ status: 'SOLD', pageSize: 1 }).then(r => r.total),
      vehicleService.getVehicles({ status: 'RESERVED', pageSize: 1 }).then(r => r.total),
      vehicleService.getVehicles({ status: 'MAINTENANCE', pageSize: 1 }).then(r => r.total),
    ]);

    const agentsBySpecialization = await Promise.all([
      agentService.getAgentsBySpecialization('VENTAS_NUEVOS'),
      agentService.getAgentsBySpecialization('VENTAS_USADOS'),
      agentService.getAgentsBySpecialization('FINANZAS'),
      agentService.getAgentsBySpecialization('SEGUROS'),
      agentService.getAgentsBySpecialization('POSTVENTA'),
    ]);

    const servicesByCategory = await Promise.all([
      serviceCatalogService.getServicesByCategory('VENTAS'),
      serviceCatalogService.getServicesByCategory('FINANZAS'),
      serviceCatalogService.getServicesByCategory('SEGUROS'),
      serviceCatalogService.getServicesByCategory('POSTVENTA'),
    ]);

    return {
      summary: {
        vehicles: { total: totalVehicles, available: availableVehicles },
        agents: { total: totalAgents, active: activeAgents },
        customers: { total: totalCustomers, active: activeCustomers },
        services: { total: totalServices, active: activeServices },
      },
      vehiclesByStatus: {
        available: vehiclesByStatus[0],
        sold: vehiclesByStatus[1],
        reserved: vehiclesByStatus[2],
        maintenance: vehiclesByStatus[3],
      },
      agentsBySpecialization: {
        ventasNuevos: agentsBySpecialization[0].length,
        ventasUsados: agentsBySpecialization[1].length,
        finanzas: agentsBySpecialization[2].length,
        seguros: agentsBySpecialization[3].length,
        postventa: agentsBySpecialization[4].length,
      },
      servicesByCategory: {
        ventas: servicesByCategory[0].length,
        finanzas: servicesByCategory[1].length,
        seguros: servicesByCategory[2].length,
        postventa: servicesByCategory[3].length,
      },
    };
  }

  /**
   * Verifica ambos servicios downstream con `Promise.allSettled` contra
   * `GET /actuator/health` (Spring Boot Actuator).
   * @returns Estado `UP` o `DOWN` de `vehicleService` y `catalogService`, más `timestamp`.
   * @throws {AppError} No lanza: todo fallo se reporta como `DOWN`.
   */
  async healthCheck() {
    const [vehicleHealth, catalogHealth] = await Promise.allSettled([
      vehicleHttpClient.get('/actuator/health'),
      catalogHttpClient.get('/actuator/health'),
    ]);

    return {
      vehicleService: vehicleHealth.status === 'fulfilled' ? 'UP' : 'DOWN',
      catalogService: catalogHealth.status === 'fulfilled' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
    };
  }
}

export const orchestrationService = new OrchestrationService();