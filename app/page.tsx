'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import Graph2D from '@/components/Graph2D';
import Graph3D from '@/components/Graph3D';
import EquationInput from '@/components/EquationInput';
import Calculator from '@/components/Calculator';
import Settings from '@/components/Settings';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { pageStyles, getTabButtonStyle } from '@/theme/styles';

type Tab = 'graph' | 'calculator';

export default function Home() {
  const { selectedMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen" style={pageStyles.layout}>
      {/* Header */}
      <header className="shadow-sm border-b" style={pageStyles.header}>
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text" style={pageStyles.titleGradient}>
                Grapher
              </h1>
              <p className="text-sm" style={pageStyles.subtitle}>
                Advanced Mathematical Graphing & Computation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab Switcher */}
              <div className="flex rounded-lg p-1 border" style={pageStyles.tabGroup}>
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    activeTab === 'graph' ? 'shadow' : 'hover:opacity-80'
                  }`}
                  style={getTabButtonStyle(activeTab === 'graph')}
                >
                  📊 Graph
                </button>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    activeTab === 'calculator' ? 'shadow' : 'hover:opacity-80'
                  }`}
                  style={getTabButtonStyle(activeTab === 'calculator')}
                >
                  🧮 Calculator
                </button>
              </div>

              <span className="text-sm" style={pageStyles.modeLabel}>
                Mode: <strong className="font-semibold" style={pageStyles.modeValue}>{selectedMode.toUpperCase()}</strong>
              </span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-6 space-y-0">
        <div
          className={`flex gap-6 h-[calc(100vh-180px)] relative ${
            activeTab === 'graph' ? '' : 'hidden'
          }`}
          aria-hidden={activeTab !== 'graph'}
        >
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
            {selectedMode === '3d' ? (
              <Graph3D isActive={activeTab === 'graph'} />
            ) : (
              <Graph2D isActive={activeTab === 'graph'} />
            )}
          </div>

          {/* Edge Sidebar Toggle Handle next to the sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-16 rounded-r-lg shadow border backdrop-blur flex items-center justify-center hover:brightness-110 hover:-translate-y-1 transition-all ${
              sidebarOpen ? 'left-[20rem]' : 'left-0'
            }`}
            style={pageStyles.sidebarToggle}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              {sidebarOpen ? (
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              ) : (
                <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L12.17 12z" />
              )}
            </svg>
          </button>
        </div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-1 gap-6 h-[calc(100vh-180px)] ${
            activeTab === 'calculator' ? '' : 'hidden'
          }`}
          aria-hidden={activeTab !== 'calculator'}
        >
          <div className="max-w-4xl mx-auto w-full">
            <Calculator />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t px-6 py-2" style={pageStyles.footer}>
        <div className="flex items-center justify-between text-xs">
          <span>© 2025 Grapher - Advanced Graphing Calculator</span>
          <span>Powered by Nerdamer & Plotly.js</span>
        </div>
      </footer>
    </div>
  );
}
