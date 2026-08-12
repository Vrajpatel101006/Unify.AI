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

          if (pathname === '/api/local/code/analyze' && req.method === 'POST') {
            const fs = await import('node:fs/promises');
            const { path: targetPath, providerId, apiKey } = body;
            if (!targetPath || !apiKey) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Path and API key required' }));
              return;
            }

            const content = await fs.readFile(targetPath, 'utf-8');
            const lines = content.split('\n');
            const linesOfCode = lines.length;
            const functionsCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/g) || []).length;

            const prompt = `You are a strict code analyzer. Respond ONLY with valid JSON, no markdown formatting blocks, no extra text. Analyze the following code and return a JSON object with this exact structure:
{
  "grade": "A|B|C|D|F",
  "complexityScore": <number 1-100>,
  "diagnostics": [
    {
      "line": <exact line number>,
      "type": "complexity|dead-code|bug|style",
      "severity": "error|warning|info",
      "message": "<description>",
      "targetContent": "<exact snippet to replace>",
      "replacementContent": "<the improved code snippet for a quick fix>"
    }
  ]
}

Code to analyze:
${content}`;

            let aiResponse;
            // Support huggingface currently as primary example
            if (providerId === 'huggingface' || providerId === 'hf') {
              aiResponse = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'meta-llama/Llama-3.3-70B-Instruct',
                  messages: [{ role: 'user', content: prompt }],
                  max_tokens: 1500
                })
              });
            } else if (providerId === 'openai') {
              aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'user', content: prompt }],
                  response_format: { type: "json_object" }
                })
              });
            } else {
              // fallback generic openai compatible endpoint
               aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'user', content: prompt }]
                })
              });
            }

            if (!aiResponse.ok) {
              if (aiResponse.status === 429 || aiResponse.status === 402 || aiResponse.status === 401) {
                res.statusCode = 429;
                res.end(JSON.stringify({ error: 'Tokens are over or API key is invalid/exhausted.' }));
                return;
              }
              const errText = await aiResponse.text();
              throw new Error(`AI API Error: ${errText}`);
            }

            const data = await aiResponse.json() as any;
            let jsonString = '';
            if (data.choices && data.choices[0] && data.choices[0].message) {
              jsonString = data.choices[0].message.content;
            } else {
              throw new Error('Invalid AI response format');
            }

            // Strip markdown block if model ignored the prompt
            jsonString = jsonString.replace(/^```json/m, '').replace(/```$/m, '').trim();
            
            let result;
            try {
              result = JSON.parse(jsonString);
            } catch (e) {
              throw new Error('AI returned invalid JSON: ' + jsonString);
            }

            result.linesOfCode = linesOfCode;
            result.functionsCount = functionsCount;

            res.end(JSON.stringify({ result }));
            return;
          }

          if (pathname === '/api/local/code/apply-fix' && req.method === 'POST') {
            const fs = await import('node:fs/promises');
            const { path: targetPath, targetContent, replacementContent } = body;
            if (!targetPath || !targetContent || !replacementContent) {
              throw new Error('Missing parameters');
            }
            
            const content = await fs.readFile(targetPath, 'utf-8');
            if (content.includes(targetContent)) {
               const newContent = content.replace(targetContent, replacementContent);
               await fs.writeFile(targetPath, newContent, 'utf-8');
               res.end(JSON.stringify({ success: true }));
            } else {
               res.statusCode = 400;
               res.end(JSON.stringify({ error: 'Target content not found in file (it may have been modified).' }));
            }
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
