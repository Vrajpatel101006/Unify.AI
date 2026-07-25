import { create } from 'zustand';

export interface CommandPaletteState {
  isOpen: boolean;
  recentCommandIds: string[];
  
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  
  addRecentCommand: (id: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  recentCommandIds: [],
  
  openPalette: () => set({ isOpen: true }),
  closePalette: () => set({ isOpen: false }),
  togglePalette: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addRecentCommand: (id: string) => set((state) => {
    // Keep max 10 recent commands, move to top if already exists
    const withoutExisting = state.recentCommandIds.filter(existing => existing !== id);
    return {
      recentCommandIds: [id, ...withoutExisting].slice(0, 10)
    };
  })
}));
