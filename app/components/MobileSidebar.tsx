import { pageStyles } from '@/theme/styles';
import EquationInput from '@/components/EquationInput';
import Settings from '@/components/Settings';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  sidebarRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: MobileSidebarProps) {
  return (
    <aside
      className={`fixed inset-0 z-40 flex items-end justify-center px-3 sm:px-6 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sidebarRef}
        className={`relative w-full max-w-md rounded-t-3xl border shadow-2xl p-4 pb-6 space-y-6 custom-scrollbar overflow-y-auto max-h-[85vh] transition-transform duration-300 ease-out hw-accelerated ${
          isOpen ? 'animate-slide-up' : ''
        }`}
        style={{
          background: 'var(--theme-surface, rgba(15, 23, 42, 0.98))',
          color: 'var(--theme-text, #e2e8f0)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-12 h-1 rounded-full mx-auto bg-gray-400/50" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Graph Controls</p>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center gpu-layer touch-feedback transition-transform active:scale-95"
            style={pageStyles.sidebarToggle}
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6.225 4.811 4.81 6.225 10.586 12l-5.776 5.775 1.415 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
            </svg>
          </button>
        </div>

        <EquationInput />
        <Settings />
      </div>
    </aside>
  );
}
