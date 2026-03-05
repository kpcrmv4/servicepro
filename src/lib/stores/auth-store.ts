import { create } from 'zustand'
import type { User, Tenant } from '@/lib/types'

interface AuthState {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setTenant: (tenant: Tenant | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      tenant: null,
      isLoading: false,
    }),
}))
