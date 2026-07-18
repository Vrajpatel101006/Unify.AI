/**
 * Unify.AI — Electron Preload Script
 *
 * Safely exposes minimal Node.js APIs to the renderer process
 * via contextBridge. Keep this surface area as small as possible.
 */

import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('unifyDesktop', {
  platform: process.platform,
  isElectron: true,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
