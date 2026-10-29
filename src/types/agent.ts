export interface Agent {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  isActive: boolean;
  specialization: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentListResponse {
  items: Agent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AgentQueryParams {
  page?: number;
  pageSize?: number;
  specialization?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateAgentRequest {
  fullName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  specialization: string;
}

export interface UpdateAgentRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  isActive?: boolean;
  specialization?: string;
}