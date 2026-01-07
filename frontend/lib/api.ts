import {
  HealthResponse,
  PaginatedVehicles,
  VehicleCreate,
  VehicleListItem,
  VehicleOut,
} from "./types";

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

const jsonHeaders = { "Content-Type": "application/json" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Request failed (${response.status}): ${message || response.statusText}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function listVehicles(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedVehicles> {
  const search = new URLSearchParams();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  search.set("page", String(page));
  search.set("page_size", String(pageSize));
  const query = search.toString();
  const path = `/api/vehicles?${query}`;

  const data = await request<PaginatedVehicles | VehicleListItem[]>(path);

  // Handle both array response and paginated response
  if (Array.isArray(data)) {
    // API returned just an array - wrap it in paginated format
    const total = data.length;
    return {
      items: data.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize) || 1,
    };
  }

  // API returned proper paginated response
  return data;
}

export async function getVehicle(vin: string): Promise<VehicleOut> {
  return request<VehicleOut>(`/api/vehicles/${encodeURIComponent(vin)}`);
}

export async function createVehicle(
  payload: VehicleCreate
): Promise<VehicleOut> {
  return request<VehicleOut>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
