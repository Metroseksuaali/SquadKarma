// src/store/appStore.ts
// Global application state using Zustand

import { create } from 'zustand';

interface AppState {
  // Selected server for voting
  selectedServerId: string | null;
  setSelectedServerId: (id: string | null) => void;

  // Selected player for voting
  selectedPlayerSteam64: string | null;
  setSelectedPlayerSteam64: (steam64: string | null) => void;

  // Vote modal state
  isVoteModalOpen: boolean;
  openVoteModal: (playerSteam64: string, serverId: string) => void;
  closeVoteModal: () => void;

  // Reset selections
  resetSelections: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedServerId: null,
  setSelectedServerId: (id) => set({ selectedServerId: id }),

  selectedPlayerSteam64: null,
  setSelectedPlayerSteam64: (steam64) => set({ selectedPlayerSteam64: steam64 }),

  isVoteModalOpen: false,
  openVoteModal: (playerSteam64, serverId) => set({
    isVoteModalOpen: true,
    selectedPlayerSteam64: playerSteam64,
    selectedServerId: serverId,
  }),
  closeVoteModal: () => set({ isVoteModalOpen: false }),

  resetSelections: () => set({
    selectedServerId: null,
    selectedPlayerSteam64: null,
    isVoteModalOpen: false,
  }),
}));
