import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Cpu, Github, Mail, Lock, User, Chrome, RefreshCw, Key } from 'lucide-react';

export function LoginWorkspace() {
  const { loginWithProvider, signUpWithEmail, signInWithEmail, isAuthenticating } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);

  // Email form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp) {
      if (!name) return;
      await signUpWithEmail(name, email);
    } else {
      await signInWithEmail(email);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#090b10] overflow-hidden select-none">
      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--color-accent-primary)] opacity-20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600 opacity-15 blur-[150px] animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 w-[420px] rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md flex flex-col gap-6">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 text-[var(--color-accent-primary)]">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-1">
              Unify.AI <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]">v1.0</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              AI-native developer workspaces and channels.
            </p>
          </div>
        </div>

        {/* Social Sign-In buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => loginWithProvider('github')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-all cursor-pointer transition-colors disabled:opacity-50"
          >
            <Github size={14} />
            <span>Continue with GitHub</span>
          </button>
          <button
            onClick={() => loginWithProvider('google')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-all cursor-pointer transition-colors disabled:opacity-50"
          >
            <Chrome size={14} className="text-red-400" />
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            onClick={() => signUpWithEmail('Demo Developer', 'demo@unify.ai')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20 py-2.5 text-xs font-bold text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20 active:bg-[var(--color-accent-primary)]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Continue with Guest / Test Account</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3">or continue with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@unify.ai"
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-accent-primary)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full rounded-lg bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] py-2.5 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isAuthenticating ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
            <span>{isAuthenticating ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center mt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-white cursor-pointer transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}
