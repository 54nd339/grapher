import { useCallback, useRef } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  active: boolean;
  timestamp: number;
}

interface UseMobileGesturesProps {
  isMobile: boolean;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}

export function useMobileGestures({
  isMobile,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  sidebarRef,
}: UseMobileGesturesProps) {
  const swipeRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    active: false,
    timestamp: 0,
  });

  const handleGraphTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobile) return;
      const touch = event.touches[0];
      if (!touch) return;
      const shouldTrack = mobileSidebarOpen || touch.clientX < 60;
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        active: shouldTrack,
        timestamp: Date.now(),
      };
    },
    [isMobile, mobileSidebarOpen]
  );

  const handleGraphTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobile || !swipeRef.current.active) return;
      const touch = event.touches[0];
      if (!touch) return;
      swipeRef.current.deltaX = touch.clientX - swipeRef.current.startX;
      swipeRef.current.deltaY = touch.clientY - swipeRef.current.startY;

      // Apply live transform to sidebar during swipe
      if (mobileSidebarOpen && sidebarRef.current) {
        const translateY = Math.max(0, -swipeRef.current.deltaY);
        if (translateY > 0) {
          sidebarRef.current.style.transform = `translateY(${translateY}px)`;
        }
      }
    },
    [isMobile, mobileSidebarOpen, sidebarRef]
  );

  const handleGraphTouchEnd = useCallback(() => {
    if (!isMobile || !swipeRef.current.active) return;
    const { deltaX, deltaY, timestamp } = swipeRef.current;
    const duration = Date.now() - timestamp;
    const velocityX = Math.abs(deltaX) / duration;

    // Reset sidebar transform
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = '';
    }

    // Horizontal swipe to open/close sidebar
    if (Math.abs(deltaX) > Math.abs(deltaY) && (Math.abs(deltaX) > 80 || velocityX > 0.5)) {
      if (deltaX > 0) {
        setMobileSidebarOpen(true);
      } else if (deltaX < 0) {
        setMobileSidebarOpen(false);
      }
    }
    // Vertical swipe to close sidebar
    else if (mobileSidebarOpen && deltaY < -50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setMobileSidebarOpen(false);
    }

    swipeRef.current = { startX: 0, startY: 0, deltaX: 0, deltaY: 0, active: false, timestamp: 0 };
  }, [isMobile, mobileSidebarOpen, setMobileSidebarOpen, sidebarRef]);

  const handleSidebarTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) {
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        active: true,
        timestamp: Date.now(),
      };
    }
  }, []);

  const handleSidebarTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeRef.current.active) return;
      const touch = e.touches[0];
      if (touch) {
        swipeRef.current.deltaY = touch.clientY - swipeRef.current.startY;
        if (swipeRef.current.deltaY > 0 && sidebarRef.current) {
          sidebarRef.current.style.transform = `translateY(${swipeRef.current.deltaY}px)`;
        }
      }
    },
    [sidebarRef]
  );

  const handleSidebarTouchEnd = useCallback(() => {
    if (swipeRef.current.active && swipeRef.current.deltaY > 100) {
      setMobileSidebarOpen(false);
    }
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = '';
    }
    swipeRef.current = { startX: 0, startY: 0, deltaX: 0, deltaY: 0, active: false, timestamp: 0 };
  }, [setMobileSidebarOpen, sidebarRef]);

  return {
    handleGraphTouchStart,
    handleGraphTouchMove,
    handleGraphTouchEnd,
    handleSidebarTouchStart,
    handleSidebarTouchMove,
    handleSidebarTouchEnd,
  };
}
