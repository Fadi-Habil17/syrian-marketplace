export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  socketUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:4000/orders',
};

// Public connection configuration only. Never embed a shared secret.
