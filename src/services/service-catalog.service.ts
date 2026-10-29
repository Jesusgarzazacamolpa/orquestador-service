import { Service, ServiceListResponse, ServiceQueryParams, CreateServiceRequest, UpdateServiceRequest } from '../types/service';
import { PaginatedResponse } from '../types/common';
import { catalogHttpClient } from '../utils/http-client';
import { toAppError } from '../utils/app-error';
import logger from '../utils/logger';

/**
 * Servicio de acceso al catálogo de servicios del Catalog Service (prefijo `/api/services`).
 * Consume `catalogHttpClient` y normaliza la paginación al contrato interno.
 * Los fallos se traducen con `toAppError` y se lanzan como `AppError`.
 */
export class ServiceCatalogService {
  /**
   * Lista servicios paginados mediante `GET /api/services`.
   * Usa `page=1` y `pageSize=20` por defecto y admite categoría, estado y búsqueda.
   * @param params Filtros y paginación opcionales.
   * @returns Página de servicios; usa `totalPages` del downstream o lo calcula.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502); errores HTTP del downstream propagados.
   */
  async getServices(params: ServiceQueryParams = {}): Promise<PaginatedResponse<Service>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(pageSize));
      
      if (params.category) queryParams.append('category', params.category);
      if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params.search) queryParams.append('search', params.search);

      const response = await catalogHttpClient.get<ServiceListResponse>(`/api/services?${queryParams.toString()}`);
      
      return {
        items: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages ?? Math.ceil(response.total / response.pageSize),
      };
    } catch (error) {
      logger.error('Failed to fetch services', { error });
      return toAppError(error, { code: 'SERVICE_FETCH_FAILED', message: 'Failed to fetch services' });
    }
  }

  /**
   * Obtiene un servicio por su identificador mediante `GET /api/services/:id`.
   * @param id Identificador UUID del servicio.
   * @returns Servicio encontrado.
   * @throws {AppError} `SERVICE_NOT_FOUND` (404) o `SERVICE_FETCH_FAILED` (502).
   */
  async getServiceById(id: string): Promise<Service> {
    try {
      const service = await catalogHttpClient.get<Service>(`/api/services/${id}`);
      return service;
    } catch (error) {
      logger.error('Failed to fetch service', { serviceId: id, error });
      return toAppError(
        error,
        { code: 'SERVICE_FETCH_FAILED', message: 'Failed to fetch service' },
        { code: 'SERVICE_NOT_FOUND', message: 'Service not found' }
      );
    }
  }

  /**
   * Obtiene un servicio por su código mediante `GET /api/services/code/:code`.
   * @param code Código único del servicio.
   * @returns Servicio encontrado.
   * @throws {AppError} `SERVICE_NOT_FOUND` (404) o `SERVICE_FETCH_FAILED` (502).
   */
  async getServiceByCode(code: string): Promise<Service> {
    try {
      const service = await catalogHttpClient.get<Service>(`/api/services/code/${code}`);
      return service;
    } catch (error) {
      logger.error('Failed to fetch service by code', { code, error });
      return toAppError(
        error,
        { code: 'SERVICE_FETCH_FAILED', message: 'Failed to fetch service' },
        { code: 'SERVICE_NOT_FOUND', message: 'Service not found' }
      );
    }
  }

  /**
   * Crea un servicio mediante `POST /api/services`.
   * @param data Datos de alta del servicio.
   * @returns Servicio creado por el downstream.
   * @throws {AppError} `SERVICE_CREATE_FAILED` (502) u otro error propagado del downstream.
   */
  async createService(data: CreateServiceRequest): Promise<Service> {
    try {
      const service = await catalogHttpClient.post<Service>('/api/services', data);
      return service;
    } catch (error) {
      logger.error('Failed to create service', { data, error });
      return toAppError(error, { code: 'SERVICE_CREATE_FAILED', message: 'Failed to create service' });
    }
  }

  /**
   * Actualiza un servicio mediante `PUT /api/services/:id`.
   * @param id Identificador UUID del servicio.
   * @param data Campos a modificar; todos son opcionales.
   * @returns Servicio actualizado.
   * @throws {AppError} `SERVICE_NOT_FOUND` (404) o `SERVICE_UPDATE_FAILED` (502).
   */
  async updateService(id: string, data: UpdateServiceRequest): Promise<Service> {
    try {
      const service = await catalogHttpClient.put<Service>(`/api/services/${id}`, data);
      return service;
    } catch (error) {
      logger.error('Failed to update service', { serviceId: id, data, error });
      return toAppError(
        error,
        { code: 'SERVICE_UPDATE_FAILED', message: 'Failed to update service' },
        { code: 'SERVICE_NOT_FOUND', message: 'Service not found' }
      );
    }
  }

  /**
   * Elimina un servicio mediante `DELETE /api/services/:id`.
   * @param id Identificador UUID del servicio.
   * @returns Promesa sin valor; el downstream responde sin body.
   * @throws {AppError} `SERVICE_NOT_FOUND` (404) o `SERVICE_DELETE_FAILED` (502).
   */
  async deleteService(id: string): Promise<void> {
    try {
      await catalogHttpClient.delete(`/api/services/${id}`);
    } catch (error) {
      logger.error('Failed to delete service', { serviceId: id, error });
      return toAppError(
        error,
        { code: 'SERVICE_DELETE_FAILED', message: 'Failed to delete service' },
        { code: 'SERVICE_NOT_FOUND', message: 'Service not found' }
      );
    }
  }

  /**
   * Desactiva un servicio mediante `PATCH /api/services/:id/deactivate` con body `{}`.
   * @param id Identificador UUID del servicio.
   * @returns Servicio con `isActive` en `false`.
   * @throws {AppError} `SERVICE_NOT_FOUND` (404) o `SERVICE_DEACTIVATE_FAILED` (502).
   */
  async deactivateService(id: string): Promise<Service> {
    try {
      const service = await catalogHttpClient.patch<Service>(`/api/services/${id}/deactivate`, {});
      return service;
    } catch (error) {
      logger.error('Failed to deactivate service', { serviceId: id, error });
      return toAppError(
        error,
        { code: 'SERVICE_DEACTIVATE_FAILED', message: 'Failed to deactivate service' },
        { code: 'SERVICE_NOT_FOUND', message: 'Service not found' }
      );
    }
  }

  /**
   * Filtra servicios por categoría mediante `GET /api/services?category=`.
   * @param category Categoría a filtrar, por ejemplo `VENTAS` o `POSTVENTA`.
   * @returns Hasta 100 servicios de esa categoría.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getServicesByCategory(category: string): Promise<Service[]> {
    const response = await this.getServices({ category, pageSize: 100 });
    return response.items;
  }

  /**
   * Recupera los servicios activos mediante `GET /api/services?isActive=true`.
   * @returns Hasta 100 servicios con `isActive` en `true`.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getActiveServices(): Promise<Service[]> {
    const response = await this.getServices({ isActive: true, pageSize: 100 });
    return response.items;
  }

  /**
   * Recupera los servicios de la categoría `VENTAS` mediante `GET /api/services?category=VENTAS`.
   * @returns Hasta 100 servicios de ventas.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getSalesServices(): Promise<Service[]> {
    return this.getServicesByCategory('VENTAS');
  }

  /**
   * Recupera los servicios de la categoría `FINANZAS` mediante `GET /api/services?category=FINANZAS`.
   * @returns Hasta 100 servicios de finanzas.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getFinanceServices(): Promise<Service[]> {
    return this.getServicesByCategory('FINANZAS');
  }

  /**
   * Recupera los servicios de la categoría `SEGUROS` mediante `GET /api/services?category=SEGUROS`.
   * @returns Hasta 100 servicios de seguros.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getInsuranceServices(): Promise<Service[]> {
    return this.getServicesByCategory('SEGUROS');
  }

  /**
   * Recupera los servicios de la categoría `POSTVENTA` mediante `GET /api/services?category=POSTVENTA`.
   * @returns Hasta 100 servicios de postventa.
   * @throws {AppError} `SERVICE_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getPostSaleServices(): Promise<Service[]> {
    return this.getServicesByCategory('POSTVENTA');
  }
}

export const serviceCatalogService = new ServiceCatalogService();