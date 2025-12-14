
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PixelArt } from '../core/PixelArt';
import { GUARD_ART_DATA, MINI_GUARD_ART } from '../../miscArt';
import { MINI_CHARACTER_ART_MAP, CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';

// Interfaces and Constants
interface Icon {
  id: number;
  type: 'player' | 'guard' | 'player_booster' | 'guard_booster';
  x: number;
  y: number;
  life: number;
  rotation: number;
}
interface Feedback {
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

export const TanecUZakrytyhDvereyWinScreen: React.FC<{ onContinue: () => void; onPlayVideo: () => void; character: Character | null }> = ({ onContinue, onPlayVideo, character }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_TANEC);
    }, [playSound]);

    // --- KANILA: PUNK RAVE ---
    if (character === Character.KANILA) {
        return (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-purple-900 overflow-hidden">
                <style>{`
                    @keyframes strobe { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
                    @keyframes rave-shake { 0% { transform: translate(0,0) rotate(0deg); } 25% { transform: translate(-5px, 5px) rotate(-5deg); } 75% { transform: translate(5px, -5px) rotate(5deg); } }
                    .strobe-bg { animation: strobe 0.1s infinite; background: repeating-conic-gradient(#4c1d95 0% 25%, #5b21b6 0% 50%); }
                    .rave-text { text-shadow: 4px 4px 0 #000; animation: rave-shake 0.2s infinite; color: #fde047; }
                `}</style>
                <div className="absolute inset-0 strobe-bg opacity-50"></div>
                <div className="z-10 flex flex-col items-center">
                    <div className="mb-8 transform scale-150 animate-[spin_1s_linear_infinite]">
                         <PixelArt artData={MINI_CHARACTER_ART_MAP[Character.KANILA]} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black rave-text mb-4 text-center">РЕЙВ У ЗАКРЫТЫХ ДВЕРЕЙ</h2>
                    <p className="text-xl text-white mb-8 bg-black p-2">ВАХТЁРША В ШОКЕ</p>
                    <div className="flex gap-4">
                        <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-yellow-500 text-black">ВИДЕО-КЛИП</button>
                        <button onClick={onContinue} className="pixel-button p-3 text-xl bg-green-700">ДАЛЬШЕ</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SEXISM: THEATRICAL BALLET ---
    if (character === Character.SEXISM) {
        const roses = Array.from({length: 20}).map((_, i) => ({
            id: i, style: { left: `${Math.random()*100}%`, animationDelay: `${Math.random()*5}s`, fontSize: `${2+Math.random()}rem` }
        }));
        return (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black overflow-hidden">
                <style>{`
                    @keyframes fall-rose { from { transform: translateY(-10vh) rotate(0deg); } to { transform: translateY(110vh) rotate(360deg); } }
                    .falling-rose { position: absolute; top: -10vh; animation: fall-rose 6s linear infinite; }
                    .spotlight-mask { background: radial-gradient(circle at center, transparent 150px, black 400px); }
                `}</style>
                {roses.map(r => <div key={r.id} className="falling-rose" style={r.style}>🌹</div>)}
                <div className="absolute inset-0 spotlight-mask pointer-events-none z-20"></div>
                
                <div className="z-10 flex flex-col items-center animate-[bounce_3s_infinite]">
                     <div className="mb-8 transform scale-125">
                         <PixelArt artData={MINI_CHARACTER_ART_MAP[Character.SEXISM]} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                    </div>
                    <h2 className="text-4xl font-serif text-pink-300 italic mb-2 text-center">"Искусство открывает любые двери"</h2>
                    <p className="text-sm text-gray-400 font-serif mb-8">— Сексизм Эванович</p>
                    
                    <div className="flex gap-4 z-30 pointer-events-auto">
                        <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-pink-700 hover:bg-pink-600">ЭТЮД</button>
                        <button onClick={onContinue} className="pixel-button p-3 text-xl bg-gray-700">БРАВО</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- BLACK PLAYER: VOID RITUAL ---
    if (character === Character.BLACK_PLAYER) {
        return (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black overflow-hidden">
                <style>{`
                    @keyframes void-pulse { 0% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 0.2; transform: scale(1); } }
                    .void-circle { position: absolute; border: 2px solid red; border-radius: 50%; animation: void-pulse 4s infinite; }
                    .glitch-font { font-family: monospace; letter-spacing: 0.2em; color: #ff0000; text-shadow: 2px 0 blue; }
                `}</style>
                <div className="void-circle w-[60vh] h-[60vh]"></div>
                <div className="void-circle w-[40vh] h-[40vh]" style={{animationDelay: '1s'}}></div>
                
                <div className="z-10 flex flex-col items-center filter invert">
                     <div className="mb-8">
                         <PixelArt artData={MINI_CHARACTER_ART_MAP[Character.BLACK_PLAYER]} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                    </div>
                </div>
                
                <h2 className="text-4xl md:text-6xl glitch-font mb-8 text-center z-10 bg-black px-4">ДВЕРЕЙ НЕ СУЩЕСТВУЕТ</h2>
                
                <div className="flex gap-4 z-10">
                    <button onClick={onPlayVideo} className="pixel-button p-3 text-xl bg-red-900 text-white border-red-500 hover:bg-red-800">ИСТОК</button>
                    <button onClick={onContinue} className="pixel-button p-3 text-xl bg-gray-900 text-white border-gray-600 hover:bg-gray-800">ПРИНЯТЬ</button>
                </div>
            </div>
        );
    }

    // --- DEFAULT (Fallback) ---
    const notes = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        char: ['♪', '♫', '♬'][i % 3],
        style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-note ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${1.5 + Math.random() * 2}rem`,
            color: ['#ff8ad8', '#0077be', '#fde047'][i % 3],
        } as React.CSSProperties
    })), []);

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 overflow-hidden">
            <style>{`
                @keyframes float-note {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(15deg); }
                }
                @keyframes spotlight-sweep {
                    0% { background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, white 5deg, transparent 10deg); }
                    100% { background: conic-gradient(from 360deg at 50% 50%, transparent 0deg, white 5deg, transparent 10deg); }
                }
                .spotlight {
                    position: absolute;
                    inset: -50%;
                    animation: spotlight-sweep 5s linear infinite;
                    opacity: 0.2;
                }
            `}</style>
            <div className="spotlight"></div>
            {notes.map(note => <div key={note.id} className="absolute" style={note.style}>{note.char}</div>)}
            <div className="text-center z-10">
                <h2 className="text-5xl text-white mb-4" style={{textShadow: "3px 3px 0px #000"}}>ТАНЕЦ — ЭТО ЖИЗНЬ!</h2>
                <button onClick={onPlayVideo} className="pixel-button p-3 text-2xl bg-yellow-500 text-black hover:bg-yellow-400">СМОТРЕТЬ ТАНЕЦ</button>
            </div>
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ПРОХОДИМ</button>
        </div>
    );
};

// Sub-components
const MuseumBackground = () => (
    <div className="absolute inset-0 bg-[#7c6f8b] overflow-hidden" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.1) 20px)'
    }}>
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-[#3d3342]"></div>
        {/* Door */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[35%] h-[80%] bg-[#5c4f6b] pixel-border border-8 border-[#3d3342]">
             <div className="w-1/2 h-full float-left border-r-4 border-[#3d3342] p-8 box-border">
                <div className="w-8 h-8 rounded-full bg-yellow-600"></div>
             </div>
             <div className="w-1/2 h-full float-right border-l-4 border-[#3d3342] p-8 box-border">
                 <div className="w-8 h-8 rounded-full bg-yellow-600"></div>
             </div>
        </div>
    </div>
);

const ScoreBar = ({ score, maxScore, isPlayer }: { score: number, maxScore: number, isPlayer: boolean }) => {
  const percentage = Math.max(0, Math.min(100, (Math.abs(score) / maxScore) * 100));
  const barClass = isPlayer ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className={`w-[45%] h-8 bg-black/50 pixel-border relative`}>
      <div className={`h-full ${barClass} transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const CharacterDisplay = ({ artData, pose, isHit, isDancing, isPlayer }: { artData: string[], pose: number, isHit: boolean, isDancing: boolean, isPlayer: boolean }) => {
    const animationClass = isHit ? 'animate-hit' : isDancing ? 'animate-dance' : '';
    const sideClass = isPlayer ? 'left-8' : 'right-8';
    const transform = `translateY(${Math.sin(pose) * 5}px) rotate(${Math.cos(pose) * 2}deg) ${isPlayer ? '' : 'scaleX(-1)'}`;

    return (
        <div className={`absolute bottom-8 ${sideClass} ${animationClass}`} style={{ transform }}>
             {/* Turn Indicator */}
             {isDancing && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-4xl animate-bounce text-yellow-400 drop-shadow-md z-10" style={{ animationDuration: '0.5s' }}>
                    🎵
                </div>
             )}
             <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={6} />
        </div>
    );
};

// Main Component
export const TanecUZakrytyhDverey: React.FC<{ onWin: () => void; onLose: () => void; }> = ({ onWin, onLose }) => {
    const { character } = useSession();
    const { playSound } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    
    const settings = useMemo(() => {
        const baseSettings = { phaseDuration: 7, maxScore: 15, iconLife: 1.5, aiAggression: 0.02, aiMistakeChance: 0.005 };
        switch(character) {
            case Character.KANILA: // Easy
                return { phaseDuration: 9, maxScore: 12, iconLife: 1.8, aiAggression: 0.01, aiMistakeChance: 0.025 }; // Lazy & Clumsy
            case Character.BLACK_PLAYER: // Hard
                return { phaseDuration: 6, maxScore: 18, iconLife: 1.2, aiAggression: 0.04, aiMistakeChance: 0.0005 }; // Aggressive & Precise
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    // State
    const [phase, setPhase] = useState<'intro' | 'player' | 'guard' | 'end'>('intro');
    const [round, setRound] = useState(0); // 0 is intro, 1-4 are game rounds
    const [playerScore, setPlayerScore] = useState(0);
    const [guardScore, setGuardScore] = useState(0);
    const [icons, setIcons] = useState<Icon[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(3);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [playerPose, setPlayerPose] = useState(0);
    const [guardPose, setGuardPose] = useState(0);
    const [playerIsHit, setPlayerIsHit] = useState(false);
    const [guardIsHit, setGuardIsHit] = useState(false);

    const iconId = useRef(0);
    const feedbackId = useRef(0);
    const timeSinceSpawn = useRef(0);
    const hasCalledOnLose = useRef(false);
    
    const charArt = useMemo(() => CHARACTER_ART_MAP[character || "Канила Дозловский"], [character]);
    const miniCharArt = useMemo(() => MINI_CHARACTER_ART_MAP[character || "Канила Дозловский"], [character]);

    const IconContent = useCallback(({ type }: { type: Icon['type'] }) => {
        switch (type) {
            case 'player':
                return <PixelArt artData={miniCharArt} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
            case 'guard':
                return <PixelArt artData={MINI_GUARD_ART} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
            case 'player_booster':
                return <span className="text-4xl text-yellow-300 filter drop-shadow-[2px_2px_0_#000]">✨</span>;
            case 'guard_booster':
                return <span className="text-4xl text-red-500 filter drop-shadow-[2px_2px_0_#000]">🚨</span>;
            default:
                return null;
        }
    }, [miniCharArt]);

    useEffect(() => {
        if (!isInstructionModalVisible) {
            setRound(1);
        }
    }, [isInstructionModalVisible]);
    
    // Phase management
    useEffect(() => {
        if (status !== 'playing' || round === 0) return;

        const timer = setTimeout(() => {
            setRound(r => r + 1);
        }, settings.phaseDuration * 1000);

        return () => clearTimeout(timer);
    }, [round, status, settings.phaseDuration]);

    // Update phase based on round
    useEffect(() => {
        if (status !== 'playing') return;

        if (round > 0 && round < 5) {
            setPhaseTimeLeft(settings.phaseDuration);
        }

        switch(round) {
            case 1:
            case 3:
                setPhase('player');
                break;
            case 2:
            case 4:
                setPhase('guard');
                break;
            case 5:
                setPhase('end');
                if (playerScore > guardScore) {
                    setStatus('won');
                } else {
                    setStatus('lost');
                }
                break;
        }
    }, [round, playerScore, guardScore, status, settings.phaseDuration, playSound]);

    // Game Loop
    useGameLoop(useCallback((deltaTime) => {
        if (status !== 'playing' || phase === 'intro' || phase === 'end') return;
        
        const dtSec = deltaTime / 1000;
        setPhaseTimeLeft(t => Math.max(0, t - dtSec));
        setPlayerPose(p => p + dtSec * 5);
        setGuardPose(p => p + dtSec * 5);

        // Icon spawning
        timeSinceSpawn.current += deltaTime;
        if (timeSinceSpawn.current > 600 - round * 50) {
            timeSinceSpawn.current = 0;
            const rand = Math.random();
            let type: Icon['type'];
            if (rand < 0.05) type = 'player_booster';
            else if (rand < 0.1) type = 'guard_booster';
            else if (rand < 0.6) type = phase === 'player' ? 'player' : 'guard';
            else type = phase === 'player' ? 'guard' : 'player';

            setIcons(prev => [...prev, {
                id: iconId.current++,
                type: type,
                x: 10 + Math.random() * 80,
                y: 20 + Math.random() * 50,
                life: settings.iconLife - round * 0.1,
                rotation: (Math.random() - 0.5) * 30
            }]);
        }

        // Icon & Feedback lifetime + AI Logic for Guard Phase
        setIcons(prev => {
            const keptIcons: Icon[] = [];
            let aiScoreAddGuard = 0;
            let aiScoreAddPlayer = 0;
            const newFeedbacks: Feedback[] = [];

            prev.forEach(i => {
                const newLife = i.life - dtSec;
                
                // AI Logic active in Guard phase
                if (phase === 'guard' && newLife > 0) {
                    const normDt = deltaTime / 16;
                    
                    // 1. Guard collects HER icons (Success)
                    if (i.type === 'guard' || i.type === 'guard_booster') {
                        const chance = settings.aiAggression * normDt;
                        if (Math.random() < chance) {
                            const points = i.type === 'guard_booster' ? 2 : 1;
                            aiScoreAddGuard += points;
                            newFeedbacks.push({
                                id: feedbackId.current++,
                                text: "МОЁ!", 
                                x: i.x,
                                y: i.y,
                                life: 1,
                                color: 'text-red-500 font-bold'
                            });
                            return; 
                        }
                    }
                    // 2. Guard accidentally collects PLAYER icons (Mistake)
                    else if (i.type === 'player' || i.type === 'player_booster') {
                        const chance = settings.aiMistakeChance * normDt;
                        if (Math.random() < chance) {
                            const points = i.type === 'player_booster' ? 2 : 1;
                            aiScoreAddPlayer += points;
                            newFeedbacks.push({
                                id: feedbackId.current++,
                                text: "ОЙ!", 
                                x: i.x,
                                y: i.y,
                                life: 1,
                                color: 'text-blue-400 font-bold'
                            });
                            return; 
                        }
                    }
                }

                if (newLife > 0) {
                    keptIcons.push({...i, life: newLife});
                }
            });

            if (aiScoreAddGuard > 0) {
                setGuardScore(s => s + aiScoreAddGuard);
                playSound(SoundType.GENERIC_CLICK);
            }
            if (aiScoreAddPlayer > 0) {
                setPlayerScore(s => s + aiScoreAddPlayer);
                playSound(SoundType.ITEM_CATCH_GOOD); // Beneficial for player
            }
            
            if (newFeedbacks.length > 0) {
                setFeedback(f => [...f, ...newFeedbacks]);
            }

            return keptIcons;
        });

        setFeedback(prev => prev.map(f => ({...f, life: f.life - dtSec, y: f.y - 10 * dtSec})).filter(f => f.life > 0));

    }, [phase, status, round, settings.iconLife, settings.aiAggression, settings.aiMistakeChance, playSound]), status === 'playing' && !isInstructionModalVisible);

    const handleIconClick = (clickedIcon: Icon) => {
        if (phase === 'intro' || phase === 'end') return;
        
        const isBooster = clickedIcon.type.includes('booster');
        const points = isBooster ? 2 : 1;
        let scoreChangeForPlayer = 0;
        let color = 'text-gray-400';

        if (phase === 'player') {
            if (clickedIcon.type.startsWith('player')) {
                setPlayerScore(s => s + points);
                scoreChangeForPlayer = points;
                setGuardIsHit(true);
                setTimeout(() => setGuardIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_GOOD);
                color = 'text-blue-400';
            } else {
                setGuardScore(s => s + points);
                scoreChangeForPlayer = -points;
                setPlayerIsHit(true);
                setTimeout(() => setPlayerIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_BAD);
                color = 'text-red-400';
            }
        } else { // Guard's phase
             if (clickedIcon.type.startsWith('guard')) {
                setPlayerScore(s => s + points);
                scoreChangeForPlayer = points;
                setGuardIsHit(true);
                setTimeout(() => setGuardIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_GOOD);
                color = 'text-blue-400';
            } else {
                setGuardScore(s => s + points);
                scoreChangeForPlayer = -points;
                setPlayerIsHit(true);
                setTimeout(() => setPlayerIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_BAD);
                color = 'text-red-400';
            }
        }
        
        setFeedback(prev => [...prev, {
            id: feedbackId.current++,
            text: `${scoreChangeForPlayer > 0 ? '+' : ''}${scoreChangeForPlayer}`,
            x: clickedIcon.x,
            y: clickedIcon.y,
            life: 1,
            color
        }]);
        setIcons(prev => prev.filter(i => i.id !== clickedIcon.id));
    };

    // Effect for handling the lose condition side-effect
    useEffect(() => {
        if (status === 'lost' && !hasCalledOnLose.current) {
            hasCalledOnLose.current = true;
            onLose();
        }
    }, [status, onLose]);

    const isPlayerTurn = phase === 'player';
    const isGuardTurn = phase === 'guard';
    
    // Calculate total remaining time based on current round and phaseTimeLeft
    const remainingRounds = Math.max(0, 4 - round);
    // Rough estimate: current phase remaining + duration of future rounds
    const totalTimeRemaining = phaseTimeLeft + (remainingRounds * settings.phaseDuration);
    
    const isUrgent = totalTimeRemaining <= 5;

    const renderGame = () => (
        <>
            <div className="absolute top-20 w-full flex justify-between px-4 z-20">
                <ScoreBar score={playerScore} maxScore={settings.maxScore} isPlayer={true} />
                <div className="text-center text-white">
                    <div className={`text-4xl font-bold ${isUrgent ? 'text-red-500 animate-pulse' : ''}`}>{Math.ceil(totalTimeRemaining)}</div>
                </div>
                <ScoreBar score={guardScore} maxScore={settings.maxScore} isPlayer={false} />
            </div>

            <CharacterDisplay artData={charArt} pose={playerPose} isHit={playerIsHit} isDancing={isPlayerTurn} isPlayer={true} />
            <CharacterDisplay artData={GUARD_ART_DATA} pose={guardPose} isHit={guardIsHit} isDancing={isGuardTurn} isPlayer={false} />
            
            {icons.map(icon => (
                <div 
                    key={icon.id}
                    className="absolute cursor-pointer transition-opacity duration-200"
                    style={{
                        left: `${icon.x}%`,
                        top: `${icon.y}%`,
                        transform: `translate(-50%, -50%) rotate(${icon.rotation}deg)`,
                        opacity: icon.life / settings.iconLife
                    }}
                    onClick={() => handleIconClick(icon)}
                    onTouchStart={() => handleIconClick(icon)}
                >
                    <IconContent type={icon.type} />
                </div>
            ))}
            {feedback.map(f => (
                <div key={f.id} className={`absolute font-bold text-2xl pointer-events-none ${f.color}`} style={{
                    left: `${f.x}%`, top: `${f.y}%`, opacity: f.life, transform: 'translate(-50%, -50%)'
                }}>{f.text}</div>
            ))}
        </>
    );

    if (status === 'won') {
        return (
             <>
                <TanecUZakrytyhDvereyWinScreen onContinue={onWin} onPlayVideo={() => setVideoUrl("https://www.youtube.com/watch?v=ZyOkyXVPBt4")} character={character} />
                {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
            </>
        )
    }
    
    // --- LOSE SCREEN ---
    if (status === 'lost') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/95 animate-[fadeIn_0.2s]">
                <style>{`
                    @keyframes door-slam {
                        0% { transform: scale(3); opacity: 0; }
                        50% { transform: scale(1); opacity: 1; }
                        55% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                    @keyframes anger-shake {
                        0%, 100% { transform: translate(0, 0) rotate(0deg); }
                        25% { transform: translate(-5px, 5px) rotate(-5deg); }
                        50% { transform: translate(5px, -5px) rotate(5deg); }
                        75% { transform: translate(-5px, -5px) rotate(-5deg); }
                    }
                `}</style>
                <div className="transform scale-150 mb-12 animate-[door-slam_0.5s_ease-out_forwards]">
                    <div style={{animation: 'anger-shake 0.5s infinite'}}>
                        <PixelArt artData={GUARD_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                    </div>
                </div>
                <h2 className="text-6xl text-white font-black mb-4 uppercase tracking-widest border-4 border-white p-4 transform -rotate-6 shadow-[10px_10px_0px_#000]">ЗАКРЫТО!</h2>
                <p className="text-2xl text-red-200 mt-4 font-mono bg-black/50 px-4 py-2 rounded">САНИТАРНЫЙ ДЕНЬ</p>
                <p className="text-xl text-red-300 mt-2 font-mono italic">И вообще!</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            <MuseumBackground />
            {!isInstructionModalVisible && renderGame()}
        </div>
    );
};
