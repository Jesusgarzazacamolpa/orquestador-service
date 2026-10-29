import { OrchestrationService } from '../../services/orchestration.service';
import { vehicleService } from '../../services/vehicle.service';
import { agentService } from '../../services/agent.service';
import { customerService } from '../../services/customer.service';
import { serviceCatalogService } from '../../services/service-catalog.service';
import { AppError } from '../../utils/app-error';
import { vehicleHttpClient, catalogHttpClient } from '../../utils/http-client';
import { Vehicle } from '../../types/vehicle';
import { Agent } from '../../types/agent';
import { Customer } from '../../types/customer';
import { Service } from '../../types/service';

jest.mock('../../services/vehicle.service');
jest.mock('../../services/agent.service');
jest.mock('../../services/customer.service');
jest.mock('../../services/service-catalog.service');
jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

const mockVehicleService = vehicleService as jest.Mocked<typeof vehicleService>;
const mockAgentService = agentService as jest.Mocked<typeof agentService>;
const mockCustomerService = customerService as jest.Mocked<typeof customerService>;
const mockServiceCatalogService = serviceCatalogService as jest.Mocked<typeof serviceCatalogService>;
const mockVehicleHttpClient = vehicleHttpClient as jest.Mocked<typeof vehicleHttpClient>;
const mockCatalogHttpClient = catalogHttpClient as jest.Mocked<typeof catalogHttpClient>;

const mockVehicle: Vehicle = { id: '1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN123', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
const mockVehicleV1: Vehicle = { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN123', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
const mockSoldVehicle: Vehicle = { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'SOLD', vin: 'VIN123', mileage: 1000, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
const mockAvailableVehicles: Vehicle[] = [{ id: '1' } as Vehicle, { id: '2' } as Vehicle ];
const mockAgents: Agent[] = [
  { id: 'a1', fullName: 'Sales Agent', email: 'sales@test.com', licenseNumber: 'LIC-001', isActive: true, specialization: 'VENTAS_NUEVOS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];
const mockServices: Service[] = [
  { id: 's1', code: 'VEH-001', name: 'Vehicle Purchase', basePrice: 15000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 's2', code: 'FIN-001', name: 'Financing', basePrice: 0, isActive: true, category: 'FINANZAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

describe('OrchestrationService', () => {
  let orchestrationService: OrchestrationService;

  beforeEach(() => {
    orchestrationService = new OrchestrationService();
    jest.clearAllMocks();
  });

  describe('getVehicleWithDetails', () => {
    it('should return vehicle with assigned agent and available services', async () => {
      mockVehicleService.getVehicleById.mockResolvedValue(mockVehicle);
      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents);
      mockServiceCatalogService.getActiveServices.mockResolvedValue(mockServices);

      const result = await orchestrationService.getVehicleWithDetails('1');

      expect(result.id).toBe('1');
      expect(result.assignedAgent).toBeDefined();
      expect(result.assignedAgent?.specialization).toBe('VENTAS_NUEVOS');
      expect(result.availableServices).toHaveLength(2);
    });
  });

  describe('getCustomerWithDetails', () => {
    it('should return customer with assigned agent and available vehicles/services', async () => {
      const mockCustomer: Customer = { id: '1', fullName: 'John Doe', email: 'john@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);
      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents);
      mockVehicleService.getAvailableVehicles.mockResolvedValue(mockAvailableVehicles);
      mockServiceCatalogService.getActiveServices.mockResolvedValue(mockServices);

      const result = await orchestrationService.getCustomerWithDetails('1');

      expect(result.id).toBe('1');
      expect(result.assignedAgent).toBeDefined();
      expect(result.availableVehicles).toHaveLength(2);
      expect(result.availableServices).toHaveLength(2);
    });
  });

  describe('prepareSalesProcess', () => {
    it('should prepare sales process with customer, vehicle, agent, and services', async () => {
      const mockCustomer: Customer = { id: 'c1', fullName: 'John Doe', email: 'john@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);
      mockVehicleService.getVehicleById.mockResolvedValue(mockVehicleV1);
      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents);
      mockServiceCatalogService.getActiveServices.mockResolvedValue(mockServices);

      const result = await orchestrationService.prepareSalesProcess('c1', 'v1');

      expect(result.customer.id).toBe('c1');
      expect(result.vehicle.id).toBe('v1');
      expect(result.agent.specialization).toBe('VENTAS_NUEVOS');
      expect(result.services.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error when vehicle is not available', async () => {
      const mockCustomer: Customer = { id: 'c1', fullName: 'John Doe', email: 'john@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);
      mockVehicleService.getVehicleById.mockResolvedValue(mockSoldVehicle);

      await expect(orchestrationService.prepareSalesProcess('c1', 'v1')).rejects.toThrow(AppError);
    });

    it('should throw error when no sales agent available', async () => {
      const mockCustomer: Customer = { id: 'c1', fullName: 'John Doe', email: 'john@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);
      mockVehicleService.getVehicleById.mockResolvedValue(mockVehicleV1);
      mockAgentService.getActiveAgents.mockResolvedValue([]);

      await expect(orchestrationService.prepareSalesProcess('c1', 'v1')).rejects.toThrow(AppError);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard summary data', async () => {
      mockVehicleService.getVehicles
        .mockResolvedValueOnce({ items: [], total: 10, page: 1, pageSize: 1, totalPages: 1 }) // totalVehicles
        .mockResolvedValueOnce({ items: [], total: 5, page: 1, pageSize: 1, totalPages: 1 }) // AVAILABLE
        .mockResolvedValueOnce({ items: [], total: 2, page: 1, pageSize: 1, totalPages: 1 }) // SOLD
        .mockResolvedValueOnce({ items: [], total: 1, page: 1, pageSize: 1, totalPages: 1 }) // RESERVED
        .mockResolvedValueOnce({ items: [], total: 3, page: 1, pageSize: 1, totalPages: 1 }); // MAINTENANCE

      mockVehicleService.getAvailableVehicles.mockResolvedValue(mockAvailableVehicles);

      mockAgentService.getAgents.mockResolvedValue({ items: [], total: 5, page: 1, pageSize: 1, totalPages: 1 });
      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents.slice(0, 2));
      mockCustomerService.getCustomers.mockResolvedValue({ items: [], total: 20, page: 1, pageSize: 1, totalPages: 1 });
      mockCustomerService.getActiveCustomers.mockResolvedValue([{ id: '1' } as Customer, { id: '2' } as Customer, { id: '3' } as Customer]);
      mockServiceCatalogService.getServices.mockResolvedValue({ items: [], total: 8, page: 1, pageSize: 1, totalPages: 1 });
      mockServiceCatalogService.getActiveServices.mockResolvedValue(mockServices.slice(0, 4));

      mockAgentService.getAgentsBySpecialization
        .mockResolvedValueOnce([{ id: '1' } as Agent])
        .mockResolvedValueOnce([{ id: '1' } as Agent])
        .mockResolvedValueOnce([{ id: '1' } as Agent])
        .mockResolvedValueOnce([{ id: '1' } as Agent])
        .mockResolvedValueOnce([{ id: '1' } as Agent]);

      mockServiceCatalogService.getServicesByCategory
        .mockResolvedValueOnce([{ id: '1' } as Service, { id: '2' } as Service])
        .mockResolvedValueOnce([{ id: '1' } as Service])
        .mockResolvedValueOnce([{ id: '1' } as Service])
        .mockResolvedValueOnce([{ id: '1' } as Service]);

      const result = await orchestrationService.getDashboardData();

      expect(result.summary.vehicles.total).toBe(10);
      expect(result.summary.agents.total).toBe(5);
      expect(result.summary.customers.total).toBe(20);
      expect(result.summary.services.total).toBe(8);
      expect(result.vehiclesByStatus).toBeDefined();
      expect(result.agentsBySpecialization).toBeDefined();
      expect(result.servicesByCategory).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('reports both services as UP when their health endpoints respond', async () => {
      mockVehicleHttpClient.get.mockResolvedValue({ status: 'UP' });
      mockCatalogHttpClient.get.mockResolvedValue({ status: 'UP' });

      const result = await orchestrationService.healthCheck();

      expect(result.vehicleService).toBe('UP');
      expect(result.catalogService).toBe('UP');
      expect(mockVehicleHttpClient.get).toHaveBeenCalledWith('/actuator/health');
      expect(mockCatalogHttpClient.get).toHaveBeenCalledWith('/actuator/health');
    });

    it('reports DOWN for the service whose health call fails', async () => {
      mockVehicleHttpClient.get
        .mockResolvedValueOnce({ status: 'UP' })
        .mockRejectedValueOnce(new Error('connection refused'));

      const result = await orchestrationService.healthCheck();

      expect(result.vehicleService).toBe('UP');
      expect(result.catalogService).toBe('DOWN');
    });
  });
});