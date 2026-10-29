import { Vehicle, VehicleListResponse, VehicleQueryParams } from '../types/vehicle';
import { PaginatedResponse } from '../types/common';
import { vehicleHttpClient } from '../utils/http-client';
import { AppError, toAppError } from '../utils/app-error';
import logger from '../utils/logger';

/**
 * Servicio de acceso al catálogo de vehículos del Vehicle Domain Service.
 * Consume `vehicleHttpClient` y adapta la respuesta `vehicles` al contrato paginado interno.
 * Los fallos se normalizan con `toAppError` y se lanzan como `AppError`.
 */
export class VehicleService {
  /**
   * Lista vehículos paginados mediante `GET /vehicles`.
   * Usa `page=1` y `pageSize=20` por defecto y admite marca, modelo, status, precio y año.
   * @param params Filtros y paginación opcionales de la consulta.
   * @returns Página de vehículos con `total` y `totalPages` calculados.
   * @throws {AppError} `VEHICLE_FETCH_FAILED` (502); errores HTTP del downstream propagados.
   */
  async getVehicles(params: VehicleQueryParams = {}): Promise<PaginatedResponse<Vehicle>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(pageSize));
      
      if (params.brand) queryParams.append('brand', params.brand);
      if (params.model) queryParams.append('model', params.model);
      if (params.status) queryParams.append('status', params.status);
      if (params.minPrice) queryParams.append('minPrice', String(params.minPrice));
      if (params.maxPrice) queryParams.append('maxPrice', String(params.maxPrice));
      if (params.year) queryParams.append('year', String(params.year));

      const response = await vehicleHttpClient.get<VehicleListResponse>(`/vehicles?${queryParams.toString()}`);
      
      return {
        items: response.vehicles,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: Math.ceil(response.total / response.pageSize),
      };
    } catch (error) {
      logger.error('Failed to fetch vehicles', { error });
      return toAppError(error, { code: 'VEHICLE_FETCH_FAILED', message: 'Failed to fetch vehicles' });
    }
  }

  /**
   * Obtiene un vehículo por su identificador mediante `GET /vehicles/:id`.
   * @param id Identificador UUID del vehículo.
   * @returns Vehículo encontrado.
   * @throws {AppError} `VEHICLE_NOT_FOUND` (404) o `VEHICLE_FETCH_FAILED` (502).
   */
  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      const vehicle = await vehicleHttpClient.get<Vehicle>(`/vehicles/${id}`);
      return vehicle;
    } catch (error) {
      logger.error('Failed to fetch vehicle', { vehicleId: id, error });
      return toAppError(
        error,
        { code: 'VEHICLE_FETCH_FAILED', message: 'Failed to fetch vehicle' },
        { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' }
      );
    }
  }

  /**
   * Busca un vehículo por VIN recorriendo `GET /vehicles` en páginas de 100.
   * @param vin VIN exacto a localizar.
   * @returns Vehículo cuyo `vin` coincide.
   * @throws {AppError} `VEHICLE_NOT_FOUND` (404) si no aparece o `VEHICLE_FETCH_FAILED` (502).
   */
  async getVehicleByVin(vin: string): Promise<Vehicle> {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.getVehicles({ page, pageSize });
      const vehicle = response.items.find((item) => item.vin === vin);
      if (vehicle) {
        return vehicle;
      }
      totalPages = response.totalPages;
      page += 1;
    } while (page <= totalPages);

    logger.warn('Vehicle not found by VIN', { vin });
    throw new AppError('VEHICLE_NOT_FOUND', 'Vehicle not found', 404);
  }

  /**
   * Recupera los vehículos disponibles mediante `GET /vehicles?status=AVAILABLE`.
   * Solicita hasta 100 elementos y devuelve solo los `items`.
   * @returns Vehículos con status `AVAILABLE`.
   * @throws {AppError} `VEHICLE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getAvailableVehicles(): Promise<Vehicle[]> {
    const response = await this.getVehicles({ status: 'AVAILABLE', pageSize: 100 });
    return response.items;
  }

  /**
   * Filtra vehículos por marca mediante `GET /vehicles?brand=:brand`.
   * @param brand Marca a filtrar.
   * @returns Hasta 100 vehículos de la marca indicada.
   * @throws {AppError} `VEHICLE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getVehiclesByBrand(brand: string): Promise<Vehicle[]> {
    const response = await this.getVehicles({ brand, pageSize: 100 });
    return response.items;
  }

  /**
   * Filtra vehículos por rango de precio mediante `GET /vehicles?minPrice=&maxPrice=`.
   * @param minPrice Precio mínimo inclusive.
   * @param maxPrice Precio máximo inclusive.
   * @returns Hasta 100 vehículos dentro del rango.
   * @throws {AppError} `VEHICLE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getVehiclesByPriceRange(minPrice: number, maxPrice: number): Promise<Vehicle[]> {
    const response = await this.getVehicles({ minPrice, maxPrice, pageSize: 100 });
    return response.items;
  }
}

export const vehicleService = new VehicleService();