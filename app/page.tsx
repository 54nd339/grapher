'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useIsMobile, useMobileGestures } from '@/hooks';
import Graph2D from '@/components/Graph2D';
import Graph3D from '@/components/Graph3D';
import EquationInput from '@/components/EquationInput';
import Calculator from '@/components/Calculator';
import Settings from '@/components/Settings';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import MobileSidebar from '@/components/MobileSidebar';
import FloatingActionButton from '@/components/FloatingActionButton';
import { pageStyles, getTabButtonStyle } from '@/theme/styles';

type Tab = 'graph' | 'calculator';

export default function Home() {
  const { selectedMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const {
    handleGraphTouchStart,
    handleGraphTouchMove,
    handleGraphTouchEnd,
    handleSidebarTouchStart,
    handleSidebarTouchMove,
    handleSidebarTouchEnd,
  } = useMobileGestures({
    isMobile,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    sidebarRef,
  });

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab !== 'graph') {
      setMobileSidebarOpen(false);
    }
  }, []);

  return (
    <div className="min-h-screen pb-24" style={pageStyles.layout}>
      {/* Header */}
      <header className="shadow-sm border-b" style={pageStyles.header}>
        <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text" style={pageStyles.titleGradient}>
                  Grapher
                </h1>
                <p className="text-sm" style={pageStyles.subtitle}>
                  Advanced Mathematical Graphing & Computation
                </p>
              </div>

            <div className="flex flex-col items-center gap-2 lg:flex-row lg:justify-between">
              <div className="flex justify-center flex-1">
                <div className="flex rounded-lg p-1 border" style={pageStyles.tabGroup}>
                  <button
                    onClick={() => handleTabChange('graph')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 touch-feedback ${
                      activeTab === 'graph' ? 'shadow' : 'hover:opacity-80'
                    }`}
                    style={getTabButtonStyle(activeTab === 'graph')}
                  >
                    📊 Graph
                  </button>
                  <button
                    onClick={() => handleTabChange('calculator')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 touch-feedback ${
                      activeTab === 'calculator' ? 'shadow' : 'hover:opacity-80'
                    }`}
                    style={getTabButtonStyle(activeTab === 'calculator')}
                  >
                    🧮 Calculator
                  </button>
                </div>
              </div>
            </div>

              <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                <span className="text-sm" style={pageStyles.modeLabel}>
                  Mode:{' '}
                  <strong className="font-semibold" style={pageStyles.modeValue}>
                    {selectedMode.toUpperCase()}
                  </strong>
                </span>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto p-4 sm:p-6 space-y-6 pb-6">
        <section
          className={activeTab === 'graph' ? 'block' : 'hidden'}
          aria-hidden={activeTab !== 'graph'}
        >
          <div className="relative flex flex-col lg:flex-row gap-6 min-h-[60vh] lg:h-[calc(100vh-220px)]">
            {!isMobile && (
              <aside
                className={`hidden lg:flex lg:flex-col transition-all duration-300 ${
                  sidebarOpen ? 'lg:w-80 opacity-100' : 'lg:w-0 opacity-0 pointer-events-none'
                }`}
                aria-hidden={!sidebarOpen}
              >
                <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                  <EquationInput />
                  <Settings />
                </div>
              </aside>
            )}

            <div
              className="flex-1 min-h-[420px]"
              onTouchStart={handleGraphTouchStart}
              onTouchMove={handleGraphTouchMove}
              onTouchEnd={handleGraphTouchEnd}
            >
              {selectedMode === '3d' ? (
                <Graph3D key="graph-3d" isActive={activeTab === 'graph'} />
              ) : (
                <Graph2D key="graph-2d" isActive={activeTab === 'graph'} />
              )}
            </div>

            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-16 rounded-r-lg shadow border backdrop-blur flex items-center justify-center hover:brightness-110 transition-all duration-200 gpu-layer touch-feedback active:scale-95 ${
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
            )}
          </div>
        </section>

        <section
          className={activeTab === 'calculator' ? 'block' : 'hidden'}
          aria-hidden={activeTab !== 'calculator'}
        >
          <div className="max-w-4xl mx-auto w-full min-h-[60vh]">
            <Calculator />
          </div>
        </section>
      </main>

      {/* Mobile floating action */}
      {isMobile && activeTab === 'graph' && (
        <FloatingActionButton
          onClick={() => setMobileSidebarOpen(true)}
          isVisible={!mobileSidebarOpen}
        />
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          sidebarRef={sidebarRef}
          onTouchStart={handleSidebarTouchStart}
          onTouchMove={handleSidebarTouchMove}
          onTouchEnd={handleSidebarTouchEnd}
        />
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t px-6 py-2" style={pageStyles.footer}>
        <div className="flex flex-col gap-1 text-xs text-center sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025 Grapher - Advanced Graphing Calculator</span>
          <span>Powered by Nerdamer & Plotly.js</span>
        </div>
      </footer>
    </div>
  );
}
