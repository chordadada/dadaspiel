
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { NEPODAVIS_HEAD_ART, PIXEL_ART_PALETTE, BLACK_PLAYER_ART_DATA } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';
import { GUARD_ART_DATA } from '../../miscArt';

// --- КОНФИГУРАЦИЯ ПЕРСОНАЖЕЙ ---
const CHAR_CONFIG = {
    [Character.KANILA]: {
        gasName: "КИСЛОРОД",
        gasColor: "blue",
        badItems: ['🍑', '🥒', '🍌', '🧱', '🍺', '👁️', '🍕'],
        bubbleStyle: "bg-blue-400/60 border-blue-200 shadow-[inset_-4px_-4px_8px_rgba(0,0,100,0.5),inset_4px_4px_8px_rgba(255,255,255,0.8)]",
        winTitle: "ЧТО-ТО ОТКАШЛЯЛОСЬ!",
        winText: "Пойду отнесу в галерею!",
        winColor: "text-blue-400"
    },
    [Character.SEXISM]: {
        gasName: "ВЕСЕЛЯЩИЙ ГАЗ",
        gasColor: "pink",
        badItems: ['🍑', '🍅', '🍆', '🍷', '🍩', '🔮', '🧮'],
        bubbleStyle: "bg-pink-400/60 border-pink-200 shadow-[inset_-4px_-4px_8px_rgba(150,0,50,0.5),inset_4px_4px_8px_rgba(255,200,200,0.8)]",
        winTitle: "УДАЧНЫЙ ПЕРФОРМАНС!",
        winText: "Чуть было не стал инсталляцией!",
        winColor: "text-pink-400"
    },
    [Character.BLACK_PLAYER]: {
        gasName: "КВАНТОВЫЙ ГАЗ",
        gasColor: "black",
        badItems: ['🍑', '0', '1', '💊', '🎲', '8', '💾'],
        bubbleStyle: "bg-black-600/60 border-purple-400 shadow-[inset_-4px_-4px_8px_rgba(50,0,50,0.5),inset_4px_4px_8px_rgba(200,100,255,0.8)]",
        winTitle: "СИСТЕМА ОЧИЩЕНА!",
        winText: "Требуется спящий режим!",
        winColor: "text-purple-500"
    }
};

// Пузырь Газа (Динамический стиль)
const GasBubble: React.FC<{ styleClass: string }> = ({ styleClass }) => (
    <div className={`w-12 h-12 rounded-full border-2 backdrop-blur-sm animate-pulse ${styleClass}`}>
        <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-80"></div>
    </div>
);

// Рука для приёма Геймлиха (Эмодзи)
const HeimlichHand: React.FC = () => (
    <div className="absolute top-1/2 right-[-150px] text-[150px] transform -translate-y-1/2 animate-[heimlich-thrust_0.2s_ease-out_forwards] z-50 filter drop-shadow-xl cursor-default select-none">
        👋
    </div>
);

// Экран победы (Адаптивный)
export const NePodavisWinScreen: React.FC<{ onContinue: () => void; character: Character | null }> = ({ onContinue, character }) => {
    const { playSound } = useSettings();
    const config = CHAR_CONFIG[character || Character.KANILA];

    useEffect(() => {
        playSound(SoundType.WIN_NEPODAVIS);
    }, [playSound]);
    
    return (
        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
             {/* Character Specific Visuals for Win Screen */}
             {character === Character.SEXISM && <div className="text-6xl mb-4 animate-bounce">💋</div>}
             {character === Character.BLACK_PLAYER && (
                 <div className="mb-4 transform scale-150 animate-pulse">
                     <PixelArt artData={BLACK_PLAYER_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={4} />
                 </div>
             )}

             <h2 className={`text-4xl ${config.winColor} mb-8 font-bold text-center`}>{config.winTitle}</h2>
             <div className="text-xl text-white mb-8 text-center max-w-md px-4">
                {config.winText}
             </div>
             <button onClick={onContinue} className={`pixel-button p-4 text-2xl z-50 ${character === Character.BLACK_PLAYER ? 'bg-purple-900 hover:bg-purple-800' : 'bg-green-700 hover:bg-green-800'}`}>
                ПРОХОДИМ
             </button>
        </div>
    );
};

// Экран поражения (Вахтёрша)
const HeimlichDefeatScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
    return (
        <div className="absolute inset-0 bg-red-900 z-50 flex flex-col items-center justify-center animate-[fadeIn_0.2s]">
            <div className="mb-4 transform scale-150">
                <PixelArt artData={GUARD_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={5} />
            </div>
            <h2 className="text-3xl text-white font-black text-center mb-2">ПРИЁМ ГЕЙМЛИХА!</h2>
            <p className="text-xl text-yellow-300 font-mono text-center px-4 mb-8 bg-black/50 p-2 animate-pulse">
                ДИАГНОЗ: ОСТРАЯ НЕПЕРЕНОСИМОСТЬ ДАДАИЗМА
            </p>
            <button onClick={onRetry} className="pixel-button p-4 text-xl bg-gray-700 hover:bg-gray-600">
                ТАК ВОТ ОНО ЧТО!
            </button>
        </div>
    );
};

// Компонент головы игрока
const PlayerHead: React.FC<{ artData: string[], isHit: boolean, isRecovering: boolean, isCoughing: boolean, hasCombo: boolean }> = ({ artData, isHit, isRecovering, isCoughing, hasCombo }) => {
    let animationClass = '';
    if (isCoughing) animationClass = 'animate-cough-lunge';
    else if (isRecovering) animationClass = 'animate-recover-shake';
    else if (isHit) animationClass = 'animate-hit-shake';

    return (
        <div className={`relative ${animationClass} transition-transform duration-200 ${isRecovering ? 'scale-125' : 'scale-100'}`}>
            {hasCombo && (
                <div className="absolute -inset-4 rounded-full bg-yellow-400/20 blur-xl animate-pulse z-0"></div>
            )}
            <div className="relative z-10">
                <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={8} />
            </div>
        </div>
    );
};

// Визуальный эффект удушья (Красная пульсация)
const ChokeOverlay: React.FC<{ intensity: number }> = ({ intensity }) => {
    return (
        <div 
            className="absolute inset-0 pointer-events-none z-30 transition-colors duration-100"
            style={{
                backgroundColor: `rgba(150, 0, 0, ${intensity * 0.6})`,
                boxShadow: `inset 0 0 ${intensity * 100}px rgba(50,0,0,0.9)`
            }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,#450a0a_100%)] opacity-80"></div>
        </div>
    );
};

interface Projectile {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    content: string | React.ReactNode;
    type: 'bad' | 'good';
    angle: number;
    rotSpeed: number;
}

interface ExpelledItem {
    id: number;
    char: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    rot: number;
    rotSpeed: number;
}

export const NePodavis: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { character } = useSession();
    const { playSound } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    
    // Config based on character
    const charConfig = useMemo(() => CHAR_CONFIG[character || Character.KANILA], [character]);

    // Game State
    const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing');
    const [gamePhase, setGamePhase] = useState<'collect' | 'choke'>('collect');
    const [heimlichAnimation, setHeimlichAnimation] = useState(false);
    
    // Phase 1: Collection
    const [otbitost, setOtbitost] = useState(0);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    
    // Phase 2: Choke
    const [chokeLevel, setChokeLevel] = useState(0); // 0 to 100
    const [currentBPM, setCurrentBPM] = useState(0);
    const [bpmFeedback, setBpmFeedback] = useState<'good' | 'bad' | null>(null);
    const [comboStreak, setComboStreak] = useState(0);
    
    // Visuals & Animations
    const [isHitVisual, setIsHitVisual] = useState(false);
    const [isCoughing, setIsCoughing] = useState(false);
    const [particles, setParticles] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{id:number, text:string, x:number, y:number, color:string}[]>([]);
		
    // Win Animation State
    const [isExpelling, setIsExpelling] = useState(false);
    const [expelledItems, setExpelledItems] = useState<ExpelledItem[]>([]);

    // Refs
    const hasFinished = useRef(false);
    const projectileId = useRef(0);
    const particleId = useRef(0);
    const lastTapTime = useRef<number>(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const charArt = useMemo(() => NEPODAVIS_HEAD_ART[character || Character.KANILA], [character]);

    const settings = useMemo(() => {
        // Difficulty adjustments
        // Slower base speed to reduce difficulty
        let speedMult = 0.7;
        let spawnRate = 0.04;
        let bottomMargin = 93;
        let topMargin = 107;
        
        if (character === Character.KANILA) { spawnRate = 0.03; speedMult = 0.6; bottomMargin = 91; topMargin = 109;}
        if (character === Character.BLACK_PLAYER) { spawnRate = 0.05; speedMult = 0.8; bottomMargin = 95; topMargin = 105;}

        return { speedMult, spawnRate, bottomMargin, topMargin };
    }, [character]);

    // Start Phase 2 Transition
    const triggerChoke = useCallback(() => {
        if (gamePhase === 'choke') return;
        playSound(SoundType.BOSS_ROAR);
        setGamePhase('choke');
        setChokeLevel(85); // Start high!
        setProjectiles([]);
        lastTapTime.current = 0; // Reset rhythm
        setComboStreak(0); // Reset combo
        setFeedback(f => [...f, {id: Date.now(), text: "УДУШЬЕ!", x: 50, y: 50, color: 'text-red-600 text-4xl'}]);
    }, [gamePhase, playSound]);

    // Trigger Heimlich Defeat Sequence
    const triggerHeimlich = useCallback(() => {
        if (heimlichAnimation) return;
        setHeimlichAnimation(true);
        // Sequence handled in useEffect below
    }, [heimlichAnimation]);

    // Handle Heimlich Sequence Timing
    useEffect(() => {
        if (heimlichAnimation) {
            // 1. Hand appears (CSS animation starts)
            
            // 2. Slap sound at impact point (approx 0.1s in)
            const t1 = setTimeout(() => {
                playSound(SoundType.SLAP);
                // Visual shake handled by CSS on player
                setIsHitVisual(true);
            }, 100);

            // 3. Screen clear & Gasp (0.5s in)
            const t2 = setTimeout(() => {
                setChokeLevel(0); // "Returns to normal"
                playSound(SoundType.GASP);
            }, 500);

            // 4. Defeat Screen (1.5s in)
            const t3 = setTimeout(() => {
                hasFinished.current = true;
                setStatus('lost');
            }, 1500);

            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
    }, [heimlichAnimation, playSound]);

    // Trigger Win Expulsion Animation
    const triggerExpulsion = useCallback(() => {
        setIsExpelling(true);
        playSound(SoundType.GASP);
        
        // Generate burst of items
        const newItems: ExpelledItem[] = [];
        const count = 30;
        const badItems = charConfig.badItems;
        
        for(let i=0; i<count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2; // Upwards cone
            const speed = 80 + Math.random() * 100;
            
            newItems.push({
                id: i,
                char: badItems[i % badItems.length],
                x: 50,
                y: 50,
                vx: Math.cos(angle) * speed * 0.5,
                vy: Math.sin(angle) * speed,
                scale: 0.5,
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 360
            });
        }
        setExpelledItems(newItems);
        setIsHitVisual(true); // Shake head

        // Play burst sound
        let i = 0;
        const interval = setInterval(() => {
            if(i < 5) {
                playSound(SoundType.COUGH);
                i++;
            } else clearInterval(interval);
        }, 150);

        // End game after animation
        setTimeout(() => {
            setStatus('won');
        }, 2500);

    }, [charConfig, playSound]);

    // Core Logic for Rhythm Tapping (shared between Click and Spacebar)
    const processRhythmTap = useCallback(() => {
        if (otbitost <= 0) {
            setFeedback(f => [...f, {id: Date.now(), text: "НЕТ БОЛЬШЕ СИЛ!", x: 50, y: 70, color: 'text-gray-500'}]);
            return; // Cannot fight back without resilience
        }

        const now = Date.now();
        const diff = now - lastTapTime.current;

        // MOBILE FIX: Debounce logic to prevent double-firing
        // If tap is registered < 100ms after the previous one, it's likely a ghost click or browser event doubling
        if (lastTapTime.current > 0 && diff < 100) {
            return;
        }
        
        if (lastTapTime.current === 0) {
            // First tap just starts the timer
            lastTapTime.current = now;
            return;
        }

        lastTapTime.current = now;
        
        // Calculate BPM based on interval
        // Cap max BPM to prevent infinity/crazy numbers on very fast legit double taps
        const bpm = diff > 0 ? Math.min(999, Math.round(60000 / diff)) : 0;
        setCurrentBPM(bpm);

        // Logic: 2 clicks = 1 impact event. We calculate impact on every click based on interval from previous.
        
        // Tolerance Window depends on Character
        if (bpm >= settings.bottomMargin && bpm <= settings.topMargin) {
            // Good Hit
            playSound(SoundType.COUGH); // Satisfying sound
            
            // Combo Logic
            const newStreak = comboStreak + 1;
            setComboStreak(newStreak);
            
            let chokeReduction = 2.5;
            
            // Combo Bonus (Every 3 hits)
            if (newStreak % 3 === 0) {
                playSound(SoundType.POWERUP);
                chokeReduction += 3.0; // Bonus reduction
                setFeedback(f => [...f, {id: Date.now(), text: `COMBO x${newStreak}!`, x: 50, y: 30, color: 'text-yellow-300 text-3xl font-black'}]);
            }

            setChokeLevel(c => Math.max(0, c - chokeReduction)); // More effective!
            setOtbitost(o => Math.max(0, o - 0.5));
            setBpmFeedback('good');
            
            // Trigger visual cough
            setIsCoughing(true);
            setTimeout(() => setIsCoughing(false), 150);
            
            // Particles
            const a = Math.random() * 6.28; const s = 40;
            setParticles(pts => [...pts, { id: particleId.current++, x: 50, y: 50, vx: Math.cos(a)*s, vy: Math.sin(a)*s, color: '#4ade80' }]);
            setTimeout(() => setParticles(pts => pts.slice(1)), 300);

        } else {
            // Bad Hit
            playSound(SoundType.PUNISHMENT_CLICK); // Dull sound
            setComboStreak(0); // Reset combo
            
            setChokeLevel(c => Math.max(0, c - 1.0)); // Less effective
            setOtbitost(o => Math.max(0, o - 1.0)); // More expensive
            setBpmFeedback('bad');
        }
    }, [otbitost, playSound, comboStreak, settings.bottomMargin, settings.topMargin]);

    // Keyboard Listener for Spacebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (status !== 'playing' || heimlichAnimation || isInstructionModalVisible || isExpelling) return;
            
            if (e.code === 'Space') {
                if (gamePhase === 'choke') {
                    e.preventDefault(); // Prevent scrolling
                    processRhythmTap();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, heimlichAnimation, isInstructionModalVisible, gamePhase, processRhythmTap, isExpelling]);

    // Game Loop
    useGameLoop(useCallback((deltaTime) => {
				// Special case: Run loop during expulsion animation
        if (isExpelling) {
            const dtSec = deltaTime / 1000;
            setExpelledItems(items => items.map(item => ({
                ...item,
                x: item.x + item.vx * dtSec,
                y: item.y + item.vy * dtSec,
                vy: item.vy + 100 * dtSec, // Gravity
                scale: item.scale + 1.5 * dtSec, // Grow rapidly
                rot: item.rot + item.rotSpeed * dtSec
            })));
            return;
        }

        if(hasFinished.current || status !== 'playing' || heimlichAnimation) return;
        const dtSec = deltaTime / 1000;

        if (gamePhase === 'collect') {
            // Spawn Projectiles
            if (Math.random() < settings.spawnRate) {
                const isOxygen = Math.random() < 0.3; // 30% Oxygen
                const type = isOxygen ? 'good' : 'bad';
                // Use character-specific bad items
                const content = isOxygen 
                    ? <GasBubble styleClass={charConfig.bubbleStyle} /> 
                    : charConfig.badItems[Math.floor(Math.random() * charConfig.badItems.length)];
                
                const dist = 80; 
                
                // Spawn position (Circle edge)
                const angle = Math.random() * 2 * Math.PI;
                const startX = 50 + Math.sin(angle) * dist;
                const startY = 50 - Math.cos(angle) * dist;

                // Target position (NOT always center 50,50)
                // Add spread so some miss the player
                const spread = 20; // Target within 30-70 range
                const targetX = 50 + (Math.random() - 0.5) * spread;
                const targetY = 50 + (Math.random() - 0.5) * spread;
                
                // Calculate velocity vector towards target
                const dx = targetX - startX;
                const dy = targetY - startY;
                const distance = Math.sqrt(dx*dx + dy*dy);
                const vx = dx / distance;
                const vy = dy / distance;
                
                setProjectiles(p => [...p, { 
                    id: projectileId.current++, 
                    x: startX, 
                    y: startY, 
                    vx, vy, 
                    content, type, 
                    angle: 0, rotSpeed: (Math.random() - 0.5) * 200
                }]);
            }

            // Move & Check Collision
            setProjectiles(currentProjs => {
                const updated = [];
                // Calculate speed based on resilience (Otbitost).
                // Base speed is ~12. Increases linearly with Otbitost to make it harder.
                // At 100 Otbitost, speed +10.
                const speed = (12 + (otbitost * 0.1)) * settings.speedMult;

                for (const p of currentProjs) {
                    const newX = p.x + p.vx * speed * dtSec; 
                    const newY = p.y + p.vy * speed * dtSec;
                    const dist = Math.sqrt(Math.pow(newX - 50, 2) + Math.pow(newY - 50, 2));
                    
                    // Hit Player Logic
                    if (dist < 8) { 
                        if (p.type === 'bad') {
                            // Bad item hit face -> Choke starts immediately
                            playSound(SoundType.PLAYER_HIT);
                            triggerChoke();
                            return []; // Clear projectiles
                        } else {
                            // Oxygen inhaled -> Good!
                            playSound(SoundType.LIQUID_CATCH);
                            setOtbitost(o => o + 2);
                            setFeedback(f => [...f, {id: Date.now(), text: "+2", x: 50, y: 40, color: 'text-blue-300'}]);
                        }
                        continue; 
                    } 
                    
                    if (dist > 100) continue; 
                    updated.push({ ...p, x: newX, y: newY, angle: p.angle + p.rotSpeed * dtSec });
                }
                return updated;
            });

        } else if (gamePhase === 'choke') {
            
            // Check Otbitost exhaustion first!
            if (otbitost <= 0) {
                // If out of resilience, choke increases rapidly (doom scenario)
                setChokeLevel(c => {
                    const next = c + 35 * dtSec; // Super fast fill
                    if (next >= 99 && !hasFinished.current) {
                        triggerHeimlich();
                        return 99;
                    }
                    return next;
                });
            } else {
                // Normal choke increase
                setChokeLevel(c => {
                    const next = c + 1.5 * dtSec;
                    // Defeat at 99%
                    if (next >= 99 && !hasFinished.current) {
                        triggerHeimlich();
                        return 99;
                    }
                    return next;
                });
            }
            
            // Win condition: Drop below 50%
            if (chokeLevel < 50 && !hasFinished.current && !isExpelling) {
                hasFinished.current = true;
								// Trigger Expulsion animation BEFORE setting status to 'won'
                triggerExpulsion();
            }
        }
        
        // Visual cleanup
        setFeedback(prev => prev.filter(f => Math.random() > 0.02)); // Decay

    }, [status, gamePhase, settings, triggerChoke, chokeLevel, playSound, triggerHeimlich, heimlichAnimation, otbitost, charConfig, isExpelling, triggerExpulsion]), status === 'playing' && !isInstructionModalVisible);

    // Interaction Handler
    const handleInteraction = (e: React.MouseEvent | React.TouchEvent, type: 'projectile' | 'rhythm', id?: number) => {
        e.stopPropagation();
        if (status !== 'playing' || heimlichAnimation || isExpelling) return;

        // --- Phase 1: Deflect Items ---
        if (type === 'projectile' && gamePhase === 'collect') {
            const p = projectiles.find(p => p.id === id);
            if (!p) return;

            if (p.type === 'bad') {
                // Deflect Bad -> +1 Resilience
                playSound(SoundType.SWOOSH);
                setOtbitost(o => o + 1);
                // Visual pop
                const newParticles = Array.from({length: 4}).map((_, i) => ({ id: particleId.current++, x: p.x, y: p.y, angle: i * 90 }));
                setParticles(pts => [...pts, ...newParticles]);
                setTimeout(() => setParticles(pts => pts.slice(4)), 400);
            } else {
                // Pop Oxygen -> -1 Resilience (Bad move, but not fatal)
                playSound(SoundType.ITEM_CATCH_BAD);
                setOtbitost(o => Math.max(0, o - 1));
                setFeedback(f => [...f, {id: Date.now(), text: "-1", x: p.x, y: p.y, color: 'text-blue-500'}]);
            }
            setProjectiles(list => list.filter(item => item.id !== id));
        } 
        
        // --- Phase 2: Rhythm Tap ---
        else if (type === 'rhythm' && gamePhase === 'choke') {
            processRhythmTap();
        }
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    const handleLose = () => {
        playSound(SoundType.BUTTON_CLICK);
        onLose();
    };

    // Derived Visuals
    const intensity = gamePhase === 'choke' ? chokeLevel / 100 : 0;

    return (
        <div className="w-full h-full relative overflow-hidden bg-gray-900 select-none touch-none">
             <style>{`
                @keyframes hit-shake { 0%, 100% { transform: translate(0, 0) rotate(0); } 25% { transform: translate(-5px, 0); } 75% { transform: translate(5px, 0); } } 
                .animate-hit-shake { animation: hit-shake 0.2s ease-in-out; }
                @keyframes recover-shake { 0% { transform: scale(1.2); } 50% { transform: scale(1.3); } 100% { transform: scale(1.2); } } 
                .animate-recover-shake { animation: recover-shake 0.1s; }
                @keyframes cough-lunge { 0% { transform: scale(1.2) translateY(0); } 30% { transform: scale(1.1) translateY(10px); } 100% { transform: scale(1.2) translateY(0); } }
                .animate-cough-lunge { animation: cough-lunge 0.15s ease-out; }
                @keyframes heimlich-thrust { from { right: -150px; } to { right: 50%; transform: translateX(50%) translateY(-50%); } }
                .particle { animation: poof 0.4s ease-out forwards; }
                @keyframes poof { from { transform: translate(0, 0) scale(0.5); opacity: 1; } to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } }
            `}</style>
            
            {/* Background */}
            <div className={`absolute inset-0 transition-colors duration-500 bg-gray-800`}></div>
            {gamePhase === 'choke' && !heimlichAnimation && !isExpelling && <ChokeOverlay intensity={intensity} />}

            {status === 'won' && <NePodavisWinScreen onContinue={handleWinContinue} character={character} />}
            {status === 'lost' && <HeimlichDefeatScreen onRetry={handleLose} />}
            
            {!isInstructionModalVisible && status === 'playing' && <>
                <MinigameHUD>
                    <div className="w-full flex justify-between items-start px-4">
                        {/* Otbitost Meter */}
                        <div className="flex flex-col items-center">
                            <span className="text-sm text-yellow-300 font-bold mb-1">ОТБИТОСТЬ</span>
                            <div className="text-3xl font-mono text-white border-2 border-yellow-500 bg-black/50 px-2 rounded">
                                {Math.floor(otbitost)}
                            </div>
                        </div>

                        {/* Phase 2 Specifics */}
                        {gamePhase === 'choke' && !isExpelling && (
                            <div className="flex flex-col items-center animate-pulse">
                                <span className="text-red-500 font-black text-xl">ДЕРЖИ РИТМ 100 УДАРОВ в СЕКУНДУ!</span>
                                <div className={`text-4xl font-mono font-bold ${bpmFeedback === 'good' ? 'text-green-400' : bpmFeedback === 'bad' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {currentBPM || "--"}
                                </div>
                                {/* Combo Counter Display */}
                                {comboStreak > 1 && (
                                    <div className="text-yellow-300 font-black text-xl animate-bounce mt-1">
                                        COMBO x{comboStreak}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="text-xl text-red-400 font-mono p-1"></div>
                    </div>
                </MinigameHUD>

                {/* Main Interaction Area */}
                <div 
                    className="absolute inset-0 flex items-center justify-center z-10"
                    onClick={(e) => handleInteraction(e, 'rhythm')}
                    onTouchStart={(e) => handleInteraction(e, 'rhythm')}
                >
                    <div className="relative pointer-events-none">
                        <PlayerHead 
                            artData={charArt} 
                            isHit={isHitVisual} 
                            isRecovering={gamePhase === 'choke'} 
                            isCoughing={isCoughing || isExpelling} 
                            hasCombo={comboStreak >= 3} 
                        />
                    </div>
                </div>
                                {/* Expulsion Animation Items */}
                {isExpelling && expelledItems.map(item => (
                    <div 
                        key={item.id}
                        className="absolute text-center z-50 pointer-events-none"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rot}deg)`,
                            fontSize: '3rem',
                            opacity: 1
                        }}
                    >
                        {item.char}
                    </div>
                ))}

                {/* Projectiles (Phase 1) */}
                {gamePhase === 'collect' && projectiles.map(p => (
                    <div 
                        key={p.id} 
                        className={`absolute flex items-center justify-center cursor-pointer transition-transform active:scale-90`} 
                        style={{
                            left: `${p.x}%`, 
                            top: `${p.y}%`, 
                            transform: `translate(-50%,-50%) rotate(${p.angle}deg)`,
                            fontSize: '2.5rem',
                            zIndex: 20
                        }} 
                        onClick={(e) => handleInteraction(e, 'projectile', p.id)} 
                        onTouchStart={(e) => handleInteraction(e, 'projectile', p.id)}
                    >
                        {p.content}
                    </div>
                ))}

                {/* Particles */}
                {particles.map(p => <div key={p.id} className="particle absolute text-white text-3xl pointer-events-none z-20" style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.color || 'white', '--tx': `${Math.cos(p.angle * Math.PI/180) * 60}px`, '--ty': `${Math.sin(p.angle * Math.PI/180) * 60}px` } as React.CSSProperties}>💥</div>)}
                
                {/* Feedback Text */}
                {feedback.map(f => (
                    <div key={f.id} className={`absolute font-bold pointer-events-none animate-[float-up_0.8s_forwards] z-30 ${f.color}`} style={{left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%, -50%)'}}>{f.text}</div>
                ))}

                {/* Heimlich Hand Animation */}
                {heimlichAnimation && <HeimlichHand />}

                {/* Choke Bar (Phase 2) */}
                {gamePhase === 'choke' && !heimlichAnimation && !isExpelling && (
                    <>
                        {/* Compact Choke Bar Container - Positioned at bottom */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-1/2 h-6 z-40">
                            
                            {/* 1. The Visual Bar (Gradient + Border) */}
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-gray-900">
                                {/* Full Gradient Background */}
                                <div className="absolute inset-0 w-full h-full opacity-90" style={{
                                    background: 'linear-gradient(to right, #4ade80 0%, #facc15 50%, #ef4444 90%, #7f1d1d 100%)'
                                }}></div>

                                {/* Vertical Line inside bar (Cursor) */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_5px_rgba(255,255,255,0.8)] mix-blend-overlay"
                                    style={{ 
                                        left: `${chokeLevel}%`, 
                                        transform: 'translateX(-50%)',
                                        transition: 'left 0.1s linear' // Smooth movement
                                    }}
                                ></div>

                                {/* Markers (Inside bar) */}
                                <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-black/50 z-10"></div>
                                <div className="absolute top-0 bottom-0 left-[99%] w-0.5 bg-black/50 z-10"></div>
                            </div>

                            {/* 2. The Pointer (Triangle on top) - Outside the overflow-hidden div */}
                            <div
                                className="absolute top-[-10px] z-50 pointer-events-none"
                                style={{
                                    left: `${chokeLevel}%`,
                                    transform: 'translateX(-50%)',
                                    transition: 'left 0.1s linear'
                                }}
                            >
                                {/* CSS Triangle */}
                                <div style={{
                                    width: 0, 
                                    height: 0, 
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderTop: '12px solid white',
                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
                                }}></div>
                            </div>

                            {/* 3. Text Labels (Above Bar) */}
                            <div className="absolute -top-6 left-[50%] -translate-x-1/2 text-[10px] font-bold text-green-400 drop-shadow-md whitespace-nowrap">ДА</div>
                            <div className="absolute -top-6 left-[99%] -translate-x-1/2 text-[10px] font-bold text-red-500 drop-shadow-md whitespace-nowrap">АД</div>

                        </div>

                        {/* Title Below Bar */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm shadow-black drop-shadow-md z-40">
                            СТЕПЕНЬ УДУШЬЯ {Math.ceil(chokeLevel)}%
                        </div>
                    </>
                )}
            </>}
        </div>
    );
};
