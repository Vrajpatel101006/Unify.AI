import type { Plugin } from 'vite';
import { GitService } from '../../../packages/platform/git/src/GitService.ts';

export function unifyLocalApiPlugin(): Plugin {
  const git = new GitService();

  return {
    name: 'unify-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/local/git')) {
          return next();
        }

        // Parse JSON body if present
        let body: any = {};
        if (req.method === 'POST' || req.method === 'PUT') {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const raw = Buffer.concat(buffers).toString();
          if (raw) {
            try {
              body = JSON.parse(raw);
            } catch (_) {
              // ignore
            }
          }
        }

        res.setHeader('Content-Type', 'application/json');

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;
          
          if (pathname === '/api/local/git/status' && req.method === 'GET') {
            const repoPath = url.searchParams.get('path');
            if (!repoPath) throw new Error('Path required');
            
            const branch = await git.getCurrentBranch(repoPath);
            const status = await git.getStatus(repoPath);
            
            res.end(JSON.stringify({ branch, status }));
            return;
          }

          if (pathname === '/api/local/git/history' && req.method === 'GET') {
            const repoPath = url.searchParams.get('path');
            if (!repoPath) throw new Error('Path required');
            
            const history = await git.getHistory(repoPath, 20);
            res.end(JSON.stringify({ history }));
            return;
          }

          if (pathname === '/api/local/git/commit' && req.method === 'POST') {
            const { path: repoPath, message, files } = body;
            if (!repoPath || !message) throw new Error('Path and message required');
            
            await git.commit(repoPath, message, files || []);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (pathname === '/api/local/git/diff' && req.method === 'POST') {
            const { path: repoPath, stagedOnly } = body;
            if (!repoPath) throw new Error('Path required');
            const diff = await git.getDiff(repoPath, !!stagedOnly);
            res.end(JSON.stringify({ success: true, diff }));
            return;
          }

          if (pathname === '/api/local/git/clone' && req.method === 'POST') {
            const { url: repoUrl, destPath } = body;
            if (!repoUrl || !destPath) throw new Error('URL and destPath required');
            
            await git.clone(repoUrl, destPath);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (pathname === '/api/local/git/push' && req.method === 'POST') {
            const { path: repoPath } = body;
            await git.push(repoPath);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (pathname === '/api/local/git/create-github-repo' && req.method === 'POST') {
            const { name, destPath, token } = body;
            if (!name || !destPath || !token) throw new Error('Missing parameters');
            
            // Create repo on GitHub
            const ghRes = await fetch('https://api.github.com/user/repos', {
              method: 'POST',
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Unify.AI-Client'
              },
              body: JSON.stringify({ name, private: false, auto_init: true })
            });

            if (!ghRes.ok) {
              const errTxt = await ghRes.text();
              if (ghRes.status === 401 || ghRes.status === 403) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'GitHub Token Expired or Invalid' }));
                return;
              }
              throw new Error(`GitHub API Error: ${errTxt}`);
            }

            const repoData = await ghRes.json() as any;
            const cloneUrl = repoData.clone_url;

            // Clone locally
            await git.clone(cloneUrl, destPath);

            res.end(JSON.stringify({ success: true, url: cloneUrl }));
            return;
          }

          if (pathname === '/api/local/git/list-github-repos' && req.method === 'POST') {
            const { token } = body;
            if (!token) throw new Error('Missing token');
            
            const ghRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Unify.AI-Client'
              }
            });

            if (!ghRes.ok) {
              const errTxt = await ghRes.text();
              if (ghRes.status === 401 || ghRes.status === 403) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'GitHub Token Expired or Invalid' }));
                return;
              }
              throw new Error(`GitHub API Error: ${errTxt}`);
            }

            const repos = await ghRes.json();
            res.end(JSON.stringify({ repos }));
            return;
          }

          if (pathname === '/api/local/fs/read' && req.method === 'GET') {
            const fs = await import('node:fs/promises');
            const targetPath = url.searchParams.get('path');
            if (!targetPath) throw new Error('Path required');
            const content = await fs.readFile(targetPath, 'utf-8');
            res.end(JSON.stringify({ content }));
            return;
          }

          if (pathname === '/api/local/fs/write' && req.method === 'POST') {
            const fs = await import('node:fs/promises');
            const { path: targetPath, content } = body;
            if (!targetPath) throw new Error('Path required');
            await fs.writeFile(targetPath, content || '', 'utf-8');
            res.end(JSON.stringify({ success: true }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
