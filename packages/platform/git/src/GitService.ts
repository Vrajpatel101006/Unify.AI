import { exec } from 'child_process';
import { promisify } from 'util';
import { IGitService, GitStatus } from './types';

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
}
