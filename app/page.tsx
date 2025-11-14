'use client';

/**
 * Main application page - Desmos-like graphing calculator
 */

import { useState } from 'react';
import { useAppStore } from './lib/store';
import Graph2D from './components/Graph2D';
import Graph3D from './components/Graph3D';
import EquationInput from './components/EquationInput';
import Calculator from './components/Calculator';
import Settings from './components/Settings';

type Tab = 'graph' | 'calculator';

export default function Home() {
  const { selectedMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }}>
                Grapher
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced Mathematical Graphing & Computation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab Switcher */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'graph'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📊 Graph
                </button>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'calculator'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🧮 Calculator
                </button>
              </div>

              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Mode: <strong className="text-gray-900 dark:text-white">{selectedMode.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-6">
        {activeTab === 'graph' ? (
          <div className="flex gap-6 h-[calc(100vh-180px)] relative">

            {/* Left Sidebar - Equation Input & Settings */}
            <div 
              className={`space-y-6 overflow-y-auto transition-all duration-300 ${
                sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
              }`}
            >
              <EquationInput />
              <Settings />
            </div>

            {/* Center - Graph Display */}
            <div className="flex-1 h-full min-h-[600px]">
              {selectedMode === '3d' ? <Graph3D /> : <Graph2D />}
            </div>

            {/* Edge Sidebar Toggle Handle next to the sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-16 rounded-r-lg shadow border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors ${
                sidebarOpen ? 'left-[20rem]' : 'left-0'
              }`}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-300">
                {sidebarOpen ? (
                  <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                ) : (
                  <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L12.17 12z" />
                )}
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 h-[calc(100vh-180px)]">
            <div className="max-w-4xl mx-auto w-full">
              <Calculator />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>© 2025 Grapher - Advanced Graphing Calculator</span>
          <span>Powered by Nerdamer, Mafs & Plotly.js</span>
        </div>
      </footer>
    </div>
  );
}
