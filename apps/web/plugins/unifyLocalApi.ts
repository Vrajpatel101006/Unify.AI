import type { Plugin } from 'vite';
import { GitService } from '../../../packages/platform/git/src/GitService.ts';
import nodePath from 'node:path';
import nodeFs from 'node:fs/promises';

// ─── Security Constants ────────────────────────────────────────────────────────

/** Allowed hostnames for the SSRF-protecting proxy whitelist */
const ALLOWED_PROXY_HOSTS = new Set([
  'generativelanguage.googleapis.com',
  'api.openai.com',
  'api.anthropic.com',
  'api.groq.com',
  'api.x.ai',
  'api.deepseek.com',
  'api-inference.huggingface.co',
  'api.github.com',
  // Ollama (local only, bound to loopback)
  'localhost',
  '127.0.0.1',
]);

/** Resolves the project root path (where vite.config.ts lives) */
const PROJECT_ROOT = nodePath.resolve(process.cwd());

/**
 * Validates that a user-supplied path is safely within the PROJECT_ROOT.
 * Prevents path-traversal attacks (e.g. "../../etc/passwd").
 * Returns the resolved absolute path, or throws on violation.
 */
function safeResolvePath(userPath: string): string {
  if (!userPath || typeof userPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }
  // Reject null bytes
  if (userPath.includes('\0')) {
    throw new Error('Invalid path: null bytes not allowed');
  }
  const resolved = nodePath.resolve(userPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Path traversal blocked: "${resolved}" is outside the project root.`);
  }
  return resolved;
}

/**
 * Validates that a URL targets only whitelisted hostnames (SSRF protection).
 * Returns the parsed URL, or throws on violation.
 */
function safeProxyUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`Blocked protocol: ${parsed.protocol}`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_PROXY_HOSTS.has(hostname)) {
    throw new Error(`Blocked hostname: "${hostname}" is not on the allowed list.`);
  }
  // Block access to private/reserved IP ranges
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) {
    throw new Error(`Blocked private IP range: ${hostname}`);
  }
  return parsed;
}

/**
 * Sanitizes a string field, rejecting if missing or too long.
 */
function requireString(val: unknown, fieldName: string, maxLength = 2048): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  if (val.length > maxLength) {
    throw new Error(`Field "${fieldName}" exceeds maximum length of ${maxLength}`);
  }
  return val;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export function unifyLocalApiPlugin(): Plugin {
  const git = new GitService();

  return {
    name: 'unify-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/local')) {
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
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              return;
            }
          }
        }

        // Security header for all local API responses
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-store');

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;

          // ── Git: Status ───────────────────────────────────────────────────
          if (pathname === '/api/local/git/status' && req.method === 'GET') {
            const repoPath = safeResolvePath(requireString(url.searchParams.get('path'), 'path'));
            const branch = await git.getCurrentBranch(repoPath);
            const status = await git.getStatus(repoPath);
            res.end(JSON.stringify({ branch, status }));
            return;
          }

          // ── Git: History ──────────────────────────────────────────────────
          if (pathname === '/api/local/git/history' && req.method === 'GET') {
            const repoPath = safeResolvePath(requireString(url.searchParams.get('path'), 'path'));
            const history = await git.getHistory(repoPath, 20);
            res.end(JSON.stringify({ history }));
            return;
          }

          // ── Git: Commit ───────────────────────────────────────────────────
          if (pathname === '/api/local/git/commit' && req.method === 'POST') {
            const repoPath = safeResolvePath(requireString(body.path, 'path'));
            const message = requireString(body.message, 'message', 512);
            const files: string[] = Array.isArray(body.files) ? body.files : [];
            await git.commit(repoPath, message, files);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // ── Git: Diff ─────────────────────────────────────────────────────
          if (pathname === '/api/local/git/diff' && req.method === 'POST') {
            const repoPath = safeResolvePath(requireString(body.path, 'path'));
            const diff = await git.getDiff(repoPath, !!body.stagedOnly);
            res.end(JSON.stringify({ success: true, diff }));
            return;
          }

          // ── Git: Clone ────────────────────────────────────────────────────
          if (pathname === '/api/local/git/clone' && req.method === 'POST') {
            const repoUrl = requireString(body.url, 'url');
            const destPath = safeResolvePath(requireString(body.destPath, 'destPath'));
            await git.clone(repoUrl, destPath);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // ── Git: Push ─────────────────────────────────────────────────────
          if (pathname === '/api/local/git/push' && req.method === 'POST') {
            const repoPath = safeResolvePath(requireString(body.path, 'path'));
            await git.push(repoPath);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // ── Git: Create GitHub Repo ───────────────────────────────────────
          if (pathname === '/api/local/git/create-github-repo' && req.method === 'POST') {
            const name = requireString(body.name, 'name', 100);
            const destPath = safeResolvePath(requireString(body.destPath, 'destPath'));
            const token = requireString(body.token, 'token', 256);

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
            await git.clone(cloneUrl, destPath);
            res.end(JSON.stringify({ success: true, url: cloneUrl }));
            return;
          }

          // ── Git: List GitHub Repos ────────────────────────────────────────
          if (pathname === '/api/local/git/list-github-repos' && req.method === 'POST') {
            const token = requireString(body.token, 'token', 256);

            const ghRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Unify.AI-Client'
              }
            });

            if (!ghRes.ok) {
              if (ghRes.status === 401 || ghRes.status === 403) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'GitHub Token Expired or Invalid' }));
                return;
              }
              throw new Error(`GitHub API Error: ${await ghRes.text()}`);
            }

            const repos = await ghRes.json();
            res.end(JSON.stringify({ repos }));
            return;
          }

          // ── FS: Read File ─────────────────────────────────────────────────
          if (pathname === '/api/local/fs/read' && req.method === 'GET') {
            const targetPath = safeResolvePath(requireString(url.searchParams.get('path'), 'path'));
            const content = await nodeFs.readFile(targetPath, 'utf-8');
            res.end(JSON.stringify({ content }));
            return;
          }

          // ── FS: Write File ────────────────────────────────────────────────
          if (pathname === '/api/local/fs/write' && req.method === 'POST') {
            const targetPath = safeResolvePath(requireString(body.path, 'path'));
            if (typeof body.content !== 'string') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'content must be a string' }));
              return;
            }
            await nodeFs.writeFile(targetPath, body.content, 'utf-8');
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // ── Code: Analyze ─────────────────────────────────────────────────
          if (pathname === '/api/local/code/analyze' && req.method === 'POST') {
            const targetPath = safeResolvePath(requireString(body.path, 'path'));
            const providerId = typeof body.providerId === 'string' ? body.providerId : 'openai';

            const content = await nodeFs.readFile(targetPath, 'utf-8');
            const lines = content.split('\n');

            const prompt = `You are an expert code reviewer. Analyze the following code and identify specific issues. Respond ONLY with a valid JSON array (no markdown, no extra text), where each element has this exact structure:
[
  {
    "line": <exact line number as integer>,
    "codeSnippet": "<the exact problematic line(s) of code>",
    "type": "bug|complexity|dead-code|style|security",
    "severity": "error|warning|info",
    "message": "<short description of the problem>",
    "suggestion": "<brief explanation of how to fix it>",
    "targetContent": "<exact string to replace in the file>",
    "replacementContent": "<the corrected replacement code>"
  }
]
Return an empty array [] if no issues are found. Do NOT include any text outside the JSON array.

Code from file: ${targetPath}
Total lines: ${lines.length}

\`\`\`
${content}
\`\`\``;

            const incomingCookie = req.headers['cookie'] ?? '';
            
            try {
              const apiRes = await fetch('http://localhost:5167/api/ai/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': incomingCookie
                },
                body: JSON.stringify({
                  providerId,
                  model: 'default', // handled by proxy or frontend provider config
                  messages: [{ role: 'user', content: prompt }],
                  maxTokens: 2000,
                  temperature: 0.1
                }),
                credentials: 'include'
              });

              if (!apiRes.ok) {
                const errText = await apiRes.text();
                res.statusCode = apiRes.status;
                res.end(JSON.stringify({ error: `AI API Error (${apiRes.status}): ${errText}` }));
                return;
              }

              const data = await apiRes.json() as any;
              let jsonString = data.content || '[]';
              jsonString = jsonString.replace(/^```json/m, '').replace(/```$/m, '').trim();

              let diagnostics;
              try {
                diagnostics = JSON.parse(jsonString);
                if (!Array.isArray(diagnostics)) diagnostics = [];
              } catch {
                diagnostics = [];
              }

              res.end(JSON.stringify({ diagnostics }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: `Proxy Error: ${err.message}` }));
            }
            return;
          }

          // ── Code: Apply Fix ───────────────────────────────────────────────
          if (pathname === '/api/local/code/apply-fix' && req.method === 'POST') {
            const targetPath = safeResolvePath(requireString(body.path, 'path'));
            const targetContent = requireString(body.targetContent, 'targetContent', 8192);
            const replacementContent = requireString(body.replacementContent, 'replacementContent', 8192);

            const content = await nodeFs.readFile(targetPath, 'utf-8');
            if (content.includes(targetContent)) {
              const newContent = content.replace(targetContent, replacementContent);
              await nodeFs.writeFile(targetPath, newContent, 'utf-8');
              res.end(JSON.stringify({ success: true }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Target content not found in file (it may have been modified).' }));
            }
            return;
          }

          // ── Auth: Save User Profile ───────────────────────────────────────
          if (pathname === '/api/local/auth/save-profile' && req.method === 'POST') {
            const { user } = body;
            if (!user || typeof user !== 'object') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'User object required' }));
              return;
            }
            // Validate email
            const email = user.email;
            if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Valid email required' }));
              return;
            }
            try {
              // users_db.json is always within project root (safe)
              const dbPath = nodePath.join(PROJECT_ROOT, 'users_db.json');
              let usersDb: Record<string, any> = {};
              try {
                const dbContent = await nodeFs.readFile(dbPath, 'utf-8');
                usersDb = JSON.parse(dbContent);
              } catch {
                // File doesn't exist yet, create fresh
              }
              // Only persist whitelisted fields (no arbitrary data injection)
              const allowedFields = [
                'email', 'name', 'mobile', 'country', 'bio', 'website',
                'githubUsername', 'twitterUsername', 'company', 'avatarUrl'
              ];
              const sanitizedUser: Record<string, any> = {};
              for (const field of allowedFields) {
                if (user[field] !== undefined) {
                  sanitizedUser[field] = String(user[field]).slice(0, 512);
                }
              }
              sanitizedUser.email = email.toLowerCase();
              sanitizedUser.updatedAt = new Date().toISOString();
              usersDb[email.toLowerCase()] = sanitizedUser;
              await nodeFs.writeFile(dbPath, JSON.stringify(usersDb, null, 2), 'utf-8');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to save profile' })); // Don't leak internal error
            }
            return;
          }

          // ── Auth: Get User Profile ────────────────────────────────────────
          if (pathname === '/api/local/auth/get-profile' && req.method === 'GET') {
            const email = url.searchParams.get('email');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Valid email parameter required' }));
              return;
            }
            try {
              const dbPath = nodePath.join(PROJECT_ROOT, 'users_db.json');
              let usersDb: Record<string, any> = {};
              try {
                const dbContent = await nodeFs.readFile(dbPath, 'utf-8');
                usersDb = JSON.parse(dbContent);
              } catch {
                // File does not exist yet
              }
              const user = usersDb[email.toLowerCase()] || null;
              res.end(JSON.stringify({ user }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to retrieve profile' }));
            }
            return;
          }

          // ── Files: Scan Project ───────────────────────────────────────────
          if (pathname === '/api/local/files/scan' && req.method === 'POST') {
            const projectPath = safeResolvePath(requireString(body.projectPath, 'projectPath'));

            const SQL_EXTS = new Set(['.sql', '.db', '.sqlite', '.sqlite3']);
            const DOC_EXTS = new Set(['.md', '.txt', '.rst', '.mdx']);
            const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.cs', '.cpp', '.c', '.rs', '.rb', '.php', '.swift', '.kt']);

            const sqlFiles: string[] = [];
            const docFiles: string[] = [];
            const codeFiles: string[] = [];

            const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.cache', 'coverage', '__pycache__']);

            const scanDir = async (dirPath: string, depth = 0) => {
              if (depth > 4) return;
              let entries: any[];
              try {
                entries = await nodeFs.readdir(dirPath, { withFileTypes: true });
              } catch { return; }

              for (const entry of entries) {
                if (IGNORE_DIRS.has(entry.name)) continue;
                const fullPath = nodePath.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                  await scanDir(fullPath, depth + 1);
                } else {
                  const ext = nodePath.extname(entry.name).toLowerCase();
                  if (SQL_EXTS.has(ext)) sqlFiles.push(fullPath);
                  else if (DOC_EXTS.has(ext)) docFiles.push(fullPath);
                  else if (CODE_EXTS.has(ext)) codeFiles.push(fullPath);
                }
              }
            };

            await scanDir(projectPath);
            res.end(JSON.stringify({ sqlFiles, docFiles, codeFiles }));
            return;
          }

          // ── Files: Read Single File ───────────────────────────────────────
          if (pathname === '/api/local/files/read' && req.method === 'POST') {
            const filePath = safeResolvePath(requireString(body.filePath, 'filePath'));
            try {
              const content = await nodeFs.readFile(filePath, 'utf-8');
              res.end(JSON.stringify({ content }));
            } catch (e: any) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `File not found` }));
            }
            return;
          }

          // ── Proxy: SSRF-protected External API Relay ──────────────────────
          if (pathname === '/api/local/proxy' && req.method === 'POST') {
            const { url: targetUrl, method, headers, body: reqBody } = body;
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'targetUrl required' }));
              return;
            }

            // SSRF Protection: validate hostname
            let validatedUrl: URL;
            try {
              validatedUrl = safeProxyUrl(targetUrl);
            } catch (err: any) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: `Proxy blocked: ${err.message}` }));
              return;
            }

            // Strip potentially dangerous request headers
            const safeHeaders: Record<string, string> = {};
            const BLOCKED_HEADERS = new Set(['host', 'x-forwarded-for', 'x-real-ip', 'cookie', 'set-cookie']);
            if (headers && typeof headers === 'object') {
              for (const [k, v] of Object.entries(headers)) {
                if (!BLOCKED_HEADERS.has(k.toLowerCase()) && typeof v === 'string') {
                  safeHeaders[k] = v;
                }
              }
            }

            try {
              const apiRes = await fetch(validatedUrl.toString(), {
                method: method || 'GET',
                headers: {
                  ...safeHeaders,
                  'User-Agent': 'Unify.AI-Server-Proxy'
                },
                body: reqBody ? (typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody)) : undefined
              });

              res.statusCode = apiRes.status;
              const ct = apiRes.headers.get('content-type');
              if (ct) res.setHeader('content-type', ct);

              const responseText = await apiRes.text();
              res.end(responseText);
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: `Proxy Error: ${err.message}` }));
            }
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        } catch (err: any) {
          res.statusCode = 400;
          // Never expose full stack trace in production; log it server-side
          console.error('[unifyLocalApi] Error:', err);
          res.end(JSON.stringify({ error: err.message || 'Request failed' }));
        }
      });
    },
  };
}
