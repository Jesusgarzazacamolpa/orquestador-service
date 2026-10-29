import { Agent, AgentListResponse, AgentQueryParams, CreateAgentRequest, UpdateAgentRequest } from '../types/agent';
import { PaginatedResponse } from '../types/common';
import { catalogHttpClient } from '../utils/http-client';
import { toAppError } from '../utils/app-error';
import logger from '../utils/logger';

/**
 * Servicio de acceso a agentes del Catalog Service (prefijo `/api/agents`).
 * Consume `catalogHttpClient` y normaliza la paginación al contrato interno.
 * Los fallos se traducen con `toAppError` y se lanzan como `AppError`.
 */
export class AgentService {
  /**
   * Lista agentes paginados mediante `GET /api/agents`.
   * Usa `page=1` y `pageSize=20` por defecto y admite especialización, estado y búsqueda.
   * @param params Filtros y paginación opcionales.
   * @returns Página de agentes; usa `totalPages` del downstream o lo calcula.
   * @throws {AppError} `AGENT_FETCH_FAILED` (502); errores HTTP del downstream propagados.
   */
  async getAgents(params: AgentQueryParams = {}): Promise<PaginatedResponse<Agent>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(pageSize));
      
      if (params.specialization) queryParams.append('specialization', params.specialization);
      if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params.search) queryParams.append('search', params.search);

      const response = await catalogHttpClient.get<AgentListResponse>(`/api/agents?${queryParams.toString()}`);

      return {
        items: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages ?? Math.ceil(response.total / response.pageSize),
      };
    } catch (error) {
      logger.error('Failed to fetch agents', { error });
      return toAppError(error, { code: 'AGENT_FETCH_FAILED', message: 'Failed to fetch agents' });
    }
  }

  /**
   * Obtiene un agente por su identificador mediante `GET /api/agents/:id`.
   * @param id Identificador UUID del agente.
   * @returns Agente encontrado.
   * @throws {AppError} `AGENT_NOT_FOUND` (404) o `AGENT_FETCH_FAILED` (502).
   */
  async getAgentById(id: string): Promise<Agent> {
    try {
      const agent = await catalogHttpClient.get<Agent>(`/api/agents/${id}`);
      return agent;
    } catch (error) {
      logger.error('Failed to fetch agent', { agentId: id, error });
      return toAppError(
        error,
        { code: 'AGENT_FETCH_FAILED', message: 'Failed to fetch agent' },
        { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
      );
    }
  }

  /**
   * Obtiene un agente por email mediante `GET /api/agents/email/:email`.
   * @param email Correo electrónico del agente.
   * @returns Agente encontrado.
   * @throws {AppError} `AGENT_NOT_FOUND` (404) o `AGENT_FETCH_FAILED` (502).
   */
  async getAgentByEmail(email: string): Promise<Agent> {
    try {
      const agent = await catalogHttpClient.get<Agent>(`/api/agents/email/${email}`);
      return agent;
    } catch (error) {
      logger.error('Failed to fetch agent by email', { email, error });
      return toAppError(
        error,
        { code: 'AGENT_FETCH_FAILED', message: 'Failed to fetch agent' },
        { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
      );
    }
  }

  /**
   * Crea un agente mediante `POST /api/agents`.
   * @param data Datos de alta del agente.
   * @returns Agente creado por el downstream.
   * @throws {AppError} `AGENT_CREATE_FAILED` (502) u otro error propagado del downstream.
   */
  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    try {
      const agent = await catalogHttpClient.post<Agent>('/api/agents', data);
      return agent;
    } catch (error) {
      logger.error('Failed to create agent', { data, error });
      return toAppError(error, { code: 'AGENT_CREATE_FAILED', message: 'Failed to create agent' });
    }
  }

  /**
   * Actualiza un agente mediante `PUT /api/agents/:id`.
   * @param id Identificador UUID del agente.
   * @param data Campos a modificar; todos son opcionales.
   * @returns Agente actualizado.
   * @throws {AppError} `AGENT_NOT_FOUND` (404) o `AGENT_UPDATE_FAILED` (502).
   */
  async updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
    try {
      const agent = await catalogHttpClient.put<Agent>(`/api/agents/${id}`, data);
      return agent;
    } catch (error) {
      logger.error('Failed to update agent', { agentId: id, data, error });
      return toAppError(
        error,
        { code: 'AGENT_UPDATE_FAILED', message: 'Failed to update agent' },
        { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
      );
    }
  }

  /**
   * Elimina un agente mediante `DELETE /api/agents/:id`.
   * @param id Identificador UUID del agente.
   * @returns Promesa sin valor; el downstream responde sin body.
   * @throws {AppError} `AGENT_NOT_FOUND` (404) o `AGENT_DELETE_FAILED` (502).
   */
  async deleteAgent(id: string): Promise<void> {
    try {
      await catalogHttpClient.delete(`/api/agents/${id}`);
    } catch (error) {
      logger.error('Failed to delete agent', { agentId: id, error });
      return toAppError(
        error,
        { code: 'AGENT_DELETE_FAILED', message: 'Failed to delete agent' },
        { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
      );
    }
  }

  /**
   * Desactiva un agente mediante `PATCH /api/agents/:id/deactivate` con body `{}`.
   * @param id Identificador UUID del agente.
   * @returns Agente con `isActive` en `false`.
   * @throws {AppError} `AGENT_NOT_FOUND` (404) o `AGENT_DEACTIVATE_FAILED` (502).
   */
  async deactivateAgent(id: string): Promise<Agent> {
    try {
      const agent = await catalogHttpClient.patch<Agent>(`/api/agents/${id}/deactivate`, {});
      return agent;
    } catch (error) {
      logger.error('Failed to deactivate agent', { agentId: id, error });
      return toAppError(
        error,
        { code: 'AGENT_DEACTIVATE_FAILED', message: 'Failed to deactivate agent' },
        { code: 'AGENT_NOT_FOUND', message: 'Agent not found' }
      );
    }
  }

  /**
   * Filtra agentes por especialización mediante `GET /api/agents?specialization=`.
   * @param specialization Especialización a filtrar, por ejemplo `VENTAS_NUEVOS`.
   * @returns Hasta 100 agentes de esa especialización.
   * @throws {AppError} `AGENT_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getAgentsBySpecialization(specialization: string): Promise<Agent[]> {
    const response = await this.getAgents({ specialization, pageSize: 100 });
    return response.items;
  }

  /**
   * Recupera los agentes activos mediante `GET /api/agents?isActive=true`.
   * @returns Hasta 100 agentes con `isActive` en `true`.
   * @throws {AppError} `AGENT_FETCH_FAILED` (502) u otro error propagado del downstream.
   */
  async getActiveAgents(): Promise<Agent[]> {
    const response = await this.getAgents({ isActive: true, pageSize: 100 });
    return response.items;
  }
}

export const agentService = new AgentService();