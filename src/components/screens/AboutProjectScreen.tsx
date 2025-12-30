
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType, startMusic, stopMusic, MusicType } from '../../utils/AudioEngine';
import { MANIFESTO_LINES } from '../../data/manifesto';
import { DynamicSky } from '../core/DynamicSky';

const SocialBadge: React.FC<{ label: string; color: string; icon?: string; url: string }> = ({ label, color, icon, url }) => (
    <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 rounded text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: color }}
    >
        {icon && <span className="text-lg">{icon}</span>}
        <span>{label}</span>
    </a>
);

export const AboutProjectScreen: React.FC = () => {
    const { setScreen } = useNavigation();
    const { playSound } = useSettings();
    const [showManifesto, setShowManifesto] = useState(false);
    const crawlRef = useRef<HTMLDivElement>(null);

    // --- РЕГУЛИРОВКА АУДИО ---
    useEffect(() => {
        if (showManifesto) {
            // Играет случайный MP3 из папки public/music
            startMusic(MusicType.EXTERNAL_MP3_FOLDER);
        } else {
            // Возврат к стандартной эмбиент-музыке меню
            startMusic(MusicType.MENU);
        }
        
        return () => {
            stopMusic();
        };
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

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center">
            <style>{`
                /* --- РЕГУЛИРОВКА ПАРАМЕТРОВ МАНИФЕСТА --- */
                
                @keyframes star-wars-crawl {
                    0% { 
                        /* Начало: текст за нижним краем экрана */
                        transform: rotateX(25deg) translateY(100%); 
                    }
                    100% { 
                        /* Конец: текст уходит далеко вверх. 
                           Отрегулируйте -500% в зависимости от длины текста для зацикливания */
                        transform: rotateX(25deg) translateY(-500%); 
                    }
                }

                .perspective-container {
                    /* perspective: глубина перспективы. Меньше = сильнее сужение сверху */
                    perspective: 100px; 
                    width: 150%;
                    height: 100%;
                    overflow: hidden;
                    position: relative;
                    background: transparent;
                }

                .manifesto-crawl {
                    position: absolute;
                    width: 100%;
                    left: 0;
                    bottom: 0;
                    font-family: 'Press Start 2P', cursive;
                    color: #DADA00; /* Цвет текста (Dada Yellow) */
                    text-align: center;
                    /* font-size: базовый размер букв */
                    font-size: 2.8rem; 
                    line-height: 2;
                    transform-origin: 50% 100%;
                    /* animation duration: скорость прокрутки (120s - медленно, 60s - быстро) */
                    animation: star-wars-crawl 200s linear infinite; 
                    padding-bottom: 20vh;
                }

                .manifesto-crawl p {
                    margin-bottom: 5rem;
                    padding: 0 10%;
                    /* Свечение текста */
                    text-shadow: 0 0 10px rgba(255, 201, 9, 0.5);
                }

                /* Стили для инвертированного неба */
                .inverted-sky {
                    filter: invert(1) brightness(0.4);
                    opacity: 0.6;
                }
            `}</style>

            {/* Фон: Инвертированное и затемненное небо */}
            <div className={`absolute inset-0 z-0 ${showManifesto ? 'inverted-sky' : 'opacity-50'}`}>
                <DynamicSky showHorizon={false} />
            </div>

            {!showManifesto ? (
                <div className="relative z-10 w-full h-full flex flex-col p-8 items-center justify-center overflow-hidden">
                    <h1 className="text-4xl md:text-6xl text-yellow-300 font-bold mb-8 text-center drop-shadow-lg shrink-0">О ПРОЕКТЕ</h1>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full items-stretch">
                        {/* Info Section */}
                        <div className="bg-black/60 p-6 pixel-border flex flex-col gap-4 backdrop-blur-sm">
                            <h2 className="text-2xl text-pink-400 border-b border-pink-500 pb-2">МИССИЯ</h2>
                            <p className="text-gray-200 text-sm leading-relaxed">
                                ДАДАШПИЛЬ — это интерактивный биоэксперимент по деконструкции реальности. Мы не создаем игры, мы создаем помехи в вашем восприятии.
                            </p>
                            
                            <h2 className="text-2xl text-blue-400 border-b border-blue-500 pb-2 mt-2">КОМАНДА</h2>
                            <ul className="text-gray-300 text-sm space-y-1">
                                <li>• Идея: <span className="text-white">Хорда Дадаизма</span></li>
                                <li>• Разработка: <span className="text-white">Лев и Близнецы</span></li>
                                <li>• Визуал: <span className="text-white">Процедурный Хаос</span></li>
                            </ul>

                            <div className="mt-auto pt-4 flex gap-4">
                                <button 
                                    onClick={handleToggleManifesto}
                                    className="flex-1 pixel-button p-3 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg animate-pulse"
                                >
                                    МАНИФЕСТ
                                </button>
                                <button 
                                    onClick={handleBack} 
                                    className="flex-1 pixel-button p-3 text-lg bg-gray-700 hover:bg-gray-600"
                                >
                                    НАЗАД
                                </button>
                            </div>
                        </div>

                        {/* Socials Section */}
                        <div className="bg-black/60 p-6 pixel-border flex flex-col gap-4 backdrop-blur-sm">
                            <h2 className="text-2xl text-cyan-400 border-b border-cyan-500 pb-2">СВЯЗЬ</h2>
                            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[160px] md:max-h-none custom-scrollbar">
                                <SocialBadge label="ЮЦЮП" color="#FF0000" url="https://www.youtube.com/@chordadada" />
                                <SocialBadge label="ЦЕЛЕГА" color="#2CA5E0" url="https://t.me/chordadada" />
                                <SocialBadge label="ИНСТА" color="#E4405F" url="https://www.instagram.com/chordadada" />
                                <SocialBadge label="ВиКей" color="#4680C2" url="https://vk.com/chordadada" />
                                <SocialBadge label="САНДКЛАД" color="#FF3300" url="https://soundcloud.com/soundadada" />
                                <SocialBadge label="ФЭСПУК" color="#1877F2" url="https://www.facebook.com/chorda.dadaisme/" />
                                <SocialBadge label="СПОЦИК" color="#1ED760" url="https://open.spotify.com/show/2tnJSAoaoDoCEshJjVLsph" />
                                <SocialBadge label="СПАТИФАЙ" color="#1ED760" url="https://open.spotify.com/show/7qJJJBKML70xiqyJSCh2DZ" />
                            </div>
                            <p className="text-[10px] text-gray-500 italic mt-auto">
                                * Любое совпадение со смыслом является случайным.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center bg-black">
                    <div className="perspective-container">
                        <div className="manifesto-crawl" ref={crawlRef}>
                            {/* Дублируем текст для обеспечения плавного бесконечного цикла, если нужно,
                                но 'infinite' в CSS и большой translateY обычно достаточно для ощущения потока */}
                            {MANIFESTO_LINES.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>
                    
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                        <button onClick={handleBack} className="pixel-button p-4 text-xl bg-black/80 hover:bg-white hover:text-black transition-all border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(255,201,9,0.3)]">
                            ПРЕРВАТЬ ПОТОК
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
