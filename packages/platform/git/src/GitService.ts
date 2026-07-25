import { exec } from 'child_process';
import { promisify } from 'util';
import type { IGitService, GitStatus, GitCommit } from './types.ts';

const execAsync = promisify(exec);

export class GitService implements IGitService {
  public async getCurrentBranch(repoPath: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
      return stdout.trim();
    } catch (err) {
      // Not a git repository or git not installed
      return null;
    }
  }

  public async getStatus(repoPath: string): Promise<GitStatus | null> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: repoPath });
      
      const lines = stdout.split('\n').filter(line => line.trim().length > 0);
      
      const modifiedFiles: string[] = [];
      const untrackedFiles: string[] = [];
      const stagedFiles: string[] = [];

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3).trim();
        
        if (status === '??') {
          untrackedFiles.push(file);
        } else {
          // If first char is not space/?, it's staged
          if (status[0] !== ' ' && status[0] !== '?') {
            stagedFiles.push(file);
          }
          // If second char is M or D, it's modified but unstaged
          if (status[1] === 'M' || status[1] === 'D') {
            modifiedFiles.push(file);
          }
        }
      }

      return {
        isClean: lines.length === 0,
        modifiedFiles,
        untrackedFiles,
        stagedFiles
      };
    } catch (err) {
      return null;
    }
  }

  public async getHistory(repoPath: string, limit: number = 10): Promise<GitCommit[]> {
    try {
      // Custom format: %H|%s|%an|%ar
      // hash|message|author|date
      const { stdout } = await execAsync(`git log -n ${limit} --pretty=format:"%H|%s|%an|%ar"`, { cwd: repoPath });
      if (!stdout) return [];
      
      return stdout.split('\n').filter(Boolean).map(line => {
        const [hash, message, author, date] = line.split('|');
        return {
          hash: hash?.substring(0, 7) || '',
          message: message || '',
          author: author || '',
          date: date || ''
        };
      });
    } catch (err) {
      return [];
    }
  }

  public async getDiff(repoPath: string, stagedOnly: boolean = false): Promise<string> {
    try {
      const cmd = stagedOnly ? 'git diff --cached' : 'git diff';
      const { stdout } = await execAsync(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer for large diffs
      return stdout;
    } catch (err) {
      console.error('[GitService] Error getting diff:', err);
      return '';
    }
  }

  public async commit(repoPath: string, message: string, files: string[]): Promise<void> {
    if (files.length > 0) {
      await execAsync(`git add ${files.map(f => `"${f}"`).join(' ')}`, { cwd: repoPath });
    }
    // Note: this assumes there are staged files to commit. If files[] is empty, it commits currently staged files.
    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: repoPath });
  }

  public async push(repoPath: string): Promise<void> {
    await execAsync('git push', { cwd: repoPath });
  }

  public async pull(repoPath: string): Promise<void> {
    await execAsync('git pull', { cwd: repoPath });
  }

  public async clone(url: string, destPath: string): Promise<void> {
    await execAsync(`git clone "${url}" "${destPath}"`);
  }
}
