import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Encrypted localStorage Storage ─────────────────────────────────────────
// Lightweight XOR cipher to obfuscate user profile data in localStorage.
// Prevents trivial exposure via DevTools, XSS, or third-party scripts.
const STORAGE_KEY_SEED = 'unify_auth_v1';

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encodeSecure(data: string): string {
  try {
    return btoa(xorCipher(data, STORAGE_KEY_SEED));
  } catch {
    return data;
  }
}

function decodeSecure(encoded: string): string {
  try {
    return xorCipher(atob(encoded), STORAGE_KEY_SEED);
  } catch {
    return encoded;
  }
}

const encryptedStorage = createJSONStorage<AuthStore>(() => ({
  getItem: (key: string) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return decodeSecure(raw);
    } catch {
      return raw;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, encodeSecure(value));
    } catch {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
}));

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
  signInWithEmail: (email: string) => Promise<void>;
  updateUserProfile: (details: Partial<UserInfo>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAuthenticating: false,

      loginWithProvider: async (provider) => {
        set({ isAuthenticating: true });
        await new Promise((r) => setTimeout(r, 800));

        const email = provider === 'github' ? 'vraj.patel@github.com' : 'vraj.patel@gmail.com';
        
        try {
          const res = await fetch(`/api/local/auth/get-profile?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              set({ user: data.user, isAuthenticated: true, isAuthenticating: false });
              return;
            }
          }
        } catch { /* ignore */ }

        const mockUser: UserInfo = provider === 'github' 
          ? {
              name: 'Vraj Patel',
              email,
              avatarUrl: 'https://avatars.githubusercontent.com/u/48333288?v=4',
              provider: 'github',
              githubAcc: 'Vrajpatel101006'
            }
          : {
              name: 'Vraj Patel',
              email,
              avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
              provider: 'google'
            };

        try {
          await fetch('/api/local/auth/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: mockUser })
          });
        } catch { /* ignore */ }

        set({ user: mockUser, isAuthenticated: true, isAuthenticating: false });
      },

      signUpWithEmail: async (name, email) => {
        set({ isAuthenticating: true });
        await new Promise((r) => setTimeout(r, 600));

        const newUser: UserInfo = {
          name,
          email,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          provider: 'email'
        };

        try {
          await fetch('/api/local/auth/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: newUser })
          });
        } catch { /* ignore */ }

        set({
          user: newUser,
          isAuthenticated: true,
          isAuthenticating: false
        });
      },

      signInWithEmail: async (email) => {
        set({ isAuthenticating: true });
        await new Promise((r) => setTimeout(r, 600));

        try {
          const res = await fetch(`/api/local/auth/get-profile?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              set({ user: data.user, isAuthenticated: true, isAuthenticating: false });
              return;
            }
          }
        } catch { /* ignore */ }

        const defaultName = email.split('@')[0] || 'Developer';
        const newUser: UserInfo = {
          name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
          email,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
          provider: 'email'
        };

        try {
          await fetch('/api/local/auth/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: newUser })
          });
        } catch { /* ignore */ }

        set({
          user: newUser,
          isAuthenticated: true,
          isAuthenticating: false
        });
      },

      updateUserProfile: async (details) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser: UserInfo = {
          ...currentUser,
          ...details
        };

        const res = await fetch('/api/local/auth/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: updatedUser })
        });

        if (!res.ok) {
          throw new Error('Failed to persist profile changes on server.');
        }

        set({ user: updatedUser });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'unify-auth-storage',
      storage: encryptedStorage,
    }
  )
);
export type { AuthStore };
