import { AgentService } from '../../services/agent.service';
import { catalogHttpClient } from '../../utils/http-client';
import { AppError } from '../../utils/app-error';

jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

const mockCatalogHttpClient = catalogHttpClient as jest.Mocked<typeof catalogHttpClient>;

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    agentService = new AgentService();
    jest.clearAllMocks();
  });

  describe('getAgents', () => {
    it('should return paginated agents', async () => {
      const mockResponse = {
        items: [
          { id: '1', fullName: 'John Doe', email: 'john@test.com', phone: '123456789', licenseNumber: 'LIC-001', isActive: true, specialization: 'VENTAS_NUEVOS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await agentService.getAgents({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].fullName).toBe('John Doe');
    });

    it('should throw AppError on client error', async () => {
      mockCatalogHttpClient.get.mockRejectedValue(
        new AppError('DOWNSTREAM_ERROR', 'Downstream service error: 500', 500)
      );

      await expect(agentService.getAgents()).rejects.toMatchObject({
        code: 'DOWNSTREAM_ERROR',
        statusCode: 500,
      });
    });
  });

  describe('getAgentById', () => {
    it('should return agent by ID', async () => {
      const mockAgent = { id: '1', fullName: 'John Doe', email: 'john@test.com', phone: '123456789', licenseNumber: 'LIC-001', isActive: true, specialization: 'VENTAS_NUEVOS', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.get.mockResolvedValue(mockAgent);

      const result = await agentService.getAgentById('1');

      expect(result.id).toBe('1');
      expect(result.email).toBe('john@test.com');
    });
  });

  describe('createAgent', () => {
    it('should create a new agent', async () => {
      const createData = { fullName: 'Jane Smith', email: 'jane@test.com', licenseNumber: 'LIC-002', specialization: 'VENTAS_USADOS' };
      const mockAgent = { id: '2', ...createData, phone: undefined, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.post.mockResolvedValue(mockAgent);

      const result = await agentService.createAgent(createData);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.email).toBe('jane@test.com');
      expect(mockCatalogHttpClient.post).toHaveBeenCalledWith('/api/agents', createData);
    });
  });

  describe('updateAgent', () => {
    it('should update an existing agent', async () => {
      const updateData = { fullName: 'John Updated', isActive: false };
      const mockAgent = { id: '1', fullName: 'John Updated', email: 'john@test.com', phone: '123456789', licenseNumber: 'LIC-001', isActive: false, specialization: 'VENTAS_NUEVOS', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockCatalogHttpClient.put.mockResolvedValue(mockAgent);

      const result = await agentService.updateAgent('1', updateData);

      expect(result.fullName).toBe('John Updated');
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', async () => {
      mockCatalogHttpClient.delete.mockResolvedValue(undefined);

      await expect(agentService.deleteAgent('1')).resolves.not.toThrow();
      expect(mockCatalogHttpClient.delete).toHaveBeenCalledWith('/api/agents/1');
    });
  });

  describe('getActiveAgents', () => {
    it('should return only active agents', async () => {
      const mockResponse = {
        items: [
          { id: '1', fullName: 'Active Agent', email: 'active@test.com', licenseNumber: 'LIC-001', isActive: true, specialization: 'VENTAS_NUEVOS', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockCatalogHttpClient.get.mockResolvedValue(mockResponse);

      const result = await agentService.getActiveAgents();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });
});