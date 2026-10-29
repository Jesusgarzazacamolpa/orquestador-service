export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'MAINTENANCE';
  vin: string;
  mileage: number;
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  transmission: 'MANUAL' | 'AUTOMATIC';
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VehicleQueryParams {
  page?: number;
  pageSize?: number;
  brand?: string;
  model?: string;
  status?: Vehicle['status'];
  minPrice?: number;
  maxPrice?: number;
  year?: number;
}