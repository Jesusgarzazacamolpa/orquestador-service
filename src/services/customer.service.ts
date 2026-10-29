import { Customer, CustomerListResponse, CustomerQueryParams, CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer';
import { PaginatedResponse } from '../types/common';
import { catalogHttpClient } from '../utils/http-client';
import { toAppError } from '../utils/app-error';
import logger from '../utils/logger';

/**
 * Servicio de acceso a clientes del Catalog Service (prefijo `/api/customers`).
 * Consume `catalogHttpClient` y normaliza la paginación al contrato interno.
 * Los fallos se traducen con `toAppError` y se lanzan como `AppError`.
 */
export class CustomerService {
  /**
   * Lista clientes paginados mediante `GET /api/customers`.
   * Usa `page=1` y `pageSize=20` por defecto y admite estado activo y búsqueda.
   * @param params Filtros y paginación opcionales.
   * @returns Página de clientes; usa `totalPages` del downstream o lo calcula.
   * @throws {AppError} `CUSTOMER_FETCH_FAILED` (502); errores HTTP del downstream propagados.
   */
  async getCustomers(params: CustomerQueryParams = {}): Promise<PaginatedResponse<Customer>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(pageSize));
      
      if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params.search) queryParams.append('search', params.search);

      const response = await catalogHttpClient.get<CustomerListResponse>(`/api/customers?${queryParams.toString()}`);
      
      return {
        items: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages ?? Math.ceil(response.total / response.pageSize),
      };
    } catch (error) {
      logger.error('Failed to fetch customers', { error });
      return toAppError(error, { code: 'CUSTOMER_FETCH_FAILED', message: 'Failed to fetch customers' });
    }
  }

  /**
   * Obtiene un cliente por su identificador mediante `GET /api/customers/:id`.
   * @param id Identificador UUID del cliente.
   * @returns Cliente encontrado.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404) o `CUSTOMER_FETCH_FAILED` (502).
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      const customer = await catalogHttpClient.get<Customer>(`/api/customers/${id}`);
      return customer;
    } catch (error) {
      logger.error('Failed to fetch customer', { customerId: id, error });
      return toAppError(
        error,
        { code: 'CUSTOMER_FETCH_FAILED', message: 'Failed to fetch customer' },
        { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' }
      );
    }
  }

  /**
   * Obtiene un cliente por email mediante `GET /api/customers/email/:email`.
   * @param email Correo electrónico del cliente.
   * @returns Cliente encontrado.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404) o `CUSTOMER_FETCH_FAILED` (502).
   */
  async getCustomerByEmail(email: string): Promise<Customer> {
    try {
      const customer = await catalogHttpClient.get<Customer>(`/api/customers/email/${email}`);
      return customer;
    } catch (error) {
      logger.error('Failed to fetch customer by email', { email, error });
      return toAppError(
        error,
        { code: 'CUSTOMER_FETCH_FAILED', message: 'Failed to fetch customer' },
        { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' }
      );
    }
  }

  /**
   * Crea un cliente mediante `POST /api/customers`.
   * @param data Datos de alta del cliente.
   * @returns Cliente creado por el downstream.
   * @throws {AppError} `CUSTOMER_CREATE_FAILED` (502) u otro error propagado del downstream.
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const customer = await catalogHttpClient.post<Customer>('/api/customers', data);
      return customer;
    } catch (error) {
      logger.error('Failed to create customer', { data, error });
      return toAppError(error, { code: 'CUSTOMER_CREATE_FAILED', message: 'Failed to create customer' });
    }
  }

  /**
   * Actualiza un cliente mediante `PUT /api/customers/:id`.
   * @param id Identificador UUID del cliente.
   * @param data Campos a modificar; todos son opcionales.
   * @returns Cliente actualizado.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404) o `CUSTOMER_UPDATE_FAILED` (502).
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    try {
      const customer = await catalogHttpClient.put<Customer>(`/api/customers/${id}`, data);
      return customer;
    } catch (error) {
      logger.error('Failed to update customer', { customerId: id, data, error });
      return toAppError(
        error,
        { code: 'CUSTOMER_UPDATE_FAILED', message: 'Failed to update customer' },
        { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' }
      );
    }
  }

  /**
   * Elimina un cliente mediante `DELETE /api/customers/:id`.
   * @param id Identificador UUID del cliente.
   * @returns Promesa sin valor; el downstream responde sin body.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404) o `CUSTOMER_DELETE_FAILED` (502).
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      await catalogHttpClient.delete(`/api/customers/${id}`);
    } catch (error) {
      logger.error('Failed to delete customer', { customerId: id, error });
      return toAppError(
        error,
        { code: 'CUSTOMER_DELETE_FAILED', message: 'Failed to delete customer' },
        { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' }
      );
    }
  }

  /**
   * Desactiva un cliente mediante `PATCH /api/customers/:id/deactivate` con body `{}`.
   * @param id Identificador UUID del cliente.
   * @returns Cliente con `isActive` en `false`.
   * @throws {AppError} `CUSTOMER_NOT_FOUND` (404) o `CUSTOMER_DEACTIVATE_FAILED` (502).
   */
  async deactivateCustomer(id: string): Promise<Customer> {
    try {
      const customer = await catalogHttpClient.patch<Customer>(`/api/customers/${id}/deactivate`, {});
      return customer;
    } catch (error) {
      logger.error('Failed to deactivate customer', { customerId: id, error });
      return toAppError(
        error,
        { code: 'CUSTOMER_DEACTIVATE_FAILED', message: 'Failed to deactivate customer' },
        { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' }
      );
    }
  }

  /**
   * Busca clientes por nombre mediante `GET /api/customers?search=`.
   * @param name Texto de búsqueda aplicado por el downstream.
   * @returns Hasta 100 clientes coincidentes.
   * @throws {AppError} `CUSTOMER_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async searchCustomers(name: string): Promise<Customer[]> {
    const response = await this.getCustomers({ search: name, pageSize: 100 });
    return response.items;
  }

  /**
   * Recupera los clientes activos mediante `GET /api/customers?isActive=true`.
   * @returns Hasta 100 clientes con `isActive` en `true`.
   * @throws {AppError} `CUSTOMER_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getActiveCustomers(): Promise<Customer[]> {
    const response = await this.getCustomers({ isActive: true, pageSize: 100 });
    return response.items;
  }
}

export const customerService = new CustomerService();