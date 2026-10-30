import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'email';
  mobile?: string;
  githubAcc?: string;
  country?: string;
  bio?: string;
  company?: string;
  website?: string;
}

interface AuthStore {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signUpWithEmail: (name: string, email: string) => Promise<void>;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  updateUserProfile: (details: Partial<UserInfo>) => Promise<void>;
  logout: () => Promise<void>;
}

// Helper to determine if we're running in Electron and have the IPC auth channel
const hasIpcAuth = () => {
  return typeof window !== 'undefined' && 
         (window as any).unifyDesktop?.login && 
         (window as any).unifyDesktop?.logout;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAuthenticating: false,

      loginWithProvider: async (provider) => {
        set({ isAuthenticating: true });
        
        // Mock email for this pass
        const email = provider === 'github' ? 'vraj.patel@github.com' : 'vraj.patel@gmail.com';
        
        try {
          if (hasIpcAuth()) {
            const profile = await (window as any).unifyDesktop.login(email, 'devpassword');
            if (profile) {
              set({ user: { ...profile, provider }, isAuthenticated: true });
            }
          } else {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: 'devpassword' }),
              credentials: 'include' // Sets httpOnly cookie
            });
            if (res.ok) {
              const data = await res.json();
              set({ user: { ...data, provider }, isAuthenticated: true });
            }
          }
        } catch (e) {
          console.error(`Login with ${provider} failed`, e);
        } finally {
          set({ isAuthenticating: false });
        }
      },

      signUpWithEmail: async (name, email) => {
        set({ isAuthenticating: true });

        try {
          if (hasIpcAuth()) {
             // For this pass we assume devpassword for simplicity
            const profile = await (window as any).unifyDesktop.login(email, 'devpassword');
            if (profile) {
              set({ user: { ...profile, provider: 'email' }, isAuthenticated: true });
            }
          } else {
            // First register (dev-only endpoint, for this pass)
            await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: 'devpassword' })
            });

            // Then login
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: 'devpassword' }),
              credentials: 'include'
            });

            if (res.ok) {
              const data = await res.json();
              set({ user: { ...data, provider: 'email' }, isAuthenticated: true });
            }
          }
        } catch (e) {
          console.error(`Sign up failed`, e);
        } finally {
          set({ isAuthenticating: false });
        }
      },

      signInWithEmail: async (email, password = 'devpassword') => {
        set({ isAuthenticating: true });
        
        try {
          if (hasIpcAuth()) {
            const profile = await (window as any).unifyDesktop.login(email, password);
            if (profile) {
              set({ user: { ...profile, provider: 'email' }, isAuthenticated: true });
            }
          } else {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
              credentials: 'include'
            });
            
            if (res.ok) {
              const data = await res.json();
              set({ user: { ...data, provider: 'email' }, isAuthenticated: true });
            }
          }
        } catch (e) {
          console.error(`Sign in failed`, e);
        } finally {
          set({ isAuthenticating: false });
        }
      },

      updateUserProfile: async (details) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const updatedUser = { ...currentUser, ...details };

        try {
          await fetch('/api/local/auth/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: updatedUser })
          });
          set({ user: updatedUser });
        } catch (e) {
          console.error('Failed to update profile locally', e);
        }
      },

      logout: async () => {
        try {
          if (hasIpcAuth()) {
            await (window as any).unifyDesktop.logout();
          } else {
            await fetch('/api/auth/logout', { 
              method: 'POST', 
              credentials: 'include' 
            });
          }
        } catch (e) {
          console.error('Logout failed', e);
        }
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'unify-auth-storage',
      // No more encryptedStorage XOR cipher, just plain localStorage for display profile
      storage: createJSONStorage(() => localStorage),
    }
  )
);
export type { AuthStore };
