
import React, { useState, useEffect, useRef } from 'react';
import { useSession, useSettings, useProfile, useNavigation } from '../../context/GameContext';
import { playSound, SoundType } from '../../utils/AudioEngine';
import { Character, GameScreen, SeasonalEvent } from '../../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

interface HUDProps {
    highlightVisor?: boolean;
    highlightControls?: boolean;
    highlightFullscreen?: boolean;
    onVisorClick?: () => void;
    onFullscreenClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ 
    highlightVisor = false, 
    highlightControls = false, 
    highlightFullscreen = false,
    onVisorClick, 
    onFullscreenClick 
}) => {
  const { 
    lives, sessionScore, character, activateArtistInsight, activateFourthWall,
    abilityUsedInCase, abilityUsedInSession, absurdEdgeUsedInSession, activateAbsurdEdge,
    currentCase, minigameIndex
  } = useSession();
  const { isMuted, toggleMute, seasonalEvent, seasonalAnimationsEnabled, toggleSeasonalAnimations, sensitivity, setSensitivity } = useSettings();
  const { activeProfile, requestLogout } = useProfile();
  const { screen, showInstructionModal } = useNavigation();
  const { isIOS } = useIsMobile();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false);
  
  // States for HUD visibility
  const [isSticky, setIsSticky] = useState(false); // For permanent visibility toggle
  const [isHovering, setIsHovering] = useState(false); // For temporary visibility on hover/tap
  
  // Force visibility if controls are highlighted (Step 2), but NOT if just visor is highlighted (Step 1)
  const isHudVisible = isSticky || isHovering || highlightControls;
  const isTutorialMode = highlightVisor || highlightControls || highlightFullscreen;

  // Check if we should show sensitivity slider (Only for Draniki Shooter 6-3)
  const isShooterGame = screen === GameScreen.MINIGAME_PLAY && currentCase?.minigames[minigameIndex]?.id === '6-3';

  // Refs for interaction logic
  const hideTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  // --- Check Fullscreen Support on Mount ---
  useEffect(() => {
      // Check standard and vendor-prefixed properties
      const doc = document as any;
      const supported = !!(
          doc.fullscreenEnabled || 
          doc.webkitFullscreenEnabled || 
          doc.mozFullScreenEnabled || 
          doc.msFullscreenEnabled
      );
      setIsFullscreenSupported(supported);
      setIsFullscreen(!!doc.fullscreenElement || !!doc.webkitFullscreenElement || !!doc.mozFullScreenElement || !!doc.msFullscreenElement);
  }, []);

  // --- Event Handlers for Visor Interaction ---

  const handleDesktopClick = () => {
    if ('ontouchstart' in window) return;
    setIsSticky(prev => !prev);
    if (onVisorClick) onVisorClick();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 300) { // Double tap
        setIsSticky(prev => !prev);
        setIsHovering(false);
    } else { // Single tap
        if (!isSticky) {
            setIsHovering(true);
            hideTimerRef.current = window.setTimeout(() => {
                setIsHovering(false);
            }, 5000);
        }
    }
    
    // Explicit tutorial trigger for touch
    if (onVisorClick) onVisorClick();
    
    lastTapRef.current = now;
  };

  const handleMouseEnter = () => {
    if ('ontouchstart' in window) return;
    if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
    }
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if ('ontouchstart' in window) return;
     if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
        setIsHovering(false);
    }, 2000); // Hide after 2 seconds
  };
  
  // --- Handlers for Control Buttons ---

  const handleToggleMute = () => {
    playSound(SoundType.BUTTON_CLICK);
    toggleMute();
  };

  const handleToggleFullscreen = () => {
    playSound(SoundType.BUTTON_CLICK);
    if (onFullscreenClick) onFullscreenClick();
    
    const doc = document as any;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
      const elem = document.documentElement as any;
      const request = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
      if (request) {
          request.call(elem).catch((err: any) => {
            console.warn("Fullscreen failed", err);
          });
      }
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exit) {
        exit.call(doc);
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
        const doc = document as any;
        setIsFullscreen(!!doc.fullscreenElement || !!doc.webkitFullscreenElement || !!doc.mozFullScreenElement || !!doc.msFullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('mozfullscreenchange', onFullscreenChange);
        document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  return (
    <div className={`absolute top-0 left-0 right-0 pt-2 px-4 flex justify-between items-start text-2xl pointer-events-none ${isTutorialMode ? 'z-[65]' : 'z-50'}`}>
      
      {/* Left Controls Panel */}
      <div 
        className={`flex flex-col items-start gap-2 transition-all duration-300 pointer-events-auto bg-black/80 p-2 rounded border border-gray-700 ${highlightControls ? 'z-[70] ring-4 ring-yellow-400 relative' : ''}`}
        style={{
            animation: isHudVisible ? 'hud-glitch-in 0.3s forwards' : 'hud-glitch-out 0.3s forwards',
            opacity: isHudVisible ? 1 : 0,
            transformOrigin: 'top left',
            filter: (isTutorialMode && !highlightControls) ? 'brightness(0.3)' : 'none',
            pointerEvents: (isTutorialMode && !highlightControls) ? 'none' : 'auto'
        }}
      >
        {activeProfile && (
            <div className="flex flex-col items-start gap-2 mb-2">
                <div>SCORE: {sessionScore}</div>
                <div className="flex items-center gap-2">
                    {character === Character.SEXISM && (
                        <button onClick={activateArtistInsight} disabled={abilityUsedInCase} className={`pixel-button text-xl !p-2 ${abilityUsedInCase ? 'pixel-button-locked' : 'bg-blue-600'}`}>ИНСАЙТ</button>
                    )}
                    {character === Character.BLACK_PLAYER && (
                        <button onClick={activateFourthWall} disabled={abilityUsedInSession} className={`pixel-button text-xl !p-2 ${abilityUsedInSession ? 'pixel-button-locked' : 'bg-purple-700'}`}>СЛОМ</button>
                    )}
                    {character === Character.BLACK_PLAYER && activeProfile?.hasDadaToken && (
                        <button onClick={activateAbsurdEdge} disabled={absurdEdgeUsedInSession || screen !== GameScreen.MINIGAME_INTRO} className={`pixel-button text-xl !p-2 ${(absurdEdgeUsedInSession || screen !== GameScreen.MINIGAME_INTRO) ? 'pixel-button-locked' : 'bg-pink-600'}`} title={screen !== GameScreen.MINIGAME_INTRO ? "Можно использовать только перед началом сна" : "Активировать Грань Абсурда"}>ГРАНЬ</button>
                    )}
                </div>
            </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleToggleMute} className="pixel-button text-2xl !p-2" aria-label={isMuted ? "Включить звук" : "Выключить звук"} style={{textShadow: 'none'}}>{isMuted ? '🔇' : '🔊'}</button>
            {!isIOS && isFullscreenSupported && (
                <button onClick={handleToggleFullscreen} className={`pixel-button text-2xl !p-2 ${highlightFullscreen ? 'animate-bounce border-yellow-300' : ''}`} aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Войти в полноэкранный режим"} style={{textShadow: 'none'}}>{isFullscreen ? '↙️' : '↗️'}</button>
            )}
            <button onClick={() => showInstructionModal()} className="pixel-button text-2xl !p-2" aria-label="Показать информацию" style={{textShadow: 'none'}}>ℹ️</button>
            {/* Seasonal Toggle Button - Only visible during holidays */}
            {seasonalEvent !== SeasonalEvent.NONE && (
                <button 
                    onClick={toggleSeasonalAnimations} 
                    className="pixel-button text-2xl !p-2" 
                    title="Вкл/Выкл Праздник" 
                    style={{textShadow: 'none'}}
                >
                    {seasonalAnimationsEnabled ? '🎉' : '🚫'}
                </button>
            )}
            {activeProfile && <button onClick={() => requestLogout()} className="pixel-button text-2xl !p-2 bg-red-800" aria-label="Выйти в главное меню" style={{textShadow: 'none'}}>🚪</button>}
        </div>
        
        {/* Sensitivity Slider - Only visible in Shooter Minigame */}
        {isShooterGame && (
            <div className="flex flex-col w-full mt-2 border-t border-gray-600 pt-2 animate-[fadeIn_0.5s]">
                <label className="text-xs text-gray-400 mb-1">ЧУВСТВИТЕЛЬНОСТЬ</label>
                <input 
                    type="range" 
                    min="0.5" 
                    max="2.5" 
                    step="0.1" 
                    value={sensitivity} 
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
            </div>
        )}
      </div>
      
      {/* Visor Toggle Button */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 top-2 w-auto h-auto pointer-events-auto cursor-pointer flex items-center justify-center animate-pulse p-2 ${highlightVisor ? 'z-[70] bg-yellow-500/20 rounded-full ring-4 ring-yellow-400' : ''}`}
        onClick={handleDesktopClick}
        onTouchStart={handleTouchStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Показать/скрыть интерфейс"
        role="button"
        tabIndex={0}
        style={{
             filter: (isTutorialMode && !highlightVisor) ? 'brightness(0.3)' : 'none',
             pointerEvents: (isTutorialMode && !highlightVisor) ? 'none' : 'auto'
        }}
      >
        <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Right Stats Panel */}
      <div 
          className="flex flex-col items-end gap-3 transition-opacity duration-300"
          style={{ 
              opacity: isHudVisible ? 1 : 0,
              visibility: isTutorialMode ? 'hidden' : 'visible'
          }}
      >
        {activeProfile && (
            <div className="flex items-center">
                {Array.from({ length: lives }).map((_, i) => (
                    <span key={i} className="text-red-500 text-4xl leading-none ml-2">♥</span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
