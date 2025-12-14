
import React, { useState, useMemo, useEffect } from 'react';
import { useProfile, useNavigation, useSettings } from '../../context/GameContext';
import { CHARACTERS } from '../../data/characterData';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { Title } from '../core/Title';
import { Character, GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';
import { DynamicSky } from '../core/DynamicSky';

export const StartScreen: React.FC = () => {
  const { createProfile, profiles } = useProfile();
  const { setScreen } = useNavigation();
  const { playSound } = useSettings();
  
  const [playerName, setPlayerName] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pixelSize, setPixelSize] = useState(3);
  const [swipeAnim, setSwipeAnim] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      // Адаптивный размер пикселя
      if (h < 800 || w < 600) setPixelSize(4);
      else setPixelSize(5);
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const completedChars = useMemo(() => new Set(profiles.filter(p => p.gameCompleted).map(p => p.character)), [profiles]);
  const isBlackPlayerUnlocked = completedChars.has(Character.KANILA) || completedChars.has(Character.SEXISM);

  const triggerSwipeAnim = () => {
      setSwipeAnim(true);
      setTimeout(() => setSwipeAnim(false), 300);
  };

  const handlePrev = () => {
    playSound(SoundType.GENERIC_CLICK);
    triggerSwipeAnim();
    setSelectedIndex(prev => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    playSound(SoundType.GENERIC_CLICK);
    triggerSwipeAnim();
    setSelectedIndex(prev => (prev === CHARACTERS.length - 1 ? 0 : prev + 1));
  };
  
  const currentCharData = CHARACTERS[selectedIndex];
  const isLocked = currentCharData.name === Character.BLACK_PLAYER && !isBlackPlayerUnlocked;
  const artData = CHARACTER_ART_MAP[currentCharData.name];

  const handleStartGame = () => {
    if (playerName.trim() && !isLocked) {
        playSound(SoundType.BUTTON_CLICK);
        createProfile(playerName.trim(), currentCharData.name);
    }
  };

  const handleBack = () => {
      playSound(SoundType.BUTTON_CLICK);
      setScreen(GameScreen.PROFILE_SELECTION);
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
        <style>{`
            @keyframes pixel-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
            }
            .animate-pixel-float {
                animation: pixel-float 3s ease-in-out infinite;
            }
        `}</style>

        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
            <DynamicSky showHorizon={false} />
        </div>

        {/* Main Layout Container */}
        <div className="absolute inset-0 z-10 flex flex-col pt-14 pb-4 px-2 md:px-4 max-w-7xl mx-auto h-full justify-between">
            
            {/* --- HEADER SECTION --- */}
            <div className="shrink-0 flex flex-col items-center w-full relative z-20">
                <div className="transform scale-50 md:scale-75 origin-top h-16 md:h-24 flex items-center justify-center -mt-2">
                    <Title onTitleClick={() => {}}/>
                </div>
            </div>

            {/* --- MAIN CONTENT SPLIT --- */}
            {/* Horizontal Layout enforced */}
            <div className="flex-1 min-h-0 w-full flex flex-row gap-4 md:gap-6 items-stretch justify-center py-1 overflow-hidden">
                
                {/* LEFT PANEL: Controls (Name, Avatar, Type) */}
                <div className="flex flex-col items-center w-[40%] md:w-[35%] bg-black/40 border-2 border-gray-700 rounded-lg p-2 gap-2 shrink-0 backdrop-blur-sm shadow-xl relative">
                    
                    {/* Input Group */}
                    <div className="w-full flex flex-col items-center gap-2 shrink-0">
                        <span className="text-m md:text-m text-yellow-500 font-bold uppercase tracking-widest text-shadow-sm">БИОСУЩЕСТВО</span>
                        <input 
                          type="text" 
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="ИМЯ..."
                          maxLength={14}
                          className="bg-black/60 text-white p-2 text-center border-b-2 border-gray-500 w-full text-m md:text-lg focus:outline-none focus:border-yellow-400 placeholder-gray-500 transition-colors uppercase font-bold"
                        />
                    </div>

                    {/* Character Visuals & Arrows */}
                    <div className="flex-1 flex items-center justify-center w-full relative min-h-0">
                        {/* Compact Arrows Overlay */}
                        <button 
                            onClick={handlePrev} 
                            className="absolute left-[-12px] md:left-0 z-10 p-2 text-white/50 hover:text-white hover:scale-125 transition-all text-3xl md:text-4xl font-black drop-shadow-md active:scale-95"
                        >
                            {'<'}
                        </button>
                        
                        <div className="relative group mx-auto">
                          <div className={`transition-all duration-300 ${isLocked ? 'opacity-50 filter grayscale blur-[1px]' : 'drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]'} ${swipeAnim ? 'scale-90 opacity-50' : 'scale-100 animate-pixel-float'}`}>
                              <div style={{ width: pixelSize * 20, height: pixelSize * 30 }} className="flex items-center justify-center">
                                  {artData && <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={pixelSize} />}
                              </div>
                          </div>
                          {isLocked && <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">🔒</div>}
                        </div>

                        <button 
                            onClick={handleNext} 
                            className="absolute right-[-12px] md:right-0 z-10 p-2 text-white/50 hover:text-white hover:scale-125 transition-all text-3xl md:text-4xl font-black drop-shadow-md active:scale-95"
                        >
                            {'>'}
                        </button>
                    </div>

                    {/* Character Name Label */}
                    <div className="bg-black/60 px-1 py-2 rounded border border-gray-600 w-full text-center mt-auto shrink-0">
                        <h3 className="text-lg md:text-xl font-black text-yellow-300 leading-none break-words tracking-tight">
                            {currentCharData.name}
                        </h3>
                    </div>
                </div>

                {/* RIGHT PANEL: Info (Description) */}
                <div className="flex flex-col flex-1 bg-black/60 pixel-border backdrop-blur-md overflow-hidden relative min-w-0">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-3 md:space-y-4">
                        {isLocked ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
                                <span className="text-5xl">🚫</span>
                                <p className="text-m md:text-base font-bold">БИОВИД НЕДОСТУПЕН</p>
                                <p className="text-sm md:text-m opacity-70">Завершите симуляцию за Канилу или Сексизма для разблокировки.</p>
                            </div>
                        ) : (
                            <>
                                <div className="border-b border-gray-600 pb-2">
                                    <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider block mb-1">АРХЕТИП</span>
                                    <p className="text-l md:text-lg text-white font-bold leading-tight shadow-black drop-shadow-md">
                                        {currentCharData.description}
                                    </p>
                                </div>
                                
                                <div>
                                    <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider block mb-1">ОСОБЕННОСТИ</span>
                                    <ul className="space-y-2">
                                        {currentCharData.abilities.map((ability, i) => (
                                            <li key={i} className="text-[11px] md:text-sm text-gray-300 flex items-start gap-3 bg-white/5 p-1.5 rounded border border-white/10">
                                                <span className="text-yellow-500 mt-[2px] text-[10px] shrink-0">●</span>
                                                <span className="leading-tight">{ability}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {currentCharData.name === Character.BLACK_PLAYER && (
                                    <div className="mt-auto pt-2 border-t border-purple-500/30">
                                        <p className="text-[10px] text-purple-400 italic">
                                            * Внимание: Нестабильная сущность. Возможны разрывы ткани игры.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- FOOTER SECTION --- */}
            <div className="shrink-0 w-full flex justify-center gap-3 md:gap-4 mt-2 mb-safe">
                <button 
                    onClick={handleBack} 
                    className="pixel-button flex-1 md:flex-none px-2 py-3 md:px-8 text-m md:text-lg bg-gray-600 hover:bg-gray-500 min-w-[100px]"
                >
                    НАЗАД
                </button>
                <button 
                  onClick={handleStartGame} 
                  disabled={!playerName.trim() || isLocked}
                  className={`pixel-button flex-1 md:flex-none px-2 py-3 md:px-8 text-m md:text-lg transition-all min-w-[120px]
                    ${(!playerName.trim() || isLocked) 
                        ? 'pixel-button-locked opacity-50 cursor-not-allowed' 
                        : 'bg-green-700 hover:bg-green-600 animate-pulse shadow-[0_0_15px_rgba(0,255,0,0.4)]'
                    }`}
                >
                    ИГРАТЬ
                </button>
            </div>

        </div>
    </div>
  );
};
