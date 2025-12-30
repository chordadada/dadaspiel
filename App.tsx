
import React, { useEffect, useState, useRef } from 'react';
import { GameScreen, Character, SeasonalEvent } from './types';
import { GameProvider, useNavigation, useSession, useProfile, useSettings } from './src/context/GameContext';
import { MusicType, SoundType, startMusic, stopMusic, preloadMusic } from './src/utils/AudioEngine';
import { useIsMobile } from './src/hooks/useIsMobile';

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
import { AboutProjectScreen } from './src/components/screens/AboutProjectScreen';

import { minigameComponentMap } from './src/components/minigames';

// Helper to determine which music track to play for a given minigame
const getMusicForMinigame = (id: string): MusicType | null => {
    if (["1-1", "1-3"].includes(id)) return MusicType.AMBIENT_GALLERY;
    if (id === "1-2") return MusicType.AMBIENT_KVIR;
    if (id === "2-1") return MusicType.AMBIENT_DANCE;
    if (id === "2-2") return MusicType.ROMANTIC_DOBRO; // Kiss of Dobro (Moved from 5-2)
    if (id === "3-1") return MusicType.AMBIENT_STREET; // Peaceful street ambience
    if (id === "4-1") return MusicType.AMBIENT_FEMINIST_FIGHT; // Word builder bass
    if (id === "4-2") return MusicType.FIGHT_CLUB_THEME; // Aggressive Breakbeat for Fight Club
    if (id === "5-1") return MusicType.AMBIENT_KITCHEN; // Bubbles
    if (id === "5-2") return MusicType.AMBIENT_ZEN; // Dada Compliment (Moved from 2-3)
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

// Tutorial State Enum
enum TutorialStep {
    NONE = 0,
    VISOR = 1,
    FULLSCREEN = 2,
    CONTROLS = 3,
    WARNING = 4,
    IOS_NOTE = 5, // New step for iPhone users
    FINAL_TIP = 6
}

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
const WelcomeInstructionContent: React.FC<{ character?: Character | null; isMinigameInverted?: boolean; seasonalEvent?: SeasonalEvent }> = ({ seasonalEvent }) => {
    const { isIOS } = useIsMobile();
    
    return (
        <>
            <p className="mt-4">ЭТО ФАНТАЗМ, состоящий из серии сюрреалистических снов.</p>
            <p className="mt-4 text-yellow-300"><strong>Управление:</strong></p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Визор:</strong> Нажмите на три точки (•••) вверху экрана, чтобы закрепить/открепить интерфейс. На десктопе он также появляется при наведении.</li>
                <li><strong>Интерфейс:</strong> В левой части визора находятся кнопки управления:
                    <ul className="list-disc list-inside ml-4">
                        <li><span className="text-2xl">🔊/🔇</span> - Включить/выключить звук.</li>
                        {!isIOS && (
                            <li><span className="text-2xl">↗️/↙️</span> - Войти/выйти из полноэкранного режима.</li>
                        )}
                        <li><span className="text-2xl">ℹ️</span> - Показать это окно или правила текущего сна.</li>
                        <li><span className="text-2xl">🚪</span> - Выйти в меню выбора профиля.</li>
                        {seasonalEvent && seasonalEvent !== SeasonalEvent.NONE && (
                            <li><span className="text-2xl">🎉</span> - Вкл/Выкл праздничное оформление.</li>
                        )}
                    </ul>
                </li>
            </ul>
            <p className="mt-4"><strong>СОВЕТ:</strong> Внимательно читайте правила перед каждой игрой.</p>
        </>
    );
};

// Component for the Tutorial Overlay
const TutorialOverlay: React.FC<{ step: TutorialStep; onNext: () => void; seasonalEvent: SeasonalEvent }> = ({ step, onNext, seasonalEvent }) => {
    const [canContinue, setCanContinue] = useState(false);
    const { isMobile } = useIsMobile();

    useEffect(() => {
        setCanContinue(false);
        if (step === TutorialStep.WARNING) {
            const timer = setTimeout(() => setCanContinue(true), 3000);
            return () => clearTimeout(timer);
        } else {
            setCanContinue(true);
        }
    }, [step]);

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center text-center p-4 animate-[fadeIn_0.3s]">
            {step === TutorialStep.VISOR && (
                <>
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 text-6xl animate-bounce text-yellow-300">⬆️</div>
                    <div className="mt-20 bg-black/80 p-6 pixel-border max-w-md">
                        <h3 className="text-2xl text-yellow-300 mb-2">ЭТО ВИЗОР</h3>
                        <p className="text-xl">
                            {isMobile 
                                ? "Нажми на три точки сверху, чтобы показать/скрыть меню игры." 
                                : "Наведи курсор на три точки сверху, чтобы увидеть меню."}
                        </p>
                    </div>
                </>
            )}

            {step === TutorialStep.FULLSCREEN && (
                <>
                    <div className="mt-20 bg-black/80 p-6 pixel-border max-w-md">
                        <h3 className="text-2xl text-yellow-300 mb-2">ПОГРУЖЕНИЕ</h3>
                        <p className="text-xl">Нажми кнопку ↗️, чтобы развернуть игру на весь экран.</p>
                    </div>
                </>
            )}

            {step === TutorialStep.CONTROLS && (
                <div className="bg-black p-6 pixel-border max-w-lg">
                    <h3 className="text-3xl text-yellow-300 mb-6">УПРАВЛЕНИЕ</h3>
                    <div className="space-y-4 text-left text-lg">
                        <p><span className="text-2xl">🔊</span> — Вкл/Выкл звук.</p>
                        <p><span className="text-2xl">ℹ️</span> — Описание текущего сна.</p>
                        <p><span className="text-2xl">🚪</span> — Выход в меню персонажей.</p>
                        {seasonalEvent !== SeasonalEvent.NONE && (
                            <p><span className="text-2xl">🎉</span> — Вкл/Выкл праздничное оформление.</p>
                        )}
                    </div>
                    <button onClick={onNext} className="pixel-button p-3 text-xl mt-8 w-full bg-blue-700">
                        ДАЛЬШЕ
                    </button>
                </div>
            )}

            {step === TutorialStep.WARNING && (
                <div className="bg-red-900/90 p-8 pixel-border max-w-2xl border-red-500">
                    <h1 className="text-4xl md:text-5xl text-white font-bold mb-6 animate-pulse">ВНИМАНИЕ!</h1>
                    <p className="text-xl md:text-2xl text-white mb-4">
                        Эта игра содержит быстро меняющиеся изображения, вспышки света и абсурдные смыслы.
                    </p>
                    <p className="text-lg text-gray-300 mb-8">
                        Если вы страдаете эпилепсией или отсутствием чувства юмора — проконсультируйтесь с врачом.
                    </p>
                    {canContinue ? (
                        <button onClick={onNext} className="pixel-button p-4 text-2xl w-full bg-white text-black hover:bg-gray-200">
                            ПОНЯТНО
                        </button>
                    ) : (
                        <p className="text-sm text-gray-400 animate-pulse">Загрузка реальности...</p>
                    )}
                </div>
            )}

            {step === TutorialStep.IOS_NOTE && (
                <div className="bg-slate-800 p-8 pixel-border max-w-lg border-blue-400">
                    <h3 className="text-3xl text-yellow-300 mb-4">APPLE? СОБОЛЕЗНУЕМ.</h3>
                    <p className="text-xl mb-4">
                        К сожалению, iPhone не дружит с полноэкранным режимом в браузере.
                    </p>
                    <p className="text-lg text-gray-300 mb-6">
                        Мы адаптировали игру под квадратный формат, чтобы вам не пришлось вращать телефон, но для полного Дада-Экстаза рекомендуем <strong>Android</strong> или <strong>ПК</strong>.
                    </p>
                    <button onClick={onNext} className="pixel-button p-3 text-xl w-full bg-blue-600 hover:bg-blue-500">
                        ПРИНЯТЬ СУДЬБУ
                    </button>
                </div>
            )}

            {step === TutorialStep.FINAL_TIP && (
                <div className="bg-green-900/90 p-8 pixel-border max-w-lg">
                    <h3 className="text-3xl text-yellow-300 mb-4">ПОСЛЕДНИЙ СОВЕТ</h3>
                    <p className="text-2xl mb-8">Внимательно читайте правила перед каждым сном!</p>
                    <button onClick={onNext} className="pixel-button p-4 text-3xl w-full bg-yellow-500 text-black hover:bg-yellow-400">
                        ИГРАТЬ
                    </button>
                </div>
            )}
        </div>
    );
};

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
    const { debugMode, playSound, seasonalEvent, seasonalAnimationsEnabled, isPaused, setIsPaused, sensitivityTutorial } = useSettings();
    const { isIOS, isMobile } = useIsMobile();
    const [isInitialLaunch, setIsInitialLaunch] = useState(false);
    
    // Tutorial State
    const [tutorialStep, setTutorialStep] = useState<TutorialStep>(TutorialStep.NONE);

    // Определяем текущую мини-игру и её компонент.
    const currentMinigame = currentCase?.minigames[minigameIndex];
    const MinigameComponent = currentMinigame ? minigameComponentMap[currentMinigame.id] : null;

    // Check for first launch / Tutorial logic
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('dada-spiel-tutorial-complete');
        
        if (!hasSeenTutorial) {
            setTutorialStep(TutorialStep.VISOR);
        } else {
            // Returning user: Skip everything, go straight to menu
            setTutorialStep(TutorialStep.NONE);
        }
        
        // We set screen to PROFILE_SELECTION initially via Context default or below,
        // but the overlay will block interaction if tutorialStep is not NONE.
        setScreen(GameScreen.PROFILE_SELECTION);
        
        // Start background music loading
        preloadMusic();
    }, []); // Run once on mount

    const advanceTutorial = () => {
        playSound(SoundType.BUTTON_CLICK);
        if (tutorialStep === TutorialStep.VISOR) {
            // Check full screen support to decide if we should skip the FULLSCREEN step
            // On iOS, fullscreen API is practically non-existent for web apps in browser, so skip it.
            const doc = document as any;
            const isFullscreenSupported = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled || doc.mozFullScreenEnabled || doc.msFullscreenEnabled);
            
            if (isIOS) {
                setTutorialStep(TutorialStep.CONTROLS); // Skip fullscreen on iOS
            } else {
                setTutorialStep(isFullscreenSupported ? TutorialStep.FULLSCREEN : TutorialStep.CONTROLS);
            }
        }
        else if (tutorialStep === TutorialStep.FULLSCREEN) setTutorialStep(TutorialStep.CONTROLS);
        else if (tutorialStep === TutorialStep.CONTROLS) setTutorialStep(TutorialStep.WARNING);
        else if (tutorialStep === TutorialStep.WARNING) {
            // If iOS, show the special note, otherwise go to final tip
            if (isIOS) {
                setTutorialStep(TutorialStep.IOS_NOTE);
            } else {
                setTutorialStep(TutorialStep.FINAL_TIP);
            }
        }
        else if (tutorialStep === TutorialStep.IOS_NOTE) setTutorialStep(TutorialStep.FINAL_TIP);
        else if (tutorialStep === TutorialStep.FINAL_TIP) {
            setTutorialStep(TutorialStep.NONE);
            localStorage.setItem('dada-spiel-tutorial-complete', 'true');
        }
    };

    // Управление фоновой музыкой
    useEffect(() => {
        if (isPaused || tutorialStep === TutorialStep.WARNING) { // Silence on warning
            return;
        }

        // Music logic
        if (screen === GameScreen.MINIGAME_PLAY && currentMinigame) {
            const musicType = getMusicForMinigame(currentMinigame.id);
            if (musicType !== null) startMusic(musicType);
            else if (currentMinigame.id !== "6-3") stopMusic();
        } else if (screen === GameScreen.PROFILE_SELECTION || screen === GameScreen.CASE_SELECTION || screen === GameScreen.LEADERBOARD || screen === GameScreen.ABOUT_PROJECT) {
            const seasonalMusic = getSeasonalMusic(seasonalEvent);
            // Prevent holiday music from playing during the tutorial
            if (seasonalAnimationsEnabled && seasonalMusic !== null && tutorialStep === TutorialStep.NONE) {
                startMusic(seasonalMusic);
            } else {
                startMusic(MusicType.MENU);
            }
        } else {
            stopMusic();
        }
    }, [screen, currentMinigame, seasonalEvent, seasonalAnimationsEnabled, isPaused, tutorialStep]);
    
    const profilePendingDeletion = profiles.find(p => p.id === profileToDeleteId);

    const introWarning = isAbsurdEdgeBonusRound
        ? "ГРАНЬ АБСУРДА: ПРАВИЛА ИНВЕРТИРОВАНЫ! +2000 ОЧКОВ!"
        : isMinigameInverted
        ? "СДВИГ РЕАЛЬНОСТИ: ПРАВИЛА ИНВЕРТИРОВАНЫ!"
        : undefined;
    
    const InstructionContentComponent = currentMinigame ? instructionData[currentMinigame.id]?.content : WelcomeInstructionContent;
    const instructionTitle = currentMinigame ? instructionData[currentMinigame.id]?.title : "Добро пожаловать в ДАДАШПИЛЬ!";

    // Apply global style overrides for certain events (like April Fools) only if enabled and NOT in a minigame
    const containerStyle: React.CSSProperties = (seasonalAnimationsEnabled && seasonalEvent === SeasonalEvent.APRIL_FOOLS && tutorialStep === TutorialStep.NONE && screen !== GameScreen.MINIGAME_PLAY)
        ? { filter: 'grayscale(100%)', fontFamily: 'Arial, sans-serif' } 
        : {};

    const renderScreen = () => {
        switch (screen) {
            case GameScreen.WARNING:
                // Warning is now handled by TutorialOverlay, but if accessed directly:
                return <div className="bg-black w-full h-full"></div>; 
            case GameScreen.PROFILE_SELECTION:
                return <ProfileSelectionScreen />;
            case GameScreen.LEADERBOARD:
                return <LeaderboardScreen />;
            case GameScreen.ABOUT_PROJECT:
                return <AboutProjectScreen />;
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

    return (
        <GameWrapper>
            <div style={containerStyle} className="w-full h-full relative">
                {screen !== GameScreen.WARNING && (
                    <HUD 
                        highlightVisor={tutorialStep === TutorialStep.VISOR}
                        highlightControls={tutorialStep === TutorialStep.FULLSCREEN || tutorialStep === TutorialStep.CONTROLS}
                        highlightFullscreen={tutorialStep === TutorialStep.FULLSCREEN}
                        onVisorClick={() => {
                            if (isMobile && tutorialStep === TutorialStep.VISOR) advanceTutorial();
                        }}
                        onVisorMouseEnter={() => {
                            if (!isMobile && tutorialStep === TutorialStep.VISOR) advanceTutorial();
                        }}
                        onFullscreenClick={() => {
                            if (tutorialStep === TutorialStep.FULLSCREEN) advanceTutorial();
                        }}
                    />
                )}
                
                {/* Seasonal effects restricted to menu screens only */}
                {tutorialStep === TutorialStep.NONE && screen !== GameScreen.MINIGAME_PLAY && <SeasonalOverlay />}
                
                {isPaused && <PauseOverlay onResume={() => {
                    playSound(SoundType.GENERIC_CLICK); 
                    setIsPaused(false);
                }} />}

                {/* Tutorial Overlay handles the onboarding flow */}
                {tutorialStep !== TutorialStep.NONE && (
                    <TutorialOverlay step={tutorialStep} onNext={advanceTutorial} seasonalEvent={seasonalEvent} />
                )}

                <div key={screen} className="screen-content-wrapper">
                    {renderScreen()}
                </div>
                
                {isGlitchWin && <GlitchWinScreen />}

                {debugMode && screen !== GameScreen.DEBUG_MENU && screen !== GameScreen.DEBUG_ANIMATION_VIEWER && tutorialStep === TutorialStep.NONE && (
                    <button
                        onClick={() => setScreen(GameScreen.DEBUG_MENU)}
                        className="absolute bottom-4 right-4 pixel-button p-2 text-sm z-50 bg-purple-700 hover:bg-purple-800"
                        aria-label="Открыть меню отладки"
                    >
                        АЛАДКИ
                    </button>
                )}

                {isInstructionModalVisible && !isLogoutConfirmationVisible && InstructionContentComponent && tutorialStep === TutorialStep.NONE && (
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
                        <InstructionContentComponent 
                            character={character} 
                            isMinigameInverted={isMinigameInverted} 
                            seasonalEvent={seasonalEvent} 
                            isSensitivityTutorialActive={sensitivityTutorial}
                        />
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
