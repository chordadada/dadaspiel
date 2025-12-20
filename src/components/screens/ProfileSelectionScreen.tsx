import React, { useState, useRef } from 'react';
import { useProfile, useNavigation, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { Title } from '../core/Title';
import { SoundType } from '../../utils/AudioEngine';

export const ProfileSelectionScreen: React.FC = () => {
    const { profiles, selectProfile, deleteProfile } = useProfile();
    const { setScreen } = useNavigation();
    const { playSound, toggleDebug, debugMode } = useSettings();


    // State for debug mode easter egg
    const [titleClickCount, setTitleClickCount] = useState(0);
    const titleClickTimer = useRef<number | null>(null);

    const handleTitleClick = () => {
        playSound(SoundType.GENERIC_CLICK);
        if (titleClickTimer.current) {
            clearTimeout(titleClickTimer.current);
        }

        const newClickCount = titleClickCount + 1;
        setTitleClickCount(newClickCount);

        if (newClickCount >= 7) {
            toggleDebug();
            setTitleClickCount(0);
        } else {
            // Reset count if clicks are too slow (1.5s window)
            titleClickTimer.current = window.setTimeout(() => {
                setTitleClickCount(0);
            }, 1500);
        }
    };

    const handleNewGame = () => {
        playSound(SoundType.BUTTON_CLICK);
        setScreen(GameScreen.START_SCREEN);
    };

    const handleSelectProfile = (id: string) => {
        playSound(SoundType.BUTTON_CLICK);
        selectProfile(id);
    };
    
    const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the profile selection.
        playSound(SoundType.BUTTON_CLICK); // Play a sound to indicate the deletion process has started.
        deleteProfile(id);
    }
    
    const handleLeaderboard = () => {
        playSound(SoundType.BUTTON_CLICK);
        setScreen(GameScreen.LEADERBOARD);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <Title onTitleClick={handleTitleClick} />
            {debugMode && <p className="text-purple-400 mb-2 animate-pulse">РЕЖИМ АЛАДОК АКТИВИРОВАН</p>}
            <h2 className="text-2xl mb-6">ВЫБЕРИТЕ БИОЭКСПЕРИМЕНТ</h2>
            <div className="w-full max-w-md flex flex-col gap-4 mb-6 overflow-y-auto" style={{maxHeight: '40vh'}}>
                {profiles.length > 0 ? (
                    profiles.map(profile => (
                        <div key={profile.id} className="flex gap-2">
                             <button 
                                onClick={() => handleSelectProfile(profile.id)} 
                                className="pixel-button p-4 text-xl grow flex justify-between items-center"
                            >
                               <span>{profile.name}</span>
                               <span className="text-yellow-300">{profile.highScore}</span>
                            </button>
                             <button 
                                onClick={(e) => handleDeleteProfile(e, profile.id)}
                                className="pixel-button p-4 text-xl bg-red-700 hover:bg-red-800 shrink-0"
                                aria-label={`Удалить профиль ${profile.name}`}
                            >
                                X
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400">Профилей пока нет. Создайте новый!</p>
                )}
            </div>
            <div className="flex gap-4">
                 <button onClick={handleNewGame} className="pixel-button p-4 text-2xl">
                    Создать
                </button>
                 <button onClick={handleLeaderboard} className="pixel-button p-4 text-2xl bg-teal-700">
                    Рекорды
                </button>
            </div>
        </div>
    );
};