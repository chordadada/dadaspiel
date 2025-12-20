
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { stopMusic, CUSTOM_PLAYLIST } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';
import { MANIFESTO_LINES } from '../../data/manifesto';

interface TextParticle {
    id: number;
    text: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
    life: number;
    maxLife: number;
    vx: number;
    vy: number;
}

const COLORS = ['#ffffff', '#ffff00', '#ff00ff', '#00ffff', '#ff3333'];

export const DadaAudioPlayer: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin }) => {
    const { isMuted } = useSettings();
    
    // Audio State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Visualizer State
    const [particles, setParticles] = useState<TextParticle[]>([]);
    
    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const particleIdCounter = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);

    // Initial setup
    useEffect(() => {
        stopMusic();
        
        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : 0.7;
        
        if (CUSTOM_PLAYLIST.length > 0) {
            audio.src = `music/${CUSTOM_PLAYLIST[0]}`;
        }

        audio.addEventListener('ended', handleNext);
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        });

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // Handle mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 0.7;
        }
    }, [isMuted]);

    // --- Kinetic Typography Engine ---
    useEffect(() => {
        let lastTime = performance.now();

        const loop = (time: number) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            // 1. Spawn Particles if playing
            if (isPlaying) {
                spawnTimerRef.current += dt;
                // Spawn rate matches a chaotic rhythm (approx 120 BPMish)
                if (spawnTimerRef.current > 0.4) {
                    spawnTimerRef.current = 0;
                    
                    const text = MANIFESTO_LINES[Math.floor(Math.random() * MANIFESTO_LINES.length)];
                    // Shorten very long lines for visual impact
                    const displayCheck = text.length > 30 ? text.substring(0, 30) + "..." : text;

                    const newParticle: TextParticle = {
                        id: particleIdCounter.current++,
                        text: displayCheck,
                        x: 10 + Math.random() * 80, // % coordinates
                        y: 10 + Math.random() * 80,
                        size: 1 + Math.random() * 3, // rem
                        rotation: (Math.random() - 0.5) * 45,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        life: 0,
                        maxLife: 3 + Math.random() * 2,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                    };
                    
                    setParticles(prev => [...prev, newParticle]);
                }
            }

            // 2. Update Particles
            setParticles(prev => prev.map(p => ({
                ...p,
                life: p.life + dt,
                x: p.x + p.vx * dt,
                y: p.y + p.vy * dt
            })).filter(p => p.life < p.maxLife)); // Remove dead particles

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying]);


    // --- Controls ---
    const playTrack = (index: number) => {
        if (!audioRef.current) return;
        const trackName = CUSTOM_PLAYLIST[index];
        if (!trackName) return;

        if (index !== currentTrackIndex || !audioRef.current.src.includes(trackName)) {
            audioRef.current.src = `music/${trackName}`;
            audioRef.current.load();
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(error => console.log("Playback prevented:", error));
        }
        setCurrentTrackIndex(index);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            playTrack(currentTrackIndex);
        }
    };

    const handleNext = () => {
        const nextIndex = (currentTrackIndex + 1) % CUSTOM_PLAYLIST.length;
        playTrack(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + CUSTOM_PLAYLIST.length) % CUSTOM_PLAYLIST.length;
        playTrack(prevIndex);
    };

    const handleShuffle = () => {
        const randIndex = Math.floor(Math.random() * CUSTOM_PLAYLIST.length);
        playTrack(randIndex);
    };

    const currentTrackName = CUSTOM_PLAYLIST[currentTrackIndex]?.replace('.mp3', '') || "UNKNOWN";

    return (
        <div className="w-full h-full bg-[#111] flex flex-col relative overflow-hidden font-mono">
            <MinigameHUD>
                <div className="w-full flex justify-between items-center text-yellow-300">
                    <span>DADA PLAYER</span>
                    <button onClick={onWin} className="pixel-button p-2 text-sm bg-red-800 hover:bg-red-700">ВЫХОД</button>
                </div>
            </MinigameHUD>

            {/* --- KINETIC BACKGROUND LAYER --- */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                {particles.map(p => {
                    // Fade in/out calculation
                    let opacity = 1;
                    if (p.life < 0.5) opacity = p.life / 0.5;
                    else if (p.life > p.maxLife - 1) opacity = (p.maxLife - p.life);
                    
                    return (
                        <div
                            key={p.id}
                            className="absolute font-bold text-center whitespace-nowrap"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                                fontSize: `${p.size}rem`,
                                color: p.color,
                                opacity: opacity,
                                textShadow: '2px 2px 0px #000'
                            }}
                        >
                            {p.text}
                        </div>
                    );
                })}
            </div>

            {/* --- COMPACT PLAYER UI --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-20">
                <div className="bg-zinc-900 border-4 border-gray-500 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] p-4 flex flex-col gap-3 relative overflow-hidden">
                    
                    {/* Metal Texture Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 2px)'}}></div>

                    {/* Display */}
                    <div className="bg-[#2b2b2b] border-2 border-gray-700 p-2 rounded flex flex-col items-center justify-center relative overflow-hidden h-16">
                        <div className="text-green-400 font-mono text-xs w-full flex justify-between px-1 mb-1">
                            <span>TRK {currentTrackIndex + 1}</span>
                            <span>{isPlaying ? 'PLAY' : 'STOP'}</span>
                        </div>
                        <div className="w-full overflow-hidden relative">
                            <p className="text-white text-lg whitespace-nowrap animate-[marquee_10s_linear_infinite]">
                                {currentTrackName} +++ {currentTrackName} +++ {currentTrackName}
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="w-full h-3 bg-black border border-gray-600 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 transition-all duration-300 ease-linear"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-between items-center px-1">
                        <button onClick={handleShuffle} className="text-gray-500 hover:text-white text-xl active:scale-95" title="Shuffle">🔀</button>
                        
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrev} className="pixel-button w-10 h-10 flex items-center justify-center text-xl bg-gray-700">⏮️</button>
                            <button 
                                onClick={togglePlay} 
                                className={`pixel-button w-14 h-14 flex items-center justify-center text-2xl border-2 ${isPlaying ? 'bg-yellow-600 border-yellow-300' : 'bg-green-700 border-green-400'}`}
                            >
                                {isPlaying ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={handleNext} className="pixel-button w-10 h-10 flex items-center justify-center text-xl bg-gray-700">⏭️</button>
                        </div>

                        <div className="w-6"></div> {/* Spacer balance */}
                    </div>
                </div>
            </div>
            
            {/* Ambient visual when paused (Static text) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 pointer-events-none">
                    <h1 className="text-9xl font-black text-gray-800 rotate-12">DADA</h1>
                </div>
            )}
        </div>
    );
};
