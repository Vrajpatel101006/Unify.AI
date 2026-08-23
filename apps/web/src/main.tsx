import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { registerCoreCommands } from './services/commandRegistry'

// Global Fetch Interceptor to bypass CORS for AI provider API requests
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const urlStr = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : input.url;

  const matchDomains = [
    'api.groq.com',
    'api.x.ai',
    'api.openai.com',
    'api-inference.huggingface.co',
    'api.anthropic.com',
    'api.deepseek.com',
    'generativelanguage.googleapis.com'
  ];

  const shouldProxy = matchDomains.some(domain => urlStr.includes(domain));

  if (shouldProxy) {
    const headersObj: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headersObj[key] = value;
        });
      } else {
        Object.assign(headersObj, init.headers);
      }
    }

    return originalFetch('/api/local/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: urlStr,
        method: init?.method || 'GET',
        headers: headersObj,
        body: init?.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined
      })
    });
  }

  return originalFetch(input, init);
};

registerCoreCommands()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
