import { pageStyles } from '@/theme/styles';

interface FloatingActionButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

export default function FloatingActionButton({ onClick, isVisible }: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-24 right-4 z-30 rounded-full px-5 py-3 text-sm font-semibold shadow-xl border flex items-center gap-2 transition-all duration-300 gpu-layer touch-feedback hw-accelerated ${
        isVisible ? 'scale-100 opacity-100 animate-bounce-in active:scale-95' : 'scale-0 opacity-0 pointer-events-none'
      }`}
      style={pageStyles.sidebarToggle}
      aria-label="Open equation panel"
    >
      <span className="text-lg" aria-hidden="true">
        ➕
      </span>
      Equations
    </button>
  );
}
