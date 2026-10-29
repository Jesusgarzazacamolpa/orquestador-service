import { VehicleService } from '../../services/vehicle.service';
import { vehicleHttpClient } from '../../utils/http-client';
import { AppError } from '../../utils/app-error';

jest.mock('../../utils/http-client');
jest.mock('../../utils/logger');

const mockVehicleHttpClient = vehicleHttpClient as jest.Mocked<typeof vehicleHttpClient>;

describe('VehicleService', () => {
  let vehicleService: VehicleService;

  beforeEach(() => {
    vehicleService = new VehicleService();
    jest.clearAllMocks();
  });

  describe('getVehicles', () => {
    it('should return paginated vehicles', async () => {
      const mockResponse = {
        vehicles: [
          { id: '1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN123', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      mockVehicleHttpClient.get.mockResolvedValue(mockResponse);

      const result = await vehicleService.getVehicles({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockVehicleHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/vehicles'));
    });

    it('should throw AppError on client error', async () => {
      mockVehicleHttpClient.get.mockRejectedValue(
        new AppError('DOWNSTREAM_ERROR', 'Downstream service error: 500', 500)
      );

      await expect(vehicleService.getVehicles()).rejects.toMatchObject({
        code: 'DOWNSTREAM_ERROR',
        statusCode: 500,
      });
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle by ID', async () => {
      const mockVehicle = { id: '1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN123', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      mockVehicleHttpClient.get.mockResolvedValue(mockVehicle);

      const result = await vehicleService.getVehicleById('1');

      expect(result.id).toBe('1');
      expect(result.brand).toBe('Toyota');
    });

    it('should throw AppError when vehicle not found', async () => {
      mockVehicleHttpClient.get.mockRejectedValue(
        new AppError('DOWNSTREAM_ERROR', 'Downstream service error: 404', 404)
      );

      await expect(vehicleService.getVehicleById('999')).rejects.toMatchObject({
        code: 'VEHICLE_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('getAvailableVehicles', () => {
    it('should return available vehicles', async () => {
      const mockResponse = {
        vehicles: [
          { id: '1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN123', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      };

      mockVehicleHttpClient.get.mockResolvedValue(mockResponse);

      const result = await vehicleService.getAvailableVehicles();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('AVAILABLE');
    });
  });

  describe('getVehicleByVin', () => {
    it('searches every page until it finds the VIN', async () => {
      mockVehicleHttpClient.get
        .mockResolvedValueOnce({ vehicles: [], total: 101, page: 1, pageSize: 100 })
        .mockResolvedValueOnce({
          vehicles: [
            { id: '101', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Red', price: 25000, status: 'AVAILABLE', vin: 'VIN-101', mileage: 0, fuelType: 'GASOLINE', transmission: 'AUTOMATIC', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
          total: 101,
          page: 2,
          pageSize: 100,
        });

      const result = await vehicleService.getVehicleByVin('VIN-101');

      expect(result.id).toBe('101');
      expect(mockVehicleHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('throws VEHICLE_NOT_FOUND after scanning all pages', async () => {
      mockVehicleHttpClient.get.mockResolvedValue({ vehicles: [], total: 0, page: 1, pageSize: 100 });

      await expect(vehicleService.getVehicleByVin('VIN-404')).rejects.toMatchObject({
        code: 'VEHICLE_NOT_FOUND',
        statusCode: 404,
      });
    });
  });
});