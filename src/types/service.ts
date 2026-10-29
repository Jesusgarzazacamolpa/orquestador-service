export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateServiceRequest {
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  category: string;
}

export interface UpdateServiceRequest {
  code?: string;
  name?: string;
  description?: string;
  basePrice?: number;
  isActive?: boolean;
  category?: string;
}