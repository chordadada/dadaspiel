
import React, { ReactNode, useEffect, useRef } from 'react';
import { useSession } from '../../context/GameContext';
import { OrientationLock } from './OrientationLock';
import { useIsMobile } from '../../hooks/useIsMobile';

export const GameWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentCase } = useSession();
  const { isIOS } = useIsMobile();
  const isGameScreen = !!currentCase;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const root = document.documentElement;
    let animationFrameId: number | null = null;

    const observer = new ResizeObserver(entries => {
      // Use requestAnimationFrame to avoid ResizeObserver loop errors
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = window.requestAnimationFrame(() => {
        for (const entry of entries) {
          const containerWidth = entry.contentRect.width;
          // This formula scales the root font-size based on the container width.
          // It's clamped to ensure readability on very small or very large screens.
          // 1.5% of width provides a good balance for mobile and desktop.
          const newFontSize = Math.max(8, Math.min(16, containerWidth * 0.015)); 
          root.style.fontSize = `${newFontSize}px`;
        }
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      // Reset the font-size when the component unmounts to not affect other parts
      // of a larger application.
      root.style.fontSize = ''; 
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Determine sizing classes based on device and screen type
  let sizingClass = '';
  
  if (isIOS) {
      // Force square on iOS everywhere to handle portrait mode gracefully
      sizingClass = 'aspect-square max-w-[100vw] max-h-[100vw]';
  } else {
      if (isGameScreen) {
          // Force 4:3 for gameplay on non-iOS
          sizingClass = 'aspect-[4/3] max-w-[1024px] max-h-[768px]';
      } else {
          // Flexible for menus on non-iOS, but capped on desktop
          sizingClass = 'sm:max-w-[1024px] sm:max-h-[768px]';
      }
  }

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-0 sm:p-4">
      <div 
        ref={containerRef}
        id="game-container"
        className={`w-full h-full bg-[#1a1a1a] pixel-border flex flex-col relative overflow-hidden transition-all duration-300 ${sizingClass}`}
      >
        <div id="game-content-container" className="w-full h-full">
            {children}
        </div>
        <OrientationLock />
      </div>
    </div>
  );
};
