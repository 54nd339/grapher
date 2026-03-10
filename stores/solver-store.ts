import { create } from "zustand";

import type { SolverCategory, SolverResult } from "@/types";

interface SolverState {
  visible: boolean;
  activeTab: SolverCategory;
  input: string;
  result: SolverResult | null;
  loading: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
  setActiveTab: (tab: SolverCategory) => void;
  setInput: (input: string) => void;
  setResult: (result: SolverResult | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSolverStore = create<SolverState>((set) => ({
  visible: false,
  activeTab: "algebra",
  input: "",
  result: null,
  loading: false,

  setVisible: (visible) => set({ visible }),
  toggleVisible: () => set((s) => ({ visible: !s.visible })),
  setActiveTab: (tab) => set({ activeTab: tab, input: "", result: null }),
  setInput: (input) => set({ input }),
  setResult: (result) => set({ result, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

