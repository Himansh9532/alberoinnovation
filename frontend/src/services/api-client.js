import { getFirebaseIdToken } from "../features/auth/services/firebaseAuth.js";

const configuredApiBaseUrl = (import.meta.env || {}).VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${configuredApiBaseUrl || ""}${normalizedPath}`;
}

export async function apiRequest(path, options = {}) {
  const { token, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);
  headers.set("Accept", "application/json");
  if (requestOptions.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token || await getFirebaseIdToken()}`);

  return fetch(apiUrl(path), { ...requestOptions, headers });
}
