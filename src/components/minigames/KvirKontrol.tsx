
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSettings, useSession, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { MINI_GUARD_ART } from '../../miscArt';

// --- Types ---

type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'rhombus';
const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'rhombus'];

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F1C', '#D4A5A5'];
const INVENTORY_SLOTS_X = [20, 40, 60, 80]; // Fixed X percentages for slots

interface GameShape {
    id: number;
    slotIndex: number; // 0-3, tracks which inventory slot this belongs to
    currentType: ShapeType;
    color: string;
    x: number; // percentage
    y: number; // percentage
    isPlaced: boolean;
    isHeld: boolean;
    morphTimer: number; // ms until next morph
    morphDuration: number; // total duration of current form
}

interface TargetSlot {
    id: number;
    requiredType: ShapeType;
    x: number;
    y: number;
    isFilled: boolean;
}

// --- Visual Components ---

const ShapeSVG: React.FC<{ type: ShapeType, color: string, size?: number, isGhost?: boolean, glowing?: boolean }> = ({ type, color, size = 60, isGhost = false, glowing = false }) => {
    let path = "";
    switch (type) {
        case 'circle': path = "M 30, 30 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0"; break;
        case 'square': path = "M 5,5 H 55 V 55 H 5 Z"; break;
        case 'triangle': path = "M 30,5 L 55,50 H 5 Z"; break;
        case 'star': path = "M 30,2 L 37,22 L 58,22 L 41,35 L 48,55 L 30,42 L 12,55 L 19,35 L 2,22 L 23,22 Z"; break;
        case 'rhombus': path = "M 30,2 L 55,30 L 30,58 L 5,30 Z"; break;
    }

    const strokeColor = glowing ? '#00FFFF' : color;
    const strokeWidth = isGhost ? (glowing ? 3 : 2) : 0;
    const filter = glowing ? 'drop-shadow(0 0 5px #00FFFF)' : 'none';

    return (
        <svg width={size} height={size} viewBox="0 0 60 60" style={{ overflow: 'visible', filter }}>
            <path 
                d={path} 
                fill={isGhost ? 'none' : color} 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
                strokeDasharray={isGhost ? "4,4" : "none"}
                className="transition-all duration-300"
            />
        </svg>
    );
};

// Spotlight for Black Player (Adjusted opacity)
const SpotlightOverlay: React.FC<{ x: number, y: number, radius: number }> = ({ x, y, radius }) => {
    return (
        <div 
            className="absolute inset-0 pointer-events-none z-30 transition-all duration-75 ease-linear"
            style={{
                // Less dark (0.75 instead of 0.85) to make outlines visible
                background: `radial-gradient(circle ${radius}px at ${x}% ${y}%, transparent 0%, transparent 90%, rgba(0, 0, 0, 0.75) 100%)`
            }}
        >
            <div 
                className="absolute w-full h-full"
                style={{
                    background: `radial-gradient(circle ${radius + 5}px at ${x}% ${y}%, rgba(255,255,255,0.05) 0%, transparent 70%)`
                }}
            />
        </div>
    );
};

// --- Win Screen ---

export const KvirKontrolWinScreen: React.FC<{ onContinue: () => void; character: Character | null }> = ({ onContinue, character }) => {
    const { playSound } = useSettings();
    const [showVideo, setShowVideo] = useState(false);
    const videoUrl = "https://www.youtube.com/watch?v=l0k6Grdu8OQ";

    useEffect(() => {
        playSound(SoundType.WIN_KVIR);
    }, [playSound]);

    let title = "СПЕКТР СОБРАН";
    let sub = "ВЫ — ФЛЮИДНЫ!";
    let bgStyle = "bg-[conic-gradient(at_center,_red,_orange,_yellow,_green,_blue,_indigo,_violet,_red)]";
    let titleColor = "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500";

    if (character === Character.BLACK_PLAYER) {
        title = "ЦЕНЗУРА ПАЛА";
        sub = "ТЬМА ПРИНЯЛА ФОРМУ";
        bgStyle = "bg-[conic-gradient(at_center,_#333,_#000,_#555,_#000,_#333)] grayscale";
        titleColor = "text-red-600";
    } else if (character === Character.KANILA) {
        title = "ХАОС В НОРМЕ";
        sub = "ФОРМА НЕ ИМЕЕТ ЗНАЧЕНИЯ";
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
            {/* Background */}
            <div className={`absolute inset-0 opacity-40 ${bgStyle} animate-[spin_10s_linear_infinite]`}></div>
            
            <div className="z-10 text-center p-8 bg-black/80 border-4 border-white pixel-border">
                <h2 className={`text-4xl md:text-6xl font-bold text-transparent bg-clip-text ${titleColor} animate-pulse mb-4`}>
                    {title}
                </h2>
                <p className="text-xl text-white mb-8">{sub}</p>
                
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setShowVideo(true)} className="pixel-button p-3 text-xl bg-purple-700 hover:bg-purple-600">
                        ЭКСКУРС
                    </button>
                    <button onClick={onContinue} className="pixel-button p-3 text-xl bg-green-700 hover:bg-green-600">
                        ПРИНЯТЬ
                    </button>
                </div>
            </div>

            {showVideo && (
                <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center" onClick={() => setShowVideo(false)}>
                    <div className="relative w-11/12 max-w-4xl aspect-video bg-black pixel-border">
                        <iframe width="100%" height="100%" src={videoUrl.replace("watch?v=", "embed/") + "?autoplay=1"} frameBorder="0" allowFullScreen title="Video"></iframe>
                        <button className="absolute -top-4 -right-4 pixel-button bg-red-600">X</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

export const KvirKontrol: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();
    const { isInstructionModalVisible } = useNavigation();
    
    // --- Settings based on Character ---
    const settings = useMemo(() => {
        const base = { 
            goal: 13, 
            magnetRadius: 15, 
            morphSpeed: 3000, 
            hasCensorship: false,
            initialTime: 45,
            timeAddBase: 5,
            targetCount: 5,
        };
        
        if (character === Character.KANILA) {
            return { ...base, magnetRadius: 25, morphSpeed: 4000, initialTime: 30 };
        } 
        if (character === Character.SEXISM) {
            return { ...base, magnetRadius: 15, morphSpeed: 3000, initialTime: 30 };
        } 
        if (character === Character.BLACK_PLAYER) {
            return { ...base, magnetRadius: 20, morphSpeed: 3500, hasCensorship: true, initialTime: 25 };
        }
        return base;
    }, [character]);

    // --- State ---
    const [shapes, setShapes] = useState<GameShape[]>([]);
    const [targets, setTargets] = useState<TargetSlot[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(settings.initialTime);
    
    // Black Player Specifics
    const [spotlight, setSpotlight] = useState({ x: 50, y: 50, vx: 0.3, vy: 0.4 });
    const [censorshipScore, setCensorshipScore] = useState(0);
    const CENSORSHIP_LIMIT = 5;

    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [feedback, setFeedback] = useState<{id: number, text: string, x: number, y: number, color?: string}[]>([]);
    
    const hasFinished = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const shapesRef = useRef<GameShape[]>([]); 
    const nextShapeId = useRef(0);
    
    const [dragState, setDragState] = useState<{ id: number, startX: number, startY: number, offsetX: number, offsetY: number } | null>(null);

    // --- Helpers ---
    const showFeedback = (text: string, x: number, y: number, color: string = "text-red-500") => {
        setFeedback(prev => [...prev, { id: Date.now() + Math.random(), text, x, y, color }]);
        setTimeout(() => setFeedback(prev => prev.slice(1)), 1000);
    };

    const spawnShape = (slotIndex: number): GameShape => {
        return {
            id: nextShapeId.current++,
            slotIndex,
            currentType: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            x: INVENTORY_SLOTS_X[slotIndex],
            y: 85,
            isPlaced: false,
            isHeld: false,
            morphTimer: Math.random() * settings.morphSpeed,
            morphDuration: settings.morphSpeed * (0.8 + Math.random() * 0.4)
        };
    };

    // Helper to generate non-overlapping target position
    const generateTargetPosition = (existingTargets: TargetSlot[]): {x: number, y: number} => {
        let attempts = 0;
        let x, y;
        let valid = false;
        
        while (!valid && attempts < 50) {
            x = 10 + Math.random() * 80;
            y = 15 + Math.random() * 50;
            valid = true;
            
            // Check distance against existing targets
            for (const t of existingTargets) {
                // Not filled means it's active on board
                if (!t.isFilled) {
                    const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
                    if (dist < 15) { // 15% distance threshold
                        valid = false;
                        break;
                    }
                }
            }
            attempts++;
        }
        // Fallback if full
        if (!valid) {
             x = 10 + Math.random() * 80;
             y = 15 + Math.random() * 50;
        }
        return { x, y };
    };

    // --- Initialization ---
    useEffect(() => {
        // Generate Shapes
        const initialShapes: GameShape[] = [];
        for (let i = 0; i < 4; i++) {
            initialShapes.push(spawnShape(i));
        }

        // Generate Targets
        const initialTargets: TargetSlot[] = [];
        for (let i = 0; i < settings.targetCount; i++) {
            const { x, y } = generateTargetPosition(initialTargets);
            initialTargets.push({
                id: i,
                requiredType: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
                x,
                y,
                isFilled: false
            });
        }

        setShapes(initialShapes);
        setTargets(initialTargets);
        shapesRef.current = initialShapes;
    }, [settings]);

    // --- Game Loop ---
    useGameLoop((deltaTime) => {
        if (hasFinished.current || status !== 'playing' || isInstructionModalVisible) return;
        
        const dt = deltaTime;
        const dtSec = dt / 1000;

        // 1. Timer Logic
        setTimeLeft(prev => {
            const next = prev - dtSec;
            if (next <= 0) {
                hasFinished.current = true;
                setStatus('lost');
                onLose();
                return 0;
            }
            return next;
        });

        // 2. Morph Logic
        setShapes(prev => {
            const next = prev.map(shape => {
                if (shape.isPlaced) return shape;

                let newTimer = shape.morphTimer - dt;
                let newType = shape.currentType;
                let newColor = shape.color;
                let didMorph = false;

                if (newTimer <= 0) {
                    const availableTypes = SHAPE_TYPES.filter(t => t !== shape.currentType);
                    newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                    newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                    newTimer = shape.morphDuration;
                    didMorph = true;
                }

                // Random glitch morph for Black Player
                if (character === Character.BLACK_PLAYER && Math.random() < 0.001) {
                     const availableTypes = SHAPE_TYPES.filter(t => t !== shape.currentType);
                     newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                     didMorph = true;
                }

                return { ...shape, currentType: newType, color: newColor, morphTimer: newTimer };
            });
            shapesRef.current = next;
            return next;
        });

        // 3. Spotlight & Censorship (Black Player)
        if (settings.hasCensorship) {
            setSpotlight(prev => {
                let nx = prev.x + prev.vx * (dt / 16);
                let ny = prev.y + prev.vy * (dt / 16);
                let nvx = prev.vx;
                let nvy = prev.vy;

                if (nx < 10 || nx > 90) nvx *= -1;
                if (ny < 10 || ny > 90) nvy *= -1;

                return { x: nx, y: ny, vx: nvx, vy: nvy };
            });

            // Check collision with held shape
            const heldShape = shapesRef.current.find(s => s.isHeld);
            if (heldShape) {
                const dist = Math.sqrt(Math.pow(heldShape.x - spotlight.x, 2) + Math.pow(heldShape.y - spotlight.y, 2));
                
                if (dist < 12) {
                    playSound(SoundType.DESTROY);
                    setDragState(null);
                    
                    setShapes(prev => {
                        const others = prev.filter(s => s.id !== heldShape.id);
                        return [...others, spawnShape(heldShape.slotIndex)];
                    });

                    setCensorshipScore(prev => {
                        const next = prev + 1;
                        if (next >= CENSORSHIP_LIMIT && !hasFinished.current) {
                            hasFinished.current = true;
                            setStatus('lost');
                            onLose();
                        }
                        return next;
                    });
                    
                    showFeedback("ЗАПРЕЩЕНО!", heldShape.x, heldShape.y);
                }
            }
        }

    }, status === 'playing');

    // --- Interaction ---

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        if (hasFinished.current || status !== 'playing') return;
        e.preventDefault();
        const shape = shapes.find(s => s.id === id);
        if (!shape || shape.isPlaced) return;

        playSound(SoundType.GENERIC_CLICK);

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const xPct = ((clientX - rect.left) / rect.width) * 100;
            const yPct = ((clientY - rect.top) / rect.height) * 100;
            
            setDragState({ id, startX: clientX, startY: clientY, offsetX: xPct - shape.x, offsetY: yPct - shape.y });
            setShapes(prev => prev.map(s => s.id === id ? { ...s, isHeld: true } : s));
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragState || !containerRef.current) return;
        e.preventDefault();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = containerRef.current.getBoundingClientRect();
        
        const xPct = ((clientX - rect.left) / rect.width) * 100;
        const yPct = ((clientY - rect.top) / rect.height) * 100;

        let finalX = xPct - dragState.offsetX;
        let finalY = yPct - dragState.offsetY;

        // Magnetism
        const heldShape = shapes.find(s => s.id === dragState.id);
        if (heldShape) {
            for (const target of targets) {
                if (target.isFilled) continue;
                if (target.requiredType === heldShape.currentType) {
                    const dist = Math.sqrt(Math.pow(target.x - finalX, 2) + Math.pow(target.y - finalY, 2));
                    const threshold = settings.magnetRadius / 8; 
                    
                    if (dist < threshold) {
                        finalX = target.x;
                        finalY = target.y;
                        break;
                    }
                }
            }
        }

        setShapes(prev => prev.map(s => s.id === dragState.id ? { ...s, x: finalX, y: finalY } : s));
    };

    const handlePointerUp = () => {
        if (!dragState) return;
        
        const shape = shapes.find(s => s.id === dragState.id);
        if (shape) {
            let placed = false;
            for (const target of targets) {
                if (target.isFilled) continue;
                const dist = Math.sqrt(Math.pow(target.x - shape.x, 2) + Math.pow(target.y - shape.y, 2));
                
                if (dist < 1 && target.requiredType === shape.currentType) {
                    // Success!
                    placed = true;
                    playSound(SoundType.ITEM_PLACE_SUCCESS);
                    
                    const timeBonus = settings.timeAddBase / (1 + score * 0.15);
                    setTimeLeft(t => t + timeBonus);
                    showFeedback(`+${Math.floor(timeBonus)}с`, target.x, target.y - 10, "text-green-400");

                    setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, isHeld: false, isPlaced: true, x: target.x, y: target.y } : s));
                    
                    // Respawn logic
                    setTimeout(() => {
                        if (hasFinished.current) return;
                        setShapes(curr => {
                            return [...curr, spawnShape(shape.slotIndex)];
                        });
                    }, 500);

                    // Replace Target with check
                    setTimeout(() => {
                         if (hasFinished.current) return;
                         setTargets(curr => {
                             const otherTargets = curr.filter(t => t.id !== target.id);
                             const { x, y } = generateTargetPosition(otherTargets);
                             return curr.map(t => t.id === target.id ? {
                                 ...t,
                                 isFilled: false,
                                 requiredType: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
                                 x,
                                 y
                             } : t);
                         });
                    }, 200);
                    
                    const newScore = score + 1;
                    setScore(newScore);
                    if (newScore >= settings.goal) {
                        hasFinished.current = true;
                        setStatus('won');
                    }
                    break;
                }
            }

            if (!placed) {
                setShapes(prev => prev.map(s => s.id === dragState.id ? { ...s, isHeld: false, x: INVENTORY_SLOTS_X[s.slotIndex], y: 85 } : s));
                playSound(SoundType.GENERIC_CLICK);
            }
        }

        setDragState(null);
    };

    // --- Render ---

    if (status === 'won') {
        return <KvirKontrolWinScreen onContinue={onWin} character={character} />;
    }

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative overflow-hidden select-none touch-none bg-gray-900"
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
        >
            <MinigameHUD>
                <div className="w-full flex items-center justify-between px-2 gap-2 md:gap-4">
                    {/* Timer (Left) */}
                    <div className="text-sm md:text-xl font-bold text-yellow-300 w-1/4 text-left">
                        {Math.ceil(timeLeft)}с
                    </div>

                    {/* Spectrum Bar (Center) */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-xs font-bold text-white mb-1 shadow-black drop-shadow-md">
                            СПЕКТР {score}/{settings.goal}
                        </span>
                        <div className="w-full max-w-xs h-8 bg-gray-700 border-2 border-white rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500"
                                style={{ width: `${(score / settings.goal) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Censorship Bar (Right) - Only if active */}
                    <div className="w-1/4 flex flex-col items-end">
                        {settings.hasCensorship && (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-[10px] text-red-500 font-bold bg-black px-1">ЦЕНЗУРА</span>
                                    <div className="w-4 h-4">
                                        <PixelArt artData={MINI_GUARD_ART} palette={PIXEL_ART_PALETTE} pixelSize={2} />
                                    </div>
                                </div>
                                <div className="w-24 h-4 bg-gray-900 border border-red-900">
                                    <div 
                                        className="h-full bg-red-600 transition-all duration-300" 
                                        style={{ width: `${Math.min(100, (censorshipScore / CENSORSHIP_LIMIT) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </MinigameHUD>

            {/* Spotlight for Black Player */}
            {settings.hasCensorship && (
                <SpotlightOverlay x={spotlight.x} y={spotlight.y} radius={120} />
            )}

            {/* Targets */}
            {targets.map(t => (
                <div 
                    key={t.id} 
                    className={`absolute transition-all duration-300 ${t.isFilled ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                    style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <ShapeSVG 
                        type={t.requiredType} 
                        color="#444" 
                        isGhost={true} 
                        size={80} 
                        glowing={character === Character.BLACK_PLAYER} // Glow for Black Player
                    />
                </div>
            ))}

            {/* Inventory Zone (Visual) */}
            <div className="absolute bottom-0 left-0 w-full h-[25%] bg-gray-800/50 border-t-2 border-white/20 pointer-events-none z-10"></div>

            {/* Shapes */}
            {shapes.map(s => (
                !s.isPlaced && (
                    <div
                        key={s.id}
                        className={`absolute cursor-grab active:cursor-grabbing transition-transform duration-100 z-20 ${s.isHeld ? 'scale-125 z-50 drop-shadow-xl' : 'scale-100'}`}
                        style={{ 
                            left: `${s.x}%`, 
                            top: `${s.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            animation: s.morphTimer < 500 ? 'pulse 0.2s infinite' : 'none'
                        }}
                        onMouseDown={(e) => handlePointerDown(e, s.id)}
                        onTouchStart={(e) => handlePointerDown(e, s.id)}
                    >
                        <ShapeSVG type={s.currentType} color={s.color} />
                    </div>
                )
            ))}

            {/* Feedback Text */}
            {feedback.map(f => (
                <div 
                    key={f.id} 
                    className={`absolute ${f.color} font-bold text-2xl animate-[float-up_1s_forwards] z-50`}
                    style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%, -50%)', textShadow: '2px 2px 0 #000' }}
                >
                    {f.text}
                </div>
            ))}

            <style>{`
                @keyframes float-up { from { opacity: 1; transform: translate(-50%, -50%); } to { opacity: 0; transform: translate(-50%, -150%); } }
            `}</style>
        </div>
    );
};
