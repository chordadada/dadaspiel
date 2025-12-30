
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType, startMusic, stopMusic, MusicType } from '../../utils/AudioEngine';
import { MANIFESTO_LINES } from '../../data/manifesto';
import { DynamicSky } from '../core/DynamicSky';

const SocialBadge: React.FC<{ label: string; color: string; url: string; index: number }> = ({ label, color, url, index }) => {
    const rotation = useMemo(() => (index % 2 === 0 ? (index * 7) % 8 : -((index * 5) % 8)), [index]);
    const fontSize = useMemo(() => 0.9 + (index % 3) * 0.15, [index]);
    const animationDelay = useMemo(() => (index * 0.2) % 2, [index]);
    
    const clipPath = useMemo(() => {
        const points = [
            `${1 + (index % 4)}% ${2 + (index % 3)}%`,
            `${25 + (index % 5)}% ${0 + (index % 2)}%`,
            `${75 - (index % 6)}% ${1 + (index % 4)}%`,
            `${99 - (index % 3)}% ${4 + (index % 5)}%`,
            `${100 - (index % 2)}% ${96 - (index % 4)}%`,
            `${50 + (index % 10)}% ${100 - (index % 2)}%`,
            `${2 + (index % 5)}% ${97 - (index % 3)}%`
        ];
        return `polygon(${points.join(', ')})`;
    }, [index]);

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative inline-block px-4 py-3 text-white font-black uppercase transition-all duration-300 hover:z-50 hover:scale-110 hover:rotate-0 active:scale-95"
            style={{ 
                backgroundColor: color,
                transform: `rotate(${rotation}deg)`,
                fontSize: `${fontSize}rem`,
                clipPath: clipPath,
                animation: `dada-jitter 4s infinite ${animationDelay}s`,
                boxShadow: '4px 4px 0px rgba(0,0,0,0.4)',
                fontFamily: index % 2 === 0 ? 'serif' : 'sans-serif'
            }}
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMjAwIDIwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC42NScvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbHRlcj0ndXJsKCNuKScvPjwvc3ZnPg==')]"></div>
            <span className="relative z-10 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-tighter">
                {label}
            </span>
        </a>
    );
};

export const AboutProjectScreen: React.FC = () => {
    const { setScreen } = useNavigation();
    const { playSound } = useSettings();
    const [showManifesto, setShowManifesto] = useState(false);

    useEffect(() => {
        if (showManifesto) {
            startMusic(MusicType.EXTERNAL_MP3_FOLDER);
        } else {
            startMusic(MusicType.MENU);
        }
        return () => stopMusic();
    }, [showManifesto]);

    const handleBack = () => {
        if (showManifesto) {
            setShowManifesto(false);
        } else {
            playSound(SoundType.BUTTON_CLICK);
            setScreen(GameScreen.PROFILE_SELECTION);
        }
    };

    const handleToggleManifesto = () => {
        playSound(SoundType.TRANSFORM_SUCCESS);
        setShowManifesto(true);
    };

    const socialLinks = [
        { label: "ГИТХАБ", color: "#DA00DA", url: "https://github.com/chordadada/dadaspiel" },
        { label: "ЮТУБ", color: "#FF0000", url: "https://www.youtube.com/@chordadada" },
        { label: "ТЕЛЕГА", color: "#2CA5E0", url: "https://t.me/chordadada" },
        { label: "ИНСТА", color: "#E4405F", url: "https://www.instagram.com/chordadada" },
        { label: "ВЭКА", color: "#4680C2", url: "https://vk.com/chordadada" },
        { label: "САУНД", color: "#FF3300", url: "https://soundcloud.com/soundadada" },
        { label: "ФБ", color: "#1877F2", url: "https://www.facebook.com/chorda.dadaisme/" },
        { label: "СПОТИК", color: "#1DB954", url: "https://open.spotify.com/show/2tnJSAoaoDoCEshJjVLsph" },
        { label: "SPOTIFY", color: "#1ED760", url: "https://open.spotify.com/show/7qJJJBKML70xiqyJSCh2DZ" },
    ];

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center">
            <style>{`
                @keyframes star-wars-crawl {
                    0% { transform: rotateX(25deg) translateY(100%); }
                    100% { transform: rotateX(25deg) translateY(-1200%); }
                }

                @keyframes dada-jitter {
                    0%, 100% { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
                    5% { transform: translate(-1px, 1px) rotate(calc(var(--rot, 0deg) + 0.5deg)); }
                    10% { transform: translate(1px, -1px) rotate(calc(var(--rot, 0deg) - 0.5deg)); }
                    15% { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
                }

                .perspective-container {
                    perspective: 150px; 
                    width: 150%;
                    height: 100%;
                    overflow: hidden;
                    position: relative;
                }

                .manifesto-crawl {
                    position: absolute;
                    width: 100%;
                    left: 0;
                    bottom: 0;
                    font-family: 'Press Start 2P', cursive;
                    color: #DADA00;
                    text-align: center;
                    font-size: 1.8rem; 
                    line-height: 2.2;
                    transform-origin: 50% 100%;
                    animation: star-wars-crawl 696s linear infinite; 
                    padding-bottom: 20vh;
                }

                .manifesto-crawl p {
                    margin-bottom: 5rem;
                    padding: 0 10%;
                    text-shadow: 0 0 15px rgba(255, 201, 9, 0.7);
                }

                .collage-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    width: 100%;
                }

                .about-content-grid {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    flex: 1;
                    min-height: 0; /* Важно для корректного flex-shrink */
                    overflow: hidden;
                }
            `}</style>

            <div className={`absolute inset-0 z-0 ${showManifesto ? 'opacity-70 invert brightness-50' : 'opacity-40'}`}>
                <DynamicSky showHorizon={false} />
            </div>

            {!showManifesto ? (
                <div className="relative z-10 w-full h-full flex flex-col pt-14 pb-2 md:pt-20 md:pb-6 px-2 md:px-6 items-center justify-between overflow-hidden">
                    
                    <div className="about-content-grid backdrop-blur-sm">
                        {/* Info Section (Left) */}
                        <div className="flex-1 p-3 md:p-8 flex flex-col gap-2 min-h-0 bg-black/10">
                            <h2 className="text-xl md:text-5xl text-center text-pink-400 font-black shrink-0 uppercase mb-2">НИЧТО</h2>
                            <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-center space-y-4 md:space-y-8 pr-1">
                                <p className="text-white leading-tight font-mono font-bold" style={{ fontSize: 'clamp(0.8rem, 2.5vw, 2.2rem)' }}>
                                    ДАДАШПИЛЬ — ЭТО НЕ ДАДА! 
                                </p>
                                <p className="text-gray-200 leading-tight font-mono" style={{ fontSize: 'clamp(0.6rem, 1.8vw, 1.6rem)' }}>
                                    ДАДАШПИЛЬ — ЭТО ВАМ НЕ ИГРУШКИ!
                                </p>
                            </div>
                            <button 
                                onClick={handleToggleManifesto}
                                className="pixel-button py-3 md:py-5 bg-purple-900 text-white hover:bg-purple-800 text-xs md:text-3xl shadow-[2px_2px_0_#4a044e] shrink-0 uppercase mt-2"
                            >
                                МАНИФЕСТ
                            </button>
                        </div>

                        {/* Collage Section (Right) */}
                        <div className="flex-1 p-3 md:p-8 flex flex-col gap-2 min-h-0 bg-white/5">
                            <h2 className="text-xl md:text-5xl text-center text-cyan-400 font-black shrink-0 uppercase mb-2">НИГДЕ</h2>
                            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 flex items-start">
                                <div className="collage-container">
                                    {socialLinks.map((link, i) => (
                                        <SocialBadge 
                                            key={`${link.label}-${i}`} 
                                            label={link.label} 
                                            color={link.color} 
                                            url={link.url} 
                                            index={i} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleBack} 
                        className="pixel-button px-6 md:px-20 py-3 md:py-6 text-sm md:text-4xl bg-gray-700 hover:bg-gray-600 shrink-0 mt-3 uppercase"
                    >
                        НДАДАУЖ
                    </button>
                </div>
            ) : (
                <div className="relative z-10 w-full h-full flex flex-col items-center">
                    <div className="perspective-container">
                        <div className="manifesto-crawl">
                            {MANIFESTO_LINES.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                            <div className="h-[100vh]"></div>
                            <p className="text-white text-3xl md:text-5xl">ХОРДА! ДА! ДАДАИЗМА!</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleBack} 
                        className="pixel-button absolute bottom-8 px-12 py-4 text-2xl bg-red-900 border-red-500 hover:bg-red-800 z-50 shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                    >
                        ВЫЙТИ ИЗ ТЕЛЕВИЗОРА
                    </button>
                </div>
            )}
        </div>
    );
};
