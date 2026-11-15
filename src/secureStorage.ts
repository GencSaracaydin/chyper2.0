import * as SecureStore from "expo-secure-store";

export const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

let deviceId: Promise<string> | null = null;

export function getDeviceId() {
  deviceId ??= (async () => {
    const existing = await SecureStore.getItemAsync("deviceId");
    if (existing) return existing;
    const created = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await SecureStore.setItemAsync("deviceId", created);
    return created;
  })();
  return deviceId;
}
