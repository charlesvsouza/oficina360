import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface DecodedAccessToken {
  sub?: string;
  email?: string;
  role?: string;
  tenantId?: string;
}

interface Tenant {
  id: string;
  name: string;
  subscription?: {
    status: string;
    plan: { name: string };
  };
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateTenant: (tenant: Tenant) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, tenant, accessToken, refreshToken) =>
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateTenant: (tenant) => set({ tenant }),
    }),
    {
      name: 'oficina360-auth',
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken || !state.user) return;
        try {
          const decoded = jwtDecode<DecodedAccessToken>(state.accessToken);
          useAuthStore.setState({
            user: {
              ...state.user,
              userId: decoded.sub ?? state.user.userId,
              email: decoded.email ?? state.user.email,
              role: decoded.role ?? state.user.role,
              tenantId: decoded.tenantId ?? state.user.tenantId,
            },
          });
        } catch {
          useAuthStore.setState({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },
    }
  )
);

export const getCurrentUser = (): User | null => {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};