import { create } from 'zustand';

interface CVStore {
  activeCVId: string | null;
  setActiveCVId: (id: string | null) => void;
}

export const useCVStore = create<CVStore>((set) => ({
  activeCVId: null,
  setActiveCVId: (id) => set({ activeCVId: id }),
}));
