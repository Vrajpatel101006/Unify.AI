import { useEffect, useState } from 'react';
import { Cpu, Terminal, Shield } from 'lucide-react';

interface LandingWorkspaceProps {
  onComplete: () => void;
}

export function LandingWorkspace({ onComplete }: LandingWorkspaceProps) {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  const startupLogs = [
    'Initializing AI Router Kernel...',
    'Loading workspace plugin structures...',
    'Securing Git session pipelines...',
    'Indexing local vector memory nodes...',
    'Injecting CORS proxy filters...',
    'Workspace core ready.',
  ];

  useEffect(() => {
    // Progress interval (takes 2.5 seconds total)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    // Log ticker interval
    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev < startupLogs.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(logInterval);
  }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-[#07080c] overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent-primary)] opacity-10 blur-[100px] animate-pulse" />
      
      {/* Spinner Branding Circle */}
      <div className="relative flex items-center justify-center h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-[var(--color-accent-primary)]/20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 rounded-full border border-t-[var(--color-accent-primary)] border-r-[var(--color-accent-primary)] border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '2s' }} />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/10 text-[var(--color-accent-primary)] shadow-2xl backdrop-blur-md">
          <Cpu size={32} className="animate-pulse" />
        </div>
      </div>

      {/* Loading info text */}
      <div className="mt-8 text-center flex flex-col items-center gap-1.5 z-10">
        <h2 className="text-sm font-bold text-white tracking-wider uppercase">
          Unifying Workspace Modules
        </h2>
        <span className="text-[10px] text-[var(--color-accent-primary)] font-mono font-bold tracking-widest">
          {progress}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-4 w-72 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 z-10">
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 transition-all duration-100 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Ticker logs */}
      <div className="mt-6 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] font-mono z-10 bg-white/[0.01] border border-white/5 px-3 py-1.5 rounded-lg">
        <Terminal size={11} className="text-[var(--color-accent-primary)] shrink-0" />
        <span className="truncate max-w-[240px]">{startupLogs[logIndex]}</span>
      </div>

      {/* Security note badge */}
      <div className="absolute bottom-6 flex items-center gap-1.5 text-[9px] text-white/20 uppercase tracking-widest font-semibold">
        <Shield size={10} />
        <span>End-to-End Encrypted Session</span>
      </div>
    </div>
  );
}
