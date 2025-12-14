
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { NEPODAVIS_HEAD_ART, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType } from '../../utils/AudioEngine';
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


// Экран победы: получение "стрададаховки".
export const NePodavisWinScreen: React.FC<{ onContinue: () => void; character: Character | null }> = ({ onContinue, character }) => {
    const { playSound } = useSettings();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        playSound(SoundType.WIN_NEPODAVIS);
    }, [playSound]);
    
    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=29p14n_qeN0");
    };

    let content = null;

    // --- KANILA: GONZO SURVIVAL ---
    if (character === Character.KANILA) {
        content = (
            <div
                onClick={handlePlayVideo}
                className="w-96 h-60 bg-yellow-200 p-4 pixel-border flex flex-col text-black transform rotate-2 cursor-pointer hover:scale-105 transition-transform relative overflow-hidden"
                style={{textShadow: 'none'}}
            >
                {/* Coffee stains */}
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 border-8 border-yellow-700/30 rounded-full"></div>
                <div className="absolute bottom-[20px] left-[40px] w-16 h-16 border-4 border-yellow-700/20 rounded-full"></div>
                
                <h3 className="text-xl text-center font-bold font-mono uppercase border-b-2 border-black pb-2">Сертификат Выжившего</h3>
                <div className="flex-grow flex flex-col justify-center mt-2 font-mono text-sm space-y-2">
                    <p>ИМЯ: <strong>КАНИЛА Д.</strong></p>
                    <p>СТАТУС: <strong>ЖИВОЙ (ВРОДЕ)</strong></p>
                    <p>ДИАГНОЗ: <strong>ОСТРЫЙ ДАДАИЗМ</strong></p>
                </div>
                <div className="absolute bottom-4 right-4 transform -rotate-12 border-4 border-red-600 px-2 py-1 text-red-600 font-black text-xl">
                    ПРОВЕРЕНО
                </div>
            </div>
        );
    }
    // --- SEXISM: CRITIC REVIEW ---
    else if (character === Character.SEXISM) {
        content = (
            <div
                onClick={handlePlayVideo}
                className="w-96 h-60 bg-white p-6 border-double border-4 border-gray-300 shadow-2xl flex flex-col text-gray-800 cursor-pointer hover:scale-105 transition-transform"
                style={{textShadow: 'none', fontFamily: 'serif'}}
            >
                <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-2">
                    <h3 className="text-2xl font-bold italic text-black">Le Critique</h3>
                    <div className="text-xs text-gray-500">Vol. 317</div>
                </div>
                <div className="flex-grow text-sm italic leading-relaxed">
                    "Подача была агрессивной, но текстура экзистенциального ужаса... божественна. Послевкусие абсурда остаётся надолго."
                </div>
                <div className="mt-2 flex justify-between items-end">
                    <div className="font-bold">- С. Эванович</div>
                    <div className="flex text-yellow-500 text-2xl">★★★★★</div>
                </div>
            </div>
        );
    }
    // --- BLACK PLAYER: ENTITY REPORT ---
    else if (character === Character.BLACK_PLAYER) {
        content = (
            <div
                onClick={handlePlayVideo}
                className="w-96 h-60 bg-black p-4 border-2 border-green-500 flex flex-col text-green-500 cursor-pointer hover:scale-105 transition-transform font-mono"
                style={{textShadow: '0 0 5px #00ff00'}}
            >
                <div className="text-xs mb-4 border-b border-green-900 pb-1">:: SYSTEM_LOG_317 ::</div>
                <div className="flex-grow space-y-1 text-sm">
                    <p>{'>'} SCANNING SUBJECT...</p>
                    <p>{'>'} BIOLOGICAL NEEDS: <span className="text-red-500">NULL</span></p>
                    <p>{'>'} CHOKE HAZARD: <span className="text-red-500">NEGATIVE</span></p>
                    <p>{'>'} ABSORPTION RATE: 100%</p>
                </div>
                <div className="animate-pulse bg-green-900 text-black text-center font-bold py-1 mt-2">
                    ASSIMILATION COMPLETE
                </div>
            </div>
        );
    }
    // --- DEFAULT ---
    else {
        content = (
            <div
                onClick={handlePlayVideo}
                className="w-96 h-60 bg-slate-200 p-4 pixel-border flex flex-col text-black transform rotate-3 cursor-pointer hover:scale-105 transition-transform"
                style={{textShadow: 'none'}}
            >
                <h3 className="text-xl text-center font-bold">Медицинская Стрададаховка</h3>
                <div className="flex-grow flex items-center justify-between mt-4">
                    <div className="text-left text-sm space-y-1"><p>Страхователь: <strong>Георгий</strong></p><p>Риски: <strong>Нелепость Бытия</strong></p><p>Покрытие: <strong>До следующего раза</strong></p><p>Франшиза: <strong>Одна жизнь</strong></p></div>
                    <div className="text-center"><div className="w-28 h-36 border-4 border-red-600 rounded-full flex items-center justify-center text-red-600 text-md font-bold">ДАДА <br/> APPROVED</div></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
                 <h2 className="text-3xl text-yellow-300 mb-8">ВЫ ВЫЖИЛИ!</h2>
                 {content}
                  <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ПРОХОДИМ</button>
            </div>
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </>
    );
};

// Компонент головы игрока с анимациями.
const PlayerHead: React.FC<{ artData: string[], isHit: boolean, isRecovering: boolean }> = ({ artData, isHit, isRecovering }) => {
    const animationClass = isRecovering ? 'animate-recover-shake' : isHit ? 'animate-hit-shake' : '';
    return <div className={`relative ${animationClass}`}><PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={8} /></div>;
};

const COUGH_PARTICLE_COLORS = ['#ffdd00', '#ff0000', '#00ff00', '#0000ff', '#ffffff'];

export const NePodavis: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { character } = useSession();
    const { playSound } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    const hasFinished = useRef(false);
    const projectileId = useRef(0);
    const particleId = useRef(0);
    const coughParticleId = useRef(0);
    const coughForce = useRef(0); // "Сила кашля" от кликов.

    const [round, setRound] = useState(1);
    const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing');
    const [projectiles, setProjectiles] = useState<any[]>([]);
    const [hitCount, setHitCount] = useState(0);
    
    // Игра состоит из двух фаз: 'avoid' (уклонение) и 'recover' (откашливание).
    const [gamePhase, setGamePhase] = useState<'avoid' | 'recover'>('avoid');
    const [chokeLevel, setChokeLevel] = useState(50); // Уровень удушья в фазе 'recover'.
    
    const [isHitVisual, setIsHitVisual] = useState(false);
    const [particles, setParticles] = useState<any[]>([]);
    const [coughParticles, setCoughParticles] = useState<any[]>([]);

    // Параметры сложности для каждого раунда.
    const roundSettings = useMemo(() => {
        const baseSettings = [
            { id: 1, spawnRate: 0.07, speed: 10, chokeIncrease: 5, chokeReduce: 8, hitsToRecover: 3 },
            { id: 2, spawnRate: 0.12, speed: 15, chokeIncrease: 7, chokeReduce: 6, hitsToRecover: 3 },
            { id: 3, spawnRate: 0.18, speed: 20, chokeIncrease: 9, chokeReduce: 5, hitsToRecover: 3 },
        ][round - 1];

        switch(character) {
            case Character.KANILA: // Easy
                return { ...baseSettings, spawnRate: baseSettings.spawnRate * 0.8, speed: baseSettings.speed * 0.8, chokeIncrease: baseSettings.chokeIncrease * 0.7, chokeReduce: baseSettings.chokeReduce * 1.3, hitsToRecover: 5 };
            case Character.BLACK_PLAYER: // Hard
                return { ...baseSettings, spawnRate: baseSettings.spawnRate * 1.3, speed: baseSettings.speed * 1.2, chokeIncrease: baseSettings.chokeIncrease * 1.3, chokeReduce: baseSettings.chokeReduce * 0.7, hitsToRecover: 2 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [round, character]);

    const charArt = useMemo(() => NEPODAVIS_HEAD_ART[character || Character.KANILA], [character]);
    const dadaProjectileColor = useMemo(() => { if (round === 2) return 'text-cyan-300'; if (round === 3) return 'text-lime-300'; return 'text-yellow-300'; }, [round]);

    // Сброс состояния при начале нового раунда.
    useEffect(() => { setGamePhase('avoid'); setProjectiles([]); setParticles([]); setCoughParticles([]); projectileId.current = 0; coughForce.current = 0; setHitCount(0); setStatus('playing'); hasFinished.current = false; }, [round]);
    
    // Переход в фазу 'recover' после N попаданий.
    useEffect(() => { if (hitCount >= roundSettings.hitsToRecover && gamePhase === 'avoid') { setGamePhase('recover'); setChokeLevel(50); setProjectiles([]); } }, [hitCount, gamePhase, roundSettings.hitsToRecover]);

    // Основной игровой цикл.
    useGameLoop(useCallback((deltaTime) => {
        if(hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;
        
        if (gamePhase === 'avoid') {
            // Появление летящих объектов.
            if (Math.random() < roundSettings.spawnRate) {
                const angle = Math.random() * 2 * Math.PI;
                const content = ['🎷🪕🥁', '🥒🥔🧅', 'word', '🍌🍑🍓', '💧🚾🌊'][Math.floor(Math.random()*5)];
                setProjectiles(p => [...p, { id: projectileId.current++, x: 50 + Math.sin(angle) * 70, y: 50 - Math.cos(angle) * 70, vx: -Math.sin(angle), vy: Math.cos(angle), content }]);
            }
            // Движение и проверка столкновений объектов.
            setProjectiles(currentProjs => {
                const updated = [];
                for (const p of currentProjs) {
                    const newX = p.x + p.vx * roundSettings.speed * dtSec; const newY = p.y + p.vy * roundSettings.speed * dtSec;
                    const dist = Math.sqrt(Math.pow(newX - 50, 2) + Math.pow(newY - 50, 2));
                    if (dist < 12) { playSound(SoundType.PLAYER_HIT); setHitCount(c => c + 1); setIsHitVisual(true); setTimeout(() => setIsHitVisual(false), 400); continue; } // Попадание!
                    if (dist > 100) continue;
                    updated.push({ ...p, x: newX, y: newY });
                }
                return updated;
            });
        } else if (gamePhase === 'recover') {
            // Уровень удушья растет со временем.
            const chokeIncrease = roundSettings.chokeIncrease * dtSec;
            // Клик (кашель) уменьшает удушье. Сила кашля со временем ослабевает.
            const chokeDecrease = coughForce.current * 2 * dtSec;
            coughForce.current = Math.max(0, coughForce.current - roundSettings.chokeReduce * 2 * dtSec);
            setChokeLevel(c => {
                const newChoke = Math.min(100, Math.max(0, c + chokeIncrease - chokeDecrease));
                if (newChoke >= 100 && !hasFinished.current) { hasFinished.current = true; setStatus('lost'); setTimeout(onLose, 2000); } // Проигрыш
                if (c > 0 && newChoke <= 0 && !hasFinished.current) { // Победа в раунде
                    if (round < 3) setRound(r => r + 1);
                    else { hasFinished.current = true; setStatus('won'); }
                }
                return newChoke;
            });
            // Анимация частиц кашля.
            setCoughParticles(currentParticles => currentParticles.map(p => ({ ...p, x: p.x + p.vx * dtSec, y: p.y + p.vy * dtSec, vy: p.vy + 40 * dtSec, life: p.life - dtSec })).filter(p => p.life > 0));
        }
    }, [status, gamePhase, round, roundSettings, onLose, playSound]), status === 'playing' && !isInstructionModalVisible);

    // Клик по летящему объекту для его уничтожения.
    const handleProjectileClick = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        e.stopPropagation();
        if (gamePhase !== 'avoid' || status !== 'playing') return;
        playSound(SoundType.DESTROY);
        const projectile = projectiles.find(p => p.id === id);
        if (projectile) {
             const newParticles = Array.from({length: 8}).map((_, i) => ({ id: particleId.current++, x: projectile.x, y: projectile.y, angle: i * 45 }));
             setParticles(p => [...p, ...newParticles]);
             setTimeout(() => setParticles(p => p.filter(particle => !newParticles.some(np => np.id === particle.id))), 400);
        }
        setProjectiles(projs => projs.filter(p => p.id !== id));
    };

    // Клик по голове для "откашливания".
    const handleRecoverClick = () => {
        if (gamePhase !== 'recover' || status !== 'playing') return;
        playSound(SoundType.COUGH);
        coughForce.current += roundSettings.chokeReduce; // Увеличиваем силу кашля.
        // Создаем частицы кашля.
        const newParticles = Array.from({length: 8}).map(() => {
            const angle = -Math.PI + Math.random() * Math.PI; const speed = 30 + Math.random() * 30;
            return { id: coughParticleId.current++, x: 50, y: 50, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: COUGH_PARTICLE_COLORS[Math.floor(Math.random() * COUGH_PARTICLE_COLORS.length)], life: 0.5 + Math.random() * 0.5 };
        });
        setCoughParticles(p => [...p, ...newParticles]);
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    return (
        <div className="w-full h-full pulsing-bg flex flex-col items-center justify-center relative overflow-hidden" onClick={handleRecoverClick} onTouchStart={handleRecoverClick}>
             <style>{`
                @keyframes pulse-bg { 0% { background-size: 100% 100%; } 50% { background-size: 120% 120%; } 100% { background-size: 100% 100%; } }
                .pulsing-bg { background: radial-gradient(circle, #4a0000 0%, #1a0000 70%, #000 100%); animation: pulse-bg 5s ease-in-out infinite; }
                @keyframes hit-shake { 0%, 100% { transform: translate(0, 0) rotate(0); } 10% { transform: translate(-8px, 0px) rotate(-2deg); } 30% { transform: translate(8px, 0px) rotate(2deg); } 50% { transform: translate(0, 0) rotate(0); } } .animate-hit-shake { animation: hit-shake 0.4s ease-in-out; }
                @keyframes recover-shake { 0% { transform: translate(0, 0); } 25% { transform: translate(4px, -4px); } 50% { transform: translate(-4px, 4px); } 75% { transform: translate(4px, 4px); } 100% { transform: translate(0, 0); } } .animate-recover-shake { animation: recover-shake 0.15s infinite; }
                @keyframes poof { from { transform: translate(0, 0) scale(0.5); opacity: 1; } to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } } .particle { animation: poof 0.4s ease-out forwards; }
            `}</style>
            {status === 'won' && <NePodavisWinScreen onContinue={handleWinContinue} character={character} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/80 z-40 flex items-center justify-center text-5xl">ПОДАВИЛСЯ!</div>}
            
            {!isInstructionModalVisible && status === 'playing' && <>
                <MinigameHUD>
                    <div className="w-full text-center">
                        <div className="text-2xl mb-2">Раунд {round}/3</div>
                        <div className="flex justify-center gap-2">
                            {Array.from({length: roundSettings.hitsToRecover}).map((_, i) => 
                                <div key={i} className={`w-12 h-12 text-4xl flex items-center justify-center pixel-border transition-colors duration-200 ${i < hitCount ? 'bg-red-600' : 'bg-gray-700'}`}>
                                    ☠️
                                </div>
                            )}
                        </div>
                    </div>
                </MinigameHUD>

                <div className="relative cursor-pointer"><PlayerHead artData={charArt} isHit={isHitVisual} isRecovering={gamePhase === 'recover'} /></div>
                
                {gamePhase === 'avoid' && projectiles.map(p => <div key={p.id} className={`absolute text-3xl cursor-pointer ${p.content === 'word' ? dadaProjectileColor : ''}`} style={{left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)'}} onClick={(e) => handleProjectileClick(e, p.id)} onTouchStart={(e) => handleProjectileClick(e, p.id)}>{p.content === 'word' ? 'ДАДА' : p.content}</div>)}
                {particles.map(p => <div key={p.id} className="particle absolute text-white text-2xl pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%`, '--tx': `${Math.cos(p.angle) * 50}px`, '--ty': `${Math.sin(p.angle) * 50}px` } as React.CSSProperties}>*</div>)}
                {coughParticles.map(p => <div key={p.id} className="absolute w-3 h-3 pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color, }}></div>)}
                {gamePhase === 'recover' && (
                    <>
                        <div className="absolute left-10 bottom-10 h-3/4 w-12 pixel-border bg-black z-20"><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-400 via-orange-500 to-red-600" style={{height: `${chokeLevel}%`}}></div></div>
                        <div className="absolute bottom-10 text-center text-yellow-300 z-30 p-4 pointer-events-none"><p className="text-2xl animate-pulse">Давайте, Геймлих!</p></div>
                    </>
                )}
            </>}
        </div>
    );
};
