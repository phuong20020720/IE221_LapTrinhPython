import { API_BASE_URL } from "./client";


export type HealthResponse = {
  status: "healthy";
  service: string;
  database: "connected";
};

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health/`, { signal });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

