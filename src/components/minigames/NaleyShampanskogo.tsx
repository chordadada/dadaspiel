
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { PixelArt } from '../core/PixelArt';
import { BOTTLE_ART_DATA, GLASS_ART_DATA } from '../../miscArt';
import { PIXEL_ART_PALETTE } from '../../../characterArt';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';

const VideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const getEmbedUrl = (videoUrl: string): string => {
        if (videoUrl.includes("youtube.com/watch?v=")) {
            return videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0";
        }
        if (videoUrl.includes("vkvideo.ru/video-")) {
            const parts = videoUrl.split('video-')[1]?.split('_');
            if (parts && parts.length === 2) {
                const oid = `-${parts[0]}`;
                const id = parts[1];
                return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=1`;
            }
        }
        return videoUrl;
    };
    const embedUrl = getEmbedUrl(url);

    return (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center animate-[fadeIn_0.3s]" onClick={onClose}>
            <div className="relative w-11/12 max-w-4xl aspect-video bg-black pixel-border" onClick={(e) => e.stopPropagation()}>
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
                <button onClick={onClose} className="absolute -top-4 -right-4 pixel-button bg-red-600 text-2xl w-12 h-12 flex items-center justify-center z-10" aria-label="Закрыть видео">X</button>
            </div>
        </div>
    );
};

const AnimatedBottle: React.FC<{ anim: string; position: React.CSSProperties; size: string; }> = ({ anim, position, size }) => {
    const splashes = useMemo(() => Array.from({length: 20}).map((_, i) => ({
        style: {
            '--start-x': `${(Math.random() - 0.5) * 20}px`,
            '--start-y': `${(Math.random() - 0.5) * 20}px`,
            '--dx': `${(Math.random() - 0.5) * 250}px`,
            '--dy': `${(Math.random() - 0.9) * 250}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${0.6 + Math.random() * 1}s`,
        } as React.CSSProperties
    })), []);

    return (
        <div className={`absolute ${size}`} style={{ ...position, animation: anim }}>
            🍾
            <div className="relative w-full h-full">
                {splashes.map((s, i) => (
                    <div key={i} className="splash-particle" style={s.style}></div>
                ))}
            </div>
        </div>
    );
};

export const NaleyShampanskogoWinScreen: React.FC<{ onContinue: () => void; onPlayVideo: () => void; character: Character | null }> = ({ onContinue, onPlayVideo, character }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_SHAMPANSKOE);
    }, [playSound]);

    // --- SEXISM: ART DECO ---
    if (character === Character.SEXISM) {
        return (
            <div className="absolute inset-0 z-30 overflow-hidden flex flex-col items-center justify-center bg-black">
                <style>{`
                    .art-deco-frame {
                        border: 8px solid #d4af37;
                        outline: 4px solid black;
                        outline-offset: -12px;
                        background: radial-gradient(circle, #2a2a2a 0%, #000000 100%);
                        box-shadow: 0 0 20px #d4af37;
                    }
                    @keyframes champagne-fill-glass {
                        0% { height: 0%; }
                        100% { height: 75%; }
                    }
                    .golden-liquid {
                        background: linear-gradient(to right, #ffd700, #f0e68c, #daa520);
                        width: 100%;
                        bottom: 0;
                        position: absolute;
                        animation: champagne-fill-glass 2s ease-out forwards;
                    }
                    @keyframes sparkle-rot { 0% { transform: rotate(0deg) scale(0.5); opacity: 0; } 50% { opacity: 1; scale(1); } 100% { transform: rotate(180deg) scale(0); opacity: 0; } }
                    .sparkle { position: absolute; color: #fff; font-size: 20px; animation: sparkle-rot 1s infinite; }
                `}</style>
                
                {/* Art Deco Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #d4af37 0, #d4af37 1px, transparent 0, transparent 50%)',
                    backgroundSize: '30px 30px'
                }}></div>

                <div className="relative z-10 art-deco-frame p-12 flex flex-col items-center">
                    {/* Glass */}
                    <div className="relative w-24 h-32 border-l-4 border-r-4 border-b-4 border-white rounded-b-2xl overflow-hidden mb-4 bg-white/10">
                        <div className="golden-liquid"></div>
                        {/* Bubbles in liquid */}
                        {Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="absolute bg-white/50 rounded-full w-1 h-1 bottom-0 animate-[rise-pop_1.5s_infinite]" style={{
                                left: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.3}s`
                            }}></div>
                        ))}
                    </div>
                    
                    <h2 className="text-4xl text-[#d4af37] font-serif tracking-widest mb-2">LE GRAND CRU</h2>
                    <p className="text-white font-serif italic text-sm">Искусство потребления</p>
                </div>

                <div className="flex gap-4 mt-12 z-20">
                    <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-[#b8860b] text-black hover:bg-[#cfb53b]">ВИДЕО-АРТ</button>
                    <button onClick={onContinue} className="pixel-button p-3 text-xl bg-white text-black hover:bg-gray-200">БРАВО</button>
                </div>
            </div>
        );
    }

    // --- BLACK PLAYER: ANTI-MATTER ---
    if (character === Character.BLACK_PLAYER) {
        return (
            <div className="absolute inset-0 z-30 overflow-hidden flex flex-col items-center justify-center bg-white invert">
                <style>{`
                    @keyframes anti-flow {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(-100%); }
                    }
                    @keyframes glitch-text-black {
                        0% { transform: skew(0deg); }
                        20% { transform: skew(-10deg); }
                        40% { transform: skew(10deg); }
                        60% { transform: skew(-5deg); }
                        80% { transform: skew(5deg); }
                        100% { transform: skew(0deg); }
                    }
                    .black-drop {
                        position: absolute;
                        background: black;
                        width: 4px;
                        height: 20px;
                        border-radius: 2px;
                        animation: anti-flow 1s linear infinite;
                    }
                `}</style>
                
                {/* Rising "Anti-Liquid" Background */}
                <div className="absolute inset-0 flex justify-around opacity-20">
                    {Array.from({length: 20}).map((_, i) => (
                        <div key={i} className="w-1 bg-black h-full" style={{
                            animation: `anti-flow ${2 + Math.random()}s linear infinite`,
                            opacity: Math.random()
                        }}></div>
                    ))}
                </div>

                <div className="relative z-10 filter invert scale-150">
                     <PixelArt artData={BOTTLE_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={6} />
                </div>

                <h2 className="text-5xl font-mono font-bold mt-12 z-10 glitch-text-black text-black tracking-widest bg-white px-2">
                    ПУСТОТА НАЛИТА
                </h2>
                
                <div className="flex gap-4 mt-8 z-20">
                    <button onClick={onPlayVideo} className="pixel-button p-3 text-xl border-black text-black bg-transparent hover:bg-black hover:text-white transition-colors">ИСТОК</button>
                    <button onClick={onContinue} className="pixel-button p-3 text-xl bg-black text-white hover:bg-gray-800">ПРИНЯТЬ</button>
                </div>
            </div>
        );
    }

    // --- GENERIC / FALLBACK ---
    const bottles = useMemo(() => [
        { anim: 'bottle-celebrate-1 4s ease-in-out infinite', position: { left: '10%', bottom: '10%' }, size: 'text-8xl' },
        { anim: 'bottle-celebrate-2 3.5s ease-in-out infinite', position: { right: '5%', bottom: '15%' }, size: 'text-9xl' },
        { anim: 'bottle-celebrate-3 4.2s ease-in-out infinite', position: { left: '40%', bottom: '5%' }, size: 'text-8xl' },
    ], []);

    const bubbles = useMemo(() => Array.from({ length: 300 }).map((_, i) => {
        const size = `${Math.random() * 20 + 5}px`;
        return {
            style: {
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 5}s`,
                animationDelay: `${0.2 + Math.random() * 4.8}s`,
            }
        };
    }), []);

    return (
        <div 
            className="absolute inset-0 z-30 overflow-hidden flex flex-col items-center justify-center" 
            style={{background: 'radial-gradient(circle, #fef08a, #fcd34d, #f59e0b)'}}
        >
            <style>{`
                @keyframes rise-pop {
                    0% { bottom: -10%; opacity: 0; transform: scale(0.5); }
                    10% { opacity: 0.7; transform: scale(1); }
                    99% { bottom: 110%; opacity: 1; transform: scale(1.2); }
                    100% { bottom: 110%; opacity: 0; transform: scale(0); }
                }
                .bubble-particle {
                    position: absolute;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 240, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    animation: rise-pop ease-in forwards;
                    box-shadow: inset 0 0 5px rgba(255,255,255,0.5);
                }

                @keyframes splash-fly {
                    from { transform: translate(var(--start-x), var(--start-y)) scale(1); opacity: 1; }
                    to { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
                }
                .splash-particle {
                    position: absolute; top: 0; left: 0;
                    width: 8px; height: 8px;
                    background: white;
                    border-radius: 50%;
                    animation: splash-fly ease-out forwards;
                }
                
                @keyframes bottle-celebrate-1 {
                    0%, 100% { transform: rotate(-15deg) translateY(0); }
                    50% { transform: rotate(10deg) translateY(-20px); }
                }
                @keyframes bottle-celebrate-2 {
                     0%, 100% { transform: rotate(20deg) translateY(5px); }
                    50% { transform: rotate(-10deg) translateY(-15px); }
                }
                @keyframes bottle-celebrate-3 {
                    0%, 100% { transform: rotate(5deg) translateY(0); }
                    50% { transform: rotate(5deg) translateY(-25px); }
                }

                @keyframes text-appear { 
                    from { opacity: 0; transform: scale(0.5); } 
                    to { opacity: 1; transform: scale(1); } 
                }
                
                @keyframes heady-wobble {
                    0%, 100% { transform: rotate(-1deg) scale(1); }
                    50% { transform: rotate(1deg) scale(1.05); }
                }

                .heady-title {
                    animation: text-appear 1s ease-out forwards, heady-wobble 2.5s ease-in-out infinite 1s;
                    text-shadow: 0 0 5px #fff, 0 0 10px #fde047, 0 0 15px #fde047, 0 0 20px #fde047;
                    color: #fff;
                }
            `}</style>
            
            {bubbles.map((bubble, i) => (
                <div key={i} className="bubble-particle" style={bubble.style}></div>
            ))}
            
            <div className="text-center z-20 flex flex-col items-center gap-4">
                <h2 className="text-5xl heady-title opacity-0">Vinum artem favet!</h2>
                <button
                    onClick={onPlayVideo}
                    className="pixel-button p-3 text-2xl bg-yellow-500 text-black hover:bg-yellow-400 opacity-0"
                    style={{animation: 'text-appear 1s 0.5s ease-out forwards'}}
                >
                    ПРУФЫ
                </button>
            </div>

            <div className="absolute w-full h-full pointer-events-none">
                {bottles.map((bottle, i) => (
                    <AnimatedBottle key={i} {...bottle} />
                ))}
            </div>
            
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 animate-[text-appear_1s_1.5s_ease-out_forwards] opacity-0">
                ПРОХОДИМ
            </button>
        </div>
    );
};

const GalleryBackground: React.FC = () => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#fafafa]">
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-gray-300 via-gray-200 to-transparent"></div>
        
        {/* Abstract painting 1 (Rothko-esque) */}
        <div className="absolute top-[18%] left-[10%] w-[25%] h-[40%] bg-red-800 opacity-60 mix-blend-multiply rotate-[-5deg] shadow-lg"></div>
        <div className="absolute top-[21%] left-[12%] w-[21%] h-[18%] bg-yellow-600 opacity-70 mix-blend-multiply rotate-[-5deg]"></div>
        <div className="absolute top-[44%] left-[13%] w-[21%] h-[11%] bg-yellow-400 opacity-60 mix-blend-multiply rotate-[-5deg]"></div>

        {/* Abstract painting 2 (Minimalist) */}
        <div className="absolute top-[25%] right-[8%] w-[15%] h-[50%] opacity-50 flex items-center justify-center">
            <div className="w-1/2 h-1/2 border-l-8 border-blue-600"></div>
        </div>

        {/* Abstract painting 3 (Suprematist Ў) */}
        <div className="absolute top-[27%] left-[62%] w-[4%] h-[8%] bg-[#aaaaaa] p-2 shadow-xl transform -translate-x-1/2 rotate-[1deg]">
            <div className="w-full h-full bg-[#f4eeed] flex items-center justify-center">
                <span className="text-3xl font-black text-red-600" style={{ textShadow: 'none', fontFamily: 'Arial, sans-serif' }}>Ў</span>
            </div>
        </div>

        {/* Crowd silhouettes */}
        <div className="absolute bottom-[20%] left-[5%] w-16 h-20 bg-black opacity-10 rounded-t-full"></div>
        <div className="absolute bottom-[20%] left-[20%] w-12 h-16 bg-black opacity-05 rounded-t-full transform scale-x-[-1]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-20 h-24 bg-black opacity-15 rounded-t-full"></div>
        <div className="absolute bottom-[20%] right-[25%] w-14 h-18 bg-black opacity-10 rounded-t-full transform scale-x-[-1]"></div>
    </div>
);

const Glass: React.FC<{ fillPercentage: number }> = ({ fillPercentage }) => {
    const glassWidth = 80;
    const glassHeight = 120;
    const bowlHeight = 70;
    const fillHeight = (bowlHeight / 100) * fillPercentage;

    return (
        <svg width={glassWidth} height={glassHeight} viewBox={`0 0 ${glassWidth} ${glassHeight}`} className="drop-shadow-lg filter">
            <defs>
                <clipPath id="glass-bowl-clip">
                    <path d="M 20,0 C 20,40 30,70 40,70 C 50,70 60,40 60,0 Z" />
                </clipPath>
            </defs>
            
            <path 
                d="M 20,0 C 20,40 30,70 40,70 C 50,70 60,40 60,0 L 20,0 Z M 40,70 L 40,110 M 10,110 L 70,110"
                stroke="rgba(0,0,0,0.3)" 
                strokeWidth="3" 
                fill="rgba(255, 255, 255, 0.4)"
            />
            
            <rect 
                clipPath="url(#glass-bowl-clip)"
                x="20" 
                y={70 - fillHeight}
                width="40"
                height={fillHeight}
                fill="#ffdbac" 
                className="transition-all duration-100 ease-linear"
            />
        </svg>
    );
};

export const NaleyShampanskogo: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { killPlayer, character } = useSession();
    const { isInstructionModalVisible } = useNavigation();
    // --- Ссылки ---
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const particleId = useRef(0);
    const particlesRef = useRef<any[]>([]);
    const hoverTimeOverBottle = useRef(0);

    // --- Состояние игры ---
    const [round, setRound] = useState(1);
    const [glassPos, setGlassPos] = useState({ x: 0, y: 0 });
    const [fill, setFill] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [particles, setParticles] = useState<any[]>([]);
    const [easterEggStage, setEasterEggStage] = useState(0);
    const [speechBubble, setSpeechBubble] = useState({ text: '', visible: false });
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [waiter, setWaiter] = useState({
        isVisible: false,
        timer: 2,
        pos: { x: 50, y: 50 },
        vel: { x: 0, y: 0 },
        angle: 0,
    });
    
    // --- Параметры сложности по раундам ---
    const roundSettings = useMemo(() => ({
        1: { visibleTime: 4.5, hiddenTime: 2.0, speed: 0.08, rotationSpeed: 0.002, fillRate: 0.9 },
        2: { visibleTime: 4.0, hiddenTime: 2.5, speed: 0.12, rotationSpeed: 0.0025, fillRate: 0.8 },
        3: { visibleTime: 3.5, hiddenTime: 3.0, speed: 0.16, rotationSpeed: 0.003, fillRate: 0.9 },
    }[round]), [round]);

    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (gameAreaRef.current && !hasFinished.current) {
            e.preventDefault();
            const rect = gameAreaRef.current.getBoundingClientRect();
            const isTouchEvent = 'touches' in e;
            const pointer = isTouchEvent ? e.touches[0] : e;
            if (pointer) {
                // Dynamic Sliding Grip for mobile:
                // If yRatio is 0 (top), we hold the bottom of the glass (offset is large).
                // If yRatio is 1 (bottom), we hold the top of the glass (offset is negative).
                // This allows the player to reach the absolute bottom of the screen while keeping the finger above the glass.
                const yRatio = (pointer.clientY - rect.top) / rect.height;
                const yOffset = isTouchEvent ? 100 - (yRatio * 150) : 0; 
                
                setGlassPos({ 
                    x: pointer.clientX - rect.left, 
                    y: (pointer.clientY - rect.top) - yOffset 
                });
            }
        }
    };
    
    useGameLoop(
      useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        
        const dtSec = deltaTime / 1000;

        setTimeLeft(prevTime => {
            const newTime = prevTime - dtSec;
            if (newTime <= 0) {
                if (!hasFinished.current) {
                    hasFinished.current = true;
                    onLose();
                }
                return 0;
            }
            return newTime;
        });
        
        // --- Easter Egg Logic ---
        if (waiter.isVisible && easterEggStage < 3) {
            const isOverBottle = Math.abs(glassPos.x - waiter.pos.x) < 30 && Math.abs(glassPos.y - waiter.pos.y) < 45;
            
            if (isOverBottle) {
                hoverTimeOverBottle.current += dtSec;
                if (hoverTimeOverBottle.current > 1) {
                    const nextStage = easterEggStage + 1;
                    setEasterEggStage(nextStage);
                    hoverTimeOverBottle.current = 0; // Reset timer for the next stage

                    switch (nextStage) {
                        case 1:
                            setSpeechBubble({ text: "Руки прочь!", visible: true });
                            setTimeout(() => setSpeechBubble(s => ({ ...s, visible: false })), 2000);
                            break;
                        case 2:
                            setSpeechBubble({ text: "Я предупреждал!", visible: true });
                            setTimeout(() => setSpeechBubble(s => ({ ...s, visible: false })), 2000);
                            setTimeLeft(10);
                            break;
                        case 3:
                            setSpeechBubble({ text: "АЛКАШ!", visible: true });
                            if (!hasFinished.current) {
                                hasFinished.current = true;
                                killPlayer();
                            }
                            break;
                    }
                }
            } else {
                hoverTimeOverBottle.current = 0; // Reset if the player moves the glass away
            }
        }


        // --- Particle Spawning ---
        if (waiter.isVisible) {
            const streamAngle = waiter.angle - Math.PI / 2;
            const nozzleOffsetY = -28;
            const spawnX = waiter.pos.x - nozzleOffsetY * Math.sin(waiter.angle);
            const spawnY = waiter.pos.y + nozzleOffsetY * Math.cos(waiter.angle);
            
            const streamSpeed = 200;
            const numToSpawn = Math.ceil(deltaTime / 8);
            for (let i = 0; i < numToSpawn; i++) {
                const speed = streamSpeed * (0.8 + Math.random() * 0.4);
                const angle = streamAngle + (Math.random() - 0.5) * 0.4;
                particlesRef.current.push({
                    id: particleId.current++,
                    x: spawnX, y: spawnY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8,
                });
            }
        }

        // --- Particle physics and Catching logic ---
        const gravity = 500;
        let fillToAdd = 0;
        const glassTopY = glassPos.y - 60;
        const glassOpeningLeftX = glassPos.x - 20;
        const glassOpeningRightX = glassPos.x + 20;
        const survivingParticles = [];

        for (const p of particlesRef.current) {
            const isCaught = p.x >= glassOpeningLeftX && p.x <= glassOpeningRightX && p.y >= glassTopY && p.y <= glassTopY + 15;
            if (isCaught) {
                fillToAdd += roundSettings.fillRate * 12 * dtSec;
                playSound(SoundType.LIQUID_CATCH);
            } else {
                const newParticle = {
                    ...p,
                    x: p.x + p.vx * dtSec,
                    y: p.y + p.vy * dtSec,
                    vy: p.vy + gravity * dtSec,
                    life: p.life - dtSec,
                };
                if (newParticle.life > 0) {
                    survivingParticles.push(newParticle);
                }
            }
        }

        particlesRef.current = survivingParticles;
        setParticles(survivingParticles);
        if (fillToAdd > 0) {
            setFill(f => Math.min(100, f + fillToAdd));
        }

        // --- State machine for the waiter ---
        setWaiter(w => {
            const newTimer = w.timer - dtSec;
            if (newTimer <= 0) {
                if (w.isVisible) {
                    return { ...w, isVisible: false, timer: roundSettings.hiddenTime };
                } else {
                    playSound(SoundType.SWOOSH);
                    const rect = gameAreaRef.current?.getBoundingClientRect();
                    return {
                        ...w,
                        isVisible: true,
                        timer: roundSettings.visibleTime,
                        pos: { x: 20 + Math.random() * ((rect?.width || 800) - 40), y: 20 + Math.random() * ((rect?.height || 600) - 120) },
                        vel: { x: (Math.random() - 0.5) * roundSettings.speed, y: (Math.random() - 0.5) * roundSettings.speed },
                        angle: Math.random() * 2 * Math.PI,
                    };
                }
            }
            if (w.isVisible) {
                let newX = w.pos.x + w.vel.x * deltaTime;
                let newY = w.pos.y + w.vel.y * deltaTime;
                let newVel = { ...w.vel };
                const rect = gameAreaRef.current?.getBoundingClientRect();
                if (rect) {
                    if (newX < 20 || newX > rect.width - 20) newVel.x *= -1;
                    if (newY < 20 || newY > rect.height - 120) newVel.y *= -1;
                }
                const newAngle = (w.angle + roundSettings.rotationSpeed * deltaTime) % (2 * Math.PI);
                return { ...w, timer: newTimer, pos: { x: newX, y: newY }, vel: newVel, angle: newAngle };
            }
            return { ...w, timer: newTimer };
        });
      }, [glassPos, status, round, roundSettings, onLose, waiter, easterEggStage, killPlayer, playSound]), status === 'playing' && !isInstructionModalVisible);

    useEffect(() => {
        if (fill >= 100) {
            if (round < 3) {
                setRound(r => r + 1);
                setFill(0);
                setTimeLeft(25);
                setWaiter({
                    isVisible: false, timer: 2, pos: { x: 50, y: 50 }, vel: { x: 0, y: 0 }, angle: 0
                });
                setParticles([]);
                particlesRef.current = [];
            } else {
                if (!hasFinished.current) {
                    hasFinished.current = true;
                    setStatus('won');
                }
            }
        }
    }, [fill, round, onWin]);

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };
    
    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=l0k6Grdu8OQ");
    };

    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove} 
            onTouchStart={handlePointerMove}
            className="w-full h-full cursor-none relative overflow-hidden p-4 flex flex-col items-center"
        >
            <GalleryBackground />
            {status === 'won' && <NaleyShampanskogoWinScreen onContinue={handleWinContinue} onPlayVideo={handlePlayVideo} character={character} />}
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
            
            {status === 'playing' && <>
                <MinigameHUD>
                    <div className="w-full text-center text-3xl" style={{color: '#333', textShadow: '1px 1px 2px white'}}>
                        РАУНД: {round}/3 | ВРЕМЯ: {Math.ceil(timeLeft)}
                    </div>
                </MinigameHUD>
                <div className="flex-grow w-full relative">
                    {/* Particles */}
                    {particles.map(p => (
                        <div key={p.id} className="absolute pointer-events-none" style={{
                            left: p.x, top: p.y,
                            width: '3px', height: '10px',
                            backgroundColor: '#ffdbac',
                            transform: `rotate(${Math.atan2(p.vy, p.vx) * (180/Math.PI) + 90}deg)`,
                        }}></div>
                    ))}

                    {/* Официант (бутылка) */}
                    {waiter.isVisible && (
                        <div 
                            className="absolute animate-[fadeIn_0.2s_ease-out]" 
                            style={{ left: waiter.pos.x, top: waiter.pos.y, transform: 'translate(-50%, -50%)' }}
                        >
                            <div style={{ transform: `rotate(${waiter.angle}rad)` }}>
                                <PixelArt artData={BOTTLE_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={4} />
                            </div>
                            {speechBubble.visible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white text-black pixel-border text-center whitespace-nowrap z-50 animate-[fadeIn_0.3s]">
                                    {speechBubble.text}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-[8px] border-t-white"></div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Бокал игрока */}
                    <div className="absolute w-[80px] h-[120px]" style={{ left: glassPos.x, top: glassPos.y, transform: 'translate(-50%, -50%)' }}>
                        <Glass fillPercentage={fill} />
                    </div>
                </div>
            </>}
        </div>
    );
};
