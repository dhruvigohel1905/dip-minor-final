import { create } from 'zustand';
import type { AuthUser, LoginCredentials, RegisterData, AuthSession } from '@/types/auth';
import {
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  getCurrentUser,
  onAuthStateChange,
  refreshSession as authRefreshSession,
} from '@/services/authService';

interface AuthState extends AuthSession {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize auth state on store creation
  getCurrentUser()
    .then((user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    })
    .catch((err) => {
      console.error("Auth initialization failed:", err);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Failed to initialize authentication",
      });
    });

  // Subscribe to auth state changes
  const unsubscribe = onAuthStateChange((user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authLogin(credentials);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        set({
          isLoading: false,
          error: errorMessage,
          user: null,
          isAuthenticated: false,
        });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true, error: null });
      try {
        await authLogout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Logout failed';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    register: async (data: RegisterData) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authRegister(data);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        set({
          isLoading: false,
          error: errorMessage,
          user: null,
          isAuthenticated: false,
        });
        throw error;
      }
    },

    refreshSession: async () => {
      try {
        const session = await authRefreshSession();
        if (session) {
          const user = await getCurrentUser();
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
        set({ error: errorMessage });
        throw error;
      }
    },

    setUser: (user: AuthUser | null) => {
      set({ user, isAuthenticated: !!user });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },
  };
});

// Hook for using auth state
export function useAuth() {
  return useAuthStore();
}
