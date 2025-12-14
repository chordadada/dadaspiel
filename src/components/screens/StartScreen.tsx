
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
  const [pixelSize, setPixelSize] = useState(8); // Default to a larger size

  useEffect(() => {
    // Set the pixel size based on window width after the component mounts
    // to prevent hydration errors from direct window.innerWidth access in render.
    const handleResize = () => {
      setPixelSize(window.innerWidth < 768 ? 6 : 8);
    };
    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const completedChars = useMemo(() => new Set(profiles.filter(p => p.gameCompleted).map(p => p.character)), [profiles]);
  const isBlackPlayerUnlocked = completedChars.has(Character.KANILA) || completedChars.has(Character.SEXISM);

  const handlePrev = () => {
    playSound(SoundType.GENERIC_CLICK);
    setSelectedIndex(prev => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    playSound(SoundType.GENERIC_CLICK);
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
    <div className="relative w-full h-full overflow-hidden">
        {/* Background Layer: Static/Fixed Sky */}
        <div className="absolute inset-0 z-0">
            <DynamicSky showHorizon={false} />
        </div>

        {/* Content Layer: Scrolling Overlay */}
        <div className="absolute inset-0 z-10 overflow-y-auto">
            <div className="min-h-full w-full flex flex-col items-center justify-start p-4">
                <div className="text-center w-full flex-shrink-0">
                    <Title onTitleClick={() => {}}/>
                    <p className="mb-4 text-xl text-shadow-md">СОТВОРЕНИЕ БИОСУЩЕСТВА</p>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Введите имя..."
                      maxLength={16}
                      className="bg-gray-800/80 text-white p-2 text-center pixel-border w-64 text-lg backdrop-blur-sm"
                    />
                </div>

                <div className="flex flex-col md:flex-row w-full flex-grow items-stretch justify-center gap-4 md:gap-8 mt-4">
                    {/* Left Panel: Character Selector */}
                    <div className="w-full md:w-1/2 flex items-center justify-center gap-2 md:gap-4">
                        <button onClick={handlePrev} className="pixel-button text-4xl p-2 md:p-4 self-center">{'<'}</button>
                        
                        <div key={selectedIndex} className="text-center char-art-container flex flex-col items-center justify-center flex-grow">
                          <div className={`w-[128px] h-[205px] md:w-[160px] md:h-[256px] flex items-center justify-center ${isLocked ? 'opacity-50 filter grayscale' : 'drop-shadow-2xl'}`}>
                              {artData && <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={pixelSize} />}
                          </div>
                          <h3 className="text-xl md:text-2xl mt-2 md:mt-4 font-bold text-shadow-md">{currentCharData.name}</h3>
                        </div>

                        <button onClick={handleNext} className="pixel-button text-4xl p-2 md:p-4 self-center">{'>'}</button>
                    </div>

                    {/* Right Panel: Details */}
                    <div className="w-full md:w-1/2 mt-4 md:mt-0 flex flex-col justify-between p-4 md:p-6 bg-black/60 pixel-border backdrop-blur-sm">
                        <div key={selectedIndex} className="details-panel flex-grow overflow-y-auto pr-2">
                            {isLocked ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <p className="text-2xl md:text-3xl text-red-500">ЗАБЛОКИРОВАНО</p>
                                    <p className="mt-4 text-md md:text-lg text-gray-300">Пройдите игру за Канилу или Сексизма, чтобы разблокировать Чёрного Игрока.</p>
                                </div>
                            ) : (
                                <>
                                  <h4 className="text-xl md:text-2xl text-yellow-300 mb-4">{currentCharData.description}</h4>
                                  <ul className="space-y-3 text-md md:text-lg list-disc list-inside">
                                    {currentCharData.abilities.map((ability, i) => <li key={i}>{ability}</li>)}
                                  </ul>
                                  {currentCharData.name === Character.BLACK_PLAYER && <p className="mt-4 text-yellow-400">Бонус: пройдите игру за обоих других, чтобы получить Дада-Фишку!</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="flex gap-4 mt-8 justify-center pt-4 flex-shrink-0 pb-8">
                    <button onClick={handleBack} className="pixel-button p-3 md:p-4 text-xl md:text-2xl bg-gray-600">
                        НАЗАД
                    </button>
                    <button 
                      onClick={handleStartGame} 
                      disabled={!playerName.trim() || isLocked}
                      className={`pixel-button p-3 md:p-4 text-xl md:text-2xl ${(!playerName.trim() || isLocked) ? 'pixel-button-locked' : 'bg-green-700'}`}
                    >
                        ВПЕРЁД
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
