import { CustomerService } from '../../services/customer.service';
import { catalogHttpClient } from '../../utils/http-client';
import { AppError } from '../../utils/app-error';

jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

const mockCatalogHttpClient = catalogHttpClient as jest.Mocked<typeof catalogHttpClient>;

describe('CustomerService', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    customerService = new CustomerService();
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      const mockResponse = {
        items: [
          { id: '1', fullName: 'John Doe', email: 'john@test.com', phone: '123456789', identificationNumber: 'IDN-001', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await customerService.getCustomers({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].fullName).toBe('John Doe');
    });
  });

  describe('getCustomerById', () => {
    it('should return customer by ID', async () => {
      const mockCustomer = { id: '1', fullName: 'John Doe', email: 'john@test.com', phone: '123456789', identificationNumber: 'IDN-001', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.get.mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById('1');

      expect(result.id).toBe('1');
      expect(result.email).toBe('john@test.com');
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const createData = { fullName: 'Jane Smith', email: 'jane@test.com', phone: '987654321', identificationNumber: 'IDN-002' };
      const mockCustomer = { id: '2', ...createData, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.post.mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(createData);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.email).toBe('jane@test.com');
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updateData = { fullName: 'John Updated', isActive: false };
      const mockCustomer = { id: '1', fullName: 'John Updated', email: 'john@test.com', phone: '123456789', identificationNumber: 'IDN-001', isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.put.mockResolvedValue(mockCustomer);

      const result = await customerService.updateCustomer('1', updateData);

      expect(result.fullName).toBe('John Updated');
      expect(result.isActive).toBe(false);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      const mockResponse = {
        items: [
          { id: '1', fullName: 'John Doe', email: 'john@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await customerService.searchCustomers('John');

      expect(result).toHaveLength(1);
      expect(result[0].fullName).toContain('John');
    });
  });

  describe('getActiveCustomers', () => {
    it('should return only active customers', async () => {
      const mockResponse = {
        items: [
          { id: '1', fullName: 'Active Customer', email: 'active@test.com', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await customerService.getActiveCustomers();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });
});