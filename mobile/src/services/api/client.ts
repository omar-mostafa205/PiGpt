import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setApiTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

/** The same Clerk token the axios interceptor uses, for the streaming fetch. */
export async function getApiToken(): Promise<string | null> {
  return tokenGetter ? tokenGetter() : null;
}

// Attach Clerk JWT to every request (from `useAuth().getToken()`)
apiClient.interceptors.request.use(async (config) => {
  const token = tokenGetter ? await tokenGetter() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Surface server errors as readable messages
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ?? err.message ?? "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);
