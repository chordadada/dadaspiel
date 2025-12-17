
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    char: string;
    color: string;
    scale?: number;
}

interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    life: number;
    color: string;
}

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

// --- WIN SCREEN ---
export const PoceluyDobraWinScreen: React.FC<{ onContinue: () => void; character: Character | null }> = ({ onContinue, character }) => {
    const { playSound } = useSettings();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        playSound(SoundType.WIN_DOBRO);
    }, [playSound]);
    
    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=VTaSn3mymIw");
    };

    let titleText = "ВЫ УСТОЯЛИ!";
    let subText = "ИММУНИТЕТ К ДОБРУ ПОВЫШЕН";

    if (character === Character.KANILA) {
        titleText = "КРИНЖ ОТБИТ!";
        subText = "УРОВЕНЬ САРКАЗМА: 100%";
    } else if (character === Character.SEXISM) {
        titleText = "ДЕКОНСТРУКЦИЯ!";
        subText = "РОМАНТИКА ПОВЕРЖЕНА ЛОГИКОЙ";
    } else if (character === Character.BLACK_PLAYER) {
        titleText = "ДОБРО АННИГИЛИРОВАНО";
        subText = "ЭМОЦИОНАЛЬНЫЙ ФОН: НУЛЕВОЙ";
    }

    return (
        <>
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden z-30">
                <style>{`
                @keyframes rainbow-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                .rainbow-bg {
                    background: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3);
                    background-size: 1800% 1800%;
                    animation: rainbow-bg 18s ease infinite;
                }
                @keyframes fly-in { from { transform: translateY(100vh) rotate(-180deg) scale(0); } to { transform: translateY(0) rotate(0) scale(1); } }
                @keyframes float-around { 0% { transform: translate(0, 0); } 25% { transform: translate(10px, 20px); } 50% { transform: translate(-15px, -10px); } 75% { transform: translate(5px, -15px); } 100% { transform: translate(0, 0); } }
                .flying-emoji { animation: float-around 8s ease-in-out infinite; }
            `}</style>
                <div className="absolute inset-0 rainbow-bg opacity-70"></div>
                {/* Летающие эмодзи для атмосферы */}
                <div className="absolute top-[10%] left-[15%] text-5xl flying-emoji" style={{ animationDelay: '0s' }}>🍆</div>
                <div className="absolute top-[70%] left-[80%] text-5xl flying-emoji" style={{ animationDelay: '-2s' }}>🍑</div>
                <div className="absolute top-[80%] left-[10%] text-5xl flying-emoji" style={{ animationDelay: '-4s' }}>💦</div>
                <div className="absolute top-[20%] left-[75%] text-5xl flying-emoji" style={{ animationDelay: '-6s' }}>❤️‍🔥</div>
                
                <div className="z-10 text-center mb-8 bg-black/50 p-4 rounded-lg backdrop-blur-sm border-2 border-white animate-[fadeIn_1s]">
                    <h2 className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">{titleText}</h2>
                    <p className="text-white font-mono">{subText}</p>
                </div>

                <div 
                    onClick={handlePlayVideo}
                    className="w-96 h-56 bg-fuchsia-300 p-2 pixel-border flex flex-col items-center justify-around text-black transform rotate-[-3deg] animate-[fly-in_1s_cubic-bezier(.17,.67,.73,1.34)_0.5s_backwards] cursor-pointer hover:scale-105 transition-transform z-20" 
                    style={{textShadow: 'none'}}
                >
                    <h3 className="text-2xl font-bold tracking-widest">— ПРОХОДКА —</h3>
                    <div className="my-2 text-center">
                        <p className="text-4xl font-bold">ГЕЙ-ОРГИЯ</p>
                        <p className="text-lg">(добра)</p>
                    </div>
                    <p className="text-sm">*предъявителю сего*</p>
                </div>
                <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 animate-[fadeIn_1s_1.5s_backwards]">
                    ПРОХОДИМ
                </button>
            </div>
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </>
    );
};

// --- LOSE SCREEN ---
export const PoceluyDobraLoseScreen: React.FC<{ onRetry: () => void; character: Character | null }> = ({ onRetry, character }) => {
    const [kisses, setKisses] = useState<{id: number, x: number, y: number, rot: number}[]>([]);

    useEffect(() => {
        // Generate kisses over time
        const interval = setInterval(() => {
            setKisses(prev => {
                if (prev.length > 50) return prev;
                return [...prev, {
                    id: Date.now() + Math.random(),
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    rot: (Math.random() - 0.5) * 90
                }];
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    let loseTitle = "ЗАЦЕЛОВАН!";
    let loseDesc = "ВЫ НЕ ВЫНЕСЛИ СТОЛЬКО ЛЮБВИ.";

    if (character === Character.KANILA) {
        loseTitle = "ЗАДУШЕН ОБЪЯТИЯМИ";
        loseDesc = "СЛИШКОМ. МНОГО. КРИНЖА.";
    } else if (character === Character.SEXISM) {
        loseTitle = "ЭСТЕТИЧЕСКИЙ КОЛЛАПС";
        loseDesc = "ПОШЛОСТЬ ЗАДОБРИЛА ВКУС.";
    } else if (character === Character.BLACK_PLAYER) {
        loseTitle = "СИСТЕМА ЗАРАЖЕНА";
        loseDesc = "КРИТИЧЕСКИЙ УРОВЕНЬ ДОБРА.";
    }

    return (
        <div className="absolute inset-0 bg-pink-900/90 z-50 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes heartbeat-bg { 0% { background-color: #831843; } 50% { background-color: #9d174d; } 100% { background-color: #831843; } }
                @keyframes zoom-face { from { transform: scale(0.5); opacity: 0; } to { transform: scale(8); opacity: 0.3; } }
                .bg-pulse { animation: heartbeat-bg 1s infinite; }
            `}</style>
            
            <div className="absolute inset-0 bg-pulse"></div>
            
            {/* Giant creepy face background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div style={{ animation: 'zoom-face 10s linear forwards' }}>
                    <PixelDobro isHit={false} />
                </div>
            </div>

            {/* Random Kisses */}
            {kisses.map(k => (
                <div 
                    key={k.id} 
                    className="absolute text-6xl animate-[pop-in_0.2s_ease-out]" 
                    style={{ left: `${k.x}%`, top: `${k.y}%`, transform: `translate(-50%, -50%) rotate(${k.rot}deg)` }}
                >
                    💋
                </div>
            ))}

            <div className="z-10 text-center p-6 bg-black/70 border-4 border-pink-500 rounded-xl backdrop-blur-md animate-[bounce_1s_infinite] max-w-2xl mx-4">
                <h2 className="text-4xl md:text-6xl font-black text-pink-300 mb-4">{loseTitle}</h2>
                <p className="text-xl text-white font-bold">{loseDesc}</p>
            </div>

            <div className="absolute bottom-8 z-50 opacity-0 animate-[fadeIn_2s_1s_forwards]">
                 {/* This just waits for the main game loop to trigger actual loss logic via onLose */}
                 <p className="text-white text-sm animate-pulse">Сопротивление бесполезно...</p>
            </div>
        </div>
    );
}

// Пиксельный арт Георгия Добра
const PixelDobro: React.FC<{ isHit: boolean }> = ({ isHit }) => {
    const pixelSize = 4; const s = (size: number) => size * pixelSize;
    const skinLight = '#f2d4c2'; const skinMid = '#d4b39b'; const skinShadow = '#a17d68';
    const hairMain = '#b0a08a'; const hairShadow = '#6b5f4e';
    const glassesFrame = '#1a1a1a'; const glassesHighlight = '#ffffff';
    const lipRed = '#ff0000';
    const containerWidth = 20; const containerHeight = 20;

    return (
        <div className={`relative transition-transform duration-100 ${isHit ? 'scale-90 rotate-12' : 'scale-100'}`} style={{
            width: s(containerWidth), height: s(containerHeight), imageRendering: 'pixelated', filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.7))'
        }}>
            <div style={{ position: 'absolute', top: s(2), left: s(12), width: s(6), height: s(12), backgroundColor: hairShadow }}></div>
            <div style={{ position: 'absolute', top: s(5), left: s(9), width: s(8), height: s(12), backgroundColor: skinMid }}></div>
            <div style={{ position: 'absolute', top: s(5), left: s(3), width: s(6), height: s(12), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(1), left: s(2), width: s(12), height: s(7), backgroundColor: hairMain }}></div>
            <div style={{ position: 'absolute', top: s(0), left: s(5), width: s(7), height: s(3), backgroundColor: hairMain }}></div>
            <div style={{ position: 'absolute', top: s(8), left: s(2), width: s(16), height: s(4), backgroundColor: glassesFrame }}></div>
            <div style={{ position: 'absolute', top: s(9), left: s(3), width: s(5), height: s(2), backgroundColor: glassesHighlight }}></div>
            <div style={{ position: 'absolute', top: s(12), left: s(8), width: s(1), height: s(3), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(12), left: s(9), width: s(1), height: s(3), backgroundColor: skinShadow }}></div>
            <div style={{ position: 'absolute', top: s(15), left: s(9), width: s(2), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(16), left: s(8), width: s(4), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(9), width: s(2), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(4), width: s(4), height: s(1), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(8), width: s(1), height: s(1), backgroundColor: skinMid }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(11), width: s(2), height: s(1), backgroundColor: skinMid }}></div>
        </div>
    );
};

export const PoceluyDobra: React.FC<{ onWin: () => void; onLose: () => void; isSlowMo?: boolean; }> = ({ onWin, onLose, isSlowMo = false }) => {
    const { character } = useSession();
    const { playSound } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    
    // --- State ---
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    
    // Game Physics State (0-100 coordinates)
    const [playerY, setPlayerY] = useState(50);
    const [dobroY, setDobroY] = useState(50);
    const [ball, setBall] = useState({ x: 90, y: 50, vx: -40, vy: 0, speed: 40, rotation: 0 });
    
    // Player Animation State
    const [playerAnim, setPlayerAnim] = useState<'idle' | 'headbutt'>('idle');
    const playerAnimTimer = useRef(0);

    // Refs for smooth movement input
    const targetPlayerY = useRef(50);
    
    // AI Refs
    const aiTargetOffset = useRef(0); // Human imperfection for AI
    const aiReactionTimer = useRef(0);

    const [scores, setScores] = useState({ player: 100, dobro: 100 });
    const [particles, setParticles] = useState<Particle[]>([]);
    const [taunts, setTaunts] = useState<FloatingText[]>([]);
    const [isPlayerHit, setIsPlayerHit] = useState(false);
    const [isDobroHit, setIsDobroHit] = useState(false);
    
    const hasFinished = useRef(false);
    const particleCounter = useRef(0);
    const tauntCounter = useRef(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    // --- Configuration ---
    const PADDLE_HEIGHT = 18;
    const PADDLE_WIDTH = 4; // Slightly wider visual hit area
    const PLAYER_X = 10;
    const DOBRO_X = 90;

    const charArt = useMemo(() => CHARACTER_ART_MAP[character || Character.KANILA], [character]);

    const DOBRO_PHRASES = [
        "ЭВРИСЫНСГОНАБИГУТ!", "БАЛЬЗАКОВСКИЙ ВОЗРАСТ!", "ЗАЛОЖНИКИ СТРАННОГО КРУГА!", "СЕГОДНЯ СНОВА НА РАБОТУ НЕ ПОЙДУУУУ!", "ЖИТЬ КРАСИВО И ОПАСНО!",
        "ПОТОМУ ЧТО ТЫ ЖЕНЩИНА!", "ВОТ ТАК СУДЬБА НАС СВЕЛА!", "ДРУЖОК-КОРЕШОК!", "УМА НЕ ПРИЛОЖУ, ПРИЧЁМ ЗДЕСЬ Я!", "ТЫ НАУЧИШЬСЯ БЕЗ ЛЮБВИ!", "СМЕРТЬ — ЭТО ПРОСТО ДЫМ!", "СУДЬБА ЗАШЛА НА НОВЫЙ КРУГ"
    ];

    const settings = useMemo(() => {
        let aiSpeed = 30;
        let aiErrorChance = 0.25; // Higher chance to allow missing
        let baseSpeed = 40;
        
        if (character === Character.KANILA) { // Easy
            aiSpeed = 25;
            aiErrorChance = 0.4;
            baseSpeed = 35;
        } else if (character === Character.BLACK_PLAYER) { // Hard
            aiSpeed = 40;
            aiErrorChance = 0.1;
            baseSpeed = 50;
        }

        return { aiSpeed, aiErrorChance, baseSpeed };
    }, [character]);

    // --- Reset Game ---
    const resetBall = useCallback((winner: 'player' | 'dobro') => {
        const spawnY = dobroY; 
        
        setBall({
            x: DOBRO_X - 5, 
            y: spawnY, 
            vx: -settings.baseSpeed, 
            vy: (Math.random() - 0.5) * 30, 
            speed: settings.baseSpeed,
            rotation: 0
        });
        playSound(SoundType.KISS_SPAWN);
        
        // Reset AI Brain
        aiTargetOffset.current = (Math.random() - 0.5) * 30; 
        aiReactionTimer.current = 0.2; 
    }, [settings.baseSpeed, playSound, dobroY]);

    // --- Spawn Taunt ---
    const spawnTaunt = (x: number, y: number) => {
        const text = DOBRO_PHRASES[Math.floor(Math.random() * DOBRO_PHRASES.length)];
        setTaunts(t => [...t, {
            id: tauntCounter.current++,
            text,
            x, y,
            life: 1.5,
            color: 'text-red-500'
        }]);
    };

    // --- Particle Spawner ---
    const spawnParticles = (x: number, y: number, color: string, count: number = 10, type: 'hit' | 'taunt' = 'hit') => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = 30 + Math.random() * 30;
            newParticles.push({
                id: particleCounter.current++,
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.3,
                char: type === 'hit' ? ['✨', '💢', '💥'][Math.floor(Math.random() * 3)] : '❤️',
                color,
                scale: 0.5 + Math.random() * 1
            });
        }
        setParticles(p => [...p, ...newParticles]);
    };

    // --- Game Loop ---
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;

        const dtSec = (deltaTime / 1000) * (isSlowMo ? 0.3 : 1);
        
        // 0. Smooth Player Movement (Lerp towards target)
        setPlayerY(prev => {
            const diff = targetPlayerY.current - prev;
            const smoothFactor = 1 - Math.pow(0.001, dtSec); 
            return prev + diff * smoothFactor;
        });

        // Player Animation Timer
        if (playerAnimTimer.current > 0) {
            playerAnimTimer.current -= dtSec;
            if (playerAnimTimer.current <= 0) {
                setPlayerAnim('idle');
            }
        }

        // 1. Update AI (Dobro)
        if (aiReactionTimer.current > 0) {
            aiReactionTimer.current -= dtSec;
        } else {
            let targetY = ball.y + aiTargetOffset.current;
            // AI moves only if ball is coming towards him (vx > 0) or close
            if (ball.vx < 0 && ball.x < 50) {
                targetY = 50; // Ball moving away, return to center lazily
            }
            let moveY = targetY - dobroY;
            const maxMove = settings.aiSpeed * dtSec;
            moveY = Math.max(-maxMove, Math.min(maxMove, moveY));
            setDobroY(y => Math.max(PADDLE_HEIGHT/2, Math.min(100 - PADDLE_HEIGHT/2, y + moveY)));
        }

        // 2. Update Ball Position
        let newX = ball.x + ball.vx * dtSec;
        let newY = ball.y + ball.vy * dtSec;
        let newVx = ball.vx;
        let newVy = ball.vy;
        let newSpeed = ball.speed;

        // Wall collisions (Top/Bottom)
        if (newY <= 0 || newY >= 100) {
            newVy *= -1;
            newY = Math.max(0, Math.min(100, newY));
            playSound(SoundType.GENERIC_CLICK);
        }

        // Paddle Collision: Player (Tunneling fix)
        if (ball.vx < 0 && newX <= PLAYER_X + PADDLE_WIDTH && ball.x >= PLAYER_X - 2) {
            // Check Y overlap
            if (newY >= playerY - PADDLE_HEIGHT / 2 - 5 && newY <= playerY + PADDLE_HEIGHT / 2 + 5) {
                newVx = Math.abs(newVx); // Force right
                newSpeed *= 1.05; // Speed up
                newVx = newSpeed;
                
                const hitOffset = (newY - playerY) / (PADDLE_HEIGHT / 2);
                newVy = hitOffset * 60 + (Math.random() - 0.5) * 10;
                
                newX = PLAYER_X + PADDLE_WIDTH + 1; // Push out
                playSound(SoundType.PARRY);
                spawnParticles(newX, newY, '#4ade80', 5);
                setIsPlayerHit(true); // Visual shake
                setTimeout(() => setIsPlayerHit(false), 200);

                // --- HEADBUTT ANIMATION TRIGGER ---
                setPlayerAnim('headbutt');
                playerAnimTimer.current = 0.2; // Keep animation for 200ms

                // Reset AI for return volley
                aiTargetOffset.current = (Math.random() - 0.5) * (40 * settings.aiErrorChance);
                aiReactionTimer.current = Math.max(0, 0.1 - (newSpeed / 1000));
            }
        }

        // Paddle Collision: Dobro
        if (ball.vx > 0 && newX >= DOBRO_X - PADDLE_WIDTH && ball.x <= DOBRO_X + 2) {
            if (newY >= dobroY - PADDLE_HEIGHT / 2 && newY <= dobroY + PADDLE_HEIGHT / 2) {
                newVx = -Math.abs(newVx); // Force left
                newSpeed *= 1.05;
                newVx = -newSpeed;
                
                const hitOffset = (newY - dobroY) / (PADDLE_HEIGHT / 2);
                newVy = hitOffset * 60;
                
                newX = DOBRO_X - PADDLE_WIDTH - 1;
                playSound(SoundType.ITEM_CATCH_BAD);
                spawnParticles(newX, newY, '#ff0000', 5);
                setIsDobroHit(true);
                setTimeout(() => setIsDobroHit(false), 200);

                // --- SPAWN TAUNT ---
                if (Math.random() < 0.4) {
                    spawnTaunt(DOBRO_X - 10, dobroY - 10);
                }
            }
        }

        // Scoring / Miss
        if (newX < 0) {
            setScores(s => ({ ...s, player: s.player - 20 }));
            playSound(SoundType.PLAYER_HIT);
            spawnParticles(5, newY, '#ff0000', 15);
            resetBall('dobro');
            return;
        } else if (newX > 100) {
            setScores(s => ({ ...s, dobro: s.dobro - 20 }));
            playSound(SoundType.PLAYER_WIN);
            spawnParticles(95, newY, '#ffff00', 15);
            resetBall('player');
            return;
        }

        setBall({ x: newX, y: newY, vx: newVx, vy: newVy, speed: newSpeed, rotation: ball.rotation + dtSec * 360 });

        // Update Particles
        setParticles(prev => prev.map(p => ({
            ...p, x: p.x + p.vx * dtSec, y: p.y + p.vy * dtSec, life: p.life - dtSec
        })).filter(p => p.life > 0));

        // Update Taunts
        setTaunts(prev => prev.map(t => ({
            ...t, y: t.y - 10 * dtSec, life: t.life - dtSec
        })).filter(t => t.life > 0));

    }, [ball, playerY, dobroY, status, settings, isSlowMo, resetBall, playSound]), status === 'playing' && !isInstructionModalVisible);

    // --- Win/Lose Check ---
    useEffect(() => {
        if (status !== 'playing' || hasFinished.current) return;

        if (scores.player <= 0) {
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 3000); // Wait for animation
        } else if (scores.dobro <= 0) {
            hasFinished.current = true;
            setStatus('won');
        }
    }, [scores, status, onLose]);

    // --- Controls ---
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current && status === 'playing') {
            e.preventDefault();
            const rect = gameAreaRef.current.getBoundingClientRect();
            const pointer = 'touches' in e ? e.touches[0] : e;
            if (!pointer) return;
            const y = Math.max(0, Math.min(100, ((pointer.clientY - rect.top) / rect.height) * 100));
            targetPlayerY.current = y;
        }
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    // Dynamic scale for the kiss based on speed/tension
    const tension = Math.max(0, (ball.speed - settings.baseSpeed) / 100);
    const ballScale = 1 + tension * 1.5; 
    const bgColor = `rgba(${100 + tension * 155}, ${200 - tension * 200}, ${200 - tension * 200}, 1)`;

    return (
        <div 
            ref={gameAreaRef}
            className="w-full h-full relative overflow-hidden cursor-none touch-none select-none"
            style={{ backgroundColor: bgColor, transition: 'background-color 0.5s', touchAction: 'none' }}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchStart={handlePointerMove}
        >
            <style>{`
                @keyframes shake { 0% { transform: translate(0,0); } 25% { transform: translate(-2px, 2px); } 75% { transform: translate(2px, -2px); } 100% { transform: translate(0,0); } }
                .screen-shake { animation: shake 0.2s infinite; }
            `}</style>

            {/* Shake Effect Overlay */}
            <div className={`absolute inset-0 pointer-events-none ${(isPlayerHit || isDobroHit) ? 'screen-shake' : ''}`}></div>

            {status === 'won' && <PoceluyDobraWinScreen onContinue={handleWinContinue} character={character} />}
            {status === 'lost' && <PoceluyDobraLoseScreen onRetry={onLose} character={character} />}

            {status === 'playing' && <>
                <MinigameHUD>
                    <div className="w-full flex justify-between items-center px-8 font-bold text-xl" style={{textShadow: '2px 2px 0 #000'}}>
                        <div className="flex flex-col items-start w-1/3">
                            <span className="text-blue-300">ЭГО</span>
                            <div className="w-full h-4 bg-gray-800 border-2 border-white">
                                <div className="h-full bg-blue-500 transition-all duration-200" style={{width: `${Math.max(0, scores.player)}%`}}></div>
                            </div>
                        </div>
                        <div className="text-2xl animate-pulse text-white">VS</div>
                        <div className="flex flex-col items-end w-1/3">
                            <span className="text-red-300">ДОБРО</span>
                            <div className="w-full h-4 bg-gray-800 border-2 border-white flex justify-end">
                                <div className="h-full bg-red-600 transition-all duration-200" style={{width: `${Math.max(0, scores.dobro)}%`}}></div>
                            </div>
                        </div>
                    </div>
                </MinigameHUD>

                {/* Center Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-1 border-l-4 border-dashed border-white/30 transform -translate-x-1/2"></div>

                {/* Player (Left) */}
                <div 
                    className="absolute" 
                    style={{ 
                        left: `${PLAYER_X}%`, 
                        top: `${playerY}%`, 
                        transform: `translate(-50%, -50%) ${playerAnim === 'headbutt' ? 'rotate(-25deg) scale(1.2)' : 'rotate(0deg) scale(1)'}`,
                        transformOrigin: 'bottom center',
                        transition: 'transform 0.1s'
                    }}
                >
                    <div className="w-[60px] h-[96px] transform scale-x-[-1]">
                        <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={3} />
                    </div>
                </div>

                {/* Dobro (Right) */}
                <div 
                    className="absolute"
                    style={{ 
                        left: `${DOBRO_X}%`, 
                        top: `${dobroY}%`, 
                        transform: 'translate(-50%, -50%)',
                        transition: 'top 0.1s linear' // AI Smoothing
                    }}
                >
                    <PixelDobro isHit={isDobroHit} />
                </div>

                {/* Ball (Kiss) */}
                <div 
                    className="absolute text-4xl" 
                    style={{ 
                        left: `${ball.x}%`, 
                        top: `${ball.y}%`, 
                        transform: `translate(-50%, -50%) rotate(${ball.rotation}deg) scale(${ballScale})` 
                    }}
                >
                    💋
                </div>
                
                {/* Trail Effect for Ball */}
                <div 
                    className="absolute w-4 h-4 bg-red-500 rounded-full blur-md opacity-50"
                    style={{ 
                        left: `${ball.x - (ball.vx * 0.05)}%`, 
                        top: `${ball.y - (ball.vy * 0.05)}%`, 
                        transform: `translate(-50%, -50%) scale(${ballScale})`
                    }}
                ></div>

                {/* Particles */}
                {particles.map(p => (
                    <div 
                        key={p.id} 
                        className="absolute text-xl pointer-events-none" 
                        style={{ 
                            left: `${p.x}%`, 
                            top: `${p.y}%`, 
                            color: p.color,
                            opacity: p.life,
                            transform: `translate(-50%, -50%) scale(${p.scale || 1})` 
                        }}
                    >
                        {p.char}
                    </div>
                ))}

                {/* Floating Taunts */}
                {taunts.map(t => (
                    <div
                        key={t.id}
                        className={`absolute font-black whitespace-nowrap animate-[float-up_1.5s_forwards] ${t.color}`}
                        style={{
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            fontSize: '1.5rem',
                            transform: 'translate(-50%, -50%)',
                            textShadow: '2px 2px 0 #000'
                        }}
                    >
                        {t.text}
                    </div>
                ))}
            </>}
        </div>
    );
};
