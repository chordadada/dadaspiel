import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { ROWANBERRY_ART_DATA } from '../../miscArt';
import { PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { MinigameHUD } from '../core/MinigameHUD';

// Video Modal Component
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


// Win Screen Component
export const PereverniKalendarWinScreen: React.FC<{ onContinue: () => void; onPlayVideo: () => void }> = ({ onContinue, onPlayVideo }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_KALENDAR);
    }, [playSound]);

    const leaves = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        style: {
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${1 + Math.random() * 1.5}rem`,
        } as React.CSSProperties
    })), []);

    const chorusLines = useMemo(() => [
        "Я календарь переверну...",
        "На фото я твоё взгляну...",
        "Но почему, но почему",
        "Расстаться всё же нам пришлось?",
        "Ведь было всё у нас всерьёз",
        "Второго сентября..."
    ], []);

    const flyingLines = useMemo(() => chorusLines.map((line, i) => {
        const fromLeft = Math.random() > 0.5;
        return {
            id: i,
            text: line,
            style: {
                top: `${10 + Math.random() * 80}%`,
                left: fromLeft ? '-100%' : '100%',
                '--destination-x': fromLeft ? '200vw' : '-200vw',
                animation: `fly-and-fade ${6 + Math.random() * 4}s linear forwards`,
                animationDelay: `${1 + i * 1.5 + Math.random()}s`,
                fontSize: '1.5rem',
                whiteSpace: 'nowrap',
                color: 'rgba(255, 255, 255, 0.3)',
                textShadow: '1px 1px 0px #000',
            } as React.CSSProperties
        }
    }), [chorusLines]);

    return (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black overflow-hidden">
            <style>{`
                /* --- Стили для экрана победы --- */

                /* Анимация падающих листьев */
                @keyframes fall {
                    from { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    to { transform: translateY(110vh) rotate(720deg); opacity: 1; }
                }
                .falling-leaf {
                    position: absolute;
                    top: -10vh;
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    color: #ff6600;
                    text-shadow: 0 0 5px #ff0000;
                    z-index: 5;
                }
                /* Анимация появления текста */
                @keyframes fadeInText {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Анимация пролетающих строк из песни */
                @keyframes fly-and-fade {
                    0% { transform: translateX(0); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(var(--destination-x)); opacity: 0; }
                }
                .flying-line {
                    position: absolute;
                    z-index: 10;
                }
                /* Анимация переливающегося градиента для текста */
                @keyframes autumn-shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                /* Стиль текста с "осенним" градиентом. Размер настраивается здесь же (font-size) */
                .autumn-text {
                    background: linear-gradient(90deg, #ff8c00, #ffc700, #ff6600, #d4a773, #ff8c00);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: autumn-shimmer 4s linear infinite;
                    font-size: 2.25rem; /* РЕГУЛИРОВКА: Размер текста на кнопке победы */
                    font-weight: bold;
                    text-decoration: none;
                }
                /* Стиль "рваной бумаги", которая служит кнопкой. Padding отвечает за размер. */
                .torn-paper {
                    background-color: #fdf6e4;
                    padding: 2rem 3rem; /* РЕГУЛИРОВКА: Отступы внутри кнопки победы */
                    transform: rotate(-3deg);
                    box-shadow: 5px 5px 15px rgba(0,0,0,0.5);
                    clip-path: polygon(0% 5%, 95% 0%, 100% 95%, 5% 100%);
                    border: 1px solid #ddd;
                }
            `}</style>
            
            {/* Background elements first */}
            {leaves.map(leaf => (
                <div key={leaf.id} className="falling-leaf" style={leaf.style}>🍁</div>
            ))}
            {flyingLines.map(line => (
                <div key={line.id} className="flying-line" style={line.style}>
                    {line.text}
                </div>
            ))}
            
            {/* Foreground elements */}
            {/* РЕГУЛИРОВКА: animationDelay в `animate-[...]` отвечает за время появления кнопки */}
            <div className="text-center z-20 opacity-0 animate-[fadeInText_2s_4s_ease-out_forwards]">
                 {/* 
                    РЕГУЛИРОВКА: 
                    - onClick: Ссылка на видео.
                    - className: Эффекты при наведении (hover) и нажатии (active).
                */}
                <div
                    onClick={onPlayVideo}
                    className="torn-paper cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-100"
                >
                    <span className="autumn-text">
                        И снова третье сентября
                    </span>
                </div>
            </div>
             {/* РЕГУЛИРОВКА: animationDelay в `animate-[...]` отвечает за время появления кнопки "Продолжить" */}
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 opacity-0 animate-[fadeInText_1s_6s_ease-out_forwards]">
                ПЕРЕВЕРНУТЬ
            </button>
        </div>
    );
};


// Calendar Component
const Calendar: React.FC<{
    calendarData: any;
    onClick: (id: number) => void;
    playSound: (type: SoundType) => void;
}> = ({ calendarData, onClick, playSound }) => {
    if (!calendarData) return null;
    const { id, type, x, y, isFlipped, isFalling } = calendarData;
    const hasFallen = useRef(false);

    useEffect(() => {
        if (isFalling && !hasFallen.current) {
            hasFallen.current = true;
            playSound(SoundType.SWOOSH);
        }
    }, [isFalling, playSound]);
    
    const fallStyle: React.CSSProperties = isFalling ? {
        animation: 'fall-to-fire 1s ease-in forwards'
    } : {};
    
    return (
        <div
            className="absolute cursor-pointer"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                perspective: '400px',
                ...fallStyle
            }}
            onClick={() => onClick(id)}
        >
            <div className="relative w-16 h-20 transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                {/* Front */}
                <div className="absolute w-full h-full bg-white pixel-border flex flex-col items-center justify-center text-black backface-hidden">
                    <div className="text-6xl font-bold flex-grow flex items-center">{type}</div>
                </div>
                {/* Back */}
                 <div className="absolute w-full h-full bg-gray-300 pixel-border flex items-center justify-center transform-rotate-y-180 backface-hidden">
                    <PixelArt artData={ROWANBERRY_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={6} />
                </div>
            </div>
        </div>
    );
};

// Background Component
const AutumnNightBackground = () => {
    const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 70}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            animationDelay: `${Math.random() * 5}s`,
        }
    })), []);

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a2f] via-[#1f2e4a] to-[#3c4a65] overflow-hidden z-0">
            {/* Stars */}
            {stars.map(star => <div key={star.id} className="star-particle" style={star.style}></div>)}
            {/* Moon */}
            <div className="absolute top-[10%] right-[15%] w-20 h-20 bg-yellow-100 rounded-full opacity-60 blur-md"></div>
             {/* Tree Silhouettes */}
            <div className="absolute bottom-0 left-0 w-full h-[35%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgMTUwIj48cGF0aCBmaWxsPSIjMDgwZDE0IiBkPSJNODEzLDE1MFY4OS4xN2MtMTUtNS40MS0yOC4xMS0xMS42OC0zOC4zMy0xOC40Qzc1MC4zLDU5LjA4LDcxNy4xMywzNCw2ODMsMzRjLTI1LjMyLDAtNTEsMTQuNTItNzEuNjIsMzguNjZsLTEuNjQtNC4yN0E5MC4zMyw5MC4zMywwLDAsMCw1MTQsMzRDNDY1LDM0LDQyMSw3MSwzODIsOTQuNGEyMDMuMDUsMjAzLjA1LDAsMCwxLTM1LjgtMjEuNjhDMzEyLjI5LDQxLjQxLDI3Mi4yMSwyMSwyMjMsMjFjLTU4LDAtOTgsMzQtMTE4LDYzLjQ3VjE1MFpNNzI1LDExOWMtMjIsMC0yOS0xMS0zNS0yMC0Ny0xMS04LTI2LTgtNDVzMS0zMyw4LTQ0YzYtOSwxMy0yMCwzNS0yMEE1MS40OSw1MS40OSwwLDAsMSw3NjgsMjJDNzkwLDIyLDgwMywzNCw4MTMsNDV2NzhaTTAsMTUwVjg5LjE3QzE1LDgzLjc2LDI4LjExLDc3LjQ5LDM4LjMzLDcwLjhDNzIuNzEsNTkuMDgsMTA1Ljg3LDM0LDEzOSwzNGM0MC41MywwLDgyLjEsMjguNDQsMTA1LDYwLjY2bDEuNjQsNC4yN0ExMjAuMSwxMjAuMSwwLDAsMSwzMDgsMzRDMzU3LDM0LDQwMSw3MSw0NDAsOTQuNGEyMDMuMDUsMjAzLjA1LDAsMCwwLDM1LjgtMjEuNjhDNTA3LjcxLDQxLjQxLDU0Ny43OSwyMSw1OTYsMjFjMzIsMCw1MywxMyw2OCwzNCw4LDEyLDEzLDI5LDEzLDQ4djQ3WiIvPjwvc3ZnPg==')] bg-repeat-x bg-bottom opacity-80"></div>
        </div>
    );
};

// Enhanced Bonfire Component with SVG and Particles
const BonfireTimer: React.FC<{ currentTime: number; maxTime: number; surgeKey: number; }> = ({ currentTime, maxTime, surgeKey }) => {
    const [particles, setParticles] = useState<any[]>([]);
    const [flames, setFlames] = useState(() =>
        Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            baseScaleY: 0.8 + Math.random() * 0.6,
            baseScaleX: 0.6 + Math.random() * 0.8,
            noiseOffsetY: Math.random() * 10,
            noiseOffsetX: Math.random() * 10,
            noiseOffsetRot: Math.random() * 10,
            currentHeight: 0,
            currentRotation: 0,
            currentScaleX: 1,
        }))
    );
    
    // Surge effect when time is added
    useEffect(() => {
        if (surgeKey === 0) return; // Ignore initial render
        const newParticles = [];
        for (let i = 0; i < 80; i++) { // Burst of 80 particles
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.5;
            const speed = 50 + Math.random() * 50;
            newParticles.push({
                id: Math.random(), x: Math.random() * 100, y: 100,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0.8 + Math.random() * 0.4,
                color: `hsl(45, 100%, ${60 + Math.random() * 20}%)`,
                size: 4 + Math.random() * 6,
            });
        }
        setParticles(p => [...p, ...newParticles]);
    }, [surgeKey]);

    // Main particle simulation loop
    useGameLoop(useCallback((deltaTime) => {
        const dtSec = deltaTime / 1000;
        const currentPercentage = maxTime > 0 ? Math.max(0, (currentTime / maxTime) * 100) : 0;
        
        // Spawn new particles based on time left (fire intensity)
        if (Math.random() < (currentPercentage / 100) * 2.5) {
             setParticles(p => [...p, {
                id: Math.random(), x: Math.random() * 100, y: 100,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - (currentPercentage / 100) * 50, // Speed depends on fire intensity
                life: 0.8 + (currentPercentage / 100) * 0.7,
                color: `hsl(${10 + currentPercentage * 0.4}, 100%, 60%)`, // Color from red to yellow
                size: 4 + (currentPercentage / 100) * 8,
            }]);
        }

        // Update existing particles (movement, gravity, lifetime)
        setParticles(currentParticles =>
            currentParticles
                .map(p => ({
                    ...p,
                    x: p.x + p.vx * dtSec, y: p.y + p.vy * dtSec,
                    vy: p.vy + 60 * dtSec, // Gravity
                    life: p.life - dtSec,
                }))
                .filter(p => p.life > 0)
        );
    }, [currentTime, maxTime]), true);

    // Flame animation loop
    useGameLoop(useCallback(() => {
        const percentage = maxTime > 0 ? Math.max(0, (currentTime / maxTime) * 100) : 0;
        const flameHeightMultiplier = Math.max(0, (percentage / 100) * 0.9);
        const time = Date.now() / 200; // A time factor for smooth sine-wave-based animations

        setFlames(currentFlames => currentFlames.map(f => {
            // Use sine waves with unique offsets for each flame to create smooth, non-uniform flickering
            const noiseY = Math.sin(time * (1 + f.noiseOffsetY / 10) + f.noiseOffsetY);
            const noiseX = Math.sin(time * (1 + f.noiseOffsetX / 10) + f.noiseOffsetX);
            const noiseRot = Math.sin(time * (1 + f.noiseOffsetRot / 10) + f.noiseOffsetRot);

            // Map noise from [-1, 1] to a subtle flicker range
            const smoothFlickerY = 1 + noiseY * 0.2; // +/- 20% height variation
            const smoothFlickerX = 1 + noiseX * 0.1; // +/- 10% width variation
            
            const dynamicHeight = flameHeightMultiplier * f.baseScaleY * smoothFlickerY;
            const dynamicRotation = noiseRot * 5 * (flameHeightMultiplier > 0.1 ? 1 : 0); // Rotation only for bigger flames
            const dynamicScaleX = f.baseScaleX * smoothFlickerX;

            return {
                ...f,
                currentHeight: dynamicHeight,
                currentRotation: dynamicRotation,
                currentScaleX: dynamicScaleX,
            };
        }));
    }, [currentTime, maxTime]), true);


    return (
        <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none z-20">
             {/* Ember bed */}
            <div className="absolute bottom-0 left-0 w-full h-6 bg-black">
                <div className="w-full h-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 opacity-80 blur-sm animate-pulse"></div>
            </div>

            {/* Flames */}
            <div className="absolute bottom-0 left-0 w-full h-full">
                 {flames.map(f => (
                     <svg 
                        key={f.id} 
                        viewBox="-20 0 90 100" // Wider viewBox to prevent clipping on rotation
                        preserveAspectRatio="xMidYMax meet" // Align flame to bottom to prevent floating
                        className="absolute bottom-0 w-24" // Wider element to compensate
                        style={{ 
                            left: `${f.x}%`, 
                            transform: 'translateX(-50%)', 
                            height: '150px' 
                        }}
                     >
                         <defs><radialGradient id="flameGradient"><stop offset="0%" stopColor="rgba(255, 255, 150, 0.8)" /><stop offset="60%" stopColor="rgba(255, 140, 0, 0.7)" /><stop offset="100%" stopColor="rgba(255, 0, 0, 0.5)" /></radialGradient></defs>
                         <path d="M25 100 C 50 70, 50 30, 25 0 C 0 30, 0 70, 25 100 Z" fill="url(#flameGradient)" style={{
                            transformOrigin: '50% 100%',
                            transform: `scaleY(${f.currentHeight}) scaleX(${f.currentScaleX}) rotate(${f.currentRotation}deg)`,
                         }}/>
                     </svg>
                 ))}
            </div>

            {/* Particles */}
            <div className="absolute bottom-0 w-full h-full">
                {particles.map(p => ( <div key={p.id} className="absolute rounded-full" style={{ left: `${p.x}%`, bottom: `${100 - p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundColor: p.color, opacity: p.life / 1.5, filter: 'blur(1px)' }}/> ))}
            </div>
        </div>
    );
};


// Main Game Component
export const PereverniKalendar: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { addLife, addScore, character } = useSession();
    const { playSound } = useSettings();
		const { isInstructionModalVisible } = useNavigation();

    const [status, setStatus] = useState<'playing' | 'lost' | 'won'>('playing');
    const MAX_TIME = 10;
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [flippedCount, setFlippedCount] = useState(0);
    const [totalSpawnedThrees, setTotalSpawnedThrees] = useState(0);
    const [losingCalendarId, setLosingCalendarId] = useState<number | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [surgeKey, setSurgeKey] = useState(0);
    const [floatingScores, setFloatingScores] = useState<any[]>([]);

    const hasFinished = useRef(false);
    const calendarIdCounter = useRef(0);
    const spawnerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Game over logic
    const handleGameOver = useCallback((isLost: boolean) => {
        if (hasFinished.current) return;
        hasFinished.current = true;
        if(spawnerTimer.current) clearInterval(spawnerTimer.current);

        // A loss occurs if the player explicitly loses (isLost) OR if time runs out with no score.
        if (isLost || flippedCount === 0) {
            setStatus('lost');
        } else {
            // Otherwise, it's a win.
            const allFlipped = flippedCount === totalSpawnedThrees && totalSpawnedThrees > 0;
            const getsBonusChance = character === Character.KANILA || character === Character.SEXISM;
            const missedOne = flippedCount === totalSpawnedThrees - 1 && totalSpawnedThrees > 0;
            if (allFlipped) addLife(1);
            else if (getsBonusChance && missedOne && Math.random() < 0.75) addLife(1);
            setStatus('won');
        }
    }, [addLife, character, flippedCount, totalSpawnedThrees]);

    // Spawner logic
    useEffect(() => {
        if (status !== 'playing' || isInstructionModalVisible) return;
        const spawnCalendars = () => {
            const newCalendars: any[] = [];
            const spawnCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < spawnCount; i++) {
                const id = calendarIdCounter.current++;
                const type = Math.random() < 0.2 ? '2' : '3';
                if (type === '3') setTotalSpawnedThrees(current => current + 1);
                const newCal = { id, type, x: 10 + Math.random() * 80, y: 10 + Math.random() * 60, isFlipped: false, isFalling: false };
                newCalendars.push(newCal);
                setTimeout(() => {
                    setCalendars(current => current.map(c => c.id === id && !c.isFlipped ? { ...c, isFalling: true } : c));
                    setTimeout(() => setCalendars(current => current.filter(c => c.id !== id)), 1000);
                }, 2000);
            }
            setCalendars(current => [...current, ...newCalendars]);
        };
        spawnCalendars();
        spawnerTimer.current = setInterval(spawnCalendars, 3000);
        return () => { if (spawnerTimer.current) clearInterval(spawnerTimer.current); };
    }, [status, isInstructionModalVisible]);
    
    const handleGameOverRef = useRef(handleGameOver);
    useEffect(() => { handleGameOverRef.current = handleGameOver; }, [handleGameOver]);

    useGameLoop(useCallback((deltaTime) => {
        if (status !== 'playing') return;
        setTimeLeft(t => {
            const newTime = t - deltaTime / 1000;
            if (newTime <= 0) {
                handleGameOverRef.current(false);
                return 0;
            }
            return newTime;
        });
    }, [status]), status === 'playing' && !isInstructionModalVisible);

    const handleFlip = (id: number) => {
        if (status !== 'playing') return;
        const calendar = calendars.find(c => c.id === id && !c.isFlipped);
        if (!calendar) return;

        if (calendar.type === '3') {
            playSound(SoundType.FLIP);
            const newFlippedCount = flippedCount + 1;
            const timeToAdd = 5 / newFlippedCount;
            setTimeLeft(t => Math.min(MAX_TIME, t + timeToAdd));
            setSurgeKey(k => k + 1);
            addScore(3);
            setFloatingScores(scores => [...scores, { id: Date.now(), x: calendar.x, y: calendar.y }]);
            setTimeout(() => setFloatingScores(scores => scores.slice(1)), 1500);
            setFlippedCount(newFlippedCount);
            setCalendars(current => current.map(c => c.id === id ? { ...c, isFlipped: true } : c));
            setTimeout(() => setCalendars(current => current.filter(c => c.id !== id)), 600);
        } else if (calendar.type === '2') {
            playSound(SoundType.LOSE_KALENDAR);
            setLosingCalendarId(id);
            handleGameOver(true);
        }
    };
    
    const handleWinContinue = () => { playSound(SoundType.BUTTON_CLICK); onWin(); };
    const handleLoseContinue = () => { playSound(SoundType.BUTTON_CLICK); onLose(); };

    const handleRestart = () => {
        playSound(SoundType.BUTTON_CLICK);
        // Сброс всех состояний до начальных значений для перезапуска игры
        setStatus('playing');
        setTimeLeft(MAX_TIME);
        setCalendars([]);
        setFlippedCount(0);
        setTotalSpawnedThrees(0);
        setLosingCalendarId(null);
        setVideoUrl(null);
        setSurgeKey(0);
        setFloatingScores([]);
        hasFinished.current = false;
        calendarIdCounter.current = 0;
        // Таймер спаунера автоматически перезапустится благодаря useEffect, который следит за `status`
    };
    
    const loseEmbers = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({ id: i, style: { left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 2}s` } as React.CSSProperties })), []);
    
    return (
        <div className="w-full h-full flex flex-col items-center p-4 relative overflow-hidden select-none">
             <AutumnNightBackground />
            <style>{`
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .transform-rotate-y-180 { transform: rotateY(180deg); }
                @keyframes float-up-and-fade {
                    from { transform: translate(-50%, -50%); opacity: 1; }
                    to { transform: translate(-50%, -150%); opacity: 0; }
                }
                .floating-score {
                    position: absolute; font-size: 2rem; font-weight: bold;
                    color: #39FF14; /* Neon green */
                    text-shadow: 2px 2px 0 #000, 0 0 10px #39FF14;
                    animation: float-up-and-fade 1.5s ease-out forwards;
                    pointer-events: none; z-index: 50;
                }
                @keyframes fall-to-fire {
                    /* Fix: Removed dynamic 'top' from keyframe. The animation will use the element's existing 'top' value as the start point. */
                    from { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
                    to { top: 110%; transform: translate(-50%, 0) rotate(360deg); opacity: 0; }
                }
                @keyframes lose-calendar-anim {
                    0% { transform: scale(1) rotate(0deg); opacity: 1; }
                    25% { transform: scale(1.5) rotate(10deg); box-shadow: 0 0 30px 10px #ff0000; }
                    100% { transform: scale(0.5) rotate(-360deg) translateY(50vh); opacity: 0; }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                /* --- Стили для экрана поражения --- */
                
                /* Анимация горения текста */
                @keyframes burning-text-glow {
                    0%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #ff4500, 0 0 30px #ff4500, 0 0 40px #ff4500, 0 0 50px #ff4500; }
                    50% { text-shadow: 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #ff6347, 0 0 40px #ff6347, 0 0 50px #ff6347, 0 0 60px #ff6347; }
                }

                /* Стиль самого "горящего" текста. Размер настраивается в JSX через классы Tailwind (например, text-2xl) */
                .burning-text { color: #fff; animation: burning-text-glow 1.5s ease-in-out infinite; }

                /* Стиль "обгоревшей бумаги", которая служит кнопкой. Padding отвечает за отступы внутри (размер кнопки) */
                .burnt-paper { 
                    position: relative; 
                    background-color: #2d1d10; 
                    padding: 1rem 2rem; /* РЕГУЛИРОВКА: Отступы внутри кнопки. Было: 1.5rem 2.5rem */
                    transform: rotate(2deg); 
                    border: 2px solid #1a1a1a; 
                    box-shadow: inset 0 0 15px #000, 0 0 5px #ff4500, 0 0 10px #ff4500; 
                }

                /* Анимация для "угольков", летящих от бумаги */
                @keyframes rise-and-fade { to { transform: translateY(-80px); opacity: 0; } }

                /* Стиль одного "уголька" */
                .lose-ember { position: absolute; bottom: -10px; width: 6px; height: 6px; background: #ff6600; border-radius: 50%; animation: rise-and-fade linear forwards; filter: blur(2px); }

                @keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
                .star-particle { position: absolute; background-color: white; border-radius: 50%; animation: twinkle 3s ease-in-out infinite; }
            `}</style>
            
            {status === 'won' && <PereverniKalendarWinScreen onContinue={handleWinContinue} onPlayVideo={() => setVideoUrl("https://www.youtube.com/watch?v=a2ZFM5Ss0M0")} />}
            {status === 'lost' && (
                <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-center p-4">
                     <div className="absolute animate-[lose-calendar-anim_4s_ease-in-out_forwards]">
                        <Calendar calendarData={calendars.find(c => c.id === losingCalendarId)} onClick={() => {}} playSound={playSound} />
                     </div>
                     {/* Container for the video button, which fades in */}
                     <div className="opacity-0 animate-[fadeIn_2s_1.5s_ease-out_forwards] z-10">
                        {/* The clickable "burnt paper" element to watch the video */}
                        <div
                            onClick={() => setVideoUrl("https://www.youtube.com/watch?v=J5xXTQXrXXQ")}
                            className="burnt-paper cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-100"
                        >
                             {loseEmbers.map(ember => <span key={ember.id} className="lose-ember" style={ember.style}></span>)}
                             {/* 
                                РЕГУЛИРОВКА: 
                                - className: Размер текста (text-2xl) и жирность (font-bold). Было: text-4xl.
                                - Содержимое <span>: Сам текст на кнопке.
                            */}
                            <span className="burning-text text-2xl font-bold">
                                Ведь было всё у нас всерьёз...
                            </span>
                        </div>
                    </div>
                    {/* Container for the action buttons at the bottom */}
                    <div className="absolute bottom-8 flex gap-4 opacity-0 animate-[fadeIn_2s_1.5s_ease-out_forwards] z-10">
                        {/* Button to continue the game */}
                        <button 
                            onClick={handleLoseContinue} 
                            className="pixel-button p-4 text-2xl bg-green-700 hover:bg-green-800"
                        >
                            Продолжить
                        </button>
                        {/* Button to restart the game */}
                        <button 
                            onClick={handleRestart} 
                            className="pixel-button p-3 text-xl bg-yellow-600 hover:bg-yellow-700"
                        >
                            Ещё раз
                        </button>
                    </div>
                </div>
            )}
          
            {status === 'playing' && (
              <>
                <MinigameHUD>
                    <div className="w-full text-center text-yellow-300">
                        Поддерживайте огонь, переворачивая календари!
                    </div>
                </MinigameHUD>
                
                <div className="w-full h-full relative z-10">
                    {calendars.map(cal => (
                        <Calendar key={cal.id} calendarData={cal} onClick={handleFlip} playSound={playSound}/>
                    ))}
                    {floatingScores.map(score => (
                        <div key={score.id} className="floating-score" style={{ left: `${score.x}%`, top: `${score.y}%` }}>
                            +++
                        </div>
                    ))}
                </div>
                
                <BonfireTimer currentTime={timeLeft} maxTime={MAX_TIME} surgeKey={surgeKey} />
              </>
            )}
             {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </div>
    );
};