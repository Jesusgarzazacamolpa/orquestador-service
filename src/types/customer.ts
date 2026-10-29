export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  identificationNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomerQueryParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  email: string;
  phone?: string;
  identificationNumber?: string;
}

export interface UpdateCustomerRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  identificationNumber?: string;
  isActive?: boolean;
}