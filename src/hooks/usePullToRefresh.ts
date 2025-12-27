import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  enabled = true 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      if (diff > 0 && container.scrollTop <= 0) {
        e.preventDefault();
        // Apply resistance
        const resistance = 0.4;
        setPullDistance(Math.min(diff * resistance, threshold * 1.5));
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      isPulling = false;
      
      if (pullDistance >= threshold && !isRefreshing) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, pullDistance, isRefreshing, handleRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
  };
}
