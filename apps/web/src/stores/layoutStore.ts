import { create } from 'zustand';

export interface TabItem {
  id: string;
  title: string;
  type: string; // 'welcome' | 'prompt' | 'sql' | 'api' | 'docs'
  isDirty?: boolean;
}

interface LayoutState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  activeActivity: string;
  openTabs: TabItem[];
  activeTabId: string | null;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveActivity: (id: string) => void;
  addTab: (tab: TabItem) => void;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  activeActivity: 'welcome',
  openTabs: [{ id: 'welcome', title: 'Welcome', type: 'welcome' }],
  activeTabId: 'welcome',

  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),

  setTheme: (theme) => set(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return { theme };
  }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
  
  setActiveActivity: (id) => set((state) => ({
    activeActivity: id,
    sidebarOpen: state.activeActivity === id ? !state.sidebarOpen : true,
  })),

  addTab: (tab) => set((state) => {
    const exists = state.openTabs.some((t) => t.id === tab.id);
    const openTabs = exists ? state.openTabs : [...state.openTabs, tab];
    return { openTabs, activeTabId: tab.id };
  }),

  closeTab: (id) => set((state) => {
    const openTabs = state.openTabs.filter((t) => t.id !== id);
    let activeTabId = state.activeTabId;

    if (activeTabId === id) {
      activeTabId = openTabs.length > 0 ? openTabs[openTabs.length - 1]!.id : null;
    }

    return { openTabs, activeTabId };
  }),

  setActiveTabId: (id) => set(() => ({ activeTabId: id })),
}));
