
import React, { useEffect, useState } from 'react';
import { GameScreen, Character, SeasonalEvent } from './types';
import { GameProvider, useNavigation, useSession, useProfile, useSettings } from './src/context/GameContext';
import { MusicType, SoundType, startMusic, stopMusic, preloadMusic } from './src/utils/AudioEngine';

import { GameWrapper } from './src/components/core/GameWrapper';
import { HUD } from './src/components/core/HUD';
import { IntroScreen } from './src/components/core/IntroScreen';
import { OutroScreen } from './src/components/core/OutroScreen';
import { ConfirmationModal } from './src/components/core/ConfirmationModal';
import { GlitchWinScreen } from './src/components/core/GlitchWinScreen';
import { InstructionModal } from './src/components/core/InstructionModal';
import { SeasonalOverlay } from './src/components/core/SeasonalOverlay';
import { instructionData } from './src/data/instructionData';

import { ProfileSelectionScreen } from './src/components/screens/ProfileSelectionScreen';
import { LeaderboardScreen } from './src/components/screens/LeaderboardScreen';
import { StartScreen } from './src/components/screens/StartScreen';
import { CaseSelectionScreen } from './src/components/screens/CaseSelectionScreen';
import { FinalEnding } from './src/components/screens/FinalEnding';
import { DebugMenu } from './src/components/screens/DebugMenu';
import { LogView } from './src/components/screens/LogView';
import { DebugAnimationViewer } from './src/components/screens/DebugAnimationViewer';

import { minigameComponentMap } from './src/components/minigames';

// Helper to determine which music track to play for a given minigame
const getMusicForMinigame = (id: string): MusicType | null => {
    if (["1-1", "1-3"].includes(id)) return MusicType.AMBIENT_GALLERY;
    if (id === "1-2") return MusicType.AMBIENT_KVIR;
    if (id === "2-1") return MusicType.AMBIENT_DANCE;
    if (id === "2-3") return MusicType.AMBIENT_ZEN;
    if (id === "3-1") return MusicType.AMBIENT_STREET; // Peaceful street ambience
    if (id === "4-1") return MusicType.AMBIENT_FEMINIST_FIGHT; // Word builder bass
    if (id === "4-2") return MusicType.FIGHT_CLUB_THEME; // Aggressive Breakbeat for Fight Club
    if (id === "5-1") return MusicType.AMBIENT_KITCHEN; // Bubbles
    if (id === "5-2") return MusicType.ROMANTIC_DOBRO; // Cheesy romance
    if (id === "6-1") return MusicType.FRUIT_ARGUMENT; // Melodic puzzle
    if (id === "6-2") return MusicType.LOOP_VACUUM; // Modulated vacuum
    // 6-3 (Draniki) handles its own MP3 music internally in the component
    return null; 
}

// Function to get seasonal music type
const getSeasonalMusic = (event: SeasonalEvent): MusicType | null => {
    switch (event) {
        case SeasonalEvent.NEW_YEAR: return MusicType.SEASONAL_NEW_YEAR;
        case SeasonalEvent.APRIL_FOOLS: return MusicType.SEASONAL_APRIL_FOOLS;
        case SeasonalEvent.HALLOWEEN: return MusicType.SEASONAL_HALLOWEEN;
        case SeasonalEvent.DADA_BIRTHDAY: return MusicType.SEASONAL_DADA_BIRTHDAY;
        case SeasonalEvent.SEPTEMBER_3: return MusicType.SEASONAL_SEPTEMBER_3;
        case SeasonalEvent.GONDOLIER_DAY: return MusicType.SEASONAL_GONDOLIER;
        case SeasonalEvent.GLITCH_DAY: return MusicType.SEASONAL_GLITCH;
        case SeasonalEvent.POTATO_SALVATION: return MusicType.SEASONAL_POTATO;
        default: return null;
    }
}

// Component for the initial warning screen
const WarningScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const [canContinue, setCanContinue] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setCanContinue(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center border-4 border-white">
            <h1 className="text-4xl md:text-6xl text-red-600 font-bold mb-8 animate-pulse">ВНИМАНИЕ!</h1>
            <p className="text-xl md:text-2xl text-white mb-4">
                Эта игра содержит быстро меняющиеся изображения, вспышки света и абсурдные смыслы.
            </p>
            <p className="text-lg text-gray-400 mb-8">
                Если вы страдаете эпилепсией или отсутствием чувства юмора — проконсультируйтесь с врачом.
            </p>
            {canContinue ? (
                <button onClick={onContinue} className="pixel-button p-4 text-2xl animate-[fadeIn_0.5s]">
                    ПОНЯТНО
                </button>
            ) : (
                <p className="text-sm text-gray-600 animate-pulse">Загрузка реальности...</p>
            )}
        </div>
    );
};

// Simple Pause Overlay
const PauseOverlay: React.FC<{ onResume: () => void }> = ({ onResume }) => (
    <div className="absolute inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center backdrop-blur-sm">
        <h2 className="text-4xl text-yellow-300 mb-4 animate-pulse">ОСМЫСЛЕНИЕ</h2>
        <p className="text-xl text-gray-300 mb-8">(сон на паузе)</p>
        <button onClick={onResume} className="pixel-button p-4 text-2xl">
            ПОНЯТНО
        </button>
    </div>
);

// Component for the content of the initial welcome/general instructions modal.
const WelcomeInstructionContent: React.FC<{ character?: Character | null; isMinigameInverted?: boolean }> = () => (
    <>
        <p>Добро пожаловать в ДАДАШПИЛЬ!</p>
        <p className="mt-4">ЭТО ФАНТАЗМ, состоящий из серии сюрреалистических снов.</p>
        <p className="mt-4 text-yellow-300"><strong>Управление:</strong></p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Визор:</strong> Нажмите на три точки (•••) вверху экрана, чтобы закрепить/открепить интерфейс. На десктопе он также появляется при наведении.</li>
            <li><strong>Интерфейс:</strong> В левой части визора находятся кнопки управления:
                <ul className="list-disc list-inside ml-4">
                    <li><span className="text-2xl">🔊/🔇</span> - Включить/выключить звук.</li>
                    <li><span className="text-2xl">↗️/↙️</span> - Войти/выйти из полноэкранного режима.</li>
                    <li><span className="text-2xl">ℹ️</span> - Показать это окно или правила текущего сна.</li>
                    <li><span className="text-2xl">🚪</span> - Выйти в меню выбора профиля.</li>
                </ul>
            </li>
            <li><strong>Чувствительность:</strong> Ползунок в визоре регулирует скорость вращения в 3D-играх.</li>
        </ul>
        <p className="mt-4"><strong>СОВЕТ:</strong> Внимательно читайте правила перед каждой игрой.</p>
    </>
);

// Главный компонент приложения, который отвечает за отображение нужного экрана.
const App: React.FC = () => {
    // Получаем необходимые данные и функции из разделенных контекстов.
    const { screen, setScreen, isInstructionModalVisible, showInstructionModal, hideInstructionModal } = useNavigation();
    const { 
        currentCase, minigameIndex, winMinigame, loseMinigame, character,
        isSlowMo, isMinigameInverted, forcedOutro, isAbsurdEdgeBonusRound,
        isGlitchWin
    } = useSession();
    const { profileToDeleteId, profiles, confirmDeleteProfile, cancelDeleteProfile, isLogoutConfirmationVisible, confirmLogout, cancelLogout } = useProfile();
    const { debugMode, playSound, seasonalEvent, seasonalAnimationsEnabled, isPaused, setIsPaused } = useSettings();
    const [isInitialLaunch, setIsInitialLaunch] = useState(false);

    // Определяем текущую мини-игру и её компонент.
    const currentMinigame = currentCase?.minigames[minigameIndex];
    const MinigameComponent = currentMinigame ? minigameComponentMap[currentMinigame.id] : null;

    // Check for first launch to show welcome instructions
    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('dada-spiel-has-seen-welcome');
        if (!hasSeenWelcome) {
            setIsInitialLaunch(true);
            // Don't show immediately if we are on WARNING screen, handled in onContinue
        }
        
        // Start background music loading
        preloadMusic();
    }, []);

    // Управление фоновой музыкой
    useEffect(() => {
        if (screen === GameScreen.WARNING || isPaused) {
            // No music on warning or pause
            return;
        }

        if (screen === GameScreen.MINIGAME_PLAY && currentMinigame) {
            const musicType = getMusicForMinigame(currentMinigame.id);
            if (musicType !== null) {
                startMusic(musicType);
            } else {
                // Если тип не возвращен (например для DranikiShooter 6-3, который сам управляет музыкой), ничего не делаем или останавливаем старую
                if (currentMinigame.id !== "6-3") {
                    stopMusic();
                }
            }
        } else if (screen === GameScreen.PROFILE_SELECTION || screen === GameScreen.CASE_SELECTION || screen === GameScreen.LEADERBOARD) {
            const seasonalMusic = getSeasonalMusic(seasonalEvent);
            if (seasonalAnimationsEnabled && seasonalMusic !== null) {
                startMusic(seasonalMusic);
            } else {
                startMusic(MusicType.MENU);
            }
        } else {
            // Stop music on any other screen (intros, outros, etc.)
            stopMusic();
        }
    }, [screen, currentMinigame, seasonalEvent, seasonalAnimationsEnabled, isPaused]);
    
    const profilePendingDeletion = profiles.find(p => p.id === profileToDeleteId);

    const introWarning = isAbsurdEdgeBonusRound
        ? "ГРАНЬ АБСУРДА: ПРАВИЛА ИНВЕРТИРОВАНЫ! +2000 ОЧКОВ!"
        : isMinigameInverted
        ? "СДВИГ РЕАЛЬНОСТИ: ПРАВИЛА ИНВЕРТИРОВАНЫ!"
        : undefined;
    
    const InstructionContentComponent = currentMinigame ? instructionData[currentMinigame.id]?.content : WelcomeInstructionContent;
    const instructionTitle = currentMinigame ? instructionData[currentMinigame.id]?.title : "СООБЩЕНИЕ С ПРИВЕТОМ!";

    const handleWarningContinue = () => {
        playSound(SoundType.BUTTON_CLICK); // Initialize audio context
        setScreen(GameScreen.PROFILE_SELECTION);
        if (isInitialLaunch) {
            showInstructionModal();
        }
    };

    const renderScreen = () => {
        switch (screen) {
            case GameScreen.WARNING:
                return <WarningScreen onContinue={handleWarningContinue} />;
            case GameScreen.PROFILE_SELECTION:
                return <ProfileSelectionScreen />;
            case GameScreen.LEADERBOARD:
                return <LeaderboardScreen />;
            case GameScreen.START_SCREEN:
                return <StartScreen />;
            case GameScreen.CASE_SELECTION:
                return <CaseSelectionScreen />;
            case GameScreen.MINIGAME_INTRO:
                if (currentCase && currentMinigame) {
                    return (
                        <IntroScreen
                            title={currentMinigame.name}
                            text={currentMinigame.intro}
                            warning={introWarning}
                            onContinue={() => {
                                setScreen(GameScreen.MINIGAME_PLAY);
                                showInstructionModal();
                            }}
                        />
                    );
                }
                return null;
            case GameScreen.MINIGAME_PLAY:
                if (MinigameComponent) {
                    return (
                        <MinigameComponent 
                            onWin={winMinigame} 
                            onLose={loseMinigame} 
                            isSlowMo={isSlowMo}
                            isMinigameInverted={isMinigameInverted}
                        />
                    );
                }
                return null;
            case GameScreen.CASE_OUTRO:
                if (currentCase) {
                    return (
                        <OutroScreen
                            title="ФАЗА СНА ЗАВЕРШЕНА"
                            text={forcedOutro || currentCase.outro}
                            onContinue={() => setScreen(GameScreen.CASE_SELECTION)}
                        />
                    );
                }
                return null;
            case GameScreen.FINAL_ENDING:
                return <FinalEnding />;
            case GameScreen.DEBUG_MENU:
                return <DebugMenu />;
            case GameScreen.LOG_VIEW:
                return <LogView />;
            case GameScreen.DEBUG_ANIMATION_VIEWER:
                return <DebugAnimationViewer />;
            default:
                return null;
        }
    };

    // Apply global style overrides for certain events (like April Fools) only if enabled
    const containerStyle: React.CSSProperties = (seasonalAnimationsEnabled && seasonalEvent === SeasonalEvent.APRIL_FOOLS)
        ? { filter: 'grayscale(100%)', fontFamily: 'Arial, sans-serif' } 
        : {};

    return (
        <GameWrapper>
            <div style={containerStyle} className="w-full h-full relative">
                {screen !== GameScreen.WARNING && <HUD />}
                <SeasonalOverlay />
                
                {isPaused && <PauseOverlay onResume={() => {
                    // Force state update to remove overlay and resume logic
                    playSound(SoundType.GENERIC_CLICK); 
                    setIsPaused(false);
                }} />}

                <div key={screen} className="screen-content-wrapper">
                    {renderScreen()}
                </div>
                
                {isGlitchWin && <GlitchWinScreen />}

                {debugMode && screen !== GameScreen.DEBUG_MENU && screen !== GameScreen.DEBUG_ANIMATION_VIEWER && screen !== GameScreen.WARNING && (
                    <button
                        onClick={() => setScreen(GameScreen.DEBUG_MENU)}
                        className="absolute bottom-4 right-4 pixel-button p-2 text-sm z-50 bg-purple-700 hover:bg-purple-800"
                        aria-label="Открыть меню отладки"
                    >
                        АЛАДКИ
                    </button>
                )}

                {isInstructionModalVisible && !isLogoutConfirmationVisible && InstructionContentComponent && (
                    <InstructionModal
                        title={instructionTitle}
                        onStart={() => {
                            if (isInitialLaunch) {
                                localStorage.setItem('dada-spiel-has-seen-welcome', 'true');
                                setIsInitialLaunch(false);
                            }
                            hideInstructionModal();
                        }}
                    >
                        <InstructionContentComponent character={character} isMinigameInverted={isMinigameInverted} />
                    </InstructionModal>
                )}

                {profilePendingDeletion && (
                    <ConfirmationModal
                        title="ПОДТВЕРДИТЕ УДАДАЛЕНИЕ"
                        message={
                            <>
                                <p>Вы уверены, что хотите удалить профиль</p>
                                <p className="font-bold text-yellow-400 mt-2">"{profilePendingDeletion.name}"?</p>
                                <p className="mt-4 text-base text-gray-400">Это действие нельзя будет отменить.</p>
                            </>
                        }
                        onConfirm={() => {
                            playSound(SoundType.DESTROY);
                            confirmDeleteProfile();
                        }}
                        onCancel={() => {
                            playSound(SoundType.BUTTON_CLICK);
                            cancelDeleteProfile();
                        }}
                        confirmText="УДАЛИТЬ"
                    />
                )}

                {isLogoutConfirmationVisible && (
                    <ConfirmationModal
                        title="ВЫХОД"
                        message={
                            <>
                            <p>Вы уверены, что хотите выйти в главное меню?</p>
                            <p className="mt-4 text-base text-gray-400">Текущий прогресс сессии будет сохранён.</p>
                            </>
                        }
                        onConfirm={() => {
                            playSound(SoundType.BUTTON_CLICK);
                            confirmLogout();
                        }}
                        onCancel={() => {
                            playSound(SoundType.BUTTON_CLICK);
                            cancelLogout();
                        }}
                        confirmText="ВЫЙТИ"
                        confirmButtonClass="bg-blue-700 hover:bg-blue-800"
                    />
                )}
            </div>
        </GameWrapper>
    );
};

const AppWrapper: React.FC = () => (
    <GameProvider>
        <App />
    </GameProvider>
);

export default AppWrapper;