import { create } from "zustand";

import { tokenStorage } from "@/api/client";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  /** Сервер не отвечает, а сохранённого профиля нет: показываем «повторить», не выкидываем. */
  connectionError: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setConnectionError: (value: boolean) => void;
  setSession: (user: User, access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,
  connectionError: false,
  setUser: (user) => {
    tokenStorage.setUser(user);
    set({ user, isLoading: false, initialized: true, connectionError: false });
  },
  setLoading: (isLoading) => set({ isLoading, ...(isLoading === false ? { initialized: true } : {}) }),
  setConnectionError: (connectionError) => set({ connectionError, isLoading: false, initialized: true }),
  setSession: (user, access, refresh) => {
    tokenStorage.set(access, refresh);
    tokenStorage.setUser(user);
    set({ user, isLoading: false, initialized: true, connectionError: false });
  },
  logout: () => {
    tokenStorage.clear();
    set({ user: null, isLoading: false, initialized: true, connectionError: false });
  },
}));
