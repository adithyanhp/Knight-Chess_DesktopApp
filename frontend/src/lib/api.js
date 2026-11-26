import { readStorage, writeStorage } from "./storage";
import { createApiClient } from "./api-client.js";

const client = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
  readToken: () => readStorage("token", ""),
});

export const api = client.api;
export const getConnectionStatus = client.getStatus;
export const subscribeConnection = client.subscribe;
export const retryConnection = () => client.ensureReady({ force: true });

export async function authenticate(mode, username, password) {
  const data = await api("/auth/" + mode, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  writeStorage("token", data.token);
  return data;
}
