import { useState } from 'react';
import { HelpCircle, Key, Github, Database, Cpu, ChevronDown, ChevronRight, Info, AlertTriangle } from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export function HelpWorkspace() {
  const [expandedSection, setExpandedSection] = useState<string | null>('api');

  const sections: HelpSection[] = [
    {
      id: 'api',
      title: '🔑 Configuring AI Provider API Keys',
      icon: Key,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            Unify.AI uses real AI models to power Code Intelligence, Chat, and SQL Simulations. You can configure keys in settings:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-[11px] text-[var(--color-text-muted)]">
            <li><strong>Google Gemini:</strong> Get a key at Google AI Studio. Direct and fast.</li>
            <li><strong>Groq Console:</strong> Get a key at Groq Console. Excellent for fast coding.</li>
            <li><strong>xAI Grok:</strong> Get a key at xAI developer console.</li>
            <li><strong>Hugging Face:</strong> Get an Inference Token for open models.</li>
          </ul>
          <div className="rounded-lg border border-[var(--color-status-info)]/30 bg-[var(--color-status-info)]/5 p-3 flex items-start gap-2">
            <Info size={14} className="text-[var(--color-status-info)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--color-text-primary)]">Security &amp; CORS Bypass:</span>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                Browsers normally block direct client-side requests to third-party endpoints because of CORS. To make connections succeed, Unify.AI automatically routes your requests through a secure Node.js proxy on your local Vite dev server. Your keys are processed locally on your device and are never stored on external third-party servers.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'github',
      title: '🐙 Connecting to GitHub (OAuth & Tokens)',
      icon: Github,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            Connecting your GitHub account lets you fetch repository information, inspect commits, and manage remote repos directly in the Repository Workspace.
          </p>
          <div className="flex flex-col gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] p-3 rounded-lg">
            <span className="font-bold text-[var(--color-text-primary)]">How to generate a GitHub Access Token:</span>
            <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-[11px] text-[var(--color-text-muted)] mt-1.5">
              <li>Navigate to your GitHub account settings and select <strong>Developer settings</strong> (at the bottom left).</li>
              <li>Go to <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong>.</li>
              <li>Click <strong>Generate new token</strong> (classic).</li>
              <li>Set a note/description (e.g. <code>Unify.AI Workspace</code>).</li>
              <li>Select scopes: Check <strong>repo</strong> (Full control of private repositories) and <strong>admin:repo_hook</strong> if you want automatic hook notifications.</li>
              <li>Click <strong>Generate token</strong> at the bottom of the page.</li>
              <li>Copy the token code (starts with <code>ghp_</code>) and paste it into the GitHub login box in Unify.AI settings.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'database',
      title: '🗄️ Connecting Databases',
      icon: Database,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            The Database Workspace allows you to explore table schemas, run query scripts, and view log execution summaries. You have two options to load databases:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            <div className="p-3 border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] rounded-lg">
              <span className="font-semibold text-[var(--color-text-primary)]">Option A: Folder Scan (SQL files)</span>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 leading-normal">
                Open a project folder containing <code>.sql</code>, <code>.db</code>, or <code>.sqlite</code> files in the Repository Workspace. The Smart File Router will scan them and place them in the <strong>Project SQL Files</strong> list. Click any file to load it into the editor.
              </p>
            </div>
            <div className="p-3 border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] rounded-lg">
              <span className="font-semibold text-[var(--color-text-primary)]">Option B: Custom Connection</span>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 leading-normal">
                Click the <strong>`+` (Plus)</strong> button in the left connections panel sidebar. Add your server address (e.g. <code>127.0.0.1:5432/my_db</code>). It will connect and display a status indicator.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/5 p-3 flex items-start gap-2 mt-1">
            <AlertTriangle size={14} className="text-[var(--color-status-warning)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--color-text-primary)]">SQL Simulation Mode:</span>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                If you have an active AI key configured, running SQL queries in the terminal will use the AI to simulate query results dynamically against your table schemas, returning neat formatted logs and execution times.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'code-intel',
      title: '🧠 Code Quality & Inline Quick Fixes',
      icon: Cpu,
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            The Code Intelligence Workspace detects code smells, unused items, bugs, and performance warnings:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <li><strong>Single File Mode:</strong> Focus the analysis on one specific file workspace path.</li>
            <li><strong>Whole Folder Mode:</strong> Iteratively scans all code files inside your opened repository with a live progress bar.</li>
            <li><strong>Proposed Fixes:</strong> Expand any issue card to view the offending code snippet (highlighted in red) and see the AI-generated correction code.</li>
            <li><strong>Apply Quick Fix:</strong> Click the "Apply Quick Fix" button on any card to directly modify the source file on your local machine instantly.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] p-6 overflow-y-auto select-text">
      {/* Top Banner */}
      <div className="border-b border-[var(--color-border-default)] pb-4 mb-6 shrink-0">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <HelpCircle size={16} className="text-[var(--color-accent-primary)]" />
          Workspace Help Center &amp; Guides
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Everything you need to know to configure and use the Unify.AI Developer Platform.
        </p>
      </div>

      {/* Accordions */}
      <div className="flex flex-col gap-4 max-w-4xl">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isExpanded = expandedSection === sec.id;

          return (
            <div
              key={sec.id}
              className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer text-left gap-3"
              >
                <div className="flex items-center gap-2.5 font-bold text-xs text-[var(--color-text-primary)]">
                  <Icon size={16} className="text-[var(--color-accent-primary)] shrink-0" />
                  <span>{sec.title}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={16} className="text-[var(--color-text-muted)]" />}
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--color-border-default)] p-4 bg-[var(--color-bg-tertiary)]/30">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
