import { ServiceCatalogService } from '../../services/service-catalog.service';
import { catalogHttpClient } from '../../utils/http-client';
import { AppError } from '../../utils/app-error';

jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

const mockCatalogHttpClient = catalogHttpClient as jest.Mocked<typeof catalogHttpClient>;

describe('ServiceCatalogService', () => {
  let serviceCatalogService: ServiceCatalogService;

  beforeEach(() => {
    serviceCatalogService = new ServiceCatalogService();
    jest.clearAllMocks();
  });

  describe('getServices', () => {
    it('should return paginated services', async () => {
      const mockResponse = {
        items: [
          { id: '1', code: 'VEH-001', name: 'Vehicle Purchase', description: 'Buy a vehicle', basePrice: 15000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await serviceCatalogService.getServices({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].code).toBe('VEH-001');
    });
  });

  describe('getServiceById', () => {
    it('should return service by ID', async () => {
      const mockService = { id: '1', code: 'VEH-001', name: 'Vehicle Purchase', description: 'Buy a vehicle', basePrice: 15000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.get.mockResolvedValue(mockService);

      const result = await serviceCatalogService.getServiceById('1');

      expect(result.id).toBe('1');
      expect(result.code).toBe('VEH-001');
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      const createData = { code: 'FIN-001', name: 'Financing', description: 'Vehicle financing', basePrice: 0, category: 'FINANZAS' };
      const mockService = { id: '2', ...createData, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.post.mockResolvedValue(mockService);

      const result = await serviceCatalogService.createService(createData);

      expect(result.code).toBe('FIN-001');
      expect(result.category).toBe('FINANZAS');
    });
  });

  describe('getServicesByCategory', () => {
    it('should return services by category', async () => {
      const mockResponse = {
        items: [
          { id: '1', code: 'VEH-001', name: 'Vehicle Purchase', description: 'Buy a vehicle', basePrice: 15000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: '2', code: 'VEH-002', name: 'Used Vehicle Purchase', description: 'Buy a used vehicle', basePrice: 8000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 2,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await serviceCatalogService.getServicesByCategory('VENTAS');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'VENTAS')).toBe(true);
    });
  });

  describe('getSalesServices', () => {
    it('should return sales category services', async () => {
      const mockResponse = {
        items: [
          { id: '1', code: 'VEH-001', name: 'Vehicle Purchase', description: 'Buy a vehicle', basePrice: 15000, isActive: true, category: 'VENTAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await serviceCatalogService.getSalesServices();

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('VENTAS');
    });
  });

  describe('getFinanceServices', () => {
    it('should return finance category services', async () => {
      const mockResponse = {
        items: [
          { id: '1', code: 'FIN-001', name: 'Financing', description: 'Vehicle financing', basePrice: 0, isActive: true, category: 'FINANZAS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await serviceCatalogService.getFinanceServices();

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('FINANZAS');
    });
  });
});