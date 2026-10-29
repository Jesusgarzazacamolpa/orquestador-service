import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { randomUUID } from 'node:crypto';
import config from '../config';
import { AppError } from './app-error';

/**
 * Cliente HTTP tipado sobre axios para comunicarse con un servicio downstream.
 * El interceptor de request inyecta un `X-Request-ID` nuevo en cada llamada y el de
 * response traduce los fallos a `AppError`: `DOWNSTREAM_ERROR` con el status real,
 * `DOWNSTREAM_UNAVAILABLE` (503) si no hubo respuesta y `REQUEST_ERROR` (500) en el resto.
 */
class HttpClient {
  private client: AxiosInstance;

  /**
   * Crea la instancia de axios y registra los interceptores de request y response.
   * @param baseUrl URL base del servicio downstream.
   * @param timeout Tiempo máximo de espera por petición, en milisegundos.
   */
  constructor(baseUrl: string, timeout: number) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.headers['X-Request-ID'] = randomUUID();
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          throw new AppError(
            'DOWNSTREAM_ERROR',
            `Downstream service error: ${error.response.status}`,
            error.response.status,
            { downstream: error.response.data }
          );
        }

        if (error.request) {
          throw new AppError('DOWNSTREAM_UNAVAILABLE', 'Downstream service unavailable', 503, {
            reason: error.message,
          });
        }

        throw new AppError('REQUEST_ERROR', error.message, 500);
      }
    );
  }

  /**
   * Ejecuta un `GET` contra el downstream y devuelve el cuerpo de la respuesta.
   * @param url Ruta relativa a la `baseUrl` del cliente.
   * @param params Parámetros de query opcionales.
   * @returns Datos de la respuesta tipados como `T`.
   * @throws {AppError} Si el downstream responde con error o no está disponible.
   */
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  /**
   * Envía un `POST` con cuerpo JSON y devuelve el cuerpo de la respuesta.
   * @param url Ruta relativa a la `baseUrl` del cliente.
   * @param data Cuerpo de la petición.
   * @returns Datos de la respuesta tipados como `T`.
   * @throws {AppError} Si el downstream responde con error o no está disponible.
   */
  async post<T>(url: string, data: unknown) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  /**
   * Reemplaza un recurso mediante `PUT` y devuelve el cuerpo de la respuesta.
   * @param url Ruta relativa a la `baseUrl` del cliente.
   * @param data Cuerpo de la petición.
   * @returns Datos de la respuesta tipados como `T`.
   * @throws {AppError} Si el downstream responde con error o no está disponible.
   */
  async put<T>(url: string, data: unknown) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  /**
   * Aplica una actualización parcial mediante `PATCH` y devuelve el cuerpo de la respuesta.
   * @param url Ruta relativa a la `baseUrl` del cliente.
   * @param data Campos a modificar.
   * @returns Datos de la respuesta tipados como `T`.
   * @throws {AppError} Si el downstream responde con error o no está disponible.
   */
  async patch<T>(url: string, data: unknown) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  /**
   * Elimina un recurso mediante `DELETE` y devuelve el cuerpo de la respuesta.
   * @param url Ruta relativa a la `baseUrl` del cliente.
   * @returns Datos de la respuesta tipados como `T`.
   * @throws {AppError} Si el downstream responde con error o no está disponible.
   */
  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

/** Cliente hacia el Vehicle Service, configurado con `VEHICLE_SERVICE_URL` y su timeout. */
export const vehicleHttpClient = new HttpClient(config.vehicleService.baseUrl, config.vehicleService.timeout);
/** Cliente hacia el Catalog Service, configurado con `CATALOG_SERVICE_URL` y su timeout. */
export const catalogHttpClient = new HttpClient(config.catalogService.baseUrl, config.catalogService.timeout);