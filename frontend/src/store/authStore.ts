"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);

        const { data } = await api.post("/auth/login", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("refresh_token", data.refresh_token);
        set({ user: data.user, isAuthenticated: true });
      },

      register: async (registerData) => {
        const { data } = await api.post("/auth/register", registerData);
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("refresh_token", data.refresh_token);
        set({ user: data.user, isAuthenticated: true });
      },

      logout: () => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
