/**
 * Global state management using Zustand
 * Manages equations, graph settings, and calculation results
 */

import { create } from 'zustand';
import type { Equation, GraphSettings, CalculationResult, GraphMode, CalculationMode } from '../types';

interface AppStore {
  // Equations state
  equations: Equation[];
  addEquation: (equation: Omit<Equation, 'id'>) => void;
  updateEquation: (id: string, updates: Partial<Equation>) => void;
  removeEquation: (id: string) => void;
  toggleEquationVisibility: (id: string) => void;
  clearEquations: () => void;

  // Graph settings
  graphSettings: GraphSettings;
  updateGraphSettings: (settings: Partial<GraphSettings>) => void;
  resetGraphSettings: () => void;

  // Mode management
  selectedMode: GraphMode;
  setSelectedMode: (mode: GraphMode) => void;
  calculationMode: CalculationMode | null;
  setCalculationMode: (mode: CalculationMode | null) => void;

  // Results
  results: CalculationResult[];
  addResult: (result: CalculationResult) => void;
  clearResults: () => void;
}

const defaultGraphSettings: GraphSettings = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  zMin: -10,
  zMax: 10,
  gridEnabled: true,
  axesEnabled: true,
  labelsEnabled: true,
  backgroundColor: '#ffffff',
  gridColor: '#e5e7eb',
  axesColor: '#000000',
};

const generateId = () => `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  equations: [],
  graphSettings: defaultGraphSettings,
  selectedMode: '2d',
  calculationMode: null,
  results: [],

  // Equation actions
  addEquation: (equation) =>
    set((state) => ({
      equations: [
        ...state.equations,
        {
          ...equation,
          id: generateId(),
        },
      ],
    })),

  updateEquation: (id, updates) =>
    set((state) => ({
      equations: state.equations.map((eq) =>
        eq.id === id ? { ...eq, ...updates } : eq
      ),
    })),

  removeEquation: (id) =>
    set((state) => ({
      equations: state.equations.filter((eq) => eq.id !== id),
    })),

  toggleEquationVisibility: (id) =>
    set((state) => ({
      equations: state.equations.map((eq) =>
        eq.id === id ? { ...eq, visible: !eq.visible } : eq
      ),
    })),

  clearEquations: () => set({ equations: [] }),

  // Graph settings actions
  updateGraphSettings: (settings) =>
    set((state) => ({
      graphSettings: { ...state.graphSettings, ...settings },
    })),

  resetGraphSettings: () => set({ graphSettings: defaultGraphSettings }),

  // Mode actions
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setCalculationMode: (mode) => set({ calculationMode: mode }),

  // Results actions
  addResult: (result) =>
    set((state) => ({
      results: [result, ...state.results].slice(0, 50), // Keep last 50 results
    })),

  clearResults: () => set({ results: [] }),
}));
