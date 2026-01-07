import VehicleDashboard from "@/components/vehicle-dashboard";
import { getHealth, listVehicles } from "@/lib/api";
import type { PaginatedVehicles } from "@/lib/types";

export default async function HomePage() {
  let vehiclePage: PaginatedVehicles = {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };
  let healthStatus: string | undefined;

  try {
    vehiclePage = await listVehicles({ page: 1, pageSize: 10 });
  } catch (error) {
    console.error("Failed to load vehicles:", error);
  }

  try {
    const health = await getHealth();
    healthStatus = health.status;
  } catch (error) {
    console.error("Failed to load health:", error);
  }

  return <VehicleDashboard initialPage={vehiclePage} healthStatus={healthStatus} />;
}
