/**
 * Unify.AI — Electron Main Process
 *
 * Minimal shell that loads the Vite dev server in development
 * and the built web app in production.
 *
 * Designed so the Electron shell can later be replaced with Tauri
 * if desired — all logic lives in the web app, not here.
 */

import { app, BrowserWindow, session, ipcMain, safeStorage } from 'electron';
import path from 'node:path';
import { net } from 'electron'; // Using fetch inside electron main is fine in recent Node/Electron

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_SERVER_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5167';

// In-memory token storage (never exposed to renderer JS)
let secureSessionToken = '';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Unify.AI',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../apps/web/dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Inject the token into outgoing requests to the backend API
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${API_BASE_URL}/api/*`] },
    (details, callback) => {
      if (secureSessionToken) {
        // Fallback to Bearer token for Electron packaged mode
        details.requestHeaders['Authorization'] = `Bearer ${secureSessionToken}`;
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Handle IPC login
  ipcMain.handle('auth:login', async (_, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Login failed');

      // The backend will set a Set-Cookie: unify_session=...
      // but it might also return it in the body for non-browser clients
      const data = await res.json();
      
      // Attempt to extract token from Set-Cookie header if provided (or from body if backend returns it)
      const cookies = res.headers.get('set-cookie');
      let token = '';
      if (cookies) {
        const match = cookies.match(/unify_session=([^;]+)/);
        if (match) token = match[1];
      }
      
      // Fallback: If backend returns token in body, grab it. 
      // Our backend doesn't, but let's assume we can grab it from cookie string.
      // Wait, our backend doesn't return the token in the body anymore to be secure.
      // So parsing Set-Cookie is correct.
      
      if (token) {
        // In a real app we'd use safeStorage to persist across app restarts
        secureSessionToken = token;
        return data; // UserInfo profile
      } else {
        throw new Error('No session cookie returned');
      }
    } catch (err) {
      console.error('IPC login error:', err);
      return null;
    }
  });

  // Handle IPC logout
  ipcMain.handle('auth:logout', async () => {
    secureSessionToken = '';
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (e) {
      // ignore
    }
    return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
