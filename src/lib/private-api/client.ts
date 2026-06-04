import { getOptionalEnv } from "@/lib/env";

export function getPrivateApiBaseUrl() {
  return getOptionalEnv("PRIVATE_API_BASE_URL")?.replace(/\/$/, "");
}

export async function fetchPrivateApi<T>(path: string) {
  const baseUrl = getPrivateApiBaseUrl();

  if (!baseUrl) {
    return undefined;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      accept: "application/json",
    },
    next: { revalidate: 60, tags: ["products"] },
  });

  if (!response.ok) {
    throw new Error(`Private API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
