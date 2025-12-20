
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { stopMusic, CUSTOM_PLAYLIST } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';
import { MANIFESTO_LINES } from '../../data/manifesto';

export const DadaAudioPlayer: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin }) => {
    const { isMuted } = useSettings();
    
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [visualizationData, setVisualizationData] = useState<number[]>(new Array(16).fill(0));
    const [lyricIndex, setLyricIndex] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number>(0);
    const lyricIntervalRef = useRef<number>(0);

    // Initial setup
    useEffect(() => {
        // Stop global background music so we can play our own
        stopMusic();
        
        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : 0.7;
        
        // Load first track
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
            if (lyricIntervalRef.current) clearInterval(lyricIntervalRef.current);
        };
    }, []);

    // Handle mute toggle dynamically
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 0.7;
        }
    }, [isMuted]);

    // Simulated Visualizer Loop
    useEffect(() => {
        const loop = () => {
            if (isPlaying) {
                // Generate fake frequency data
                setVisualizationData(prev => prev.map(() => Math.random() * 100));
            } else {
                setVisualizationData(new Array(16).fill(5)); // Idle state
            }
            animationFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying]);

    // Lyrics Cycle
    useEffect(() => {
        if (isPlaying) {
            lyricIntervalRef.current = window.setInterval(() => {
                setLyricIndex(prev => (prev + 1) % MANIFESTO_LINES.length);
            }, 3000); // Change lyric every 3 seconds
        } else {
            clearInterval(lyricIntervalRef.current);
        }
        return () => clearInterval(lyricIntervalRef.current);
    }, [isPlaying]);

    const playTrack = (index: number) => {
        if (!audioRef.current) return;
        const trackName = CUSTOM_PLAYLIST[index];
        if (!trackName) return;

        // If changing track
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

    const currentLyric = MANIFESTO_LINES[lyricIndex];

    return (
        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div 
                    className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%]"
                    style={{
                        background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
                        animation: isPlaying ? 'spin 10s linear infinite' : 'none'
                    }}
                ></div>
            </div>

            <MinigameHUD>
                <div className="w-full flex justify-between items-center text-yellow-300">
                    <span>DADA PLAYER v0.9</span>
                    <button onClick={onWin} className="pixel-button p-2 text-sm bg-red-800 hover:bg-red-700">ВЫХОД</button>
                </div>
            </MinigameHUD>

            {/* Main Player UI */}
            <div className="z-10 bg-black border-4 border-gray-600 p-6 rounded-xl shadow-2xl max-w-md w-full flex flex-col gap-6 relative">
                
                {/* Screen Area */}
                <div className="bg-[#2b2b2b] border-2 border-gray-700 p-4 rounded h-48 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Visualizer Bars */}
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-2 opacity-30 pointer-events-none">
                        {visualizationData.map((h, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-green-500 transition-all duration-75" 
                                style={{ height: `${h}%` }}
                            ></div>
                        ))}
                    </div>

                    {/* Central Shape (Vinyl/Triangle) */}
                    <div 
                        className={`w-24 h-24 border-4 border-white flex items-center justify-center transition-all duration-500 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
                        style={{ borderRadius: '50%' }} // Circle
                    >
                        <div className="w-8 h-8 bg-red-500 transform rotate-45"></div>
                    </div>

                    {/* Track Info */}
                    <div className="mt-4 text-center z-10">
                        <h2 className="text-xl text-white font-bold tracking-widest uppercase truncate max-w-[250px]">
                            {isPlaying ? "PLAYING..." : "PAUSED"}
                        </h2>
                        <p className="text-xs text-gray-400 font-mono mt-1">TRACK {currentTrackIndex + 1} / {CUSTOM_PLAYLIST.length}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
                    <div 
                        className="h-full bg-yellow-400 transition-all duration-300 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center px-4">
                    <button onClick={handleShuffle} className="text-gray-400 hover:text-white text-xl" title="Shuffle">🔀</button>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrev} className="pixel-button w-12 h-12 flex items-center justify-center text-2xl">⏮️</button>
                        <button onClick={togglePlay} className="pixel-button w-16 h-16 flex items-center justify-center text-3xl bg-yellow-600 hover:bg-yellow-500 border-yellow-300">
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        <button onClick={handleNext} className="pixel-button w-12 h-12 flex items-center justify-center text-2xl">⏭️</button>
                    </div>

                    <div className="w-6"></div> {/* Spacer for symmetry */}
                </div>
            </div>

            {/* Lyric Flasher - Manifesto */}
            {isPlaying && (
                <div className="absolute top-24 w-full px-4 text-center pointer-events-none z-0">
                    <span 
                        key={lyricIndex} 
                        className="text-2xl md:text-4xl font-black text-white/20 animate-[pulse_3s_infinite] block"
                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}
                    >
                        {currentLyric}
                    </span>
                </div>
            )}
        </div>
    );
};
