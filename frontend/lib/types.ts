export type ISODateString = string;

export interface HealthResponse {
  status: string;
}

export interface VehicleCreate {
  vin: string;
  make: string;
  model: string;
  description: string;
  image_urls: string[];
}

export interface VehicleListItem {
  vin: string;
  make: string;
  model: string;
  created_at?: ISODateString | null;
}

export interface VehicleOut extends VehicleCreate {
  created_at?: ISODateString | null;
}

export interface PaginatedVehicles {
  items: VehicleListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
