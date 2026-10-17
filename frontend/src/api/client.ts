import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const ACCESS_KEY = "opensaas_access_token";
const REFRESH_KEY = "opensaas_refresh_token";
// Копия профиля: кабинет открывается сразу, пока сервер подтверждает сессию.
const USER_KEY = "opensaas_user";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null; // приватный режим / заблокированное хранилище
  }
}

export const tokenStorage = {
  get access(): string | null {
    return storage()?.getItem(ACCESS_KEY) ?? null;
  },
  get refresh(): string | null {
    return storage()?.getItem(REFRESH_KEY) ?? null;
  },
  /** Есть ли сохранённая сессия (хотя бы refresh-токен). */
  get hasSession(): boolean {
    return Boolean(this.access || this.refresh);
  },
  set(access: string, refresh: string) {
    storage()?.setItem(ACCESS_KEY, access);
    storage()?.setItem(REFRESH_KEY, refresh);
  },
  get user(): User | null {
    const raw = storage()?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser(user: User | null) {
    if (user) storage()?.setItem(USER_KEY, JSON.stringify(user));
    else storage()?.removeItem(USER_KEY);
  },
  clear() {
    storage()?.removeItem(ACCESS_KEY);
    storage()?.removeItem(REFRESH_KEY);
    storage()?.removeItem(USER_KEY);
  },
};

/**
 * Сессия недействительна, только если сервер прямо отверг токен.
 * Сетевая ошибка, 502/503 во время перезапуска сайта и т.п. — не повод
 * выкидывать человека на форму входа.
 */
export function isAuthRejection(err: unknown): boolean {
  const status = (err as AxiosError | undefined)?.response?.status;
  return status === 400 || status === 401 || status === 403 || status === 422;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.access;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let waitQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  waitQueue.forEach((cb) => cb(token));
  waitQueue = [];
}

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && !original?._retry && tokenStorage.refresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            } else {
              reject(error);
            }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: tokenStorage.refresh,
        });
        tokenStorage.set(data.access_token, data.refresh_token);
        resolveQueue(data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(original);
      } catch (refreshErr) {
        resolveQueue(null);
        // Выходим, только если сервер отверг refresh-токен. Если сервер
        // временно недоступен, сессию сохраняем — повторим позже.
        if (isAuthRejection(refreshErr)) {
          tokenStorage.clear();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
