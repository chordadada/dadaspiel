
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { STROITELNIE_TERMINY } from '../../data/wordData';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { CHALK_DRAWINGS } from '../../miscArt';

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


const OBSTACLE_COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

interface Obstacle { id: number; type: 'person' | 'animal' | 'concept'; content: string; x: number; y: number; vx: number; vy: number; size: number; color?: string; isHit?: boolean; }

// Компонент, имитирующий сцену из немого кино.
const DadaSilentMovie: React.FC<{ movieType: 'casablanca' | 'nosferatu' | 'trip-to-the-moon', isMuted: boolean }> = ({ movieType, isMuted }) => {
    
    // Функция для проигрывания процедурно сгенерированных звуков с помощью Web Audio API.
    const playNotes = useCallback((notes: { freq: number; time: number; dur: number; type?: OscillatorType }[]) => {
        if (isMuted) return;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (!audioContext) return;
            notes.forEach(note => {
                const oscillator = audioContext.createOscillator(); const gainNode = audioContext.createGain();
                oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime); gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + note.time + 0.01); gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + note.time + note.dur);
                oscillator.type = note.type || 'sine'; oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);
                oscillator.start(audioContext.currentTime + note.time); oscillator.stop(audioContext.currentTime + note.time + note.dur);
            });
        } catch (e) { console.error("Could not play sound:", e); }
    }, [isMuted]);

    // Проигрываем звуки в зависимости от типа "фильма".
    useEffect(() => {
        if (movieType === 'casablanca') playNotes([{ freq: 261, time: 2.5, dur: 0.2 }, { freq: 329, time: 2.8, dur: 0.2 }, { freq: 392, time: 3.1, dur: 0.2 }, { freq: 523, time: 3.5, dur: 0.8, type: 'triangle' }]);
        else if (movieType === 'nosferatu') playNotes([{ freq: 110, time: 0, dur: 4, type: 'sawtooth' }, { freq: 115, time: 1, dur: 3, type: 'sawtooth' }, { freq: 125, time: 2, dur: 2, type: 'sawtooth' }, { freq: 880, time: 4.5, dur: 0.1, type: 'square' }, { freq: 932, time: 4.6, dur: 0.1, type: 'square' }]);
        else if (movieType === 'trip-to-the-moon') {
            const swoosh: any[] = []; for (let i = 0; i < 20; i++) swoosh.push({ freq: 200 + i * 50, time: i * 0.1, dur: 0.1, type: 'square' });
            playNotes(swoosh); playNotes([{ freq: 80, time: 2.1, dur: 0.5, type: 'triangle' }]);
        }
    }, [movieType, playNotes]);

    return (
        <div className="absolute inset-0 bg-black z-40 flex items-center justify-center overflow-hidden">
            {/* CSS-анимации для каждой сцены */}
            <style>{`
                @keyframes casablanca-left { 0% { left: -20%; } 100% { left: 40%; transform: rotate(-15deg); } } @keyframes casablanca-right { 0% { right: -20%; } 100% { right: 40%; transform: rotate(15deg); } } @keyframes heart-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; } }
                @keyframes nosferatu-approach { 0% { left: -30%; } 100% { left: 70%; } } @keyframes nosferatu-shadow { 0% { transform: scale(1, 1) skewX(0deg); opacity: 0.3; } 100% { transform: scale(4, 1.2) skewX(20deg); opacity: 0.6; } } @keyframes scary-flash { 40%, 42%, 100% { background-color: transparent; } 41% { background-color: rgba(200, 0, 0, 0.9); } } @keyframes victim-cower { 0%, 100% { transform: skewX(0); } 20% { transform: skewX(-10deg); } 80% { transform: skewX(10deg); }}
                @keyframes moon-rocket-fly { from { left: -10%; top: 50%; transform: rotate(-30deg); } to { left: 68%; top: 40%; transform: rotate(10deg); } } @keyframes moon-wince { 0%, 100% { transform: scale(1) rotate(0); } 5% { transform: scale(1.05, 0.9) rotate(-2deg); } 10% { transform: scale(1) rotate(0); } }
            `}</style>
            {movieType === 'casablanca' && (<> <div className="absolute w-20 h-40 bg-white" style={{ animation: 'casablanca-left 2.5s ease-out forwards' }}></div><div className="absolute w-20 h-40 bg-white" style={{ animation: 'casablanca-right 2.5s ease-out forwards' }}></div><div className="absolute top-1/2 left-1/2 text-red-500 text-6xl opacity-0" style={{ animation: 'heart-pulse 1s ease-in-out 3s infinite' }}>♥</div></>)}
            {movieType === 'nosferatu' && (<> <div className="absolute inset-0" style={{animation: 'scary-flash 5s linear forwards'}}></div><div className="absolute bottom-0 w-16 h-20 bg-white" style={{ left: '80%', animation: 'victim-cower 0.5s linear infinite 1s' }}></div><div className="absolute bottom-0 w-12 h-48 bg-gray-300 transform" style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)', animation: 'nosferatu-approach 4s linear forwards' }}><div className="absolute bottom-0 w-full h-1/2 bg-black" style={{ animation: 'nosferatu-shadow 4s linear forwards' }}></div></div></>)}
            {movieType === 'trip-to-the-moon' && (<div className="w-full h-full relative"><div className="absolute w-48 h-48 bg-gray-200 rounded-full" style={{ right: '5%', top: '30%' }}><div className="absolute w-8 h-8 bg-gray-400 rounded-full" style={{ left: '25%', top: '30%' }}></div><div id="moon-eye" className="absolute w-12 h-12 bg-gray-400 rounded-full" style={{ right: '30%', top: '35%', animation: 'moon-wince 3s linear 2s infinite' }}></div><div className="absolute w-10 h-4 bg-gray-400 rounded-full" style={{ left: '30%', top: '65%', transform: 'rotate(20deg)' }}></div></div><div className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[60px] border-r-white" style={{ animation: 'moon-rocket-fly 2s ease-in forwards' }}></div></div>)}
        </div>
    );
};

// Компонент для отображения титров (интертитров) в стиле немого кино.
const SilentMovieCard: React.FC<{ text: string, subtext?: string, isEnd?: boolean }> = ({ text, subtext, isEnd }) => (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 animate-[movie_card_fade_in_1s]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English&display=swap'); .movie-card-text { font-family: 'IM Fell English', serif; } @keyframes movie_card_fade_in_1s { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <div className="w-[90%] h-[80%] border-4 border-double border-gray-400 p-8 flex flex-col items-center justify-center text-center movie-card-text"><p className={`text-4xl md:text-5xl text-gray-200 leading-relaxed ${isEnd ? 'italic' : ''}`}>{text}</p>{subtext && <p className="mt-8 text-2xl md:text-3xl text-gray-300">{subtext}</p>}</div>
    </div>
);

// Компонент-плеер, который управляет показом титров и самой сцены.
const SilentMoviePlayer: React.FC<{ movieType: 'casablanca' | 'nosferatu' | 'trip-to-the-moon', onFinish: () => void, isMuted: boolean }> = ({ movieType, onFinish, isMuted }) => {
    // `phase` - это состояние, которое управляет тем, что сейчас на экране: титры, сцена или конец.
    const [phase, setPhase] = useState(0); 
    const content = useMemo(() => { // Тексты для каждого фильма.
        switch (movieType) {
            case 'trip-to-the-moon': return { title: 'ПУТЕШЕСТВИЕ НА ДАДУ', titleSub: '(или как я перестал любить и начал бояться)', intertitle1: 'Смелые дада-навты отправляются к единственному небесному телу, что их понимает.', intertitle2: 'Луна опозорена. Она-то думала, что она — сюрреалистка.', endCard: 'КОНЕЦ?' };
            case 'nosferatu': return { title: 'НОС ФЕРАТУ', titleSub: 'УЖАС СИМФОНИИ УЖАСА', intertitle1: 'Тень чего-то экзистенциального нависла над деревней...', intertitle2: '...но это была всего лишь тень носа Ферату.', endCard: 'FIN.' };
            case 'casablanca': return { title: 'КАСАБЛАНОК', titleSub: '(с чесноком)', intertitle1: 'Из всех арт-кафе во всех городах он вошёл в моё.', intertitle2: 'Сыграй ещё раз, Сэмка. Только на этот раз что-нибудь про деконструкцию.', endCard: 'ДАДА.' };
        }
    }, [movieType]);

    // Таймер для автоматической смены фаз.
    useEffect(() => {
        if (phase > 5) return; let delay = 0;
        switch(phase) {
            case 0: delay = 100; break; case 1: delay = 4000; break; case 2: delay = 4000; break; case 3: delay = 5000; break; case 4: delay = 4000; break; case 5: delay = 3000; break;
        }
        const timer = setTimeout(() => {
            if (phase >= 5) { onFinish(); } else { setPhase(p => p + 1); }
        }, delay);
        return () => clearTimeout(timer);
    }, [phase, onFinish]);

    switch(phase) {
        case 1: return <SilentMovieCard text={content.title} subtext={content.titleSub} />;
        case 2: return <SilentMovieCard text={content.intertitle1} />;
        case 3: return <DadaSilentMovie movieType={movieType} isMuted={isMuted} />;
        case 4: return <SilentMovieCard text={content.intertitle2} />;
        case 5: return <SilentMovieCard text={content.endCard} isEnd />;
        default: return <div className="absolute inset-0 bg-black z-40"></div>; // Пустой экран в начале.
    }
};

export const ProhodKKinoWinScreen: React.FC<{ onContinue: () => void; isMuted: boolean }> = ({ onContinue, isMuted }) => {
    const { playSound } = useSettings();
    const [movie, setMovie] = useState<'casablanca' | 'nosferatu' | 'trip-to-the-moon' | null>(null);
    const [movieFinished, setMovieFinished] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    
    const handleSetMovie = (movieType: 'casablanca' | 'nosferatu' | 'trip-to-the-moon') => {
        playSound(SoundType.BUTTON_CLICK);
        setMovie(movieType);
    };

    const handleBack = () => {
        playSound(SoundType.BUTTON_CLICK);
        onContinue();
    };
    
    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=v0OXygaPB8c");
    };
    
    if (movieFinished) {
        return (
             <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-center">
                 <h2 className="text-4xl mb-6">Фильм окончен... но не дадаизм.</h2>
                 <button onClick={handlePlayVideo} className="pixel-button p-4 text-2xl bg-yellow-600 text-black">
                    ПОСЛЕСЛОВИЕ
                 </button>
                 <button onClick={handleBack} className="pixel-button absolute bottom-8 p-4 text-xl">ПРОЙДЁМТЕ</button>
                 {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl mb-4">Выберите фильм для просмотра:</h3>
                <div className="flex flex-col gap-4">
                    <button onClick={() => handleSetMovie('casablanca')} className="pixel-button p-2">КАСАБЛАНОК</button>
                    <button onClick={() => handleSetMovie('nosferatu')} className="pixel-button p-2">НОС ФЕРАТУ</button>
                    <button onClick={() => handleSetMovie('trip-to-the-moon')} className="pixel-button p-2">ПУТЕШЕСТВИЕ НА ДАДУ</button>
                </div>
                 <button onClick={handleBack} className="pixel-button absolute bottom-8 p-4 text-xl">ПРОПУСТИТЬ</button>
            </div>
        )
    }
    
    return <SilentMoviePlayer movieType={movie} onFinish={() => setMovieFinished(true)} isMuted={isMuted} />
};

export const ProhodKKino: React.FC<{ onWin: () => void; onLose: () => void; isMinigameInverted?: boolean }> = ({ onWin, onLose, isMinigameInverted = false }) => {
    const { playSound, isMuted } = useSettings();
    const { addScore, character } = useSession();
    const { isInstructionModalVisible } = useNavigation();
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);

    const settings = useMemo(() => {
        const baseSettings = { playerSpeed: 6, obstacleSpeedMultiplier: 1 };
        switch(character) {
            case Character.KANILA: // Easy
                return { playerSpeed: 5, obstacleSpeedMultiplier: 0.8 };
            case Character.BLACK_PLAYER: // Hard
                return { playerSpeed: 7, obstacleSpeedMultiplier: 1.25 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    const [round, setRound] = useState(1);
    const [player, setPlayer] = useState({ x: 5, y: 50 }); // Позиция игрока в %.
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [wobble, setWobble] = useState(0); // State for player walking animation
    
    // Chalk drawings logic
    const [chalkDecorations, setChalkDecorations] = useState<{id: number, x: number, y: number, art: string[]}[]>([]);

    useEffect(() => {
        // Generate random chalk drawings once on mount/round 1
        const decos = [];
        for(let i=0; i<3; i++) {
            const artIndex = Math.floor(Math.random() * CHALK_DRAWINGS.length);
            decos.push({
                id: i,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80,
                art: CHALK_DRAWINGS[artIndex]
            });
        }
        setChalkDecorations(decos);
    }, []);

    // Art assets
    const charArt = useMemo(() => CHARACTER_ART_MAP[character || Character.KANILA], [character]);

    // Генерация препятствий для каждого раунда.
    useEffect(() => {
        const newObstacles: Obstacle[] = []; const numObstacles = 10 + round * 4;
        const obstaclePools = { person: ['🚶', '🏃', '🧍', '🧑‍🤝‍🧑', '🧎', '💃', '🕺', '🤸', '🧗', '🧘', '👨‍👩‍👧‍👦', '🤾', '👩‍🦽', '👨‍🦯'], animal: ['🦇', '🐈', '🐀', '🐍', '������️', '🦂', '🐕', '🐩', '🐅', '🐊', '🦥', '🐌', '🦀', '🦑', '🐘'], concept: STROITELNIE_TERMINY };
        const types: ('person' | 'animal' | 'concept')[] = ['person', 'animal', 'concept']; const typeForRound = types[round - 1]; const size = typeForRound === 'concept' ? 20 : (round < 3 ? 45 : 30);
        for (let i = 0; i < numObstacles; i++) {
            const pool = obstaclePools[typeForRound];
            newObstacles.push({ id: i, type: typeForRound, content: pool[Math.floor(Math.random() * pool.length)], x: 20 + Math.random() * 70, y: Math.random() * 100, vx: (Math.random() - 0.5) * 4, vy: ((Math.random() - 0.5) * 10 * round + (Math.sign(Math.random() - 0.5) * 2 * round)) * settings.obstacleSpeedMultiplier, size: size, color: typeForRound === 'concept' ? OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)] : undefined });
        }
        setObstacles(newObstacles);
    }, [round, settings.obstacleSpeedMultiplier]);
    
    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (gameStatus !== 'playing' || !gameAreaRef.current) return;
        e.preventDefault();
        const rect = gameAreaRef.current.getBoundingClientRect();
        const pointer = 'touches' in e ? e.touches[0] : e;
        if (!pointer) return;
        const y = ((pointer.clientY - rect.top) / rect.height) * 100;
        setPlayer(p => ({ ...p, y: Math.max(0, Math.min(100, y)) }));
    };

    // В 3 раунде клик меняет направление движения препятствий.
    const handleObstacleClick = () => { 
        if (round === 3 && gameStatus === 'playing') {
            playSound(SoundType.GENERIC_CLICK);
            setObstacles(obs => obs.map(o => ({ ...o, vy: -o.vy }))); 
        }
    };
    
    // Основной игровой цикл.
    useGameLoop(
      useCallback((deltaTime) => {
        if (hasFinished.current || gameStatus !== 'playing') return;
        // Движение игрока вправо.
        setPlayer(p => {
            const speed = settings.playerSpeed - (p.x / 100) * (settings.playerSpeed - 2); // Speed decreases as player moves right
            const newX = p.x + speed * (deltaTime / 1000);
            if (newX >= 95) { // Если дошел до конца.
                if (round < 3) { setRound(r => r + 1); return { x: 5, y: p.y }; } // Следующий раунд.
                else { if (!hasFinished.current) { hasFinished.current = true; setGameStatus('won'); } return { ...p, x: 95 }; } // Победа.
            }
            return { ...p, x: newX };
        });
        
        // Wobble Animation for walking effect
        setWobble(w => (w + deltaTime * 0.01) % (Math.PI * 2));

        // Движение препятствий.
        setObstacles(obs => obs.map(o => {
            if (o.isHit) return o; // Не двигаем "сбитые" препятствия в инвертированном режиме
            let newY = o.y + o.vy * (deltaTime / 1000); let newVy = o.vy;
            if (newY > 100 || newY < 0) { newY = Math.max(0, Math.min(100, newY)); newVy *= -1; }
            let newColor = o.color; if (o.type === 'concept' && Math.random() < 0.01) newColor = OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)];
            return { ...o, y: newY, vy: newVy, color: newColor };
        }));
        // Проверка столкновений.
        if (gameAreaRef.current) {
            const rect = gameAreaRef.current.getBoundingClientRect();
            const playerPixel = { x: (player.x / 100) * rect.width, y: (player.y / 100) * rect.height, size: 20 };
            
            setObstacles(obs => obs.map(o => {
                if(o.isHit) return o;
                const obsPixel = { x: (o.x / 100) * rect.width, y: (o.y / 100) * rect.height, size: o.size };
                let hit = false;

                if (o.type === 'concept') {
                    // Rectangular collision for text
                    // Estimate width: char count * approx width per char + padding
                    const estimatedWidth = o.content.length * o.size * 0.6;
                    const obsRect = {
                        left: obsPixel.x - estimatedWidth / 2,
                        right: obsPixel.x + estimatedWidth / 2,
                        top: obsPixel.y - o.size / 2,
                        bottom: obsPixel.y + o.size / 2
                    };
                    
                    const playerRect = {
                        left: playerPixel.x - playerPixel.size / 2,
                        right: playerPixel.x + playerPixel.size / 2,
                        top: playerPixel.y - playerPixel.size / 2,
                        bottom: playerPixel.y + playerPixel.size / 2
                    };

                    hit = (playerRect.left < obsRect.right && 
                           playerRect.right > obsRect.left && 
                           playerRect.top < obsRect.bottom && 
                           playerRect.bottom > obsRect.top);
                } else {
                    // Circular collision for emojis
                    const dx = playerPixel.x - obsPixel.x; 
                    const dy = playerPixel.y - obsPixel.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    hit = distance < (playerPixel.size + obsPixel.size) / 2;
                }

                if (hit) {
                    if (isMinigameInverted) {
                        playSound(SoundType.ITEM_CATCH_GOOD);
                        addScore(25);
                        return {...o, isHit: true}; // Помечаем как сбитый
                    } else {
                         if (!hasFinished.current) { 
                            playSound(SoundType.PLAYER_HIT);
                            hasFinished.current = true; 
                            setGameStatus('lost'); 
                            setTimeout(() => onLose(), 2000); 
                        }
                    }
                }
                return o;
            }));
        }
      }, [gameStatus, player.x, round, onLose, playSound, isMinigameInverted, addScore, settings.playerSpeed]), gameStatus === 'playing' && !isInstructionModalVisible);

    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove} 
            onTouchStart={handlePointerMove}
            onClick={handleObstacleClick} 
            className="w-full h-full bg-gradient-to-b from-[#333] to-[#111] flex flex-col items-center relative overflow-hidden cursor-none"
        >
            {gameStatus === 'won' && <ProhodKKinoWinScreen onContinue={onWin} isMuted={isMuted} />}
            {gameStatus === 'lost' && <div className="absolute inset-0 bg-red-900 bg-opacity-70 z-30 flex items-center justify-center text-4xl md:text-6xl text-white animate-[fadeIn_0.5s]">СТОЛКНОВЕНИЕ!</div>}
            
            {gameStatus === 'playing' && (
            <>
                <MinigameHUD>
                    <div className="text-left">РАУНД {round}/3</div>
                    <div className="text-right">→ КИНО →</div>
                </MinigameHUD>

                <div className="absolute top-0 bottom-0 right-0 w-8 bg-[repeating-linear-gradient(45deg,#fff,#fff_10px,#000_10px,#000_20px)] z-10"></div>
                
                {/* Chalk Drawings on Asphalt */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                    {chalkDecorations.map(deco => (
                        <div key={deco.id} className="absolute transform -rotate-12" style={{left: `${deco.x}%`, top: `${deco.y}%`}}>
                            {/* Increased pixelSize for larger drawings */}
                            <PixelArt artData={deco.art} palette={{'w': '#cccccc'}} pixelSize={8} />
                        </div>
                    ))}
                </div>

                {/* Character Player */}
                <div 
                    className="absolute z-20 pointer-events-none" 
                    style={{ 
                        left: `${player.x}%`, 
                        top: `${player.y}%`, 
                        transform: `translate(-50%, -50%) rotate(${Math.sin(wobble * 10) * 10}deg)`,
                        width: '32px',
                        height: '32px'
                    }}
                >
                    <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={2} />
                </div>

                {obstacles.map(o => <div key={o.id} className={`absolute z-10 ${o.isHit ? 'opacity-30' : ''}`} style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${o.size}px`, color: o.color || '#fff', textShadow: '2px 2px 2px #000', transition: 'color 0.5s, opacity 0.5s' }}>{o.content}</div>)}
            </>
            )}
        </div>
    );
};
