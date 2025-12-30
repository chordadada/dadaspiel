
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { PixelArt } from '../core/PixelArt';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE, BLACK_PLAYER_ART_DATA } from '../../../characterArt';
import { GUARD_ART_DATA, DOBRO_ART_DATA } from '../../miscArt';

// --- НАСТРОЙКИ СЛОЖНОСТИ (Словарь для удобного редактирования) ---
const DIFFICULTY_SETTINGS = {
    [Character.KANILA]: {
        fallSpeed: 12,        // Скорость падения
        spawnRate: 0.03,     // Частота появления
        ruleInterval: 9,      // Интервал правила (сек)
        catchWidth: 9,       // Ширина зоны ловли
        aiPrecision: 0.1,     // Точность ИИ
    },
    [Character.SEXISM]: {
        fallSpeed: 17,
        spawnRate: 0.04,
        ruleInterval: 8,
        catchWidth: 8,
        aiPrecision: 0.15,
    },
    [Character.BLACK_PLAYER]: {
        fallSpeed: 23,
        spawnRate: 0.05,
        ruleInterval: 7,
        catchWidth: 7,
        aiPrecision: 0.2,
    }
};

// --- ИНДИВИДУАЛЬНЫЕ ПРЕДМЕТЫ ---
const CHARACTER_ARGUMENTS: Record<string, Argument[]> = {
    [Character.KANILA]: [
        { id: 1, char: '🍓', color: 'red', isFavorite: true },
        { id: 2, char: '👺', color: 'red', isFavorite: false },
        { id: 3, char: '💧', color: 'blue', isFavorite: true },
        { id: 4, char: '🥶', color: 'blue', isFavorite: false },
        { id: 5, char: '🤮', color: 'green', isFavorite: true },
        { id: 6, char: '🔫', color: 'green', isFavorite: false },
        { id: 7, char: '🤪', color: 'yellow', isFavorite: true },
        { id: 8, char: '🦀', color: 'yellow', isFavorite: false },
        { id: 9, char: '🍆', color: 'purple', isFavorite: true },
        { id: 10, char: '🍇', color: 'purple', isFavorite: false },
    ],
    [Character.SEXISM]: [
        { id: 11, char: '🍷', color: 'red', isFavorite: true },
        { id: 12, char: '💄', color: 'red', isFavorite: false },
        { id: 13, char: '🥶', color: 'blue', isFavorite: true },
        { id: 14, char: '❄️', color: 'blue', isFavorite: false },
        { id: 15, char: '🥝', color: 'green', isFavorite: true },
        { id: 16, char: '🐸', color: 'green', isFavorite: false },
        { id: 17, char: '🎷', color: 'yellow', isFavorite: true },
        { id: 18, char: '🧽', color: 'yellow', isFavorite: false },
        { id: 19, char: '😈', color: 'purple', isFavorite: true },
        { id: 20, char: '🔮', color: 'purple', isFavorite: false },
    ],
    [Character.BLACK_PLAYER]: [
        { id: 21, char: '🩸', color: 'red', isFavorite: true },
        { id: 22, char: '👹', color: 'red', isFavorite: false },
        { id: 23, char: '❄️', color: 'blue', isFavorite: true },
        { id: 24, char: '🐳', color: 'blue', isFavorite: false },
        { id: 25, char: '🤮', color: 'green', isFavorite: true },
        { id: 26, char: '🥦', color: 'green', isFavorite: false },
        { id: 27, char: '⚠️', color: 'yellow', isFavorite: true },
        { id: 28, char: '🔥', color: 'yellow', isFavorite: false },
        { id: 29, char: '👾', color: 'purple', isFavorite: true },
        { id: 30, char: '🦄', color: 'purple', isFavorite: false },
    ]
};

type ColorType = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
interface Argument { id: number; char: string; color: ColorType; isFavorite: boolean; }
interface Rule { text: string; description: string; evaluate: (arg: Argument) => number; }

const RULES: Rule[] = [
    { text: "КРАСНОЕ", description: "Красный +1, Синий -1", evaluate: (a) => a.color === 'red' ? 1 : (a.color === 'blue' ? -1 : 0) },
    { text: "СИНЕЕ", description: "Синий +1, Красный -1", evaluate: (a) => a.color === 'blue' ? 1 : (a.color === 'red' ? -1 : 0) },
    { text: "ЗЕЛЁНОЕ", description: "Зелёный +1, Жёлтый -1", evaluate: (a) => a.color === 'green' ? 1 : (a.color === 'yellow' ? -1 : 0) },
    { text: "ЖЁЛТОЕ", description: "Жёлтый +1, Зелёный -1", evaluate: (a) => a.color === 'yellow' ? 1 : (a.color === 'green' ? -1 : 0) },
    { text: "ФИОЛЕТОВОЕ", description: "Фиолетовый +1, остальные 0", evaluate: (a) => a.color === 'purple' ? 1 : 0 },
    { text: "ЛЮБИМОЕ", description: "Угадайте предпочтения (+1 / -1)", evaluate: (a) => a.isFavorite ? 1 : -1 },
];

// --- Subcomponents ---

const VideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const getEmbedUrl = (videoUrl: string): string => {
        if (videoUrl.includes("youtube.com/watch?v=")) return videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0";
        return videoUrl;
    };
    return (
        <div className="absolute inset-0 bg-black/95 z-[150] flex items-center justify-center animate-[fadeIn_0.3s]" onClick={onClose}>
            <div className="relative w-11/12 max-w-4xl aspect-video bg-black pixel-border" onClick={(e) => e.stopPropagation()}>
                <iframe width="100%" height="100%" src={getEmbedUrl(url)} title="Video player" frameBorder="0" allowFullScreen></iframe>
                <button onClick={onClose} className="absolute -top-4 -right-4 pixel-button bg-red-600 text-2xl w-12 h-12 flex items-center justify-center z-10">X</button>
            </div>
        </div>
    );
};

// Character-Specific Win Screens
export const FruktoviySporWinScreen: React.FC<{ onContinue: () => void; onPlayVideo: () => void; character: Character | null }> = ({ onContinue, onPlayVideo, character }) => {
    const { playSound } = useSettings();
    useEffect(() => { playSound(SoundType.WIN_FRUKTY); }, [playSound]);
    // KANILA (Anarchic/Street)
    if (character === Character.KANILA) {
        return (
            <div className="absolute inset-0 bg-zinc-900 z-30 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <style>{`
                    @keyframes spray-drip { 0% { height: 0px; } 100% { height: 40px; } }
                    .drip { position: absolute; width: 4px; background: #ef4444; animation: spray-drip 2s ease-out forwards; }
                `}</style>
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'}}></div>
                
                <div className="relative z-10 transform -rotate-3 bg-black p-8 border-4 border-white shadow-[10px_10px_0px_#ef4444]">
                    <h2 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">БАЗАР ОКОНЧЕН</h2>
                    <p className="text-xl text-red-500 font-mono font-bold bg-white px-2">АРГУМЕНТ ПРИНЯТ</p>
                    {/* Drips */}
                    <div className="drip" style={{left: '20%', bottom: '-40px'}}></div>
                    <div className="drip" style={{left: '60%', bottom: '-25px', animationDelay: '0.5s'}}></div>
                </div>

                <div className="flex gap-4 mt-12 relative z-20">
                    <button onClick={onPlayVideo} className="pixel-button p-4 text-xl bg-yellow-500 text-black hover:bg-yellow-400">ПРУФЫ</button>
                    <button onClick={onContinue} className="pixel-button p-4 text-xl bg-green-700 hover:bg-green-600">ВАЛИМ</button>
                </div>
            </div>
        );
    }

    // SEXISM (Glamour/TV)
    if (character === Character.SEXISM) {
        return (
            <div className="absolute inset-0 bg-fuchsia-900 z-30 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <style>{`
                    @keyframes spotlight-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .spotlight-bg { background: conic-gradient(from 0deg at 50% 50%, #701a75 0deg, #a21caf 60deg, #701a75 120deg, #a21caf 180deg, #701a75 240deg, #a21caf 300deg, #701a75 360deg); animation: spotlight-spin 10s linear infinite; }
                `}</style>
                <div className="absolute inset-0 spotlight-bg opacity-50"></div>
                
                <div className="relative z-10 p-8 border-y-4 border-yellow-300 bg-black/60 backdrop-blur-md w-full">
                    <h2 className="text-5xl md:text-7xl font-serif text-yellow-300 mb-2 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]">БЛЕСТЯЩЕ!</h2>
                    <p className="text-2xl text-pink-300 italic font-serif">Ваша риторика неотразима</p>
                </div>

                <div className="flex gap-6 mt-12 relative z-20">
                    <button onClick={onPlayVideo} className="pixel-button p-4 text-xl bg-pink-600 hover:bg-pink-500 border-yellow-300">ЭФИР</button>
                    <button onClick={onContinue} className="pixel-button p-4 text-xl bg-purple-700 hover:bg-purple-600">ФИНАЛ</button>
                </div>
            </div>
        );
    }

    // Fallback / Generic
    return (
        <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-6xl text-yellow-400 mb-4 animate-bounce">ПОБЕДА В СПОРЕ!</h2>
            <div className="flex gap-4">
                <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-purple-700">ДОКАЗАТЕЛЬСТВА</button>
                <button onClick={onContinue} className="pixel-button p-3 text-xl bg-green-700">ПРОЙДЁМТЕ</button>
            </div>
        </div>
    );
};

export const BlackPlayerBecomingWinScreen: React.FC<{ onContinue: () => void; onPlayVideo: () => void }> = ({ onContinue, onPlayVideo }) => {
    const { playSound } = useSettings();
    useEffect(() => { playSound(SoundType.WIN_FRUKTY); }, [playSound]);
    return (
        <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes glitch-bg-red { 0% { background: #000; } 10% { background: #300; } 20% { background: #000; } 100% { background: #000; } }
            `}</style>
            <div className="absolute inset-0 z-0 animate-[glitch-bg-red_0.2s_infinite]"></div>
            <div className="z-10 flex flex-col items-center filter invert">
                <div className="mb-8">
                     <PixelArt artData={BLACK_PLAYER_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-mono text-red-600 mb-8 text-center z-10 bg-black px-4 animate-pulse">СТАНОВЛЕНИЕ ЗАВЕРШЕНО</h2>
            <div className="flex gap-4 z-10">
                <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-red-900 text-white border-red-500">ИСТОК</button>
                <button onClick={onContinue} className="pixel-button p-3 text-xl bg-gray-900 text-white border-gray-600">ПРИНЯТЬ</button>
            </div>
        </div>
    );
};

// Lose Screen showing Opponent Triumph
const FruktoviySporLoseScreen: React.FC<{ onRetry: () => void; character: Character | null }> = ({ onRetry, character }) => {
    let opponentArt = GUARD_ART_DATA;
    let title = "АРГУМЕНТ ОТКЛОНЁН";
    let subtitle = "Вахтёрша не пускает!";
    let bgColor = "bg-blue-900";

    if (character === Character.SEXISM) {
        opponentArt = DOBRO_ART_DATA;
        title = "СЛИШКОМ ТОНКО";
        subtitle = "Добро задавило интеллектом.";
        bgColor = "bg-red-900";
    } else if (character === Character.BLACK_PLAYER) {
        opponentArt = BLACK_PLAYER_ART_DATA; // Opponent is Self/Anti-Self
        title = "СБОЙ ЛОГИКИ";
        subtitle = "Система поглотила сама себя.";
        bgColor = "bg-gray-900";
    }

    return (
        <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center ${bgColor} overflow-hidden animate-[fadeIn_0.3s]`}>
            <div className="absolute inset-0 bg-black/50"></div>
            
            <div className="z-10 flex flex-col items-center">
                <div className="mb-8 transform scale-[2] md:scale-[3] animate-[bounce_1s_infinite]">
                    <div className={character === Character.BLACK_PLAYER ? "filter invert grayscale brightness-50" : ""}>
                        <PixelArt artData={opponentArt} palette={PIXEL_ART_PALETTE} pixelSize={6} />
                    </div>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black text-white mb-2 text-center shadow-black drop-shadow-md border-4 border-white p-4 bg-red-600 transform -rotate-2">
                    {title}
                </h2>
                <p className="text-xl text-white font-mono mb-8 bg-black px-2">{subtitle}</p>
                
                <button onClick={onRetry} className="pixel-button p-4 text-2xl bg-gray-700 hover:bg-gray-600">
                    ЕЩЁ РАЗ
                </button>
            </div>
        </div>
    );
};

// --- Обновленная корзина ---
const TopBasket: React.FC<{ items: (Argument | null)[] }> = ({ items }) => (
    <div className="flex justify-center items-center gap-2 p-1.5 bg-[#2d1b0a] border-b-4 border-r-4 border-black/40 rounded-lg shadow-xl w-48 h-16">
        {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 h-full bg-black/30 border-2 border-[#1a0f05] rounded flex items-center justify-center text-2xl relative">
                {items[i]?.char}
            </div>
        ))}
    </div>
);

const CharacterArt: React.FC<{ character: Character | null; isOpponent?: boolean; isHit?: boolean }> = ({ character, isOpponent }) => {
    if (isOpponent) {
        if (character === Character.SEXISM) return <PixelArt artData={DOBRO_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
        if (character === Character.KANILA) return <PixelArt artData={GUARD_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
        if (character === Character.BLACK_PLAYER) return <div className="filter invert grayscale brightness-50"><PixelArt artData={BLACK_PLAYER_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={3} /></div>;
    }
    return <PixelArt artData={CHARACTER_ART_MAP[character || Character.KANILA]} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
};

export const FruktoviySpor: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { character } = useSession();
    const { playSound, isPaused } = useSettings();
    const { isInstructionModalVisible } = useNavigation();

    const diff = useMemo(() => DIFFICULTY_SETTINGS[character || Character.KANILA], [character]);
    const duration = character === Character.BLACK_PLAYER ? 120 : (character === Character.SEXISM ? 90 : 60);
    const itemPool = useMemo(() => CHARACTER_ARGUMENTS[character || Character.KANILA], [character]);

    // STATUS: playing | won | lost | countdown
    const [status, setStatus] = useState<'countdown' | 'playing' | 'won' | 'lost'>('countdown');
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [currentRule, setCurrentRule] = useState<Rule>(RULES[0]);
    const [ruleTimer, setRuleTimer] = useState(diff.ruleInterval);
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    
    const [playerBasket, setPlayerBasket] = useState<(Argument | null)[]>([]);
    const [aiBasket, setAiBasket] = useState<(Argument | null)[]>([]);
    const [playerItems, setPlayerItems] = useState<{ id: number, arg: Argument, x: number, y: number }[]>([]);
    const [aiItems, setAiItems] = useState<{ id: number, arg: Argument, x: number, y: number }[]>([]);
    
    const [playerX, setPlayerX] = useState(50);
    const [aiX, setAiX] = useState(50);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const itemIdCounter = useRef(0);
    const aiTargetX = useRef(50);
    const aiDecisionTimer = useRef(0);
   
    // --- Smooth Movement Refs ---
    const targetPlayerX = useRef(50);
    
    // Timer Ref for logic
    const ruleTimerRef = useRef(diff.ruleInterval);

    // Sync timer when settings change
    useEffect(() => {
        setRuleTimer(diff.ruleInterval);
        ruleTimerRef.current = diff.ruleInterval;
    }, [diff]);

    useEffect(() => {
        if (isInstructionModalVisible || status !== 'countdown') return;
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(timer); setStatus('playing'); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isInstructionModalVisible, status]);

    const evaluateBaskets = useCallback(() => {
        const pPoints = playerBasket.reduce((sum, item) => sum + (item ? currentRule.evaluate(item) : 0), 0);
        const aPoints = aiBasket.reduce((sum, item) => sum + (item ? currentRule.evaluate(item) : 0), 0);
        setPlayerScore(s => s + pPoints);
        setAiScore(s => s + aPoints);
        if (pPoints > 0) playSound(SoundType.ITEM_PLACE_SUCCESS);
        if (pPoints < 0) playSound(SoundType.ITEM_CATCH_BAD);
    }, [playerBasket, aiBasket, currentRule, playSound]);

    const changeRule = useCallback(() => {
        evaluateBaskets();
        setCurrentRule(RULES[Math.floor(Math.random() * RULES.length)]);
        setRuleTimer(diff.ruleInterval);
        ruleTimerRef.current = diff.ruleInterval;
        playSound(SoundType.TRANSFORM_SUCCESS);
    }, [evaluateBaskets, playSound, diff.ruleInterval]);

    useGameLoop(useCallback((dt) => {
        if (status !== 'playing' || isPaused || isInstructionModalVisible) return;
        const dtSec = dt / 1000;

        setTimeLeft(t => {
            const next = t - dtSec;
            if (next <= 0) { 
                // Time up! Check winner.
                if (playerScore >= aiScore) {
                    setStatus('won');
                } else {
                    setStatus('lost');
                }
                return 0; 
            }
            return next;
        });

        // Update Rule Timer using Ref for accuracy
        ruleTimerRef.current -= dtSec;
        if (ruleTimerRef.current <= 0) changeRule();
        else setRuleTimer(ruleTimerRef.current);

        // Плавное следование за целью (LERP) - ускорено для мгновенной реакции
        const smoothFactor = 1 - Math.pow(0.0001, dtSec); 
        setPlayerX(prev => prev + (targetPlayerX.current - prev) * smoothFactor);

        // AI Lerp
        setAiX(prev => prev + (aiTargetX.current - prev) * diff.aiPrecision);

        // Спад предметов (80% зона, т.е. 10-90%)
        if (Math.random() < diff.spawnRate) {
            const arg = itemPool[Math.floor(Math.random() * itemPool.length)];
            setPlayerItems(items => [...items, { id: itemIdCounter.current++, arg, x: 10 + Math.random() * 80, y: -10 }]);
        }
        if (Math.random() < diff.spawnRate) {
            const arg = itemPool[Math.floor(Math.random() * itemPool.length)];
            setAiItems(items => [...items, { id: itemIdCounter.current++, arg, x: 10 + Math.random() * 80, y: -10 }]);
        }
        // --- Items Update & Collision ---
        setPlayerItems(items => {
            const next = [];
            for (const it of items) {
                const ny = it.y + diff.fallSpeed * dtSec;
                // Check collision against visual player position (playerX)
                if (Math.abs(it.x - playerX) < diff.catchWidth && ny > 75 && ny < 85) {
                    playSound(SoundType.ITEM_CATCH_GOOD);
                    setPlayerBasket(prev => [it.arg, ...prev].slice(0, 3));
                    continue;
                }
                if (ny < 110) next.push({ ...it, y: ny });
            }
            return next;
        });

        setAiItems(items => {
            const next = [];
            for (const it of items) {
                const ny = it.y + diff.fallSpeed * dtSec;
                if (Math.abs(it.x - aiX) < diff.catchWidth && ny > 75 && ny < 85) {
                    setAiBasket(prev => [it.arg, ...prev].slice(0, 3));
                    continue;
                }
                if (ny < 110) next.push({ ...it, y: ny });
            }
            return next;
        });
        // --- AI Logic ---
        aiDecisionTimer.current -= dtSec;
        if (aiDecisionTimer.current <= 0) {
            const targets = aiItems.filter(i => currentRule.evaluate(i.arg) > 0);
            aiTargetX.current = targets.length > 0 ? targets[0].x : 10 + Math.random() * 80;
            aiDecisionTimer.current = 0.4 + Math.random() * 0.4;
        }


    }, [status, playerX, aiX, playerItems, aiItems, currentRule, changeRule, playSound, diff, itemPool, isPaused, isInstructionModalVisible, playerScore, aiScore]), status === 'playing');

    // Универсальный обработчик Pointer Events
    const handlePointerMove = (e: React.PointerEvent) => {
        if (gameAreaRef.current && status === 'playing' && !isPaused) {
            const rect = gameAreaRef.current.getBoundingClientRect();
            // На мобильных палец часто закрывает фигурку, поэтому берем только X координату
            // Вычисляем положение курсора/пальца относительно всего экрана и проецируем на шкалу 0-100
            const rawX = ((e.clientX - rect.left) / rect.width) * 100;
            targetPlayerX.current = Math.max(5, Math.min(95, rawX));
        }
    };

    const handleWinContinue = () => { playSound(SoundType.BUTTON_CLICK); onWin(); };

    return (
        <div ref={gameAreaRef} 
             className="w-full h-full relative overflow-hidden flex flex-col select-none touch-none cursor-none" 
             style={{ backgroundColor: bgColor, touchAction: 'none' }}
             onPointerMove={handlePointerMove} 
             onPointerDown={handlePointerMove}
        >
            <style>{`
                /* Убираем любые CSS переходы для мгновенного следования */
                .no-delay { transition: none !important; }
            `}</style>
            <div className="w-full bg-black/70 p-4 border-b-2 border-orange-900/30 flex flex-col items-center z-30 shadow-2xl">
                <div className="flex justify-between items-center w-full max-w-6xl px-4 relative">
                    {/* Слева: Название правила */}
                    <div className="w-1/3 flex flex-col items-start overflow-hidden">
                        <div className="text-yellow-500 font-black text-2xl tracking-tighter truncate w-full">{currentRule.text}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest truncate w-full">{currentRule.description}</div>
                    </div>

                    {/* Центр: Шкала времени до смены правила */}
                    <div className="w-1/3 flex flex-col items-center">
                        <div className="w-full max-w-[200px] h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300" style={{ width: `${(ruleTimer / diff.ruleInterval) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Справа: Общий таймер */}
                    <div className="w-1/3 flex justify-end">
                        <div className="text-5xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            {Math.ceil(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-1 border-l-2 border-dashed border-white/5 z-10"></div>
                
                {/* ЛЕВО: ОППОНЕНТ */}
                <div className={`w-1/2 h-full relative overflow-hidden bg-red-950/5 ${character === Character.BLACK_PLAYER ? 'filter invert hue-rotate-180' : ''}`}>
                    {/* Header Info: Score & Centered Basket */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                        <div className="text-5xl font-mono text-red-600 font-black drop-shadow-md">{aiScore}</div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <TopBasket items={aiBasket} />
                        </div>
                    </div>

                    {aiItems.map(it => (
                        <div key={it.id} className="absolute text-4xl drop-shadow-lg" style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%, -50%)' }}>
                            {it.arg.char}
                        </div>
                    ))}
                    <div className="absolute bottom-[4%] no-delay" style={{ left: `${aiX}%`, transform: 'translateX(-50%)' }}>
                        <div className="transform scale-x-[-1]"><CharacterArt character={character} isOpponent /></div>
                        <div className="w-16 h-2 bg-black/40 rounded-full blur-sm mt-1 mx-auto"></div>
                    </div>
                </div>

                {/* ПРАВО: ИГРОК */}
                <div className="w-1/2 h-full relative overflow-hidden bg-blue-950/5">
                    {/* Header Info: Score & Centered Basket */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <TopBasket items={playerBasket} />
                        </div>
                        <div className="ml-auto text-5xl font-mono text-blue-500 font-black drop-shadow-md">{playerScore}</div>
                    </div>

                    {playerItems.map(it => (
                        <div key={it.id} className="absolute text-4xl drop-shadow-lg" style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%, -50%)' }}>
                            {it.arg.char}
                        </div>
                    ))}
                    <div className="absolute bottom-[4%] no-delay" style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}>
                        <CharacterArt character={character} />
                        <div className="w-16 h-2 bg-black/40 rounded-full blur-sm mt-1 mx-auto"></div>
                    </div>
                </div>
            </div>

            {/* Обратный отсчет */}
            {status === 'countdown' && !isInstructionModalVisible && (
                <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center">
                    <div className="text-9xl font-black text-white animate-ping">{countdown > 0 ? countdown : "СПОРИМ!"}</div>
                </div>
            )}
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </div>
    );
};