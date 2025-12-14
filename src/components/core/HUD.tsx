
import React, { useState, useEffect, useRef } from 'react';
import { useSession, useSettings, useProfile, useNavigation } from '../../context/GameContext';
import { playSound, SoundType } from '../../utils/AudioEngine';
import { Character, GameScreen, SeasonalEvent } from '../../../types';

export const HUD: React.FC = () => {
  const { 
    lives, sessionScore, character, activateArtistInsight, activateFourthWall,
    abilityUsedInCase, abilityUsedInSession, absurdEdgeUsedInSession, activateAbsurdEdge
  } = useSession();
  const { isMuted, toggleMute, seasonalEvent, seasonalAnimationsEnabled, toggleSeasonalAnimations, sensitivity, setSensitivity } = useSettings();
  const { activeProfile, requestLogout } = useProfile();
  const { screen, showInstructionModal } = useNavigation();

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  
  // States for HUD visibility
  const [isSticky, setIsSticky] = useState(false); // For permanent visibility toggle
  const [isHovering, setIsHovering] = useState(false); // For temporary visibility on hover/tap
  const isHudVisible = isSticky || isHovering;

  // Refs for interaction logic
  const hideTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  // --- Event Handlers for Visor Interaction ---

  const handleDesktopClick = () => {
    if ('ontouchstart' in window) return;
    setIsSticky(prev => !prev);
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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 pt-2 px-4 flex justify-between items-start text-2xl z-50 pointer-events-none">
      
      <div 
        className="flex flex-col items-start gap-2 transition-all duration-300 pointer-events-auto bg-black/80 p-2 rounded border border-gray-700"
        style={{
            animation: isHudVisible ? 'hud-glitch-in 0.3s forwards' : 'hud-glitch-out 0.3s forwards',
            opacity: isHudVisible ? 1 : 0,
            transformOrigin: 'top left'
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
            <button onClick={handleToggleFullscreen} className="pixel-button text-2xl !p-2" aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Войти в полноэкранный режим"} style={{textShadow: 'none'}}>{isFullscreen ? '↙️' : '↗️'}</button>
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
        
        {/* Sensitivity Slider */}
        <div className="flex flex-col w-full mt-2 border-t border-gray-600 pt-2">
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
      </div>
      
      <div 
        className="absolute left-1/2 -translate-x-1/2 top-2 w-auto h-auto pointer-events-auto cursor-pointer flex items-center justify-center animate-pulse p-2"
        onClick={handleDesktopClick}
        onTouchStart={handleTouchStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Показать/скрыть интерфейс"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      <div 
          className="flex flex-col items-end gap-3 transition-opacity duration-300"
          style={{ opacity: isHudVisible ? 1 : 0 }}
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