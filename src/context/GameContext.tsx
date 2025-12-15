
import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo, useRef } from 'react';
import { GameScreen, Character, CaseData, LogEntry, PlayerProfile, SeasonalEvent } from '../../types';
import { CASES } from '../data/caseData';
import { playSound as playSoundUtil, toggleMuteState, getMuteState, SoundType, stopMusic } from '../utils/AudioEngine';
import { MINIGAME_VIDEO_MAP } from '../data/videoData';

// --- Type Definitions for each Context ---

interface NavigationContextType {
    screen: GameScreen;
    setScreen: (screen: GameScreen) => void;
    animationToView: string | null;
    setAnimationToView: (id: string | null) => void;
    jumpToMinigame: (id: string) => void;
    isInstructionModalVisible: boolean;
    showInstructionModal: () => void;
    hideInstructionModal: () => void;
}

interface SettingsContextType {
    debugMode: boolean;
    toggleDebug: () => void;
    isLogging: boolean;
    toggleLogging: () => void;
    setIsLogging: (logging: boolean) => void;
    log: LogEntry[];
    logEvent: (message: string) => void;
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: SoundType) => void;
    debugCharacter: Character | null;
    setDebugCharacter: (character: Character | null) => void;
    seasonalEvent: SeasonalEvent;
    setSeasonalEvent: (event: SeasonalEvent) => void;
    seasonalAnimationsEnabled: boolean;
    toggleSeasonalAnimations: () => void;
    seasonalMessage: string | null;
    sensitivity: number;
    setSensitivity: (val: number) => void;
    sensitivityTutorial: boolean;
    setSensitivityTutorial: (active: boolean) => void;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
}

interface ProfileContextType {
    profiles: PlayerProfile[];
    activeProfile: PlayerProfile | null;
    profileToDeleteId: string | null;
    createProfile: (name: string, character: Character) => void;
    selectProfile: (profileId: string) => void;
    deleteProfile: (profileId: string) => void;
    confirmDeleteProfile: () => void;
    cancelDeleteProfile: () => void;
    requestLogout: () => void;
    dynamicCases: CaseData[];
    isLogoutConfirmationVisible: boolean;
    confirmLogout: () => void;
    cancelLogout: () => void;
    unlockAllLevels: () => void;
}

interface SessionContextType {
    character: Character | null;
    currentCase: CaseData | null;
    minigameIndex: number;
    lives: number;
    sessionScore: number;
    isSlowMo: boolean;
    isMinigameInverted: boolean;
    abilityUsedInCase: boolean;
    abilityUsedInSession: boolean;
    forcedOutro: string | null;
    absurdEdgeUsedInSession: boolean;
    isAbsurdEdgeBonusRound: boolean;
    isGlitchWin: boolean;
    glitchWinVideoUrl: string | null;
    startCase: (caseId: number) => void;
    winMinigame: () => void;
    loseMinigame: () => void;
    killPlayer: () => void;
    addLife: (amount?: number) => void;
    addScore: (points: number) => void;
    activateArtistInsight: () => void;
    activateFourthWall: () => void;
    handleMistake: () => boolean;
    activateAbsurdEdge: () => void;
    proceedAfterGlitchWin: () => void;
}


// --- Create Contexts ---
const NavigationContext = createContext<NavigationContextType | null>(null);
const SettingsContext = createContext<SettingsContextType | null>(null);
const ProfileContext = createContext<ProfileContextType | null>(null);
const SessionContext = createContext<SessionContextType | null>(null);

// --- Custom Hooks for easy access ---
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within a GameProvider");
  return context;
};
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a GameProvider");
  return context;
};
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within a GameProvider");
  return context;
};
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a GameProvider");
  return context;
};

const PROFILES_STORAGE_KEY = 'dada-spiel-profiles';

const saveProfilesToStorage = (profilesToSave: PlayerProfile[]) => {
    try {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profilesToSave));
    } catch (error) {
        console.error("Failed to save profiles to localStorage:", error);
    }
};

// Robust UUID generator
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- MANUAL OVERRIDE FOR TESTING HOLIDAYS ---
const FORCE_HOLIDAY_TEST = false; 

// Helper to calculate seasonal event
const getSeasonalEvent = (): SeasonalEvent => {
    if (FORCE_HOLIDAY_TEST) return SeasonalEvent.DADA_BIRTHDAY;

    const today = new Date();
    const month = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    const date = today.getDate();

    // 3 Сентября
    if (month === 8 && date === 3) return SeasonalEvent.SEPTEMBER_3;

    // Новый Год (с 20 дек по 5 янв)
    if ((month === 11 && date >= 20) || (month === 0 && date <= 5)) return SeasonalEvent.NEW_YEAR;

    // День Рождения Дада (2 августа) - выбрано специально для контраста
    if (month === 7 && date === 2) return SeasonalEvent.DADA_BIRTHDAY;

    // 1 Апреля
    if (month === 3 && date === 1) return SeasonalEvent.APRIL_FOOLS;

    // Хэллоуин (30 окт - 1 ноя)
    if (month === 9 && date >= 30 || (month === 10 && date === 1)) return SeasonalEvent.HALLOWEEN;

    // День Гондольера (4 марта)
    if (month === 2 && date === 4) return SeasonalEvent.GONDOLIER_DAY;

    // День Глюка (29 мая)
    if (month === 4 && date === 29) return SeasonalEvent.GLITCH_DAY;

    // День Драников (12 февраля)
    if (month === 1 && date === 12) return SeasonalEvent.POTATO_SALVATION;

    return SeasonalEvent.NONE;
};

const MESSAGES_BY_EVENT: Partial<Record<SeasonalEvent, string[]>> = {
    [SeasonalEvent.NEW_YEAR]: ["Салат в помощь!", "С Новым Гадом!", "Мандарины - это ложь.", "Оливье с майонезом судьбы."],
    [SeasonalEvent.APRIL_FOOLS]: ["Вам повестка.", "Это не шутка.", "Смех продлевает срок.", "Заполните форму 2-НДФЛ."],
    [SeasonalEvent.HALLOWEEN]: ["Ипотека близко...", "Бу!", "Жизнь - это ужас.", "Твоя спина белая (от страха)."],
    [SeasonalEvent.DADA_BIRTHDAY]: ["Фонтаны для купания!", "Внезапный Дада Вопрос!", "Няшность спасет мир!", "Любовь, голуби и кирпичи.", "Розовый - новый камуфляж.", "Make DADA not WAR."],
    [SeasonalEvent.SEPTEMBER_3]: ["Я календарь...", "...переверну!", "Костры рябин горят.", "Всё не то, всё не так."],
    [SeasonalEvent.GONDOLIER_DAY]: ["ЯМы Гондольер", "Не раскачивай лодку!", "Греби отсюда.", "Полосатый рейс.", "Венеция тонет, а мы нет."],
    [SeasonalEvent.GLITCH_DAY]: ["ERROR 404: REALITY NOT FOUND", "undefined is not a function", "CSS is awesome", "Wake up, Neo...", "01000100 01000001", "Сбой в матрице."],
    [SeasonalEvent.POTATO_SALVATION]: ["Слава Крахмалу!", "Вся власть драникам!", "Не чисти — так жарь!", "Bulba is Life.", "Святой Клубень следит за тобой."]
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // ---- Состояние ----
    const [screen, _setScreen] = useState<GameScreen>(GameScreen.WARNING); // Start with warning screen
    const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [profileToDeleteId, setProfileToDeleteId] = useState<string | null>(null);
    const [lives, setLives] = useState(3);
    const [sessionScore, setSessionScore] = useState(0);
    const [currentCase, setCurrentCase] = useState<CaseData | null>(null);
    const [minigameIndex, setMinigameIndex] = useState(0);
    const [debugMode, setDebugMode] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [animationToView, setAnimationToView] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(getMuteState());
    const [debugCharacter, setDebugCharacter] = useState<Character | null>(null);
    const [isSlowMo, setIsSlowMo] = useState(false);
    const [isMinigameInverted, setIsMinigameInverted] = useState(false);
    const [abilityUsedInCase, setAbilityUsedInCase] = useState(false);
    const [abilityUsedInSession, setAbilityUsedInSession] = useState(false);
    const [caseStartScore, setCaseStartScore] = useState(0);
    const [forcedOutro, setForcedOutro] = useState<string | null>(null);
    const [kanilaMistakeUsedInMinigame, setKanilaMistakeUsedInMinigame] = useState(false);
    const [absurdEdgeUsedInSession, setAbsurdEdgeUsedInSession] = useState(false);
    const [isAbsurdEdgeBonusRound, setIsAbsurdEdgeBonusRound] = useState(false);
    const [isGlitchWin, setIsGlitchWin] = useState(false);
    const [glitchWinVideoUrl, setGlitchWinVideoUrl] = useState<string | null>(null);
    const isTransitioning = useRef(false);
    const [seasonalEvent, setSeasonalEvent] = useState<SeasonalEvent>(SeasonalEvent.NONE);
    const [seasonalAnimationsEnabled, setSeasonalAnimationsEnabled] = useState(true);
    const [seasonalMessage, setSeasonalMessage] = useState<string | null>(null);
    const [sensitivity, setSensitivity] = useState(1.0);
    const [sensitivityTutorial, setSensitivityTutorial] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // --- Modal States ---
    const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
    const [isLogoutConfirmationVisible, setIsLogoutConfirmationVisible] = useState(false);

    // --- Window Focus/Blur Handling ---
    useEffect(() => {
        const handleBlur = () => {
            if (screen === GameScreen.MINIGAME_PLAY) {
                setIsPaused(true);
                // We rely on stopMusic/startMusic in App.tsx or component level, 
                // or we could mute audio context here.
                // But visual pause is handled by rendering.
                stopMusic(); 
            }
        };
        const handleFocus = () => {
            // When focus returns, user has to manually unpause usually, 
            // or we keep it paused until they click "Resume"
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [screen]);

    // --- Производное состояние ---
    const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId) || null, [profiles, activeProfileId]);
    const character = useMemo(() => debugCharacter || activeProfile?.character || null, [activeProfile, debugCharacter]);
    const isUIPaused = isInstructionModalOpen || isLogoutConfirmationVisible || isPaused;

    // --- Init Seasonal Event ---
    useEffect(() => {
        setSeasonalEvent(getSeasonalEvent());
    }, []);

    // --- Seasonal Message Loop ---
    useEffect(() => {
        if (seasonalEvent === SeasonalEvent.NONE) {
            setSeasonalMessage(null);
            return;
        }

        const messages = MESSAGES_BY_EVENT[seasonalEvent];
        if (!messages) return;

        const loop = () => {
            if (Math.random() > 0.4) { // Chance to show message
                const msg = messages[Math.floor(Math.random() * messages.length)];
                setSeasonalMessage(msg);
                setTimeout(() => setSeasonalMessage(null), 4000); // Hide after 4s
            }
            // Next attempt in 30-60s
            const delay = 30000 + Math.random() * 30000;
            timeoutRef.current = window.setTimeout(loop, delay);
        };

        let timeoutRef = { current: window.setTimeout(loop, 10000) }; // Start loop after 10s

        return () => clearTimeout(timeoutRef.current);
    }, [seasonalEvent]);

    const dynamicCases = useMemo(() => {
        if (debugMode) { return CASES; }
        if (!activeProfile) return CASES;
        
        // Hide 3rd September game if it's not the date, unless we are Black Player or have debug
        if (seasonalEvent !== SeasonalEvent.SEPTEMBER_3 && activeProfile.character !== Character.BLACK_PLAYER) {
          return CASES.map(c => c.id === 3 ? { ...c, minigames: c.minigames.filter(mg => mg.id !== "3-2") } : c).filter(c => c.minigames.length > 0);
        }
        return CASES;
    }, [activeProfile, debugMode, seasonalEvent]);

    // --- Загрузка и базовые действия ---
    useEffect(() => {
        try { const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY); if (savedProfiles) setProfiles(JSON.parse(savedProfiles)); } catch (error) { console.error("Failed to load profiles:", error); }
    }, []);

    const setScreen = useCallback((newScreen: GameScreen) => {
        if (newScreen === GameScreen.MINIGAME_INTRO) setKanilaMistakeUsedInMinigame(false);
        setIsPaused(false); // Unpause on screen change
        _setScreen(newScreen);
    }, []);

    useEffect(() => { isTransitioning.current = false; }, [screen, minigameIndex]);

    const logEvent = useCallback((message: string) => { if (isLogging) setLog(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message }]); }, [isLogging]);

    const playSound = useCallback((type: SoundType) => playSoundUtil(type), []);
    
    const toggleMute = useCallback(() => { const newState = toggleMuteState(); setIsMuted(newState); logEvent(`Sound ${newState ? 'muted' : 'unmuted'}`); }, [logEvent]);

    const toggleSeasonalAnimations = useCallback(() => {
        setSeasonalAnimationsEnabled(prev => !prev);
        playSound(SoundType.GENERIC_CLICK);
    }, [playSound]);

    const saveScoreAndEndSession = useCallback(() => {
        if (!activeProfileId) return;
        setProfiles(prevProfiles => {
            const currentScore = sessionScore;
            const finalProfiles = prevProfiles.map(p => {
                if (p.id === activeProfileId) {
                    logEvent(`Session ended. Score: ${currentScore}. Old high score: ${p.highScore}`);
                    return { ...p, highScore: Math.max(p.highScore, currentScore) };
                }
                return p;
            });
            saveProfilesToStorage(finalProfiles);
            return finalProfiles;
        });
    }, [activeProfileId, logEvent, sessionScore]);

    // --- Логика профилей ---
    const confirmLogout = useCallback(() => {
        stopMusic();
        saveScoreAndEndSession();
        setActiveProfileId(null); setCurrentCase(null); setMinigameIndex(0); setSessionScore(0); setLives(3);
        setAbilityUsedInSession(false); setAbsurdEdgeUsedInSession(false); setIsAbsurdEdgeBonusRound(false); setDebugCharacter(null);
        setIsLogoutConfirmationVisible(false);
        setScreen(GameScreen.PROFILE_SELECTION);
    }, [saveScoreAndEndSession]);

    const requestLogout = useCallback(() => { logEvent('Logout requested.'); setIsLogoutConfirmationVisible(true); }, [logEvent]);
    const cancelLogout = useCallback(() => { logEvent('Logout cancelled.'); setIsLogoutConfirmationVisible(false); }, [logEvent]);

    const createProfile = useCallback((name: string, character: Character) => {
        logEvent(`Creating new profile: ${name} as ${character}`);
        const completedChars = new Set(profiles.filter(p => p.gameCompleted).map(p => p.character));
        const hasDadaToken = character === Character.BLACK_PLAYER && completedChars.has(Character.KANILA) && completedChars.has(Character.SEXISM);
        if(hasDadaToken) logEvent("Dada Token granted!");
        
        const newId = generateUUID();
        const newProfile: PlayerProfile = { id: newId, name, character, progress: {}, highScore: 0, hasDadaToken: hasDadaToken ? true : undefined, };
        setProfiles(prev => { const newProfiles = [...prev, newProfile]; saveProfilesToStorage(newProfiles); return newProfiles; });
        
        setActiveProfileId(newId);
        setSessionScore(0); setLives(3); setAbilityUsedInSession(false); setAbsurdEdgeUsedInSession(false); setIsAbsurdEdgeBonusRound(false); setDebugCharacter(null);
        setScreen(GameScreen.CASE_SELECTION);
    }, [logEvent, profiles]);

    const selectProfile = useCallback((profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            logEvent(`Profile selected: ${profile.name}`);
            setActiveProfileId(profileId);
            setSessionScore(0); setLives(3); setAbilityUsedInSession(false); setAbsurdEdgeUsedInSession(false); setIsAbsurdEdgeBonusRound(false); setDebugCharacter(null);
            setScreen(GameScreen.CASE_SELECTION);
        }
    }, [profiles, logEvent]);

    const deleteProfile = useCallback((profileId: string) => { logEvent(`Deletion initiated for profile ${profileId}`); setProfileToDeleteId(profileId); }, [logEvent]);
    
    const confirmDeleteProfile = useCallback(() => {
        if (!profileToDeleteId) return;
        
        const isDeletingActive = activeProfileId === profileToDeleteId;

        setProfiles(prev => {
            const updated = prev.filter(p => p.id !== profileToDeleteId);
            saveProfilesToStorage(updated);
            return updated;
        });
        
        logEvent(`Profile ${profileToDeleteId} deleted.`);
        
        if (isDeletingActive) setActiveProfileId(null);
        setProfileToDeleteId(null);
    }, [profileToDeleteId, activeProfileId, logEvent]);

    const cancelDeleteProfile = useCallback(() => { logEvent(`Deletion cancelled for profile ${profileToDeleteId}`); setProfileToDeleteId(null); }, [profileToDeleteId, logEvent]);
    
    const unlockAllLevels = useCallback(() => {
        if (!activeProfileId) {
             logEvent("DEBUG: No active profile selected to unlock.");
             return;
        }
        
        logEvent(`DEBUG: Unlocking levels for ${activeProfileId}`);

        setProfiles(prev => {
            const updated = prev.map(p => {
                if (p.id === activeProfileId) {
                    const allProgress: { [key: number]: number } = {};
                    CASES.forEach(c => {
                        allProgress[c.id] = c.minigames.length;
                    });
                    return { ...p, progress: allProgress, gameCompleted: true };
                }
                return p;
            });
            saveProfilesToStorage(updated);
            return updated;
        });
        playSound(SoundType.TRANSFORM_SUCCESS);
    }, [activeProfileId, logEvent, playSound]);

    // --- Логика сессии/игры ---
    const startCase = useCallback((caseId: number) => {
        const selectedCase = dynamicCases.find(c => c.id === caseId);
        if (!selectedCase || !activeProfile) return;
        
        logEvent(`Case ${caseId} started by ${activeProfile.name}`);
        setCurrentCase(selectedCase); setCaseStartScore(sessionScore); setAbilityUsedInCase(false); setForcedOutro(null); setIsAbsurdEdgeBonusRound(false);

        if (activeProfile.character === Character.BLACK_PLAYER && Math.random() < 0.1) { setIsMinigameInverted(true); logEvent("Reality Shift activated!"); } else { setIsMinigameInverted(false); }

        const savedProgress = activeProfile.progress[caseId] || 0;
        const startIndex = savedProgress >= selectedCase.minigames.length ? 0 : savedProgress;
        setMinigameIndex(startIndex);
        setScreen(GameScreen.MINIGAME_INTRO);
    }, [activeProfile, logEvent, sessionScore, dynamicCases]);

    const nextMinigame = useCallback((noScore: boolean = false) => {
        if (!currentCase || !activeProfileId) return;
        
        const newScore = noScore ? sessionScore : sessionScore + 250;
        const newMinigameIndex = minigameIndex + 1;
        const isCaseCompleted = newMinigameIndex >= currentCase.minigames.length;
        const finalScore = isCaseCompleted && !noScore ? newScore + 1000 : newScore;

        setSessionScore(finalScore);
        
        setProfiles(prevProfiles => {
            let allCasesComplete = false;
            const newProfiles = prevProfiles.map(p => {
                if (p.id === activeProfileId) {
                    const newProgress = { ...p.progress, [currentCase.id]: Math.max(p.progress[currentCase.id] || 0, newMinigameIndex) };
                    const updatedProfile = { ...p, progress: newProgress, highScore: Math.max(p.highScore, finalScore) };
                    allCasesComplete = dynamicCases.every(c => (updatedProfile.progress[c.id] || 0) >= c.minigames.length);
                    if (allCasesComplete && !updatedProfile.gameCompleted) {
                        logEvent(`GAME COMPLETED with ${updatedProfile.character}.`);
                        return { ...updatedProfile, gameCompleted: true };
                    }
                    return updatedProfile;
                }
                return p;
            });

            saveProfilesToStorage(newProfiles);
            
            if (allCasesComplete) setScreen(GameScreen.FINAL_ENDING);
            else if (isCaseCompleted) setScreen(GameScreen.CASE_OUTRO);
            else { 
                // Return to Case Selection after each minigame to allow "Door" progression feel
                // setMinigameIndex(newMinigameIndex); // Index is tracked in profile, so startCase will pick it up correctly
                setScreen(GameScreen.CASE_SELECTION); 
            }

            return newProfiles;
        });
    }, [currentCase, activeProfileId, minigameIndex, sessionScore, logEvent, dynamicCases]);
    
    const winMinigame = useCallback(() => {
        if (isTransitioning.current) return; isTransitioning.current = true;
        stopMusic();
        playSound(SoundType.PLAYER_WIN);
        if (isAbsurdEdgeBonusRound) { logEvent("Absurd Edge win! +2000 bonus."); setSessionScore(s => s + 2000); }
        setIsAbsurdEdgeBonusRound(false);
        if (currentCase?.minigames[minigameIndex]) { logEvent(`Minigame won: ${currentCase.minigames[minigameIndex].name}`); nextMinigame(false); } 
        else { logEvent("Minigame won (standalone)."); setScreen(GameScreen.DEBUG_MENU); }
    }, [currentCase, minigameIndex, logEvent, nextMinigame, playSound, isAbsurdEdgeBonusRound]);

    const loseMinigame = useCallback(() => {
        if (isTransitioning.current) return;
        stopMusic();
        setIsAbsurdEdgeBonusRound(false);

        if (currentCase?.minigames[minigameIndex]?.id === '3-2') {
            logEvent("Bonus game 'Pereverni Kalendar' lost. Proceeding without penalty.");
            playSound(SoundType.BUTTON_CLICK);
            isTransitioning.current = true;
            nextMinigame(true);
            return;
        }

        if (character === Character.KANILA && Math.random() < 0.5) {
            logEvent("Anarchic Glitch! Loss becomes a win (no score).");
            playSound(SoundType.TRANSFORM_SUCCESS);
            isTransitioning.current = true;
            const currentMinigameId = currentCase?.minigames[minigameIndex]?.id;
            const videoUrl = currentMinigameId ? MINIGAME_VIDEO_MAP[currentMinigameId] : null;
            setGlitchWinVideoUrl(videoUrl);
            setIsGlitchWin(true);
            return;
        }

        isTransitioning.current = true; playSound(SoundType.PLAYER_LOSE);
        logEvent(`Minigame lost: ${currentCase?.minigames[minigameIndex]?.name || 'standalone'}`);
        const newLives = lives - 1;
        if (newLives <= 0) { logEvent("GAME OVER."); setTimeout(() => confirmLogout(), 2000); setLives(0); } 
        else {
            setLives(newLives); logEvent(`Life lost. ${newLives} remaining.`);
            setTimeout(() => { isTransitioning.current = false; if (currentCase) setScreen(GameScreen.MINIGAME_INTRO); else setScreen(GameScreen.DEBUG_MENU); }, 1500);
        }
    }, [character, currentCase, minigameIndex, logEvent, confirmLogout, playSound, nextMinigame, lives]);

    const killPlayer = useCallback(() => { if (isTransitioning.current) return; isTransitioning.current = true; playSound(SoundType.PLAYER_LOSE); logEvent("Player instantly killed."); setLives(0); setTimeout(() => confirmLogout(), 2000); }, [playSound, logEvent, confirmLogout]);
    
    const jumpToMinigame = useCallback((id: string) => {
        for (const c of dynamicCases) {
            const mgIndex = c.minigames.findIndex(mg => mg.id === id);
            if (mgIndex !== -1) { 
                logEvent(`Jumping to minigame: ${id}`); 
                setCurrentCase(c); 
                setMinigameIndex(mgIndex); 
                setScreen(GameScreen.MINIGAME_PLAY);
                setIsInstructionModalOpen(true); // Open instructions automatically
                return; 
            }
        }
    }, [logEvent, dynamicCases]);

    const activateArtistInsight = useCallback(() => { if (character !== Character.SEXISM || abilityUsedInCase || isSlowMo) return; playSound(SoundType.TRANSFORM_SUCCESS); logEvent("Artist's Insight activated."); setAbilityUsedInCase(true); setIsSlowMo(true); setTimeout(() => setIsSlowMo(false), 3000); }, [character, abilityUsedInCase, isSlowMo, playSound, logEvent]);
    const activateFourthWall = useCallback(() => { if (character !== Character.BLACK_PLAYER || abilityUsedInSession || !currentCase) return; playSound(SoundType.DESTROY); logEvent("Fourth Wall activated."); setAbilityUsedInSession(true); setForcedOutro("Вы воспользовались «читом»."); setSessionScore(caseStartScore); nextMinigame(true); }, [character, abilityUsedInSession, currentCase, caseStartScore, logEvent, playSound, nextMinigame]);
    const handleMistake = useCallback(() => { if (character !== Character.KANILA || kanilaMistakeUsedInMinigame) return false; logEvent("Conceptual Mistake triggered!"); setKanilaMistakeUsedInMinigame(true); setSessionScore(s => s + 50); playSound(SoundType.GENERIC_CLICK); return true; }, [character, kanilaMistakeUsedInMinigame, logEvent, playSound]);
    const activateAbsurdEdge = useCallback(() => { if (character !== Character.BLACK_PLAYER || !activeProfile?.hasDadaToken || absurdEdgeUsedInSession || screen !== GameScreen.MINIGAME_INTRO) return; playSound(SoundType.DESTROY); logEvent("Absurd Edge activated."); setAbsurdEdgeUsedInSession(true); setIsAbsurdEdgeBonusRound(true); setIsMinigameInverted(true); }, [character, activeProfile, absurdEdgeUsedInSession, screen, playSound, logEvent]);
    const proceedAfterGlitchWin = useCallback(() => { setIsGlitchWin(false); setGlitchWinVideoUrl(null); nextMinigame(true); }, [nextMinigame]);

    // --- Memoized Context Values ---
    const navigationContextValue = useMemo(() => ({ screen, setScreen, animationToView, setAnimationToView, jumpToMinigame, isInstructionModalVisible: isUIPaused, showInstructionModal: () => setIsInstructionModalOpen(true), hideInstructionModal: () => setIsInstructionModalOpen(false) }), [screen, animationToView, isUIPaused, setScreen, jumpToMinigame]);
    const settingsContextValue = useMemo(() => ({ debugMode, toggleDebug: () => setDebugMode(d => !d), isLogging, toggleLogging: () => setIsLogging(l => !l), setIsLogging, log, logEvent, isMuted, toggleMute, playSound, debugCharacter, setDebugCharacter, seasonalEvent, setSeasonalEvent, seasonalAnimationsEnabled, toggleSeasonalAnimations, seasonalMessage, sensitivity, setSensitivity, sensitivityTutorial, setSensitivityTutorial, isPaused, setIsPaused }), [debugMode, isLogging, log, isMuted, debugCharacter, logEvent, playSound, toggleMute, seasonalEvent, setSeasonalEvent, seasonalAnimationsEnabled, toggleSeasonalAnimations, seasonalMessage, sensitivity, sensitivityTutorial, isPaused]);
    const profileContextValue = useMemo(() => ({ profiles, activeProfile, profileToDeleteId, createProfile, selectProfile, deleteProfile, confirmDeleteProfile, cancelDeleteProfile, requestLogout, dynamicCases, isLogoutConfirmationVisible, confirmLogout, cancelLogout, unlockAllLevels }), [profiles, activeProfile, profileToDeleteId, createProfile, selectProfile, deleteProfile, confirmDeleteProfile, cancelDeleteProfile, requestLogout, dynamicCases, isLogoutConfirmationVisible, confirmLogout, cancelLogout, unlockAllLevels]);
    const sessionContextValue = useMemo(() => ({ character, currentCase, minigameIndex, lives, sessionScore, isSlowMo, isMinigameInverted, abilityUsedInCase, abilityUsedInSession, forcedOutro, absurdEdgeUsedInSession, isAbsurdEdgeBonusRound, isGlitchWin, glitchWinVideoUrl, startCase, winMinigame, loseMinigame, killPlayer, addLife: (amount = 1) => setLives(l => l + amount), addScore: (points) => setSessionScore(s => s + points), activateArtistInsight, activateFourthWall, handleMistake, activateAbsurdEdge, proceedAfterGlitchWin }), [character, currentCase, minigameIndex, lives, sessionScore, isSlowMo, isMinigameInverted, abilityUsedInCase, abilityUsedInSession, forcedOutro, absurdEdgeUsedInSession, isAbsurdEdgeBonusRound, isGlitchWin, glitchWinVideoUrl, startCase, winMinigame, loseMinigame, killPlayer, activateArtistInsight, activateFourthWall, handleMistake, activateAbsurdEdge, proceedAfterGlitchWin]);

    return (
        <NavigationContext.Provider value={navigationContextValue}>
            <SettingsContext.Provider value={settingsContextValue}>
                <ProfileContext.Provider value={profileContextValue}>
                    <SessionContext.Provider value={sessionContextValue}>
                        {children}
                    </SessionContext.Provider>
                </ProfileContext.Provider>
            </SettingsContext.Provider>
        </NavigationContext.Provider>
    );
};
